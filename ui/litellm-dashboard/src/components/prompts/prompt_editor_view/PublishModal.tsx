import React from "react";
import { Button as TremorButton, Text } from "@tremor/react";
import { Input, Modal } from "antd";
import { useTranslation } from "react-i18next";

interface PublishModalProps {
  visible: boolean;
  promptName: string;
  isSaving: boolean;
  onNameChange: (name: string) => void;
  onPublish: () => void;
  onCancel: () => void;
}

const PublishModal: React.FC<PublishModalProps> = ({
  visible,
  promptName,
  isSaving,
  onNameChange,
  onPublish,
  onCancel,
}) => {
  const { t } = useTranslation();
  return (
    <Modal
      title="Publish Prompt"
      open={visible}
      onCancel={onCancel}
      footer={[
        <div key="footer" className="flex justify-end gap-2">
          <TremorButton variant="secondary" onClick={onCancel}>
            Cancel
          </TremorButton>
          <TremorButton onClick={onPublish} loading={isSaving}>
            Publish
          </TremorButton>
        </div>
      ]}
    >
      <div className="py-4">
        <Text className="mb-2">{t('Name_1')}</Text>
        <Input
          value={promptName}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder="Enter prompt name"
          onPressEnter={onPublish}
          autoFocus
        />
        <Text className="text-gray-500 text-xs mt-2">
          Published prompts can be used in API calls and are versioned for easy tracking.
        </Text>
      </div>
    </Modal>
  );
};

export default PublishModal;

