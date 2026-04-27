import { InfoCircleOutlined, UserAddOutlined } from "@ant-design/icons";
import { useQueryClient } from "@tanstack/react-query";
import { useOrganizations } from "@/app/(dashboard)/hooks/organizations/useOrganizations";
import { Accordion, AccordionBody, AccordionHeader, SelectItem, TextInput } from "@tremor/react";
import { Alert, Button, Form, Input, Modal, Select, Select as Select2, Space, Tooltip, Typography } from "antd";
import React, { useEffect, useMemo, useState } from "react";
import BulkCreateUsers from "./bulk_create_users_button";
import TeamDropdown from "./common_components/team_dropdown";
import { getModelDisplayName } from "./key_team_helpers/fetch_available_models_team_key";
import NotificationsManager from "./molecules/notifications_manager";
import {
  getProxyBaseUrl,
  getProxyUISettings,
  invitationCreateCall,
  modelAvailableCall,
  userCreateCall,
} from "./networking";
import OnboardingModal, { InvitationLink } from "./onboarding_link";
import { useTranslation } from "react-i18next";
const { Option } = Select;
const { Text, Link, Title } = Typography;
// Helper function to generate UUID compatible across all environments
const generateUUID = (): string => {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback UUID generation for environments without crypto.randomUUID
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c == "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

interface CreateuserProps {
  userID: string;
  accessToken: string;
  teams: any[] | null;
  possibleUIRoles: null | Record<string, Record<string, string>>;
  onUserCreated?: (userId: string) => void;
  isEmbedded?: boolean;
}

// Define an interface for the UI settings
interface UISettings {
  PROXY_BASE_URL: string | null;
  PROXY_LOGOUT_URL: string | null;
  DEFAULT_TEAM_DISABLED: boolean;
  SSO_ENABLED: boolean;
}

export const CreateUserButton: React.FC<CreateuserProps> = ({
  userID,
  accessToken,
  teams,
  possibleUIRoles,
  onUserCreated,
  isEmbedded = false,
}) => {
    const { t } = useTranslation();
const queryClient = useQueryClient();
  const [uiSettings, setUISettings] = useState<UISettings | null>(null);
  const [form] = Form.useForm();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [apiuser, setApiuser] = useState<boolean>(false);
  const [userModels, setUserModels] = useState<string[]>([]);
  const [isInvitationLinkModalVisible, setIsInvitationLinkModalVisible] = useState(false);
  const [invitationLinkData, setInvitationLinkData] = useState<InvitationLink | null>(null);
  const [baseUrl, setBaseUrl] = useState<string | null>(null);
  const { data: organizations = [] } = useOrganizations();

  // Derive teams from the user's organizations, falling back to the teams prop
  const availableTeams = useMemo(() => {
    const orgTeams = organizations.flatMap((org) => org.teams || []);
    if (orgTeams.length > 0) return orgTeams;
    return teams || [];
  }, [organizations, teams]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userRole = "any";
        const modelDataResponse = await modelAvailableCall(accessToken, userID, userRole);
        const availableModels = [];
        for (let i = 0; i < modelDataResponse.data.length; i++) {
          const model = modelDataResponse.data[i];
          availableModels.push(model.id);
        }
        setUserModels(availableModels);
        const uiSettingsResponse = await getProxyUISettings(accessToken);
        setUISettings(uiSettingsResponse);
      } catch (error) {
        console.error("Error fetching model data:", error);
      }
    };

    setBaseUrl(getProxyBaseUrl());
    fetchData();
  }, []);

  const handleOk = () => {
    setIsModalVisible(false);
    form.resetFields();
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    setApiuser(false);
    form.resetFields();
  };

  const handleCreate = async (formValues: {
    user_id: string;
    models?: string[];
    user_role: string;
    organization_ids?: string[];
    organizations?: string[];
  }) => {
    try {
      NotificationsManager.info("Making API Call");
      if (!isEmbedded) {
        setIsModalVisible(true);
      }
      if ((!formValues.models || formValues.models.length === 0) && formValues.user_role !== "proxy_admin") {
        formValues.models = ["no-default-models"];
      }
      if (formValues.organization_ids) {
        formValues.organizations = formValues.organization_ids;
        delete formValues.organization_ids;
      }
      const response = await userCreateCall(accessToken, null, formValues);
      await queryClient.invalidateQueries({ queryKey: ["userList"] });
      setApiuser(true);
      const user_id = response.data?.user_id || response.user_id;

      if (onUserCreated && isEmbedded) {
        onUserCreated(user_id);
        form.resetFields();
        return;
      }

      if (!uiSettings?.SSO_ENABLED) {
        invitationCreateCall(accessToken, user_id).then((data) => {
          data.has_user_setup_sso = false;
          setInvitationLinkData(data);
          setIsInvitationLinkModalVisible(true);
        });
      } else {
        // create an InvitationLink Object for this user for the SSO flow
        // for SSO the invite link is the proxy base url since the User just needs to login
        const invitationLink: InvitationLink = {
          id: generateUUID(), // Generate a unique ID
          user_id: user_id,
          is_accepted: false,
          accepted_at: null,
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Set expiry to 7 days from now
          created_at: new Date(),
          created_by: userID, // Assuming userID is the current user creating the invitation
          updated_at: new Date(),
          updated_by: userID,
          has_user_setup_sso: true,
        };
        setInvitationLinkData(invitationLink);
        setIsInvitationLinkModalVisible(true);
      }

      NotificationsManager.success(t('Polzovatel_API_sozdan'));
      form.resetFields();
      localStorage.removeItem("userData" + userID);
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || error?.message || "Error creating the user";
      NotificationsManager.fromBackend(errorMessage);
      console.error("Error creating the user:", error);
    }
  };

  // Modify the return statement to handle embedded mode
  if (isEmbedded) {
    return (
      <Form form={form} onFinish={handleCreate} labelCol={{ span: 8 }} wrapperCol={{ span: 16 }} labelAlign="left">
        <Alert
          message={t('Priglasheniya_po_elektronnoy_pochte')}
          description={
            <>
              {t('Novye_polzovateli_poluchayut_priglasheni')}{" "}
              <Link href="https://docs.litellm.ai/docs/proxy/email" target="_blank">
                {t('Uznat_kak_nastroit_uvedomleniya_po_ele')}
              </Link>
            </>
          }
          type="info"
          showIcon
          className="mb-4"
        />
        <Form.Item label={t('Email_polzovatelya')} name="user_email">
          <TextInput placeholder="" />
        </Form.Item>
        <Form.Item label={t('Rol_polzovatelya')} name="user_role">
          <Select2>
            {possibleUIRoles &&
              Object.entries(possibleUIRoles).map(([role, { ui_label, description }]) => (
                <SelectItem key={role} value={role} title={ui_label}>
                  <div className="flex">
                    {ui_label}{" "}
                    <Text className="ml-2" style={{ color: "gray", fontSize: "12px" }}>
                      {description}
                    </Text>
                  </div>
                </SelectItem>
              ))}
          </Select2>
        </Form.Item>
        <Form.Item label={t('Komanda')} name="team_id">
          <TeamDropdown />
        </Form.Item>

        <Form.Item label={t('Metadannye')} name="metadata">
          <Input.TextArea rows={4} placeholder={t('Vvedite_metadannye_v_formate_JSON')} />
        </Form.Item>

        <div style={{ textAlign: "right", marginTop: "10px" }}>
          <Button htmlType="submit">{t('Sozdat_polzovatelya')}</Button>
        </div>
      </Form>
    );
  }

  // Original return for standalone mode
  return (
    <div className="flex gap-2">
      <Button type="primary" className="mb-0" onClick={() => setIsModalVisible(true)}>
        {t('Priglasit_polzovatelya')}
      </Button>
      <BulkCreateUsers accessToken={accessToken} teams={teams} possibleUIRoles={possibleUIRoles} />
      <Modal
        title={t('Priglasit_polzovatelya_1')}
        open={isModalVisible}
        width={800}
        footer={null}
        onOk={handleOk}
        onCancel={handleCancel}
      >
        <Space direction="vertical" size="middle">
          <Text className="mb-1">{t('Sozdayte_polzovatelya_kotoryy_mozhet_vla')}</Text>
          <Alert
            message={t('Priglasheniya_po_elektronnoy_pochte')}
            description={
              <>
                {t('Novye_polzovateli_poluchayut_priglasheni')}{" "}
                <Link href="https://docs.litellm.ai/docs/proxy/email" target="_blank">
                  {t('Uznat_kak_nastroit_uvedomleniya_po_ele')}
                </Link>
              </>
            }
            type="info"
            showIcon
            className="mb-4"
          />
        </Space>
        <Form form={form} onFinish={handleCreate} labelCol={{ span: 8 }} wrapperCol={{ span: 16 }} labelAlign="left">
          <Form.Item label={t('Email_polzovatelya')} name="user_email">
            <Input />
          </Form.Item>
          <Form.Item
            label={
              <span>
                {t('Globalnaya_rol_proksi')}{" "}
                <Tooltip title={t('Eta_rol_ne_zavisit_ot_roley_v_komandah')}>
                  <InfoCircleOutlined />
                </Tooltip>
              </span>
            }
            name="user_role"
          >
            <Select2>
              {possibleUIRoles &&
                Object.entries(possibleUIRoles).map(([role, { ui_label, description }]) => (
                  <SelectItem key={role} value={role} title={ui_label}>
                    <Text>{ui_label}</Text>
                    <Text type="secondary">
                      {" - "}
                      {description}
                    </Text>
                  </SelectItem>
                ))}
            </Select2>
          </Form.Item>

          <Form.Item
            label={t('Komanda')}
            className="gap-2"
            name="team_id"
            help={t('Pri_vybore_polzovatel_budet_dobavlen_v')}
          >
            <TeamDropdown />
          </Form.Item>

          <Form.Item
            label={t('Organizatsiya')}
            name="organization_ids"
            help={t('Polzovatel_budet_dobavlen_v_vybrannye')}
          >
            <Select mode="multiple" placeholder={t('Vybrat_organizatsiyu')} style={{ width: "100%" }}>
              {organizations.map((org) => (
                <Option key={org.organization_id} value={org.organization_id}>
                  {org.organization_alias} ({org.organization_id})
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item label={t('Metadannye')} name="metadata">
            <Input.TextArea rows={4} placeholder={t('Vvedite_metadannye_v_formate_JSON')} />
          </Form.Item>
          <Accordion>
            <AccordionHeader>
              <Text strong>{t('Sozdanie_lichnyh_klyuchey')}</Text>
            </AccordionHeader>
            <AccordionBody>
              <Form.Item
                className="gap-2"
                label={
                  <span>
                    {t('Modeli')}{" "}
                    <Tooltip title={t('Modeli_dostupnye_polzovatelyu_vne_koman')}>
                      <InfoCircleOutlined style={{ marginLeft: "4px" }} />
                    </Tooltip>
                  </span>
                }
                name="models"
                help={t('Modeli_dostupnye_polzovatelyu_vne_koman')}
              >
                <Select2 mode="multiple" placeholder={t('Vybrat_modeli')} style={{ width: "100%" }}>
                  <Select2.Option key="all-proxy-models" value="all-proxy-models">
                    {t('Vse_proksi_modeli')}
                  </Select2.Option>
                  <Select2.Option key="no-default-models" value="no-default-models">
                    {t('Net_modeley_po_umolchaniyu')}
                  </Select2.Option>
                  {userModels.map((model) => (
                    <Select2.Option key={model} value={model}>
                      {getModelDisplayName(model)}
                    </Select2.Option>
                  ))}
                </Select2>
              </Form.Item>
            </AccordionBody>
          </Accordion>
          <div style={{ textAlign: "right", marginTop: "10px" }}>
            <Button type="primary" icon={<UserAddOutlined />} htmlType="submit">
              {t('Priglasit_polzovatelya_1')}
            </Button>
          </div>
        </Form>
      </Modal>
      {apiuser && (
        <OnboardingModal
          isInvitationLinkModalVisible={isInvitationLinkModalVisible}
          setIsInvitationLinkModalVisible={setIsInvitationLinkModalVisible}
          baseUrl={baseUrl || ""}
          invitationLinkData={invitationLinkData}
        />
      )}
    </div>
  );
};
