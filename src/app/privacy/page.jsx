"use client";

import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@/components/ui/card";

const SECTIONS = [
  { title: "data_collected_title", body: "data_collected" },
  { title: "how_we_process_title", body: "how_we_process" },
  { title: "lawful_basis_title", body: "lawful_basis" },
  { title: "third_parties_title", body: "third_parties" },
  { title: "data_retention_title", body: "data_retention" },
  { title: "your_rights_title", body: "your_rights" },
  { title: "how_to_contact_title", body: "how_to_contact" },
  { title: "cookies_title", body: "cookies" },
  { title: "changes_title", body: "changes" },
];

export default function PrivacyPage() {
  const { t } = useTranslation();

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="mb-2 text-3xl font-bold">{t("privacy.title")}</h1>
      <p className="mb-8 text-sm text-muted-foreground">{t("privacy.last_updated")}</p>

      <div className="space-y-6">
        <Card>
          <CardContent className="p-6">
            <p className="text-muted-foreground leading-relaxed">{t("privacy.intro")}</p>
          </CardContent>
        </Card>

        {SECTIONS.map((section) => (
          <Card key={section.title}>
            <CardContent className="p-6">
              <h2 className="mb-3 text-lg font-semibold">{t(`privacy.${section.title}`)}</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">{t(`privacy.${section.body}`)}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
