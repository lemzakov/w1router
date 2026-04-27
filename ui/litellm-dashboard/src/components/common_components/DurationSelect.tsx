import { Select } from "antd";
import { useTranslation } from "react-i18next";

interface DurationSelectProps {
  className?: string;
  value?: string;
  onChange?: (value: string) => void;
}

export default function DurationSelect({ className, value, onChange }: DurationSelectProps) {
  const { t } = useTranslation();
  return (
    <Select className={className} value={value} onChange={onChange}>
      <Select.Option value="24h">{t('Daily')}</Select.Option>
      <Select.Option value="7d">{t('Weekly')}</Select.Option>
      <Select.Option value="30d">{t('Monthly')}</Select.Option>
    </Select>
  );
}
