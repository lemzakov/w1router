import React from "react";
import { Title } from "@tremor/react";
import { Descriptions } from "antd";
import { Agent } from "./types";
import { useTranslation } from "react-i18next";

interface AgentCostViewProps {
  agent: Agent;
}

const AgentCostView: React.FC<AgentCostViewProps> = ({ agent }) => {
  const { t } = useTranslation();
  const params = agent.litellm_params;

  if (
    params?.cost_per_query === undefined &&
    params?.input_cost_per_token === undefined &&
    params?.output_cost_per_token === undefined
  ) {
    return null;
  }

  return (
    <div style={{ marginTop: 24 }}>
      <Title>{t('Cost_Configuration')}</Title>
      <Descriptions bordered column={1} style={{ marginTop: 16 }}>
        {params.cost_per_query !== undefined && (
          <Descriptions.Item label="Cost Per Query">
            ${params.cost_per_query}
          </Descriptions.Item>
        )}
        {params.input_cost_per_token !== undefined && (
          <Descriptions.Item label="Input Cost Per Token">
            ${params.input_cost_per_token}
          </Descriptions.Item>
        )}
        {params.output_cost_per_token !== undefined && (
          <Descriptions.Item label="Output Cost Per Token">
            ${params.output_cost_per_token}
          </Descriptions.Item>
        )}
      </Descriptions>
    </div>
  );
};

export default AgentCostView;

