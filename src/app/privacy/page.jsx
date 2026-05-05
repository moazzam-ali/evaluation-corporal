"use client";

import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@/components/ui/card";

export default function PrivacyPage() {
  const { t } = useTranslation();

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="mb-8 text-3xl font-bold">{t("privacy.title")}</h1>

      <div className="space-y-6">
        <Card>
          <CardContent className="p-6">
            <p className="text-muted-foreground">{t("privacy.intro")}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <h2 className="mb-3 text-lg font-semibold">{t("privacy.data_handling_title")}</h2>
            <p className="text-sm text-muted-foreground">{t("privacy.data_handling")}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <h2 className="mb-3 text-lg font-semibold">{t("privacy.consent_title")}</h2>
            <p className="text-sm text-muted-foreground">{t("privacy.consent")}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <h2 className="mb-3 text-lg font-semibold">{t("privacy.contact_title")}</h2>
            <p className="text-sm text-muted-foreground">{t("privacy.contact")}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
