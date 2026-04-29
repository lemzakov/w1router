/**
 * The parent pane, showing list of budgets
 *
 */

import {
  Button,
  Card,
  Tab,
  TabGroup,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
  TabList,
  TabPanel,
  TabPanels,
  Text,
} from "@tremor/react";
import React, { useState } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import DeleteResourceModal from "../common_components/DeleteResourceModal";
import TableIconActionButton from "../common_components/IconActionButton/TableIconActionButtons/TableIconActionButton";
import NotificationsManager from "../molecules/notifications_manager";
import { useBudgets, useDeleteBudget } from "@/app/(dashboard)/hooks/budgets/useBudgets";
import BudgetModal from "./budget_modal";
import EditBudgetModal from "./edit_budget_modal";
import { CREATE_END_USER_CURL_COMMAND, CHAT_COMPLETIONS_CURL_COMMAND, OPENAI_SDK_PYTHON_CODE } from "./constants";
import { useTranslation } from "react-i18next";

interface BudgetSettingsPageProps {
  accessToken: string | null;
}

export interface budgetItem {
  budget_id: string;
  max_budget: number | null;
  rpm_limit: number | null;
  tpm_limit: number | null;
  updated_at: string;
}

const BudgetPanel: React.FC<BudgetSettingsPageProps> = ({ accessToken }) => {
  const { t } = useTranslation();
  const [isCreateModelVisible, setIsCreateModelVisible] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [selectedBudget, setSelectedBudget] = useState<budgetItem | null>(null);
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);

  const { data: budgetList = [] } = useBudgets();
  const deleteBudget = useDeleteBudget();

  const handleEditCall = async (budget: budgetItem) => {
    if (accessToken == null) {
      return;
    }
    setSelectedBudget(budget);
    setIsEditModalVisible(true);
  };

  const handleDeleteClick = (budget: budgetItem) => {
    setSelectedBudget(budget);
    setIsDeleteModalVisible(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedBudget || accessToken == null) {
      return;
    }
    try {
      await deleteBudget.mutateAsync(selectedBudget.budget_id);
      NotificationsManager.success("Budget deleted.");
    } catch (error) {
      console.error("Error deleting budget:", error);
      if (typeof NotificationsManager.fromBackend === "function") {
        NotificationsManager.fromBackend("Failed to delete budget");
      } else {
        NotificationsManager.info("Failed to delete budget");
      }
    } finally {
      setIsDeleteModalVisible(false);
      setSelectedBudget(null);
    }
  };

  const handleDeleteCancel = () => {
    setIsDeleteModalVisible(false);
  };

  return (
    <div className="w-full mx-auto flex-auto overflow-y-auto m-8 p-2">
      <Button size="sm" variant="primary" className="mb-2" onClick={() => setIsCreateModelVisible(true)}>
        + {t('Create_Budget')}
      </Button>
      <TabGroup>
        <TabList>
          <Tab>{t('Budgets')}</Tab>
          <Tab>{t('Examples_1')}</Tab>
        </TabList>
        <TabPanels>
          <TabPanel>
            <div className="mt-6">
              <BudgetModal
                isModalVisible={isCreateModelVisible}
                setIsModalVisible={setIsCreateModelVisible}
              />
              {selectedBudget && (
                <EditBudgetModal
                  isModalVisible={isEditModalVisible}
                  setIsModalVisible={setIsEditModalVisible}
                  existingBudget={selectedBudget}
                />
              )}
              <Card>
                <Text>{t('Create_a_budget_to_assign_to_customers')}</Text>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableHeaderCell>{t('Budget_ID')}</TableHeaderCell>
                      <TableHeaderCell>{t('Max_Budget_RUB')}</TableHeaderCell>
                      <TableHeaderCell>{t('TPM_Tokens_per_Minute')}</TableHeaderCell>
                      <TableHeaderCell>{t('RPM_Requests_per_Minute')}</TableHeaderCell>
                    </TableRow>
                  </TableHead>

                  <TableBody>
                    {budgetList
                      .slice()
                      .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
                      .map((value: budgetItem) => (
                        <TableRow key={value.budget_id}>
                          <TableCell>{value.budget_id}</TableCell>
                          <TableCell>{value.max_budget != null ? `₽${value.max_budget.toFixed(2)}` : t('not_set')}</TableCell>
                          <TableCell>{value.tpm_limit != null ? value.tpm_limit : t('not_set')}</TableCell>
                          <TableCell>{value.rpm_limit != null ? value.rpm_limit : t('not_set')}</TableCell>
                          <TableIconActionButton
                            variant="Edit"
                            tooltipText={t('Edit_budget_tooltip')}
                            onClick={() => handleEditCall(value)}
                            dataTestId="edit-budget-button"
                          />
                          <TableIconActionButton
                            variant="Delete"
                            tooltipText={t('Delete_budget_tooltip')}
                            onClick={() => handleDeleteClick(value)}
                            dataTestId="delete-budget-button"
                          />
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </Card>
              <DeleteResourceModal
                isOpen={isDeleteModalVisible}
                title={t('Delete_Budget_title')}
                message={t('Delete_Budget_message')}
                resourceInformationTitle={t('Budget_Information')}
                resourceInformation={[
                  { label: t('Budget_ID'), value: selectedBudget?.budget_id, code: true },
                  { label: t('Max_Budget_RUB'), value: selectedBudget?.max_budget != null ? `₽${selectedBudget.max_budget.toFixed(2)}` : t('not_set') },
                  { label: t('TPM_Tokens_per_Minute'), value: selectedBudget?.tpm_limit },
                  { label: t('RPM_Requests_per_Minute'), value: selectedBudget?.rpm_limit },
                ]}
                onCancel={handleDeleteCancel}
                onOk={handleDeleteConfirm}
                confirmLoading={deleteBudget.isPending}
              />
            </div>
          </TabPanel>
          <TabPanel>
            <div className="mt-6">
              <Text className="text-base">{t('How_to_use_budget_id')}</Text>
              <TabGroup>
                <TabList>
                  <Tab>{t('Assign_Budget_to_Customer')}</Tab>
                  <Tab>{t('Test_it_Curl')}</Tab>
                  <Tab>{t('Test_it_OpenAI_SDK')}</Tab>
                </TabList>
                <TabPanels>
                  <TabPanel>
                    <SyntaxHighlighter language="bash">{CREATE_END_USER_CURL_COMMAND}</SyntaxHighlighter>
                  </TabPanel>
                  <TabPanel>
                    <SyntaxHighlighter language="bash">{CHAT_COMPLETIONS_CURL_COMMAND}</SyntaxHighlighter>
                  </TabPanel>
                  <TabPanel>
                    <SyntaxHighlighter language="python">{OPENAI_SDK_PYTHON_CODE}</SyntaxHighlighter>
                  </TabPanel>
                </TabPanels>
              </TabGroup>
            </div>
          </TabPanel>
        </TabPanels>
      </TabGroup>
    </div>
  );
};

export default BudgetPanel;
