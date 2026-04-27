import { Empty, Typography, Button } from "antd";
import { useTranslation } from "react-i18next";

const { Title, Paragraph } = Typography;

interface HashicorpVaultEmptyPlaceholderProps {
  onAdd: () => void;
}

export default function HashicorpVaultEmptyPlaceholder({ onAdd }: HashicorpVaultEmptyPlaceholderProps) {
  const { t } = useTranslation();
  return (
    <div className="bg-white p-12 rounded-lg border border-dashed border-gray-300 text-center w-full">
      <Empty
        image={Empty.PRESENTED_IMAGE_SIMPLE}
        description={
          <div className="space-y-2">
            <Title level={4}>{t('No_Vault_Configuration_Found')}</Title>
            <Paragraph type="secondary" className="max-w-md mx-auto">
              Configure Hashicorp Vault to securely manage provider API keys and secrets
              for your LiteLLM deployment.
            </Paragraph>
          </div>
        }
      >
        <Button type="primary" size="large" onClick={onAdd} className="flex items-center gap-2 mx-auto mt-4">
          Configure Vault
        </Button>
      </Empty>
    </div>
  );
}
