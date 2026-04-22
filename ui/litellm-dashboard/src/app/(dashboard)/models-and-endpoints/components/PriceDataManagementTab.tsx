import { TabPanel, Text, Title } from "@tremor/react";
import PriceDataReload from "@/components/price_data_reload";
import React from "react";
import useAuthorized from "@/app/(dashboard)/hooks/useAuthorized";
import { useModelCostMap } from "../../hooks/models/useModelCostMap";

const PriceDataManagementTab = () => {
  const { accessToken } = useAuthorized();
  const { refetch: refetchModelCostMap } = useModelCostMap();

  return (
    <TabPanel>
      <div className="p-6">
        <div className="mb-6">
          <Title>Управление ценовыми данными</Title>
          <Text className="text-tremor-content">
            Управляйте данными о ценах на модели и настраивайте расписание автоматической перезагрузки
          </Text>
        </div>
        <PriceDataReload
          accessToken={accessToken}
          onReloadSuccess={() => {
            refetchModelCostMap();
          }}
          buttonText="Перезагрузить ценовые данные"
          size="middle"
          type="primary"
          className="w-full"
        />
      </div>
    </TabPanel>
  );
};

export default PriceDataManagementTab;
