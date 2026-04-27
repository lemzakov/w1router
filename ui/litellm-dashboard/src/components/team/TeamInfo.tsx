import useAuthorized from "@/app/(dashboard)/hooks/useAuthorized";
import { useOrganizations } from "@/app/(dashboard)/hooks/organizations/useOrganizations";
import UserSearchModal from "@/components/common_components/user_search_modal";
import {
  getGuardrailsList,
  getPoliciesList,
  getPolicyInfoWithGuardrails,
  Member,
  Organization,
  organizationInfoCall,
  teamInfoCall,
  teamMemberAddCall,
  teamMemberDeleteCall,
  teamMemberUpdateCall,
  teamUpdateCall,
} from "@/components/networking";
import { formatNumberWithCommas } from "@/utils/dataUtils";
import { mapEmptyStringToNull } from "@/utils/keyUpdateUtils";
import { isProxyAdminRole } from "@/utils/roles";
import { EditOutlined, InfoCircleOutlined, MinusCircleOutlined, PlusOutlined, SaveOutlined } from "@ant-design/icons";
import { ArrowLeftIcon } from "@heroicons/react/outline";
import { Badge, Card, Grid, Text, TextInput, Title } from "@tremor/react";
import { Button, Form, Input, InputNumber, Select, Space, Switch, Tabs, Tooltip } from "antd";
import MessageManager from "@/components/molecules/message_manager";
import { CheckIcon, CopyIcon } from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";
import { copyToClipboard as utilCopyToClipboard } from "../../utils/dataUtils";
import AccessGroupSelector from "../common_components/AccessGroupSelector";
import AgentSelector from "../agent_management/AgentSelector";
import DeleteResourceModal from "../common_components/DeleteResourceModal";
import DurationSelect from "../common_components/DurationSelect";
import PassThroughRoutesSelector from "../common_components/PassThroughRoutesSelector";
import { unfurlWildcardModelsInList } from "../key_team_helpers/fetch_available_models_team_key";
import LoggingSettingsView from "../logging_settings_view";
import MCPServerSelector from "../mcp_server_management/MCPServerSelector";
import MCPToolPermissions from "../mcp_server_management/MCPToolPermissions";
import { ModelSelect } from "../ModelSelect/ModelSelect";
import NotificationsManager from "../molecules/notifications_manager";
import { fetchMCPAccessGroups } from "../networking";
import ObjectPermissionsView from "../object_permissions_view";
import NumericalInput from "../shared/numerical_input";
import VectorStoreSelector from "../vector_store_management/VectorStoreSelector";
import EditLoggingSettings from "./EditLoggingSettings";
import MemberModal from "./EditMembership";
import MemberPermissions from "./member_permissions";
import {
  getTeamInfoDefaultTab,
  getTeamInfoVisibleTabs,
  TEAM_INFO_TAB_KEYS,
  TEAM_INFO_TAB_LABELS,
} from "./tabVisibilityUtils";
import TeamMembersComponent from "./TeamMemberTab";
import { TeamVirtualKeysTable } from "./TeamVirtualKeysTable";
import { useTranslation } from "react-i18next";

export interface TeamMembership {
  user_id: string;
  team_id: string;
  budget_id: string;
  spend: number;
  litellm_budget_table: {
    budget_id: string;
    soft_budget: number | null;
    max_budget: number | null;
    max_parallel_requests: number | null;
    tpm_limit: number | null;
    rpm_limit: number | null;
    model_max_budget: Record<string, number> | null;
    budget_duration: string | null;
  };
}

export interface TeamData {
  team_id: string;
  team_info: {
    team_alias: string;
    team_id: string;
    organization_id: string | null;
    admins: string[];
    members: string[];
    members_with_roles: Member[];
    metadata: Record<string, any>;
    tpm_limit: number | null;
    rpm_limit: number | null;
    max_budget: number | null;
    soft_budget?: number | null;
    budget_duration: string | null;
    models: string[];
    blocked: boolean;
    spend: number;
    max_parallel_requests: number | null;
    budget_reset_at: string | null;
    model_id: string | null;
    litellm_model_table: {
      model_aliases: Record<string, string>;
    } | null;
    created_at: string;
    access_group_ids?: string[];
    access_group_models?: string[];
    access_group_mcp_server_ids?: string[];
    access_group_agent_ids?: string[];
    guardrails?: string[];
    policies?: string[];
    object_permission?: {
      object_permission_id: string;
      mcp_servers: string[];
      mcp_access_groups?: string[];
      mcp_tool_permissions?: Record<string, string[]>;
      mcp_toolsets?: string[];
      vector_stores: string[];
      agents?: string[];
      agent_access_groups?: string[];
    };
    team_member_budget_table: {
      max_budget: number;
      budget_duration: string;
      tpm_limit: number | null;
      rpm_limit: number | null;
    } | null;
  };
  keys: any[];
  team_memberships: TeamMembership[];
}

export interface TeamInfoProps {
  teamId: string;
  onUpdate: (data: any) => void;
  onClose: () => void;
  accessToken: string | null;
  is_team_admin: boolean;
  is_proxy_admin: boolean;
  is_org_admin?: boolean;
  userModels: string[];
  editTeam: boolean;
  premiumUser?: boolean;
}

const getOrganizationModels = (organization: Organization | null, userModels: string[]) => {
  let tempModelsToPick = [];

  if (organization) {
    // Check if organization has "all-proxy-models" in its models array
    if (organization.models.includes("all-proxy-models")) {
      // Treat as all-proxy-models (use userModels)
      tempModelsToPick = userModels;
    } else if (organization.models.length > 0) {
      // Organization has specific models
      tempModelsToPick = organization.models;
    } else {
      // Empty array [] is treated as all-proxy-models
      tempModelsToPick = userModels;
    }
  } else {
    // No organization, show all available models
    tempModelsToPick = userModels;
  }

  return unfurlWildcardModelsInList(tempModelsToPick, userModels);
};

const TeamInfoView: React.FC<TeamInfoProps> = ({
  teamId,
  onClose,
  accessToken,
  is_team_admin,
  is_proxy_admin,
  is_org_admin = false,
  userModels,
  editTeam,
  premiumUser = false,
  onUpdate,
}) => {
    const { t } = useTranslation();
const [teamData, setTeamData] = useState<TeamData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAddMemberModalVisible, setIsAddMemberModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [isEditMemberModalVisible, setIsEditMemberModalVisible] = useState(false);
  const [selectedEditMember, setSelectedEditMember] = useState<Member | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [mcpAccessGroups, setMcpAccessGroups] = useState<string[]>([]);
  const [mcpAccessGroupsLoaded, setMcpAccessGroupsLoaded] = useState(false);
  const [copiedStates, setCopiedStates] = useState<Record<string, boolean>>({});
  const [guardrailsList, setGuardrailsList] = useState<string[]>([]);
  const [policiesList, setPoliciesList] = useState<string[]>([]);
  const [policyGuardrails, setPolicyGuardrails] = useState<Record<string, string[]>>({});
  const [loadingPolicies, setLoadingPolicies] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState<Member | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isTeamSaving, setIsTeamSaving] = useState(false);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const { userRole, userId } = useAuthorized();
  const { data: userOrganizations = [] } = useOrganizations();

  // Check if user is org admin for this team's organization
  const isOrgAdminForTeam = useMemo(() => {
    const teamOrgId = teamData?.team_info?.organization_id;
    if (!teamOrgId || !userId) return false;
    const org = userOrganizations.find((o) => o.organization_id === teamOrgId);
    return org?.members?.some((m: any) => m.user_id === userId && m.user_role === "org_admin") ?? false;
  }, [teamData, userOrganizations, userId]);

  // Models currently selected in the team edit form, used to scope the per-model
  // rate limit dropdown to models this team actually has access to.
  const selectedModelsInForm = Form.useWatch("models", form) as string[] | undefined;
  const availableRateLimitModels = useMemo(() => {
    const selected = selectedModelsInForm ?? teamData?.team_info?.models ?? [];
    if (selected.includes("all-proxy-models") || selected.includes("all-team-models")) {
      return userModels;
    }
    return unfurlWildcardModelsInList(selected, userModels);
  }, [selectedModelsInForm, teamData, userModels]);

  const canEditTeam = is_team_admin || is_proxy_admin || is_org_admin || isOrgAdminForTeam;
  const visibleTabs = useMemo(() => getTeamInfoVisibleTabs(canEditTeam), [canEditTeam]);
  const defaultTabKey = useMemo(
    () => getTeamInfoDefaultTab(editTeam, canEditTeam),
    [editTeam, canEditTeam]
  );

  const fetchTeamInfo = async () => {
    try {
      setLoading(true);
      if (!accessToken) return;
      const response = await teamInfoCall(accessToken, teamId);
      setTeamData(response);
    } catch (error) {
      NotificationsManager.fromBackend("Failed to load team information");
      console.error("Error fetching team info:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeamInfo();
  }, [teamId, accessToken]);

  // Fetch organization data when team has organization_id
  useEffect(() => {
    const fetchOrganization = async () => {
      if (!accessToken || !teamData?.team_info?.organization_id) {
        setOrganization(null);
        return;
      }

      try {
        const orgData = await organizationInfoCall(accessToken, teamData.team_info.organization_id);
        setOrganization(orgData);
      } catch (error) {
        console.error("Error fetching organization info:", error);
        setOrganization(null);
      }
    };

    fetchOrganization();
  }, [accessToken, teamData?.team_info?.organization_id]);

  // Compute modelsToPick based on organization and userModels
  const modelsToPick = useMemo(() => {
    return getOrganizationModels(organization, userModels);
  }, [organization, userModels]);

  const fetchMcpAccessGroups = async () => {
    if (!accessToken) return;
    if (mcpAccessGroupsLoaded) return;
    try {
      const groups = await fetchMCPAccessGroups(accessToken);
      setMcpAccessGroups(groups);
      setMcpAccessGroupsLoaded(true);
    } catch (error) {
      console.error("Failed to fetch MCP access groups:", error);
    }
  };

  useEffect(() => {
    const fetchGuardrails = async () => {
      try {
        if (!accessToken) return;
        const response = await getGuardrailsList(accessToken);
        const guardrailNames = response.guardrails.map((g: { guardrail_name: string }) => g.guardrail_name);
        setGuardrailsList(guardrailNames);
      } catch (error) {
        console.error("Failed to fetch guardrails:", error);
      }
    };

    const fetchPolicies = async () => {
      try {
        if (!accessToken) return;
        const response = await getPoliciesList(accessToken);
        const policyNames = response.policies.map((p: { policy_name: string }) => p.policy_name);
        setPoliciesList(policyNames);
      } catch (error) {
        console.error("Failed to fetch policies:", error);
      }
    };

    fetchGuardrails();
    fetchPolicies();
  }, [accessToken]);

  // Fetch resolved guardrails for all policies
  useEffect(() => {
    const fetchPolicyGuardrails = async () => {
      if (!accessToken || !teamData?.team_info?.policies || teamData.team_info.policies.length === 0) {
        return;
      }

      setLoadingPolicies(true);
      const guardrailsMap: Record<string, string[]> = {};

      try {
        await Promise.all(
          teamData.team_info.policies.map(async (policyName: string) => {
            try {
              const policyInfo = await getPolicyInfoWithGuardrails(accessToken, policyName);
              guardrailsMap[policyName] = policyInfo.resolved_guardrails || [];
            } catch (error) {
              console.error(`Failed to fetch guardrails for policy ${policyName}:`, error);
              guardrailsMap[policyName] = [];
            }
          })
        );
        setPolicyGuardrails(guardrailsMap);
      } catch (error) {
        console.error("Failed to fetch policy guardrails:", error);
      } finally {
        setLoadingPolicies(false);
      }
    };

    fetchPolicyGuardrails();
  }, [accessToken, teamData?.team_info?.policies]);

  const handleMemberCreate = async (values: any) => {
    try {
      if (accessToken == null) return;

      const member: Member = {
        user_email: values.user_email,
        user_id: values.user_id,
        role: values.role,
      };

      await teamMemberAddCall(accessToken, teamId, member);

      NotificationsManager.success("Team member added successfully");
      setIsAddMemberModalVisible(false);
      form.resetFields();

      // Fetch updated team info
      const updatedTeamData = await teamInfoCall(accessToken, teamId);
      setTeamData(updatedTeamData);

      // Notify parent component of the update
      onUpdate(updatedTeamData);
    } catch (error: any) {
      let errMsg = "Failed to add team member";

      if (error?.raw?.detail?.error?.includes("Assigning team admins is a premium feature")) {
        errMsg = "Assigning admins is an enterprise-only feature. Please upgrade your LiteLLM plan to enable this.";
      } else if (error?.message) {
        errMsg = error.message;
      }

      NotificationsManager.fromBackend(errMsg);
      console.error("Error adding team member:", error);
    }
  };

  const handleMemberUpdate = async (values: any) => {
    try {
      if (accessToken == null) {
        return;
      }

      const member: Member = {
        user_email: values.user_email,
        user_id: values.user_id,
        role: values.role,
        max_budget_in_team: values.max_budget_in_team,
        tpm_limit: values.tpm_limit,
        rpm_limit: values.rpm_limit,
      };
      MessageManager.destroy(); // Remove all existing toasts

      await teamMemberUpdateCall(accessToken, teamId, member);

      NotificationsManager.success("Team member updated successfully");
      setIsEditMemberModalVisible(false);

      // Fetch updated team info
      const updatedTeamData = await teamInfoCall(accessToken, teamId);
      setTeamData(updatedTeamData);

      // Notify parent component of the update
      onUpdate(updatedTeamData);
    } catch (error: any) {
      let errMsg = "Failed to update team member";
      if (error?.raw?.detail?.includes("Assigning team admins is a premium feature")) {
        errMsg = "Assigning admins is an enterprise-only feature. Please upgrade your LiteLLM plan to enable this.";
      } else if (error?.message) {
        errMsg = error.message;
      }
      setIsEditMemberModalVisible(false);

      MessageManager.destroy(); // Remove all existing toasts

      NotificationsManager.fromBackend(errMsg);
      console.error("Error updating team member:", error);
    }
  };

  const handleMemberDelete = (member: Member) => {
    setMemberToDelete(member);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!memberToDelete || !accessToken) return;

    setIsDeleting(true);
    try {
      await teamMemberDeleteCall(accessToken, teamId, memberToDelete);

      NotificationsManager.success("Team member removed successfully");

      // Fetch updated team info
      const updatedTeamData = await teamInfoCall(accessToken, teamId);
      setTeamData(updatedTeamData);

      // Notify parent component of the update
      onUpdate(updatedTeamData);
    } catch (error) {
      NotificationsManager.fromBackend("Failed to remove team member");
      console.error("Error removing team member:", error);
    } finally {
      setIsDeleting(false);
      setIsDeleteModalOpen(false);
      setMemberToDelete(null);
    }
  };

  const handleDeleteCancel = () => {
    setIsDeleteModalOpen(false);
    setMemberToDelete(null);
  };

  const handleTeamUpdate = async (values: any) => {
    try {
      if (!accessToken) return;
      setIsTeamSaving(true);

      let parsedMetadata = {};
      try {
        const rawMetadata = values.metadata ? JSON.parse(values.metadata) : {};
        // Exclude soft_budget_alerting_emails from parsed metadata since it's handled separately
        const { soft_budget_alerting_emails, ...rest } = rawMetadata;
        parsedMetadata = rest;
      } catch (e) {
        NotificationsManager.fromBackend("Invalid JSON in metadata field");
        return;
      }

      let secretManagerSettings: Record<string, any> | undefined;
      if (typeof values.secret_manager_settings === "string") {
        const trimmedSecretConfig = values.secret_manager_settings.trim();
        if (trimmedSecretConfig.length > 0) {
          try {
            secretManagerSettings = JSON.parse(values.secret_manager_settings);
          } catch (e) {
            NotificationsManager.fromBackend("Invalid JSON in secret manager settings");
            return;
          }
        }
      }

      const sanitizeNumeric = (v: any) => {
        if (v === null || v === undefined) return null;
        if (typeof v === "string" && v.trim() === "") return null;
        if (typeof v === "number" && Number.isNaN(v)) return null;
        return v;
      };

      const modelTpmLimit: Record<string, number> = {};
      const modelRpmLimit: Record<string, number> = {};
      for (const entry of (values.modelLimits ?? []) as { model?: string; tpm?: number; rpm?: number }[]) {
        if (entry?.model) {
          if (entry.tpm != null) modelTpmLimit[entry.model] = entry.tpm;
          if (entry.rpm != null) modelRpmLimit[entry.model] = entry.rpm;
        }
      }

      const updateData: any = {
        team_id: teamId,
        team_alias: values.team_alias,
        models: values.models,
        tpm_limit: sanitizeNumeric(values.tpm_limit),
        rpm_limit: sanitizeNumeric(values.rpm_limit),
        model_tpm_limit: modelTpmLimit,
        model_rpm_limit: modelRpmLimit,
        max_budget: values.max_budget,
        soft_budget: sanitizeNumeric(values.soft_budget),
        budget_duration: values.budget_duration,
        metadata: {
          ...parsedMetadata,
          ...(values.guardrails?.length > 0 ? { guardrails: values.guardrails } : {}),
          ...(values.logging_settings?.length > 0 ? { logging: values.logging_settings } : {}),
          disable_global_guardrails: values.disable_global_guardrails || false,
          soft_budget_alerting_emails:
            typeof values.soft_budget_alerting_emails === "string"
              ? values.soft_budget_alerting_emails
                .split(",")
                .map((email: string) => email.trim())
                .filter((email: string) => email.length > 0)
              : values.soft_budget_alerting_emails || [],
          ...(secretManagerSettings !== undefined ? { secret_manager_settings: secretManagerSettings } : {}),
        },
        ...(values.policies?.length > 0 ? { policies: values.policies } : {}),
        ...(values.organization_id !== info.organization_id
          ? { organization_id: values.organization_id ?? null }
          : {}),
      };

      updateData.max_budget = mapEmptyStringToNull(updateData.max_budget);
      updateData.team_member_budget_duration = values.team_member_budget_duration;

      if (values.team_member_budget !== undefined) {
        updateData.team_member_budget = Number(values.team_member_budget);
      }

      if (values.team_member_key_duration !== undefined) {
        updateData.team_member_key_duration = values.team_member_key_duration;
      }

      if (values.team_member_tpm_limit !== undefined || values.team_member_rpm_limit !== undefined) {
        updateData.team_member_tpm_limit = sanitizeNumeric(values.team_member_tpm_limit);
        updateData.team_member_rpm_limit = sanitizeNumeric(values.team_member_rpm_limit);
      }

      // Handle object_permission updates
      const { servers, accessGroups, toolsets } = values.mcp_servers_and_groups || {
        servers: [],
        accessGroups: [],
        toolsets: [],
      };
      const serverIds = new Set(servers || []);
      const mcpToolPermissions = Object.fromEntries(
        Object.entries(values.mcp_tool_permissions || {}).filter(([serverId]) => serverIds.has(serverId)),
      );

      updateData.object_permission = {};
      if (servers) {
        updateData.object_permission.mcp_servers = servers;
      }
      if (accessGroups) {
        updateData.object_permission.mcp_access_groups = accessGroups;
      }
      if (mcpToolPermissions) {
        updateData.object_permission.mcp_tool_permissions = mcpToolPermissions;
      }
      if (toolsets) {
        updateData.object_permission.mcp_toolsets = toolsets;
      }
      delete values.mcp_servers_and_groups;
      delete values.mcp_tool_permissions;

      // Handle agent permissions
      const { agents, accessGroups: agentAccessGroups } = values.agents_and_groups || {
        agents: [],
        accessGroups: [],
      };
      if (agents && agents.length > 0) {
        updateData.object_permission.agents = agents;
      }
      if (agentAccessGroups && agentAccessGroups.length > 0) {
        updateData.object_permission.agent_access_groups = agentAccessGroups;
      }
      delete values.agents_and_groups;

      // Handle vector stores permissions
      if (values.vector_stores && values.vector_stores.length > 0) {
        updateData.object_permission.vector_stores = values.vector_stores;
      }

      // Pass access_group_ids to the update request
      if (values.access_group_ids !== undefined) {
        updateData.access_group_ids = values.access_group_ids;
      }

      const response = await teamUpdateCall(accessToken, updateData);

      NotificationsManager.success("Team settings updated successfully");
      setIsEditing(false);
      fetchTeamInfo();
    } catch (error) {
      console.error("Error updating team:", error);
    } finally {
      setIsTeamSaving(false);
    }
  };

  if (loading) {
    return <div className="p-4">{t('Zagruzka_1')}</div>;
  }

  if (!teamData?.team_info) {
    return <div className="p-4">{t('Komanda_ne_naydena')}</div>;
  }

  const { team_info: info } = teamData;

  const copyToClipboard = async (text: string, key: string) => {
    const success = await utilCopyToClipboard(text);
    if (success) {
      setCopiedStates((prev) => ({ ...prev, [key]: true }));
      setTimeout(() => {
        setCopiedStates((prev) => ({ ...prev, [key]: false }));
      }, 2000);
    }
  };

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <div>
          <Button
            type="text"
            icon={<ArrowLeftIcon className="h-4 w-4" />}
            onClick={onClose}
            className="mb-4"
          >
            {t('Nazad_k_komandam')}
          </Button>
          <Title>{info.team_alias}</Title>
          <div className="flex items-center">
            <Text className="text-gray-500 font-mono">{info.team_id}</Text>
            <Button
              type="text"
              size="small"
              icon={copiedStates["team-id"] ? <CheckIcon size={12} /> : <CopyIcon size={12} />}
              onClick={() => copyToClipboard(info.team_id, "team-id")}
              className={`left-2 z-10 transition-all duration-200 ${copiedStates["team-id"]
                ? "text-green-600 bg-green-50 border-green-200"
                : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                }`}
            />
          </div>
        </div>
      </div>

      <Tabs
        defaultActiveKey={defaultTabKey}
        className="mb-4"
        items={[
          {
            key: TEAM_INFO_TAB_KEYS.OVERVIEW,
            label: TEAM_INFO_TAB_LABELS[TEAM_INFO_TAB_KEYS.OVERVIEW],
            children: (
              <Grid numItems={1} numItemsSm={2} numItemsLg={3} className="gap-6">
                <Card>
                  <Text>{t('Byudzhet')}</Text>
                  <div className="mt-2">
                    <Title>${formatNumberWithCommas(info.spend, 4)}</Title>
                    <Text>
                      ${t('iz')} {info.max_budget === null ? t('Bez_ogranicheniy') : `$${formatNumberWithCommas(info.max_budget, 4)}`}
                    </Text>
                    {info.budget_duration && <Text className="text-gray-500">${t('Sbros')} {info.budget_duration}</Text>}
                    <br />
                    {info.team_member_budget_table && (
                      <Text className="text-gray-500">
                        ${t('Byudzhet_uchastnika_komandy')} ${formatNumberWithCommas(info.team_member_budget_table.max_budget, 4)}
                      </Text>
                    )}
                  </div>
                </Card>

                <Card>
                  <Text>{t('Limity_skorosti')}</Text>
                  <div className="mt-2">
                    <Text>TPM: {info.tpm_limit || t('Bez_ogranicheniy')}</Text>
                    <Text>RPM: {info.rpm_limit || t('Bez_ogranicheniy')}</Text>
                    {info.max_parallel_requests && <Text>${t('Maks_parallelnyh_zaprosov')} {info.max_parallel_requests}</Text>}
                    {(() => {
                      const modelTpm = (info.metadata?.model_tpm_limit ?? {}) as Record<string, number>;
                      const modelRpm = (info.metadata?.model_rpm_limit ?? {}) as Record<string, number>;
                      const models = Array.from(new Set([...Object.keys(modelTpm), ...Object.keys(modelRpm)]));
                      if (models.length === 0) return null;
                      return (
                        <div className="mt-3">
                          <Text className="text-gray-500">{t('Limity_po_modelyam')}</Text>
                          {models.map((m) => (
                            <Text key={m} className="text-xs">
                              {m}: TPM {modelTpm[m] ?? "—"}, RPM {modelRpm[m] ?? "—"}
                            </Text>
                          ))}
                        </div>
                      );
                    })()}
                  </div>
                </Card>

                <Card>
                  <Text>{t('Modeli')}</Text>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {info.models.length === 0 || info.models.includes("all-proxy-models") ? (
                      <Badge color="red">{t('Vse_modeli_proksi')}</Badge>
                    ) : (
                      <>
                        {info.models.map((model: string, index: number) => (
                          <Badge key={`direct-${index}`} color="blue">
                            {model}
                          </Badge>
                        ))}
                        {(info.access_group_models || []).map((model: string, index: number) => (
                          <Badge key={`ag-${index}`} color="green" title="From access group">
                            {model}
                          </Badge>
                        ))}
                      </>
                    )}
                  </div>
                </Card>

                <Card>
                  <Text className="font-semibold text-gray-900">{t('Virtualnye_klyuchi')}</Text>
                  <div className="mt-2">
                    <Text>${t('Klyuchi')} ${t('polzovateley')}: {teamData.keys.filter((key) => key.user_id).length}</Text>
                    <Text>${t('Klyuchi_servisnyh_akkauntov')} {teamData.keys.filter((key) => !key.user_id).length}</Text>
                    <Text className="text-gray-500">${t('Vsego')} {teamData.keys.length}</Text>
                  </div>
                </Card>

                <ObjectPermissionsView
                  objectPermission={info.object_permission}
                  variant="card"
                  accessToken={accessToken}
                />

                <Card>
                  <Text className="font-semibold text-gray-900 mb-3">{t('Guardrails')}</Text>
                  {info.guardrails && info.guardrails.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {info.guardrails.map((guardrail: string, index: number) => (
                        <Badge key={index} color="blue">
                          {guardrail}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <Text className="text-gray-500">{t('Guardrails_ne_nastroeny')}</Text>
                  )}
                  {info.metadata?.disable_global_guardrails && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <Badge color="yellow">{t('Globalnye_Guardrails_otklyucheny')}</Badge>
                    </div>
                  )}
                </Card>

                <Card>
                  <Text className="font-semibold text-gray-900 mb-3">{t('Politiki')}</Text>
                  {info.policies && info.policies.length > 0 ? (
                    <div className="space-y-4">
                      {info.policies.map((policy: string, index: number) => (
                        <div key={index} className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Badge color="purple">{policy}</Badge>
                            {loadingPolicies && <Text className="text-xs text-gray-400">{t('Zagruzka_guardrails')}</Text>}
                          </div>
                          {!loadingPolicies && policyGuardrails[policy] && policyGuardrails[policy].length > 0 && (
                            <div className="ml-4 pl-3 border-l-2 border-gray-200">
                              <Text className="text-xs text-gray-500 mb-1">{t('Primenyonnye_Guardrails')}</Text>
                              <div className="flex flex-wrap gap-1">
                                {policyGuardrails[policy].map((guardrail: string, gIndex: number) => (
                                  <Badge key={gIndex} color="blue" size="xs">
                                    {guardrail}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <Text className="text-gray-500">{t('Politiki_ne_nastroeny')}</Text>
                  )}
                </Card>

                <LoggingSettingsView
                  loggingConfigs={info.metadata?.logging || []}
                  disabledCallbacks={[]}
                  variant="card"
                />
              </Grid>
            ),
          },
          {
            key: TEAM_INFO_TAB_KEYS.VIRTUAL_KEYS,
            label: TEAM_INFO_TAB_LABELS[TEAM_INFO_TAB_KEYS.VIRTUAL_KEYS],
            children: (
              <TeamVirtualKeysTable
                teamId={teamId}
                teamAlias={info.team_alias}
                organization={organization}
              />
            ),
          },
          {
            key: TEAM_INFO_TAB_KEYS.MEMBERS,
            label: TEAM_INFO_TAB_LABELS[TEAM_INFO_TAB_KEYS.MEMBERS],
            children: (
              <TeamMembersComponent
                teamData={teamData}
                canEditTeam={canEditTeam}
                handleMemberDelete={handleMemberDelete}
                setSelectedEditMember={setSelectedEditMember}
                setIsEditMemberModalVisible={setIsEditMemberModalVisible}
                setIsAddMemberModalVisible={setIsAddMemberModalVisible}
              />
            ),
          },
          {
            key: TEAM_INFO_TAB_KEYS.MEMBER_PERMISSIONS,
            label: TEAM_INFO_TAB_LABELS[TEAM_INFO_TAB_KEYS.MEMBER_PERMISSIONS],
            children: (
              <MemberPermissions teamId={teamId} accessToken={accessToken} canEditTeam={canEditTeam} />
            ),
          },
          {
            key: TEAM_INFO_TAB_KEYS.SETTINGS,
            label: TEAM_INFO_TAB_LABELS[TEAM_INFO_TAB_KEYS.SETTINGS],
            children: (
              <Card className="overflow-y-auto max-h-[65vh]">
                <div className="flex justify-between items-center mb-4">
                  <Title>{t('Nastroyki_komandy')}</Title>
                  {canEditTeam && !isEditing && (
                    <Button icon={<EditOutlined className="h-4 w-4" />} onClick={() => setIsEditing(true)}>{t('Redaktirovat_nastroyki')}</Button>
                  )}
                </div>

                {isEditing ? (
                  <Form
                    form={form}
                    onFinish={handleTeamUpdate}
                    initialValues={{
                      ...info,
                      team_alias: info.team_alias,
                      models: info.models,
                      tpm_limit: info.tpm_limit,
                      rpm_limit: info.rpm_limit,
                      modelLimits: Array.from(
                        new Set([
                          ...Object.keys(info.metadata?.model_tpm_limit ?? {}),
                          ...Object.keys(info.metadata?.model_rpm_limit ?? {}),
                        ]),
                      ).map((model) => ({
                        model,
                        tpm: info.metadata?.model_tpm_limit?.[model],
                        rpm: info.metadata?.model_rpm_limit?.[model],
                      })),
                      max_budget: info.max_budget,
                      soft_budget: info.soft_budget,
                      budget_duration: info.budget_duration,
                      team_member_tpm_limit: info.team_member_budget_table?.tpm_limit,
                      team_member_rpm_limit: info.team_member_budget_table?.rpm_limit,
                      team_member_budget: info.team_member_budget_table?.max_budget,
                      team_member_budget_duration: info.team_member_budget_table?.budget_duration,
                      guardrails: info.metadata?.guardrails || [],
                      policies: info.policies || [],
                      disable_global_guardrails: info.metadata?.disable_global_guardrails || false,
                      soft_budget_alerting_emails:
                        Array.isArray(info.metadata?.soft_budget_alerting_emails)
                          ? info.metadata.soft_budget_alerting_emails.join(", ")
                          : "",
                      metadata: info.metadata
                        ? JSON.stringify(
                          (({ logging, secret_manager_settings, soft_budget_alerting_emails, model_tpm_limit, model_rpm_limit, ...rest }) => rest)(info.metadata),
                          null,
                          2,
                        )
                        : "",
                      logging_settings: info.metadata?.logging || [],
                      secret_manager_settings: info.metadata?.secret_manager_settings
                        ? JSON.stringify(info.metadata.secret_manager_settings, null, 2)
                        : "",
                      organization_id: info.organization_id,
                      vector_stores: info.object_permission?.vector_stores || [],
                      mcp_servers: info.object_permission?.mcp_servers || [],
                      mcp_access_groups: info.object_permission?.mcp_access_groups || [],
                      mcp_servers_and_groups: {
                        servers: info.object_permission?.mcp_servers || [],
                        accessGroups: info.object_permission?.mcp_access_groups || [],
                        toolsets: info.object_permission?.mcp_toolsets || [],
                      },
                      mcp_tool_permissions: info.object_permission?.mcp_tool_permissions || {},
                      agents_and_groups: {
                        agents: info.object_permission?.agents || [],
                        accessGroups: info.object_permission?.agent_access_groups || [],
                      },
                      access_group_ids: info.access_group_ids || [],
                    }}
                    layout="vertical"
                  >
                    <Form.Item
                      label={t('Nazvanie_komandy')}
                      name="team_alias"
                      rules={[{ required: true, message: t('Pozhaluysta_vvedite_nazvanie_komandy') }]}
                    >
                      <Input type="" />
                    </Form.Item>

                    <Form.Item
                      label={t('Modeli')}
                      name="models"
                      rules={[{ required: true, message: t('Pozhaluysta_vyberite_hotya_by_odnu_model') }]}
                    >
                      <ModelSelect
                        value={form.getFieldValue("models") || []}
                        onChange={(values) => form.setFieldValue("models", values)}
                        teamID={teamId}
                        organizationID={teamData?.team_info?.organization_id || undefined}
                        options={{
                          includeSpecialOptions: true,
                          includeUserModels: !teamData?.team_info?.organization_id,
                          showAllProxyModelsOverride: isProxyAdminRole(userRole) && !teamData?.team_info?.organization_id,
                        }}
                        context="team"
                        dataTestId="models-select"
                      />
                    </Form.Item>

                    <Form.Item label={t('Maksimalnyy_byudzhet_USD')} name="max_budget">
                      <NumericalInput step={0.01} precision={2} style={{ width: "100%" }} />
                    </Form.Item>

                    <Form.Item label={t('Myagkiy_byudzhet_USD')} name="soft_budget">
                      <NumericalInput step={0.01} precision={2} style={{ width: "100%" }} />
                    </Form.Item>

                    <Form.Item
                      label={t('Email_dlya_uvedomleniy_o_myagkom_byudzhe')}
                      name="soft_budget_alerting_emails"
                      tooltip={t('Email_adresa_cherez_zapyatuyu_dlya_poluc')}
                    >
                      <Input placeholder="example1@test.com, example2@test.com" />
                    </Form.Item>

                    <Form.Item
                      label={t('Byudzhet_uchastnika_komandy_USD')}
                      name="team_member_budget"
                      tooltip={t('Individualnyy_byudzhet_polzovatelya_v_ko')}
                    >
                      <NumericalInput step={0.01} precision={2} style={{ width: "100%" }} />
                    </Form.Item>

                    <Form.Item label={t('Period_byudzheta_uchastnika')} name="team_member_budget_duration">
                      <DurationSelect
                        onChange={(value) => form.setFieldValue("team_member_budget_duration", value)}
                        value={form.getFieldValue("team_member_budget_duration")}
                      />
                    </Form.Item>

                    <Form.Item
                      label={t('Dlitelnost_klyucha_uchastnika_napr_1d')}
                      name="team_member_key_duration"
                      tooltip={t('Ogranichenie_na_dlitelnost_klyucha_uchas')}
                    >
                      <TextInput placeholder={t('napr_30d')} />
                    </Form.Item>

                    <Form.Item
                      label={t('Limit_TPM_uchastnika_komandy')}
                      name="team_member_tpm_limit"
                      tooltip={t('Limit_tokenov_v_minutu_po_umolchaniyu_dl')}
                    >
                      <NumericalInput step={1} style={{ width: "100%" }} placeholder="e.g., 1000" />
                    </Form.Item>

                    <Form.Item
                      label={t('Limit_RPM_uchastnika_komandy')}
                      name="team_member_rpm_limit"
                      tooltip={t('Limit_zaprosov_v_minutu_po_umolchaniyu_d')}
                    >
                      <NumericalInput step={1} style={{ width: "100%" }} placeholder="e.g., 100" />
                    </Form.Item>

                    <Form.Item label={t('Sbrosit_byudzhet')} name="budget_duration">
                      <Select placeholder={t('n_p')}>
                        <Select.Option value="24h">{t('ezhednevno')}</Select.Option>
                        <Select.Option value="7d">{t('ezhenedelno')}</Select.Option>
                        <Select.Option value="30d">{t('ezhemesyachno')}</Select.Option>
                      </Select>
                    </Form.Item>

                    <Form.Item label={t('Limit_tokenov_v_minutu_TPM')} name="tpm_limit">
                      <NumericalInput step={1} style={{ width: "100%" }} />
                    </Form.Item>

                    <Form.Item label={t('Limit_zaprosov_v_minutu_RPM')} name="rpm_limit">
                      <NumericalInput step={1} style={{ width: "100%" }} />
                    </Form.Item>

                    <Form.Item
                      label={t('Limity_skorosti_po_modelyam')}
                      tooltip={t('Ustanovite_limity_TPM_RPM_dlya_kazhdoy_m')}
                    >
                      <Form.List name="modelLimits">
                        {(fields, { add, remove }) => (
                          <>
                            {fields.map(({ key, name, ...restField }) => (
                              <Space
                                key={key}
                                style={{ display: "flex", marginBottom: 8 }}
                                align="baseline"
                              >
                                <Form.Item
                                  {...restField}
                                  name={[name, "model"]}
                                  rules={[
                                    { required: true, message: t('Vyberite_model') },
                                    {
                                      validator: (_, value) => {
                                        if (!value) return Promise.resolve();
                                        const all = form.getFieldValue("modelLimits") ?? [];
                                        const dupes = all.filter(
                                          (entry: { model?: string }) => entry?.model === value,
                                        );
                                        if (dupes.length > 1) {
                                          return Promise.reject(new Error(t('Dubliruyuschayasya_model')));
                                        }
                                        return Promise.resolve();
                                      },
                                    },
                                  ]}
                                  style={{ minWidth: 240 }}
                                >
                                  <Select
                                    showSearch
                                    placeholder={t('Vybrat_model')}
                                    allowClear
                                    options={availableRateLimitModels.map((m) => ({
                                      value: m,
                                      label: m,
                                    }))}
                                  />
                                </Form.Item>
                                <Form.Item
                                  {...restField}
                                  name={[name, "tpm"]}
                                  rules={[
                                    {
                                      validator: async (_, value) => {
                                        const row = (form.getFieldValue("modelLimits") ?? [])[name] ?? {};
                                        if (row.model && value == null && row.rpm == null) {
                                          return Promise.reject(new Error(t('Ukazhite_hotya_by_TPM_ili_RPM')));
                                        }
                                        return Promise.resolve();
                                      },
                                    },
                                  ]}
                                >
                                  <InputNumber placeholder={t('Limit_TPM')} min={0} />
                                </Form.Item>
                                <Form.Item {...restField} name={[name, "rpm"]}>
                                  <InputNumber placeholder={t('Limit_RPM')} min={0} />
                                </Form.Item>
                                <MinusCircleOutlined
                                  onClick={() => remove(name)}
                                  style={{ color: "#ef4444" }}
                                />
                              </Space>
                            ))}
                            <Form.Item>
                              <Button
                                type="dashed"
                                onClick={() => add()}
                                block
                                icon={<PlusOutlined />}
                              >
                                {t('Dobavit_limit_po_modeli')}
                              </Button>
                            </Form.Item>
                          </>
                        )}
                      </Form.List>
                    </Form.Item>

                    <Form.Item
                      label={
                        <span>
                          Guardrails{" "}
                          <Tooltip title="Setup your first guardrail">
                            <a
                              href="https://docs.litellm.ai/docs/proxy/guardrails/quick_start"
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <InfoCircleOutlined style={{ marginLeft: "4px" }} />
                            </a>
                          </Tooltip>
                        </span>
                      }
                      name="guardrails"
                      help={t('Vyberite_suschestvuyuschie_guardrails_il')}
                    >
                      <Select
                        mode="tags"
                        placeholder={t('Vybrat_ili_vvesti_guardrails')}
                        options={guardrailsList.map((name) => ({ value: name, label: name }))}
                      />
                    </Form.Item>

                    <Form.Item
                      label={
                        <span>
                          {t('Otklyuchit_globalnye_Guardrails')}
                          <Tooltip title={t('Esli_vklyucheno_eta_komanda_budet_obhodi')}>
                            <InfoCircleOutlined style={{ marginLeft: "4px" }} />
                          </Tooltip>
                        </span>
                      }
                      name="disable_global_guardrails"
                      valuePropName="checked"
                      help={t('Obhodit_globalnye_guardrails_dlya_etoy')}
                    >
                      <Switch checkedChildren={t('Da')} unCheckedChildren={t('Net')} />
                    </Form.Item>

                    <Form.Item
                      label={
                        <span>
                          Policies{" "}
                          <Tooltip title="Apply policies to this team to control guardrails and other settings">
                            <a
                              href="https://docs.litellm.ai/docs/proxy/guardrails/guardrail_policies"
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <InfoCircleOutlined style={{ marginLeft: "4px" }} />
                            </a>
                          </Tooltip>
                        </span>
                      }
                      name="policies"
                      help={t('Vyberite_suschestvuyuschie_politiki_ili_')}
                    >
                      <Select
                        mode="tags"
                        placeholder={t('Vybrat_ili_vvesti_politiki')}
                        options={policiesList.map((name) => ({ value: name, label: name }))}
                      />
                    </Form.Item>

                    <Form.Item
                      label={
                        <span>
                          {t('Gruppy_dostupa')}{" "}
                          <Tooltip title={t('Naznachte_gruppy_dostupa_etoy_komande_G')}>
                            <InfoCircleOutlined style={{ marginLeft: "4px" }} />
                          </Tooltip>
                        </span>
                      }
                      name="access_group_ids"
                    >
                      <AccessGroupSelector placeholder={t('Vybrat_gruppy_dostupa_neobyazatelno')} />
                    </Form.Item>

                    <Form.Item label={t('Hranilischa_vektorov')} name="vector_stores" aria-label="Vector Stores">
                      <VectorStoreSelector
                        onChange={(values: string[]) => form.setFieldValue("vector_stores", values)}
                        value={form.getFieldValue("vector_stores")}
                        accessToken={accessToken || ""}
                        placeholder={t('Vybrat_hranilischa_vektorov')}
                      />
                    </Form.Item>

                    <Form.Item label={t('Razreshyonnye_marshruty_tranzita')} name="allowed_passthrough_routes">
                      <PassThroughRoutesSelector
                        onChange={(values: string[]) => form.setFieldValue("allowed_passthrough_routes", values)}
                        value={form.getFieldValue("allowed_passthrough_routes")}
                        accessToken={accessToken || ""}
                        placeholder={t('Vybrat_marshruty_tranzita')}
                      />
                    </Form.Item>

                    <Form.Item label={t('MCP_servery_Gruppy_dostupa')} name="mcp_servers_and_groups">
                      <MCPServerSelector
                        onChange={(val) => form.setFieldValue("mcp_servers_and_groups", val)}
                        value={form.getFieldValue("mcp_servers_and_groups")}
                        accessToken={accessToken || ""}
                        placeholder={t('Vybrat_MCP_servery_ili_gruppy_dostupa')}
                      />
                    </Form.Item>

                    {/* Hidden field to register mcp_tool_permissions with the form */}
                    <Form.Item name="mcp_tool_permissions" initialValue={{}} hidden>
                      <Input type="hidden" />
                    </Form.Item>

                    <Form.Item
                      noStyle
                      shouldUpdate={(prevValues, currentValues) =>
                        prevValues.mcp_servers_and_groups !== currentValues.mcp_servers_and_groups ||
                        prevValues.mcp_tool_permissions !== currentValues.mcp_tool_permissions
                      }
                    >
                      {() => (
                        <div className="mb-6">
                          <MCPToolPermissions
                            accessToken={accessToken || ""}
                            selectedServers={form.getFieldValue("mcp_servers_and_groups")?.servers || []}
                            toolPermissions={form.getFieldValue("mcp_tool_permissions") || {}}
                            onChange={(toolPerms) => form.setFieldsValue({ mcp_tool_permissions: toolPerms })}
                          />
                        </div>
                      )}
                    </Form.Item>

                    <Form.Item label={t('Agenty_Gruppy_dostupa')} name="agents_and_groups">
                      <AgentSelector
                        onChange={(val) => form.setFieldValue("agents_and_groups", val)}
                        value={form.getFieldValue("agents_and_groups")}
                        accessToken={accessToken || ""}
                        placeholder={t('Vybrat_agentov_ili_gruppy_dostupa_neob')}
                      />
                    </Form.Item>

                    <Form.Item label={t('Organizatsiya')} name="organization_id">
                      <Select
                        allowClear
                        placeholder={t('Vybrat_organizatsiyu')}
                        showSearch
                        optionFilterProp="label"
                        options={userOrganizations.map((org) => ({
                          value: org.organization_id,
                          label: org.organization_alias || org.organization_id,
                        }))}
                      />
                    </Form.Item>

                    <Form.Item label={t('Nastroyki_logirovaniya')} name="logging_settings">
                      <EditLoggingSettings
                        value={form.getFieldValue("logging_settings")}
                        onChange={(values) => form.setFieldValue("logging_settings", values)}
                      />
                    </Form.Item>

                    <Form.Item
                      label={t('Nastroyki_menedzhera_sekretov')}
                      name="secret_manager_settings"
                      help={
                        premiumUser
                          ? t('Vvedite_konfiguratsiyu_menedzhera_sekret')
                          : t('Premium_funktsiya_Obnovite_plan_dlya_upr')
                      }
                      rules={[
                        {
                          validator: async (_, value) => {
                            if (!value) {
                              return Promise.resolve();
                            }
                            try {
                              JSON.parse(value);
                              return Promise.resolve();
                            } catch (error) {
                              return Promise.reject(new Error(t('Pozhaluysta_vvedite_korrektnyy_JSON')));
                            }
                          },
                        },
                      ]}
                    >
                      <Input.TextArea
                        rows={6}
                        placeholder='{"namespace": "admin", "mount": "secret", "path_prefix": "litellm"}'
                        disabled={!premiumUser}
                      />
                    </Form.Item>

                    <Form.Item label={t('Metadannye')} name="metadata">
                      <Input.TextArea rows={10} />
                    </Form.Item>

                    <div className="sticky z-10 bg-white p-4 pr-0 border-t border-gray-200 bottom-[-1.5rem] inset-x-[-1.5rem]">
                      <div className="flex justify-end items-center gap-2">
                        <Button onClick={() => setIsEditing(false)} disabled={isTeamSaving}>
                          {t('Otmena')}
                        </Button>
                        <Button icon={<SaveOutlined className="h-4 w-4" />} type="primary" htmlType="submit" loading={isTeamSaving}>
                          {t('Sohranit')}
                        </Button>
                      </div>
                    </div>
                  </Form>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <Text className="font-medium">{t('Nazvanie_komandy')}</Text>
                      <div>{info.team_alias}</div>
                    </div>
                    <div>
                      <Text className="font-medium">{t('ID_komandy')}</Text>
                      <div className="font-mono">{info.team_id}</div>
                    </div>
                    <div>
                      <Text className="font-medium">{t('Sozdano')}</Text>
                      <div>{new Date(info.created_at).toLocaleString()}</div>
                    </div>
                    <div>
                      <Text className="font-medium">{t('Modeli')}</Text>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {info.models.map((model, index) => (
                          <Badge key={index} color="red">
                            {model}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <Text className="font-medium">{t('Limity_skorosti')}</Text>
                      <div>TPM: {info.tpm_limit || t('Bez_ogranicheniy')}</div>
                      <div>RPM: {info.rpm_limit || t('Bez_ogranicheniy')}</div>
                      {(() => {
                        const modelTpm = (info.metadata?.model_tpm_limit ?? {}) as Record<string, number>;
                        const modelRpm = (info.metadata?.model_rpm_limit ?? {}) as Record<string, number>;
                        const models = Array.from(new Set([...Object.keys(modelTpm), ...Object.keys(modelRpm)]));
                        if (models.length === 0) return null;
                        return (
                          <div className="mt-2">
                            <Text className="text-gray-500">{t('Limity_po_modelyam')}</Text>
                            {models.map((m) => (
                              <div key={m} className="text-xs ml-2">
                                {m}: TPM {modelTpm[m] ?? "—"}, RPM {modelRpm[m] ?? "—"}
                              </div>
                            ))}
                          </div>
                        );
                      })()}
                    </div>
                    <div>
                      <Text className="font-medium">{t('Byudzhet_komandy')}</Text>
                      <div>
                        ${t('Maksimalnyy_byudzhet')}:{" "}
                        {info.max_budget !== null ? `$${formatNumberWithCommas(info.max_budget, 4)}` : t('Bez_ogranicheniy')}
                      </div>
                      <div>
                        {t('Myagkiy_byudzhet')}{" "}
                        {info.soft_budget !== null && info.soft_budget !== undefined
                          ? `$${formatNumberWithCommas(info.soft_budget, 4)}`
                          : t('Bez_ogranicheniy')}
                      </div>
                      <div>{t('Sbros_byudzheta_1')} {info.budget_duration || t('Nikogda')}</div>
                      {info.metadata?.soft_budget_alerting_emails &&
                        Array.isArray(info.metadata.soft_budget_alerting_emails) &&
                        info.metadata.soft_budget_alerting_emails.length > 0 && (
                          <div>
                            {t('Email_dlya_uvedomleniy')} {info.metadata.soft_budget_alerting_emails.join(", ")}
                          </div>
                        )}
                    </div>
                    <div>
                      <Text className="font-medium">
                        {t('Nastroyki_uchastnikov_komandy')}{" "}
                        <Tooltip title={t('Eto_ogranicheniya_dlya_otdelnyh_uchastni')}>
                          <InfoCircleOutlined style={{ marginLeft: "4px" }} />
                        </Tooltip>
                      </Text>
                      <div>{t('Maks_byudzhet')} {info.team_member_budget_table?.max_budget || t('Bez_ogranicheniy')}</div>
                      <div>{t('Period_byudzheta')} {info.team_member_budget_table?.budget_duration || t('Bez_ogranicheniy')}</div>
                      <div>{t('Dlitelnost_klyucha')} {info.metadata?.team_member_key_duration || t('Bez_ogranicheniy')}</div>
                      <div>{t('Limit_TPM_1')} {info.team_member_budget_table?.tpm_limit || t('Bez_ogranicheniy')}</div>
                      <div>{t('Limit_RPM_1')} {info.team_member_budget_table?.rpm_limit || t('Bez_ogranicheniy')}</div>
                    </div>
                    <div>
                      <Text className="font-medium">{t('ID_organizatsii')}</Text>
                      <div>{info.organization_id}</div>
                    </div>
                    <div>
                      <Text className="font-medium">{t('Status')}</Text>
                      <Badge color={info.blocked ? "red" : "green"}>{info.blocked ? t('Zablokirovano') : t('Aktivno')}</Badge>
                    </div>

                    <div>
                      <Text className="font-medium">{t('Otklyuchit_globalnye_Guardrails')}</Text>
                      <div>
                        {info.metadata?.disable_global_guardrails === true ? (
                          <Badge color="yellow">{t('Vklyucheno_globalnye_guardrails_obhodyat')}</Badge>
                        ) : (
                          <Badge color="green">{t('Otklyucheno_globalnye_guardrails_aktivn')}</Badge>
                        )}
                      </div>
                    </div>

                    <ObjectPermissionsView
                      objectPermission={info.object_permission}
                      variant="inline"
                      className="pt-4 border-t border-gray-200"
                      accessToken={accessToken}
                    />

                    <LoggingSettingsView
                      loggingConfigs={info.metadata?.logging || []}
                      disabledCallbacks={[]}
                      variant="inline"
                      className="pt-4 border-t border-gray-200"
                    />

                    {info.metadata?.secret_manager_settings && (
                      <div className="pt-4 border-t border-gray-200">
                        <Text className="font-medium">{t('Nastroyki_menedzhera_sekretov')}</Text>
                        <pre className="mt-2 bg-gray-50 p-3 rounded text-xs overflow-x-auto">
                          {JSON.stringify(info.metadata.secret_manager_settings, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                )}
              </Card>
            ),
          },
        ].filter(tab => visibleTabs.includes(tab.key))}
      />

      <MemberModal
        visible={isEditMemberModalVisible}
        onCancel={() => setIsEditMemberModalVisible(false)}
        onSubmit={handleMemberUpdate}
        initialData={selectedEditMember}
        mode="edit"
        config={{
          title: t('Redaktirovat_uchastnika'),
          showEmail: true,
          showUserId: true,
          roleOptions: [
            { label: t('Administrator'), value: "admin" },
            { label: t('Polzovatel'), value: "user" },
          ],
          additionalFields: [
            {
              name: "max_budget_in_team",
              label: (
                <span>
                  {t('Byudzhet_uchastnika_komandy_USD')}{" "}
                  <Tooltip title={t('Maksimalnaya_summa_v_USD_kotoruyu_etot_u')}>
                    <InfoCircleOutlined style={{ marginLeft: "4px" }} />
                  </Tooltip>
                </span>
              ),
              type: "numerical" as const,
              step: 0.01,
              min: 0,
              placeholder: t('Limit_byudzheta_dlya_etogo_uchastnika_v_'),
            },
            {
              name: "tpm_limit",
              label: (
                <span>
                  {t('Limit_TPM_uchastnika_komandy')}{" "}
                  <Tooltip title={t('Maksimalnoe_kolichestvo_tokenov_v_minutu_1')}>
                    <InfoCircleOutlined style={{ marginLeft: "4px" }} />
                  </Tooltip>
                </span>
              ),
              type: "numerical" as const,
              step: 1,
              min: 0,
              placeholder: t('Limit_tokenov_v_minutu_dlya_etogo_uchast'),
            },
            {
              name: "rpm_limit",
              label: (
                <span>
                  {t('Limit_RPM_uchastnika_komandy')}{" "}
                  <Tooltip title={t('Maksimalnoe_kolichestvo_zaprosov_v_minut')}>
                    <InfoCircleOutlined style={{ marginLeft: "4px" }} />
                  </Tooltip>
                </span>
              ),
              type: "numerical" as const,
              step: 1,
              min: 0,
              placeholder: t('Limit_zaprosov_v_minutu_dlya_etogo_uchas'),
            },
          ],
        }}
      />

      <UserSearchModal
        isVisible={isAddMemberModalVisible}
        onCancel={() => setIsAddMemberModalVisible(false)}
        onSubmit={handleMemberCreate}
        accessToken={accessToken}
        teamId={teamId}
      />

      {/* Delete Member Confirmation Modal */}
      <DeleteResourceModal
        isOpen={isDeleteModalOpen}
        title={t('Udalit_uchastnika_komandy')}
        alertMessage={t('Udalenie_uchastnikov_komandy_takzhe_udal')}
        message={t('Vy_uvereny_chto_hotite_udalit_etogo_ucha')}
        resourceInformationTitle={t('Informatsiya_ob_uchastnike')}
        resourceInformation={[
          { label: t('ID_polzovatelya'), value: memberToDelete?.user_id, code: true },
          { label: "Email", value: memberToDelete?.user_email },
          { label: t('Rol'), value: memberToDelete?.role },
        ]}
        onCancel={handleDeleteCancel}
        onOk={handleDeleteConfirm}
        confirmLoading={isDeleting}
      />
    </div>
  );
};

export default TeamInfoView;
