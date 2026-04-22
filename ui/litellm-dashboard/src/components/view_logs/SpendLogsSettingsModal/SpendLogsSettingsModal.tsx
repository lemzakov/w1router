"use client";

import { ConfigType, GeneralSettingsFieldName, useDeleteProxyConfigField, useProxyConfig } from "@/app/(dashboard)/hooks/proxyConfig/useProxyConfig";
import { StoreRequestInSpendLogsParams, useStoreRequestInSpendLogs } from "@/app/(dashboard)/hooks/storeRequestInSpendLogs/useStoreRequestInSpendLogs";
import NotificationsManager from "@/components/molecules/notifications_manager";
import { parseErrorMessage } from "@/components/shared/errorUtils";
import { ClockCircleOutlined } from "@ant-design/icons";
import { Button, Form, Input, Modal, Skeleton, Space, Switch, Typography } from "antd";
import React, { useEffect, useMemo } from "react";

interface SpendLogsSettingsModalProps {
  isVisible: boolean;
  onCancel: () => void;
  onSuccess?: () => void;
}

const SpendLogsSettingsModal: React.FC<SpendLogsSettingsModalProps> = ({ isVisible, onCancel, onSuccess }) => {
  const [form] = Form.useForm();
  const { mutateAsync, isPending } = useStoreRequestInSpendLogs();
  const { mutateAsync: deleteField, isPending: isDeletingField } = useDeleteProxyConfigField();
  const { data: proxyConfigData, isLoading: isLoadingConfig, refetch } = useProxyConfig(ConfigType.GENERAL_SETTINGS);
  const storePromptsValue = Form.useWatch('store_prompts_in_spend_logs', form);

  // Refetch config when modal opens to ensure we have the latest values
  useEffect(() => {
    if (isVisible) {
      refetch();
    }
  }, [isVisible, refetch]);

  // Compute initial values from fetched config data
  const initialValues = useMemo(() => {
    if (!proxyConfigData) {
      return {
        store_prompts_in_spend_logs: false,
        maximum_spend_logs_retention_period: undefined,
      };
    }

    const storePromptsField = proxyConfigData.find(field => field.field_name === 'store_prompts_in_spend_logs');
    const retentionPeriodField = proxyConfigData.find(field => field.field_name === 'maximum_spend_logs_retention_period');

    return {
      store_prompts_in_spend_logs: storePromptsField?.field_value ?? false,
      maximum_spend_logs_retention_period: retentionPeriodField?.field_value ?? undefined,
    };
  }, [proxyConfigData]);

  const handleFormSubmit = async (formValues: StoreRequestInSpendLogsParams) => {
    try {
      // If maximum_spend_logs_retention_period is empty/null, delete the field first
      const retentionPeriodValue = formValues.maximum_spend_logs_retention_period;
      const shouldDeleteRetentionPeriod =
        !retentionPeriodValue ||
        (typeof retentionPeriodValue === "string" && retentionPeriodValue.trim() === "");

      if (shouldDeleteRetentionPeriod) {
        try {
          await deleteField({
            config_type: ConfigType.GENERAL_SETTINGS,
            field_name: GeneralSettingsFieldName.MAXIMUM_SPEND_LOGS_RETENTION_PERIOD,
          });
        } catch (deleteError) {
          // If field doesn't exist, that's okay - continue with update
          console.warn("Failed to delete retention period field (may not exist):", deleteError);
        }
      }

      // Update the settings (excluding maximum_spend_logs_retention_period if it's empty)
      const updateParams: StoreRequestInSpendLogsParams = {
        store_prompts_in_spend_logs: formValues.store_prompts_in_spend_logs,
        ...(retentionPeriodValue &&
          typeof retentionPeriodValue === "string" &&
          retentionPeriodValue.trim() !== "" && {
          maximum_spend_logs_retention_period: retentionPeriodValue,
        }),
      };

      await mutateAsync(updateParams, {
        onSuccess: () => {
          NotificationsManager.success("Настройки логов расходов успешно обновлены");
          refetch(); // Refetch config to get updated values
          onSuccess?.();
        },
        onError: (error) => {
          NotificationsManager.fromBackend("Не удалось сохранить настройки логов расходов: " + parseErrorMessage(error));
        },
      });
    } catch (error) {
      NotificationsManager.fromBackend("Не удалось сохранить настройки логов расходов: " + parseErrorMessage(error));
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onCancel();
  };

  return (
    <Modal
      title={<Typography.Title level={5}>Настройки логов расходов</Typography.Title>}
      open={isVisible}
      footer={
        <Space>
          <Button onClick={handleCancel} disabled={isPending || isDeletingField || isLoadingConfig}>
            Отмена
          </Button>
          <Button type="primary" loading={isPending || isDeletingField} disabled={isLoadingConfig} onClick={() => form.submit()}>
            {isPending || isDeletingField ? "Сохранение..." : "Сохранить настройки"}
          </Button>
        </Space>
      }
      onCancel={handleCancel}
    >

      <Form
        key={proxyConfigData ? JSON.stringify(initialValues) : 'loading'}
        form={form}
        layout="horizontal"
        onFinish={handleFormSubmit}
        initialValues={initialValues}
      >
        <Form.Item
          label="Сохранять запросы в логах расходов"
          name="store_prompts_in_spend_logs"
          tooltip={
            proxyConfigData?.find(f => f.field_name === 'store_prompts_in_spend_logs')?.field_description ||
            "Если включено, запросы будут сохраняться в логах расходов для отслеживания и анализа."
          }
          valuePropName="checked"
        >
          <div>

            {isLoadingConfig ? <Skeleton.Input active block /> : <Switch checked={storePromptsValue ?? false} onChange={(checked) => form.setFieldValue('store_prompts_in_spend_logs', checked)} />}
          </div>
        </Form.Item>

        <Form.Item
          label="Максимальный период хранения логов расходов (опционально)"
          name="maximum_spend_logs_retention_period"
          tooltip={
            proxyConfigData?.find(f => f.field_name === 'maximum_spend_logs_retention_period')?.field_description ||
            "Установите максимальный период хранения логов расходов (например, '7d' — 7 дней, '30d' — 30 дней). Оставьте пустым для хранения без ограничений."
          }
        >
          {isLoadingConfig ? <Skeleton.Input active block /> : <Input
            placeholder="e.g., 7d, 30d"
            prefix={<ClockCircleOutlined />}
          />}
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default SpendLogsSettingsModal;
