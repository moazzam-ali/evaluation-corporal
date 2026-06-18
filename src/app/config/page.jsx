"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { ArrowRight, Settings2, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LANGUAGES } from "@/lib/languages";

const languages = LANGUAGES;

export default function HomePage() {
  const { t } = useTranslation();
  const router = useRouter();

  const [chatIDs, setChatIDs] = useState("");
  const [botIndex, setBotIndex] = useState("1");
  const [accountIDs, setAccountIDs] = useState("");
  const [contactIDs, setContactIDs] = useState("");
  const [language, setLanguage] = useState("en");

  /** Strip decimals from comma-separated numeric IDs (e.g. "239.0" → "239") */
  const cleanIDs = (raw) =>
    raw.split(",").map((s) => {
      const trimmed = s.trim();
      const n = Number(trimmed);
      return trimmed && !isNaN(n) ? String(Math.trunc(n)) : trimmed;
    }).filter(Boolean).join(",");

  const handleSubmit = (e) => {
    e.preventDefault();

    const params = new URLSearchParams();
    if (chatIDs.trim()) params.set("n", cleanIDs(chatIDs));
    if (botIndex.trim()) params.set("b", String(Math.trunc(Number(botIndex)) || botIndex.trim()));
    if (accountIDs.trim()) params.set("a", cleanIDs(accountIDs));
    if (contactIDs.trim()) params.set("c", cleanIDs(contactIDs));
    params.set("l", language);

    router.push(`/scan?${params.toString()}`);
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-10 text-center"
      >
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-4 py-1.5">
          <Sparkles className="h-4 w-4 text-secondary" />
          <span className="text-sm font-medium text-primary">Evaluación Corporal</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight">{t("home.title", "Configuration")}</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          {t("home.subtitle", "Set up the Telegram notification and CRM parameters, then proceed to the skin analysis form.")}
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings2 className="h-5 w-5" />
              {t("home.form_title", "Parameters")}
            </CardTitle>
            <CardDescription>
              {t("home.form_desc", "Configure Telegram bots, CRM IDs, and language before starting.")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Chat IDs */}
              <div className="space-y-2">
                <Label htmlFor="chatIDs">{t("home.chat_ids", "Chat IDs")}</Label>
                <Input
                  id="chatIDs"
                  value={chatIDs}
                  onChange={(e) => setChatIDs(e.target.value)}
                  placeholder={t("home.chat_ids_placeholder", "Comma-separated Telegram chat IDs")}
                />
                <p className="text-xs text-muted-foreground">
                  {t("home.chat_ids_help", "Enter one or more Telegram chat IDs separated by commas.")}
                </p>
              </div>

              {/* Bot Index */}
              <div className="space-y-2">
                <Label htmlFor="botIndex">{t("home.bot_index", "Bot Index")}</Label>
                <Input
                  id="botIndex"
                  value={botIndex}
                  onChange={(e) => setBotIndex(e.target.value)}
                  placeholder={t("home.bot_index_placeholder", "1")}
                />
                <p className="text-xs text-muted-foreground">
                  {t("home.bot_index_help", "Which Telegram bot to use (from the bots table).")}
                </p>
              </div>

              {/* Account IDs */}
              <div className="space-y-2">
                <Label htmlFor="accountIDs">{t("home.account_ids", "Account IDs")}</Label>
                <Input
                  id="accountIDs"
                  value={accountIDs}
                  onChange={(e) => setAccountIDs(e.target.value)}
                  placeholder={t("home.account_ids_placeholder", "Comma-separated CRM account IDs")}
                />
              </div>

              {/* Contact IDs */}
              <div className="space-y-2">
                <Label htmlFor="contactIDs">{t("home.contact_ids", "Contact IDs")}</Label>
                <Input
                  id="contactIDs"
                  value={contactIDs}
                  onChange={(e) => setContactIDs(e.target.value)}
                  placeholder={t("home.contact_ids_placeholder", "Comma-separated CRM contact IDs")}
                />
              </div>

              {/* Language */}
              <div className="space-y-2">
                <Label htmlFor="language">{t("home.language", "Language")}</Label>
                <select
                  id="language"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  {languages.map((lang) => (
                    <option key={lang.code} value={lang.code}>
                      {lang.nativeLabel}
                    </option>
                  ))}
                </select>
              </div>

              <Button type="submit" size="lg" className="w-full gap-2">
                {t("home.submit", "Proceed to Skin Analysis")}
                <ArrowRight className="h-5 w-5" />
              </Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
