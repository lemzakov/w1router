import React from "react";
import { Alert, Button } from "antd";
import { useTranslation } from "react-i18next";

export function OnboardingErrorView() {
  const { t } = useTranslation();
  return (
    <div className="mx-auto w-full max-w-md mt-10">
      <Alert
        type="error"
        message="Failed to load invitation"
        description="The invitation link may be invalid or expired."
        showIcon
      />
      <div className="mt-4">
        <Button href="/ui/login">{t('Back_to_Login')}</Button>
      </div>
    </div>
  );
}
