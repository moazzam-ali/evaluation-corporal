"use client";

import { useState } from "react";
import { Globe, Loader2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import toast from "react-hot-toast";

const LANGUAGE_NAMES = {
  en: "English",
  es: "Spanish",
  fr: "French",
  de: "German",
  it: "Italian",
  tr: "Turkish",
  in: "Indonesian",
  pt: "Portuguese",
};

export default function TranslationTabs({
  productId,
  selectedLanguages,
  translations,
  onTranslationsChange,
  baseContent,
}) {
  const [translatingLangs, setTranslatingLangs] = useState(new Set());

  const nonEnglishLangs = selectedLanguages.filter((l) => l !== "en");

  if (nonEnglishLangs.length === 0) {
    return (
      <p className="py-4 text-center text-sm text-muted-foreground">
        Select additional languages above to add translations.
      </p>
    );
  }

  const updateField = (lang, field, value) => {
    onTranslationsChange({
      ...translations,
      [lang]: {
        ...(translations[lang] || {}),
        [field]: value,
      },
    });
  };

  const handleAutoTranslate = async (lang) => {
    if (!productId) {
      toast.error("Save the product first to enable auto-translate");
      return;
    }

    setTranslatingLangs((prev) => new Set(prev).add(lang));
    try {
      const res = await fetch(`/api/admin/products/${productId}/auto-translate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ language: lang }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Translation failed");

      const t = data.translation;
      onTranslationsChange({
        ...translations,
        [lang]: {
          name: t.name || "",
          benefits: (t.benefits || []).join("\n"),
          key_ingredients: (t.key_ingredients || [])
            .map((i) => `${i.name} | ${i.role || ""}`)
            .join("\n"),
          how_to_use: t.how_to_use || "",
          cautions: (t.cautions || []).join("\n"),
        },
      });

      toast.success(`${LANGUAGE_NAMES[lang]} translation generated`);
    } catch (err) {
      toast.error(`Translation failed: ${err.message}`);
    } finally {
      setTranslatingLangs((prev) => {
        const next = new Set(prev);
        next.delete(lang);
        return next;
      });
    }
  };

  const defaultTab = nonEnglishLangs[0];

  return (
    <Tabs defaultValue={defaultTab} className="w-full">
      <TabsList className="mb-4 flex flex-wrap gap-1 bg-transparent h-auto">
        {nonEnglishLangs.map((lang) => (
          <TabsTrigger
            key={lang}
            value={lang}
            className="rounded-md border px-3 py-1.5 text-xs uppercase data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            {translatingLangs.has(lang) && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
            {lang}
          </TabsTrigger>
        ))}
      </TabsList>

      {nonEnglishLangs.map((lang) => {
        const t = translations[lang] || {};
        const isTranslating = translatingLangs.has(lang);

        return (
          <TabsContent key={lang} value={lang} className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium">
                {LANGUAGE_NAMES[lang] || lang.toUpperCase()} Translation
              </h3>
              <button
                type="button"
                onClick={() => handleAutoTranslate(lang)}
                disabled={isTranslating || !productId}
                className="inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs transition-colors hover:bg-muted disabled:opacity-50"
                title={!productId ? "Save product first to enable auto-translate" : `Auto-translate to ${LANGUAGE_NAMES[lang]}`}
              >
                {isTranslating ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Globe className="h-3 w-3" />
                )}
                {isTranslating ? "Translating..." : "Auto-translate"}
              </button>
            </div>

            <fieldset disabled={isTranslating} className="space-y-4">
              <LangField label="Name">
                <input
                  type="text"
                  value={t.name || ""}
                  onChange={(e) => updateField(lang, "name", e.target.value)}
                  placeholder={baseContent.name || "Will be auto-translated on save"}
                  className="input"
                />
              </LangField>

              <LangField label="Benefits (one per line)">
                <textarea
                  value={t.benefits || ""}
                  onChange={(e) => updateField(lang, "benefits", e.target.value)}
                  rows={4}
                  placeholder="Will be auto-translated on save"
                  className="input font-mono text-xs"
                />
              </LangField>

              <LangField label="Key ingredients (one per line: Name | Role)">
                <textarea
                  value={t.key_ingredients || ""}
                  onChange={(e) => updateField(lang, "key_ingredients", e.target.value)}
                  rows={4}
                  placeholder="Glycerin | Attracts and retains moisture"
                  className="input font-mono text-xs"
                />
              </LangField>

              <LangField label="How to use">
                <textarea
                  value={t.how_to_use || ""}
                  onChange={(e) => updateField(lang, "how_to_use", e.target.value)}
                  rows={3}
                  placeholder="Will be auto-translated on save"
                  className="input"
                />
              </LangField>

              <LangField label="Cautions (one per line)">
                <textarea
                  value={t.cautions || ""}
                  onChange={(e) => updateField(lang, "cautions", e.target.value)}
                  rows={3}
                  placeholder="Will be auto-translated on save"
                  className="input font-mono text-xs"
                />
              </LangField>
            </fieldset>
          </TabsContent>
        );
      })}
    </Tabs>
  );
}

function LangField({ label, children }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-muted-foreground">{label}</label>
      {children}
    </div>
  );
}
