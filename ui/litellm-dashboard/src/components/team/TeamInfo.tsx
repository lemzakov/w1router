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
    return <div className="p-4">Загрузка...</div>;
  }

  if (!teamData?.team_info) {
    return <div className="p-4">Команда не найдена</div>;
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
            Назад к командам
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
                  <Text>Бюджет</Text>
                  <div className="mt-2">
                    <Title>${formatNumberWithCommas(info.spend, 4)}</Title>
                    <Text>
                      из {info.max_budget === null ? "Без ограничений" : `$${formatNumberWithCommas(info.max_budget, 4)}`}
                    </Text>
                    {info.budget_duration && <Text className="text-gray-500">Сброс: {info.budget_duration}</Text>}
                    <br />
                    {info.team_member_budget_table && (
                      <Text className="text-gray-500">
                        Бюджет участника команды: ${formatNumberWithCommas(info.team_member_budget_table.max_budget, 4)}
                      </Text>
                    )}
                  </div>
                </Card>

                <Card>
                  <Text>Лимиты скорости</Text>
                  <div className="mt-2">
                    <Text>TPM: {info.tpm_limit || "Без ограничений"}</Text>
                    <Text>RPM: {info.rpm_limit || "Без ограничений"}</Text>
                    {info.max_parallel_requests && <Text>Макс. параллельных запросов: {info.max_parallel_requests}</Text>}
                    {(() => {
                      const modelTpm = (info.metadata?.model_tpm_limit ?? {}) as Record<string, number>;
                      const modelRpm = (info.metadata?.model_rpm_limit ?? {}) as Record<string, number>;
                      const models = Array.from(new Set([...Object.keys(modelTpm), ...Object.keys(modelRpm)]));
                      if (models.length === 0) return null;
                      return (
                        <div className="mt-3">
                          <Text className="text-gray-500">Лимиты по моделям:</Text>
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
                  <Text>Модели</Text>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {info.models.length === 0 || info.models.includes("all-proxy-models") ? (
                      <Badge color="red">Все модели прокси</Badge>
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
                  <Text className="font-semibold text-gray-900">Виртуальные ключи</Text>
                  <div className="mt-2">
                    <Text>Ключи пользователей: {teamData.keys.filter((key) => key.user_id).length}</Text>
                    <Text>Ключи сервисных аккаунтов: {teamData.keys.filter((key) => !key.user_id).length}</Text>
                    <Text className="text-gray-500">Всего: {teamData.keys.length}</Text>
                  </div>
                </Card>

                <ObjectPermissionsView
                  objectPermission={info.object_permission}
                  variant="card"
                  accessToken={accessToken}
                />

                <Card>
                  <Text className="font-semibold text-gray-900 mb-3">Guardrails</Text>
                  {info.guardrails && info.guardrails.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {info.guardrails.map((guardrail: string, index: number) => (
                        <Badge key={index} color="blue">
                          {guardrail}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <Text className="text-gray-500">Guardrails не настроены</Text>
                  )}
                  {info.metadata?.disable_global_guardrails && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <Badge color="yellow">Глобальные Guardrails отключены</Badge>
                    </div>
                  )}
                </Card>

                <Card>
                  <Text className="font-semibold text-gray-900 mb-3">Политики</Text>
                  {info.policies && info.policies.length > 0 ? (
                    <div className="space-y-4">
                      {info.policies.map((policy: string, index: number) => (
                        <div key={index} className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Badge color="purple">{policy}</Badge>
                            {loadingPolicies && <Text className="text-xs text-gray-400">Загрузка guardrails...</Text>}
                          </div>
                          {!loadingPolicies && policyGuardrails[policy] && policyGuardrails[policy].length > 0 && (
                            <div className="ml-4 pl-3 border-l-2 border-gray-200">
                              <Text className="text-xs text-gray-500 mb-1">Применённые Guardrails:</Text>
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
                    <Text className="text-gray-500">Политики не настроены</Text>
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
                  <Title>Настройки команды</Title>
                  {canEditTeam && !isEditing && (
                    <Button icon={<EditOutlined className="h-4 w-4" />} onClick={() => setIsEditing(true)}>Редактировать настройки</Button>
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
                      label="Название команды"
                      name="team_alias"
                      rules={[{ required: true, message: "Пожалуйста, введите название команды" }]}
                    >
                      <Input type="" />
                    </Form.Item>

                    <Form.Item
                      label="Модели"
                      name="models"
                      rules={[{ required: true, message: "Пожалуйста, выберите хотя бы одну модель" }]}
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

                    <Form.Item label="Максимальный бюджет (USD)" name="max_budget">
                      <NumericalInput step={0.01} precision={2} style={{ width: "100%" }} />
                    </Form.Item>

                    <Form.Item label="Мягкий бюджет (USD)" name="soft_budget">
                      <NumericalInput step={0.01} precision={2} style={{ width: "100%" }} />
                    </Form.Item>

                    <Form.Item
                      label="Email для уведомлений о мягком бюджете"
                      name="soft_budget_alerting_emails"
                      tooltip="Email-адреса через запятую для получения уведомлений при достижении мягкого бюджета"
                    >
                      <Input placeholder="example1@test.com, example2@test.com" />
                    </Form.Item>

                    <Form.Item
                      label="Бюджет участника команды (USD)"
                      name="team_member_budget"
                      tooltip="Индивидуальный бюджет пользователя в команде."
                    >
                      <NumericalInput step={0.01} precision={2} style={{ width: "100%" }} />
                    </Form.Item>

                    <Form.Item label="Период бюджета участника" name="team_member_budget_duration">
                      <DurationSelect
                        onChange={(value) => form.setFieldValue("team_member_budget_duration", value)}
                        value={form.getFieldValue("team_member_budget_duration")}
                      />
                    </Form.Item>

                    <Form.Item
                      label="Длительность ключа участника (напр.: 1d, 1mo)"
                      name="team_member_key_duration"
                      tooltip="Ограничение на длительность ключа участника. Формат: 30s (секунды), 30m (минуты), 30h (часы), 30d (дни), 1mo (месяц)"
                    >
                      <TextInput placeholder="напр., 30d" />
                    </Form.Item>

                    <Form.Item
                      label="Лимит TPM участника команды"
                      name="team_member_tpm_limit"
                      tooltip="Лимит токенов в минуту по умолчанию для отдельного участника команды. Применяется ко всем запросам пользователя в этой команде. Может быть переопределён для каждого участника."
                    >
                      <NumericalInput step={1} style={{ width: "100%" }} placeholder="e.g., 1000" />
                    </Form.Item>

                    <Form.Item
                      label="Лимит RPM участника команды"
                      name="team_member_rpm_limit"
                      tooltip="Лимит запросов в минуту по умолчанию для отдельного участника команды. Применяется ко всем запросам пользователя в этой команде. Может быть переопределён для каждого участника."
                    >
                      <NumericalInput step={1} style={{ width: "100%" }} placeholder="e.g., 100" />
                    </Form.Item>

                    <Form.Item label="Сбросить бюджет" name="budget_duration">
                      <Select placeholder="н/п">
                        <Select.Option value="24h">ежедневно</Select.Option>
                        <Select.Option value="7d">еженедельно</Select.Option>
                        <Select.Option value="30d">ежемесячно</Select.Option>
                      </Select>
                    </Form.Item>

                    <Form.Item label="Лимит токенов в минуту (TPM)" name="tpm_limit">
                      <NumericalInput step={1} style={{ width: "100%" }} />
                    </Form.Item>

                    <Form.Item label="Лимит запросов в минуту (RPM)" name="rpm_limit">
                      <NumericalInput step={1} style={{ width: "100%" }} />
                    </Form.Item>

                    <Form.Item
                      label="Лимиты скорости по моделям"
                      tooltip="Установите лимиты TPM/RPM для каждой модели, применяемые ко всей команде."
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
                                    { required: true, message: "Выберите модель" },
                                    {
                                      validator: (_, value) => {
                                        if (!value) return Promise.resolve();
                                        const all = form.getFieldValue("modelLimits") ?? [];
                                        const dupes = all.filter(
                                          (entry: { model?: string }) => entry?.model === value,
                                        );
                                        if (dupes.length > 1) {
                                          return Promise.reject(new Error("Дублирующаяся модель"));
                                        }
                                        return Promise.resolve();
                                      },
                                    },
                                  ]}
                                  style={{ minWidth: 240 }}
                                >
                                  <Select
                                    showSearch
                                    placeholder="Выбрать модель"
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
                                          return Promise.reject(new Error("Укажите хотя бы TPM или RPM"));
                                        }
                                        return Promise.resolve();
                                      },
                                    },
                                  ]}
                                >
                                  <InputNumber placeholder="Лимит TPM" min={0} />
                                </Form.Item>
                                <Form.Item {...restField} name={[name, "rpm"]}>
                                  <InputNumber placeholder="Лимит RPM" min={0} />
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
                                Добавить лимит по модели
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
                      help="Выберите существующие guardrails или введите новые"
                    >
                      <Select
                        mode="tags"
                        placeholder="Выбрать или ввести guardrails"
                        options={guardrailsList.map((name) => ({ value: name, label: name }))}
                      />
                    </Form.Item>

                    <Form.Item
                      label={
                        <span>
                          Отключить глобальные Guardrails
                          <Tooltip title="Если включено, эта команда будет обходить все guardrails, настроенные для выполнения при каждом запросе (глобальные guardrails)">
                            <InfoCircleOutlined style={{ marginLeft: "4px" }} />
                          </Tooltip>
                        </span>
                      }
                      name="disable_global_guardrails"
                      valuePropName="checked"
                      help="Обходить глобальные guardrails для этой команды"
                    >
                      <Switch checkedChildren="Да" unCheckedChildren="Нет" />
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
                      help="Выберите существующие политики или введите новые"
                    >
                      <Select
                        mode="tags"
                        placeholder="Выбрать или ввести политики"
                        options={policiesList.map((name) => ({ value: name, label: name }))}
                      />
                    </Form.Item>

                    <Form.Item
                      label={
                        <span>
                          Группы доступа{" "}
                          <Tooltip title="Назначьте группы доступа этой команде. Группы доступа управляют тем, какие модели, MCP серверы и агенты доступны команде">
                            <InfoCircleOutlined style={{ marginLeft: "4px" }} />
                          </Tooltip>
                        </span>
                      }
                      name="access_group_ids"
                    >
                      <AccessGroupSelector placeholder="Выбрать группы доступа (необязательно)" />
                    </Form.Item>

                    <Form.Item label="Хранилища векторов" name="vector_stores" aria-label="Vector Stores">
                      <VectorStoreSelector
                        onChange={(values: string[]) => form.setFieldValue("vector_stores", values)}
                        value={form.getFieldValue("vector_stores")}
                        accessToken={accessToken || ""}
                        placeholder="Выбрать хранилища векторов"
                      />
                    </Form.Item>

                    <Form.Item label="Разрешённые маршруты транзита" name="allowed_passthrough_routes">
                      <PassThroughRoutesSelector
                        onChange={(values: string[]) => form.setFieldValue("allowed_passthrough_routes", values)}
                        value={form.getFieldValue("allowed_passthrough_routes")}
                        accessToken={accessToken || ""}
                        placeholder="Выбрать маршруты транзита"
                      />
                    </Form.Item>

                    <Form.Item label="MCP серверы / Группы доступа" name="mcp_servers_and_groups">
                      <MCPServerSelector
                        onChange={(val) => form.setFieldValue("mcp_servers_and_groups", val)}
                        value={form.getFieldValue("mcp_servers_and_groups")}
                        accessToken={accessToken || ""}
                        placeholder="Выбрать MCP серверы или группы доступа (необязательно)"
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

                    <Form.Item label="Агенты / Группы доступа" name="agents_and_groups">
                      <AgentSelector
                        onChange={(val) => form.setFieldValue("agents_and_groups", val)}
                        value={form.getFieldValue("agents_and_groups")}
                        accessToken={accessToken || ""}
                        placeholder="Выбрать агентов или группы доступа (необязательно)"
                      />
                    </Form.Item>

                    <Form.Item label="Организация" name="organization_id">
                      <Select
                        allowClear
                        placeholder="Выбрать организацию"
                        showSearch
                        optionFilterProp="label"
                        options={userOrganizations.map((org) => ({
                          value: org.organization_id,
                          label: org.organization_alias || org.organization_id,
                        }))}
                      />
                    </Form.Item>

                    <Form.Item label="Настройки логирования" name="logging_settings">
                      <EditLoggingSettings
                        value={form.getFieldValue("logging_settings")}
                        onChange={(values) => form.setFieldValue("logging_settings", values)}
                      />
                    </Form.Item>

                    <Form.Item
                      label="Настройки менеджера секретов"
                      name="secret_manager_settings"
                      help={
                        premiumUser
                          ? "Введите конфигурацию менеджера секретов в формате JSON."
                          : "Премиум функция — Обновите план для управления настройками менеджера секретов."
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
                              return Promise.reject(new Error("Пожалуйста, введите корректный JSON"));
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

                    <Form.Item label="Метаданные" name="metadata">
                      <Input.TextArea rows={10} />
                    </Form.Item>

                    <div className="sticky z-10 bg-white p-4 pr-0 border-t border-gray-200 bottom-[-1.5rem] inset-x-[-1.5rem]">
                      <div className="flex justify-end items-center gap-2">
                        <Button onClick={() => setIsEditing(false)} disabled={isTeamSaving}>
                          Отмена
                        </Button>
                        <Button icon={<SaveOutlined className="h-4 w-4" />} type="primary" htmlType="submit" loading={isTeamSaving}>
                          Сохранить
                        </Button>
                      </div>
                    </div>
                  </Form>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <Text className="font-medium">Название команды</Text>
                      <div>{info.team_alias}</div>
                    </div>
                    <div>
                      <Text className="font-medium">ID команды</Text>
                      <div className="font-mono">{info.team_id}</div>
                    </div>
                    <div>
                      <Text className="font-medium">Создано</Text>
                      <div>{new Date(info.created_at).toLocaleString()}</div>
                    </div>
                    <div>
                      <Text className="font-medium">Модели</Text>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {info.models.map((model, index) => (
                          <Badge key={index} color="red">
                            {model}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <Text className="font-medium">Лимиты скорости</Text>
                      <div>TPM: {info.tpm_limit || "Без ограничений"}</div>
                      <div>RPM: {info.rpm_limit || "Без ограничений"}</div>
                      {(() => {
                        const modelTpm = (info.metadata?.model_tpm_limit ?? {}) as Record<string, number>;
                        const modelRpm = (info.metadata?.model_rpm_limit ?? {}) as Record<string, number>;
                        const models = Array.from(new Set([...Object.keys(modelTpm), ...Object.keys(modelRpm)]));
                        if (models.length === 0) return null;
                        return (
                          <div className="mt-2">
                            <Text className="text-gray-500">Лимиты по моделям:</Text>
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
                      <Text className="font-medium">Бюджет команды</Text>
                      <div>
                        Максимальный бюджет:{" "}
                        {info.max_budget !== null ? `$${formatNumberWithCommas(info.max_budget, 4)}` : "Без ограничений"}
                      </div>
                      <div>
                        Мягкий бюджет:{" "}
                        {info.soft_budget !== null && info.soft_budget !== undefined
                          ? `$${formatNumberWithCommas(info.soft_budget, 4)}`
                          : "Без ограничений"}
                      </div>
                      <div>Сброс бюджета: {info.budget_duration || "Никогда"}</div>
                      {info.metadata?.soft_budget_alerting_emails &&
                        Array.isArray(info.metadata.soft_budget_alerting_emails) &&
                        info.metadata.soft_budget_alerting_emails.length > 0 && (
                          <div>
                            Email для уведомлений: {info.metadata.soft_budget_alerting_emails.join(", ")}
                          </div>
                        )}
                    </div>
                    <div>
                      <Text className="font-medium">
                        Настройки участников команды{" "}
                        <Tooltip title="Это ограничения для отдельных участников команды">
                          <InfoCircleOutlined style={{ marginLeft: "4px" }} />
                        </Tooltip>
                      </Text>
                      <div>Макс. бюджет: {info.team_member_budget_table?.max_budget || "Без ограничений"}</div>
                      <div>Период бюджета: {info.team_member_budget_table?.budget_duration || "Без ограничений"}</div>
                      <div>Длительность ключа: {info.metadata?.team_member_key_duration || "Без ограничений"}</div>
                      <div>Лимит TPM: {info.team_member_budget_table?.tpm_limit || "Без ограничений"}</div>
                      <div>Лимит RPM: {info.team_member_budget_table?.rpm_limit || "Без ограничений"}</div>
                    </div>
                    <div>
                      <Text className="font-medium">ID организации</Text>
                      <div>{info.organization_id}</div>
                    </div>
                    <div>
                      <Text className="font-medium">Статус</Text>
                      <Badge color={info.blocked ? "red" : "green"}>{info.blocked ? "Заблокировано" : "Активно"}</Badge>
                    </div>

                    <div>
                      <Text className="font-medium">Отключить глобальные Guardrails</Text>
                      <div>
                        {info.metadata?.disable_global_guardrails === true ? (
                          <Badge color="yellow">Включено — глобальные guardrails обходятся</Badge>
                        ) : (
                          <Badge color="green">Отключено — глобальные guardrails активны</Badge>
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
                        <Text className="font-medium">Настройки менеджера секретов</Text>
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
          title: "Редактировать участника",
          showEmail: true,
          showUserId: true,
          roleOptions: [
            { label: "Администратор", value: "admin" },
            { label: "Пользователь", value: "user" },
          ],
          additionalFields: [
            {
              name: "max_budget_in_team",
              label: (
                <span>
                  Бюджет участника команды (USD){" "}
                  <Tooltip title="Максимальная сумма в USD, которую этот участник может потратить в рамках данной команды. Не зависит от глобальных бюджетных ограничений пользователя">
                    <InfoCircleOutlined style={{ marginLeft: "4px" }} />
                  </Tooltip>
                </span>
              ),
              type: "numerical" as const,
              step: 0.01,
              min: 0,
              placeholder: "Лимит бюджета для этого участника в данной команде",
            },
            {
              name: "tpm_limit",
              label: (
                <span>
                  Лимит TPM участника команды{" "}
                  <Tooltip title="Максимальное количество токенов в минуту для этого участника в данной команде. Не зависит от глобальных ограничений пользователя">
                    <InfoCircleOutlined style={{ marginLeft: "4px" }} />
                  </Tooltip>
                </span>
              ),
              type: "numerical" as const,
              step: 1,
              min: 0,
              placeholder: "Лимит токенов в минуту для этого участника в данной команде",
            },
            {
              name: "rpm_limit",
              label: (
                <span>
                  Лимит RPM участника команды{" "}
                  <Tooltip title="Максимальное количество запросов в минуту для этого участника в данной команде. Не зависит от глобальных ограничений пользователя">
                    <InfoCircleOutlined style={{ marginLeft: "4px" }} />
                  </Tooltip>
                </span>
              ),
              type: "numerical" as const,
              step: 1,
              min: 0,
              placeholder: "Лимит запросов в минуту для этого участника в данной команде",
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
        title="Удалить участника команды"
        alertMessage="Удаление участников команды также удалит все ключи, созданные ими или для них."
        message="Вы уверены, что хотите удалить этого участника из команды? Это действие нельзя отменить."
        resourceInformationTitle="Информация об участнике"
        resourceInformation={[
          { label: "ID пользователя", value: memberToDelete?.user_id, code: true },
          { label: "Email", value: memberToDelete?.user_email },
          { label: "Роль", value: memberToDelete?.role },
        ]}
        onCancel={handleDeleteCancel}
        onOk={handleDeleteConfirm}
        confirmLoading={isDeleting}
      />
    </div>
  );
};

export default TeamInfoView;
