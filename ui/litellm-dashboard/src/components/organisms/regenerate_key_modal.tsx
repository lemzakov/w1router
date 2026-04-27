import useAuthorized from "@/app/(dashboard)/hooks/useAuthorized";
import { Button, Col, Grid, Text, TextInput, Title } from "@tremor/react";
import { Form, InputNumber, Modal } from "antd";
import { add } from "date-fns";
import { useEffect, useState } from "react";
import { CopyToClipboard } from "react-copy-to-clipboard";
import { KeyResponse } from "../key_team_helpers/key_list";
import NotificationManager from "../molecules/notifications_manager";
import { regenerateKeyCall } from "../networking";
import { useTranslation } from "react-i18next";

interface RegenerateKeyModalProps {
  selectedToken: KeyResponse | null;
  visible: boolean;
  onClose: () => void;
  onKeyUpdate?: (updatedKeyData: Partial<KeyResponse>) => void;
}

export function RegenerateKeyModal({ selectedToken, visible, onClose, onKeyUpdate }: RegenerateKeyModalProps) {
    const { t } = useTranslation();
const { accessToken } = useAuthorized();
  const [form] = Form.useForm();
  const [regeneratedKey, setRegeneratedKey] = useState<string | null>(null);
  const [regenerateFormData, setRegenerateFormData] = useState<any>(null);
  const [newExpiryTime, setNewExpiryTime] = useState<string | null>(null);
  const [isRegenerating, setIsRegenerating] = useState(false);

  // Track whether this is the user's own authentication key
  const [isOwnKey, setIsOwnKey] = useState<boolean>(false);

  // Keep track of the current valid access token locally
  const [currentAccessToken, setCurrentAccessToken] = useState<string | null>(null);

  useEffect(() => {
    if (visible && selectedToken && accessToken) {
      form.setFieldsValue({
        key_alias: selectedToken.key_alias,
        max_budget: selectedToken.max_budget,
        tpm_limit: selectedToken.tpm_limit,
        rpm_limit: selectedToken.rpm_limit,
        duration: selectedToken.duration || "",
        grace_period: "",
      });

      // Initialize the current access token
      setCurrentAccessToken(accessToken);

      // Check if this is the user's own authentication key by comparing the key values
      const isUserOwnKey = selectedToken.key_name === accessToken;
      setIsOwnKey(isUserOwnKey);
    }
  }, [visible, selectedToken, form, accessToken]);

  useEffect(() => {
    if (!visible) {
      // Reset states when modal is closed
      setRegeneratedKey(null);
      setIsRegenerating(false);
      setIsOwnKey(false);
      setCurrentAccessToken(null);
      form.resetFields();
    }
  }, [visible, form]);

  const calculateNewExpiryTime = (duration: string | undefined): string | null => {
    if (!duration) return null;

    try {
      const now = new Date();
      let newExpiry: Date;

      if (duration.endsWith("s")) {
        newExpiry = add(now, { seconds: parseInt(duration) });
      } else if (duration.endsWith("h")) {
        newExpiry = add(now, { hours: parseInt(duration) });
      } else if (duration.endsWith("d")) {
        newExpiry = add(now, { days: parseInt(duration) });
      } else {
        throw new Error("Invalid duration format");
      }

      return newExpiry.toLocaleString();
    } catch (error) {
      return null;
    }
  };

  useEffect(() => {
    if (regenerateFormData?.duration) {
      setNewExpiryTime(calculateNewExpiryTime(regenerateFormData.duration));
    } else {
      setNewExpiryTime(null);
    }
  }, [regenerateFormData?.duration]);

  const handleRegenerateKey = async () => {
    if (!selectedToken || !currentAccessToken) return;

    setIsRegenerating(true);
    try {
      const formValues = await form.validateFields();

      // Use the current access token for the API call
      const response = await regenerateKeyCall(
        currentAccessToken,
        selectedToken.token || selectedToken.token_id,
        formValues,
      );
      setRegeneratedKey(response.key);
      NotificationManager.success(t('Virtualnyy_klyuch_uspeshno_peresozdan'));

      console.log("Full regenerate response:", response); // Debug log to see what's returned

      // Create updated key data with ALL new values from the response
      const updatedKeyData: Partial<KeyResponse> = {
        // Use the new token/key ID from the response (this is what was missing!)
        token: response.token || response.key_id || selectedToken.token, // Try different possible field names
        key_name: response.key, // This is the new secret key string
        max_budget: formValues.max_budget,
        tpm_limit: formValues.tpm_limit,
        rpm_limit: formValues.rpm_limit,
        expires: formValues.duration ? calculateNewExpiryTime(formValues.duration) : selectedToken.expires,
        // Include any other fields that might be returned by the API
        ...response, // Spread the entire response to capture all updated fields
      };

      console.log("Updated key data with new token:", updatedKeyData); // Debug log

      // Update the parent component with new key data
      if (onKeyUpdate) {
        onKeyUpdate(updatedKeyData);
      }

      setIsRegenerating(false);
    } catch (error) {
      console.error("Error regenerating key:", error);
      NotificationManager.fromBackend(error);
      setIsRegenerating(false); // Reset regenerating state on error
    }
  };

  const handleClose = () => {
    setRegeneratedKey(null);
    setIsRegenerating(false);
    setIsOwnKey(false);
    setCurrentAccessToken(null);
    form.resetFields();
    onClose();
  };

  return (
    <Modal
      title={t('Peresozdat_virtualnyy_klyuch')}
      open={visible}
      onCancel={handleClose}
      footer={
        regeneratedKey
          ? [
              <Button key="close" onClick={handleClose}>
                {t('Zakryt')}
              </Button>,
            ]
          : [
              <Button key="cancel" onClick={handleClose} className="mr-2">
                {t('Otmena')}
              </Button>,
              <Button key="regenerate" onClick={handleRegenerateKey} disabled={isRegenerating}>
                {isRegenerating ? t('Peresozdanie') : t('Peresozdat')}
              </Button>,
            ]
      }
    >
      {regeneratedKey ? (
        <Grid numItems={1} className="gap-2 w-full">
          <Title>{t('Peresozdannyy_klyuch')}</Title>
          <Col numColSpan={1}>
            <p>
              {t('Zamenite_vash_staryy_klyuch_na_novyy_V_t')}{" "}
              <b>{t('vy_bolshe_ne_smozhete_prosmotret_ego')}</b> {t('v_vashem_akkaunte_LiteLLM_Esli_vy_potery')}
            </p>
          </Col>
          <Col numColSpan={1}>
            <Text className="mt-3">{t('Psevdonim_klyucha_1')}</Text>
            <div className="bg-gray-100 p-2 rounded mb-2">
              <pre className="break-words whitespace-normal">{selectedToken?.key_alias || t('Psevdonim_ne_zadan')}</pre>
            </div>
            <Text className="mt-3">{t('Novyy_virtualnyy_klyuch')}</Text>
            <div className="bg-gray-100 p-2 rounded mb-2">
              <pre className="break-words whitespace-normal">{regeneratedKey}</pre>
            </div>
            <CopyToClipboard
              text={regeneratedKey}
              onCopy={() => NotificationManager.success(t('Virtualnyy_klyuch_skopirovan'))}
            >
              <Button className="mt-3">{t('Kopirovat_virtualnyy_klyuch')}</Button>
            </CopyToClipboard>
          </Col>
        </Grid>
      ) : (
        <Form
          form={form}
          layout="vertical"
          onValuesChange={(changedValues) => {
            if ("duration" in changedValues) {
              setRegenerateFormData((prev: { duration?: string }) => ({ ...prev, duration: changedValues.duration }));
            }
          }}
        >
          <Form.Item name="key_alias" label={t('Psevdonim_klyucha')}>
            <TextInput disabled={true} />
          </Form.Item>
          <Form.Item name="max_budget" label={t('Maksimalnyy_byudzhet_USD')}>
            <InputNumber step={0.01} precision={2} style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item name="tpm_limit" label={t('Limit_TPM')}>
            <InputNumber style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item name="rpm_limit" label={t('Limit_RPM')}>
            <InputNumber style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item name="duration" label={t('Istekaet_napr_30s_30h_30d')} className="mt-8">
            <TextInput placeholder="" />
          </Form.Item>
          <div className="mt-2 text-sm text-gray-500">
            {t('Tekuschiy_srok')} {selectedToken?.expires ? new Date(selectedToken.expires).toLocaleString() : t('Nikogda')}
          </div>
          {newExpiryTime && <div className="mt-2 text-sm text-green-600">{t('Novyy_srok')} {newExpiryTime}</div>}
          <Form.Item
            name="grace_period"
            label={t('Period_ozhidaniya_napr_24h_2d')}
            tooltip={t('Sohranyayte_staryy_klyuch_deystvitelnym_')}
            className="mt-8"
            rules={[
              {
                pattern: /^(\d+(s|m|h|d|w|mo))?$/,
                message: t('Dolzhno_byt_dlitelnostyu_vida_30s_30m'),
              },
            ]}
          >
            <TextInput placeholder={t('napr_24h_2d_pusto_nemedlennaya_otmen')} />
          </Form.Item>
          <div className="mt-2 text-sm text-gray-500">
            {t('Rekomenduetsya_24h_72h_dlya_klyuchey_v_p')}
          </div>
        </Form>
      )}
    </Modal>
  );
}
