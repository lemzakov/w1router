import { getTeamPermissionsCall, teamPermissionsUpdateCall } from "@/components/networking";
import { ReloadOutlined, SaveOutlined } from "@ant-design/icons";
import { Card, Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow, Text, Title } from "@tremor/react";
import { Button, Checkbox, Empty } from "antd";
import React, { useEffect, useState } from "react";
import NotificationsManager from "../molecules/notifications_manager";
import { getPermissionInfo } from "./permission_definitions";
import { useTranslation } from "react-i18next";

interface MemberPermissionsProps {
  teamId: string;
  accessToken: string | null;
  canEditTeam: boolean;
}

const MemberPermissions: React.FC<MemberPermissionsProps> = ({ teamId, accessToken, canEditTeam }) => {
    const { t } = useTranslation();
const [permissions, setPermissions] = useState<string[]>([]);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const fetchPermissions = async () => {
    try {
      setLoading(true);
      if (!accessToken) return;
      const response = await getTeamPermissionsCall(accessToken, teamId);
      const allPermissions = response.all_available_permissions || [];
      setPermissions(allPermissions);
      const teamPermissions = response.team_member_permissions || [];
      setSelectedPermissions(teamPermissions);
      setHasChanges(false);
    } catch (error) {
      NotificationsManager.fromBackend(t('Ne_udalos_zagruzit_prava_dostupa'));
      console.error("Error fetching permissions:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPermissions();
  }, [teamId, accessToken]);

  const handlePermissionChange = (permission: string, checked: boolean) => {
    const newSelectedPermissions = checked
      ? [...selectedPermissions, permission]
      : selectedPermissions.filter((p) => p !== permission);
    setSelectedPermissions(newSelectedPermissions);
    setHasChanges(true);
  };

  const handleSave = async () => {
    try {
      if (!accessToken) return;
      setSaving(true);
      await teamPermissionsUpdateCall(accessToken, teamId, selectedPermissions);
      NotificationsManager.success(t('Prava_dostupa_uspeshno_obnovleny'));
      setHasChanges(false);
    } catch (error) {
      NotificationsManager.fromBackend(t('Ne_udalos_obnovit_prava_dostupa'));
      console.error("Error updating permissions:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    fetchPermissions();
  };

  if (loading) {
    return <div className="p-6 text-center">{t('Zagruzka_prav_dostupa')}</div>;
  }

  const hasPermissions = permissions.length > 0;

  return (
    <Card className="bg-white shadow-md rounded-md p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b pb-4 mb-6">
        <Title className="mb-2 sm:mb-0">{t('Prava_dostupa_uchastnikov')}</Title>
        {canEditTeam && hasChanges && (
          <div className="flex gap-3">
            <Button icon={<ReloadOutlined />} onClick={handleReset}>
              {t('Sbrosit')}
            </Button>
            <Button onClick={handleSave} loading={saving} type="primary" icon={<SaveOutlined />}>
              {t('Sohranit')}
            </Button>
          </div>
        )}
      </div>

      <Text className="mb-6 text-gray-600">{t('Upravlyayte_tem_chto_mogut_delat_uchastn')}</Text>

      {hasPermissions ? (
        <div className="overflow-x-auto">
          <Table className=" min-w-full">
            <TableHead>
              <TableRow>
                <TableHeaderCell>{t('Metod')}</TableHeaderCell>
                <TableHeaderCell>{t('Endpoint')}</TableHeaderCell>
                <TableHeaderCell>{t('Opisanie')}</TableHeaderCell>
                <TableHeaderCell className="sticky right-0 bg-white shadow-[-4px_0_4px_-4px_rgba(0,0,0,0.1)] text-center">
                  {t('Razreshit_dostup')}
                </TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {permissions.map((permission) => {
                const permInfo = getPermissionInfo(permission);
                return (
                  <TableRow key={permission} className="hover:bg-gray-50 transition-colors">
                    <TableCell>
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          permInfo.method === "GET" ? "bg-blue-100 text-blue-800" : "bg-green-100 text-green-800"
                        }`}
                      >
                        {permInfo.method}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-sm text-gray-800">{permInfo.endpoint}</span>
                    </TableCell>
                    <TableCell className="text-gray-700">{permInfo.description}</TableCell>
                    <TableCell className="sticky right-0 bg-white shadow-[-4px_0_4px_-4px_rgba(0,0,0,0.1)] text-center">
                      <Checkbox
                        checked={selectedPermissions.includes(permission)}
                        onChange={(e) => handlePermissionChange(permission, e.target.checked)}
                        disabled={!canEditTeam}
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="py-12">
          <Empty description={t('Prava_dostupa_otsutstvuyut')} />
        </div>
      )}
    </Card>
  );
};

export default MemberPermissions;
