import { InfoCircleOutlined } from "@ant-design/icons";
import { Button, SelectItem, TextInput, Textarea } from "@tremor/react";
import { Checkbox, Form, Select, Tooltip } from "antd";
import React, { useState } from "react";
import { all_admin_roles } from "../utils/roles";
import BudgetDurationDropdown from "./common_components/budget_duration_dropdown";
import { getModelDisplayName } from "./key_team_helpers/fetch_available_models_team_key";
import NumericalInput from "./shared/numerical_input";
import { useTranslation } from "react-i18next";

interface UserEditViewProps {
  userData: any;
  onCancel: () => void;
  onSubmit: (values: any) => void;
  teams: any[] | null;
  accessToken: string | null;
  userID: string | null;
  userRole: string | null;
  userModels: string[];
  possibleUIRoles: Record<string, Record<string, string>> | null;
  isBulkEdit?: boolean;
}

export function UserEditView({
  userData,
  onCancel,
  onSubmit,
  teams,
  accessToken,
  userID,
  userRole,
  userModels,
  possibleUIRoles,
  isBulkEdit = false,
}: UserEditViewProps) {
  const [form] = Form.useForm();
    const { t } = useTranslation();
const [unlimitedBudget, setUnlimitedBudget] = useState(false);

  // Set initial form values
  React.useEffect(() => {
    const maxBudget = userData.user_info?.max_budget;
    const isUnlimited = maxBudget === null || maxBudget === undefined;
    setUnlimitedBudget(isUnlimited);

    form.setFieldsValue({
      user_id: userData.user_id,
      user_email: userData.user_info?.user_email,
      user_alias: userData.user_info?.user_alias,
      user_role: userData.user_info?.user_role,
      models: userData.user_info?.models || [],
      max_budget: isUnlimited ? "" : maxBudget,
      budget_duration: userData.user_info?.budget_duration,
      metadata: userData.user_info?.metadata ? JSON.stringify(userData.user_info.metadata, null, 2) : undefined,
    });
  }, [userData, form]);

  const handleUnlimitedBudgetChange = (e: any) => {
    const checked = e.target.checked;
    setUnlimitedBudget(checked);
    if (checked) {
      form.setFieldsValue({ max_budget: "" });
    }
  };

  const handleSubmit = (values: any) => {
    // Convert metadata back to an object if it exists and is a string
    if (values.metadata && typeof values.metadata === "string") {
      try {
        values.metadata = JSON.parse(values.metadata);
      } catch (error) {
        console.error("Error parsing metadata JSON:", error);
        return;
      }
    }

    if (unlimitedBudget || values.max_budget === "" || values.max_budget === undefined) {
      values.max_budget = null;
    }

    onSubmit(values);
  };

  return (
    <Form form={form} onFinish={handleSubmit} layout="vertical">
      {!isBulkEdit && (
        <Form.Item label={t('ID_polzovatelya')} name="user_id">
          <TextInput disabled />
        </Form.Item>
      )}

      {!isBulkEdit && (
        <Form.Item label={t('Elektronnaya_pochta')} name="user_email">
          <TextInput />
        </Form.Item>
      )}

      <Form.Item label={t('Psevdonim_polzovatelya')} name="user_alias">
        <TextInput />
      </Form.Item>

      <Form.Item
        label={
          <span>
            {t('Globalnaya_rol_proksi')}{" "}
            <Tooltip title={t('Eto_rol_polzovatelya_globalno_na_proks')}>
              <InfoCircleOutlined />
            </Tooltip>
          </span>
        }
        name="user_role"
      >
        <Select>
          {possibleUIRoles &&
            Object.entries(possibleUIRoles).map(([role, { ui_label, description }]) => (
              <SelectItem key={role} value={role} title={ui_label}>
                <div className="flex">
                  {ui_label}{" "}
                  <p className="ml-2" style={{ color: "gray", fontSize: "12px" }}>
                    {description}
                  </p>
                </div>
              </SelectItem>
            ))}
        </Select>
      </Form.Item>

      <Form.Item
        label={
          <span>
            {t('Lichnye_modeli')}{" "}
            <Tooltip title={t('Vyberite_modeli_dostupnye_etomu_polzov')}>
              <InfoCircleOutlined style={{ marginLeft: "4px" }} />
            </Tooltip>
          </span>
        }
        name="models"
      >
        <Select
          mode="multiple"
          placeholder={t('Vybrat_modeli')}
          style={{ width: "100%" }}
          disabled={!all_admin_roles.includes(userRole || "")}
        >
          <Select.Option key="all-proxy-models" value="all-proxy-models">
            {t('Vse_proksi_modeli')}
          </Select.Option>
          <Select.Option key="no-default-models" value="no-default-models">
            {t('Net_modeley_po_umolchaniyu')}
          </Select.Option>
          {userModels.map((model) => (
            <Select.Option key={model} value={model}>
              {getModelDisplayName(model)}
            </Select.Option>
          ))}
        </Select>
      </Form.Item>

      <Form.Item
        label={
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <span>{t('Maksimalnyy_byudzhet_USD')}</span>
            <Checkbox
              checked={unlimitedBudget}
              onChange={handleUnlimitedBudgetChange}
            >
              {t('Neogranichennyy_byudzhet')}
            </Checkbox>
          </div>
        }
        name="max_budget"
        rules={[
          {
            validator: (_, value) => {
              if (!unlimitedBudget && (value === "" || value === null || value === undefined)) {
                return Promise.reject(new Error(t('Vvedite_byudzhet_ili_vyberite_Neogranich')));
              }
              return Promise.resolve();
            },
          },
        ]}
      >
        <NumericalInput
          step={0.01}
          precision={2}
          style={{ width: "100%" }}
          disabled={unlimitedBudget}
        />
      </Form.Item>

      <Form.Item label={t('Sbros_byudzheta')} name="budget_duration">
        <BudgetDurationDropdown />
      </Form.Item>

      <Form.Item label={t('Metadannye')} name="metadata">
        <Textarea rows={4} placeholder={t('Vvedite_metadannye_v_formate_JSON')} />
      </Form.Item>

      <div className="flex justify-end space-x-2">
        <Button variant="secondary" type="button" onClick={onCancel}>
          {t('Otmena')}
        </Button>
        <Button type="submit">{t('Sohranit')}</Button>
      </div>
    </Form>
  );
}
