"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, Trash2, Loader2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import toast from "react-hot-toast";
import ImageUpload from "./ImageUpload";
import TranslationTabs from "./TranslationTabs";

const SUPPORTED_LANGS = ["en", "es", "fr", "de", "it", "tr", "in", "pt"];
const TYPES = ["topical", "ingestible"];

/**
 * Convert DB translation row (structured data) to form strings (newline-separated).
 */
function translationToForm(t) {
  return {
    name: t.name || "",
    benefits: (t.benefits || []).join("\n"),
    key_ingredients: (t.key_ingredients || [])
      .map((i) => `${i.name} | ${i.role || ""}`)
      .join("\n"),
    how_to_use: t.how_to_use || "",
    cautions: (t.cautions || []).join("\n"),
  };
}

/**
 * Convert form strings back to structured data for the API.
 */
function formToTranslation(t) {
  return {
    name: t.name || "",
    benefits: (t.benefits || "").split("\n").map((s) => s.trim()).filter(Boolean),
    key_ingredients: (t.key_ingredients || "")
      .split("\n")
      .map((line) => {
        const [name, role] = line.split("|").map((s) => s.trim());
        return name ? { name, role: role || "" } : null;
      })
      .filter(Boolean),
    how_to_use: t.how_to_use || "",
    cautions: (t.cautions || "").split("\n").map((s) => s.trim()).filter(Boolean),
  };
}

/**
 * Check if a form translation has any user-entered content.
 */
function hasContent(t) {
  if (!t) return false;
  return !!(t.name || t.benefits || t.key_ingredients || t.how_to_use || t.cautions);
}

export default function ProductForm({ initial, isNew = false }) {
  const router = useRouter();
  const [form, setForm] = useState(() => ({
    id: initial?.id || "",
    sku: initial?.sku || "",
    name: initial?.name || "",
    category: initial?.category || "",
    type: initial?.type || "topical",
    concern_category: initial?.concernCategory || "",
    size: initial?.size || "",
    image: initial?.image || "",
    concerns: (initial?.concerns || []).join(", "),
    benefits: (initial?.benefits || []).join("\n"),
    key_ingredients: (initial?.keyIngredients || [])
      .map((i) => `${i.name} | ${i.role}`)
      .join("\n"),
    how_to_use: initial?.howToUse || "",
    cautions: (initial?.cautions || []).join("\n"),
    routine_step: initial?.routineStep ? JSON.stringify(initial.routineStep) : "",
    languages: initial?.languages || ["en"],
    is_active: initial?.isActive ?? true,
    display_order: initial?.displayOrder || 0,
  }));
  const [translations, setTranslations] = useState({});
  const [loadingTranslations, setLoadingTranslations] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const removedLanguagesRef = useRef([]);

  // Fetch existing translations on mount (edit mode)
  useEffect(() => {
    if (!isNew && initial?.id) {
      setLoadingTranslations(true);
      fetch(`/api/admin/products/${initial.id}/translations`)
        .then((r) => r.json())
        .then((data) => {
          if (data.translations) {
            const formatted = {};
            for (const [lang, t] of Object.entries(data.translations)) {
              formatted[lang] = translationToForm(t);
            }
            setTranslations(formatted);
          }
        })
        .catch((err) => console.warn("Failed to load translations:", err.message))
        .finally(() => setLoadingTranslations(false));
    }
  }, [isNew, initial?.id]);

  const update = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const toggleLang = (lang) => {
    if (lang === "en") return; // English is always required

    setForm((f) => {
      const isRemoving = f.languages.includes(lang);

      if (isRemoving) {
        // Confirm removal if translation data exists
        if (hasContent(translations[lang])) {
          if (!confirm(`Remove ${lang.toUpperCase()} and its translations?`)) return f;
        }
        // Track removed language for API
        removedLanguagesRef.current.push(lang);
        // Clean up translation state
        setTranslations((prev) => {
          const next = { ...prev };
          delete next[lang];
          return next;
        });
        return { ...f, languages: f.languages.filter((l) => l !== lang) };
      }

      return { ...f, languages: [...f.languages, lang] };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      // Build product payload
      const payload = {
        ...form,
        concerns: form.concerns.split(",").map((s) => s.trim()).filter(Boolean),
        benefits: form.benefits.split("\n").map((s) => s.trim()).filter(Boolean),
        key_ingredients: form.key_ingredients
          .split("\n")
          .map((line) => {
            const [name, role] = line.split("|").map((s) => s.trim());
            return name ? { name, role: role || "" } : null;
          })
          .filter(Boolean),
        cautions: form.cautions.split("\n").map((s) => s.trim()).filter(Boolean),
        routine_step: form.routine_step ? JSON.parse(form.routine_step) : null,
      };

      // Build translations payload — parse form strings to structured data
      const nonEnglishLangs = form.languages.filter((l) => l !== "en");
      const parsedTranslations = {};
      const autoTranslateLanguages = [];

      for (const lang of nonEnglishLangs) {
        if (hasContent(translations[lang])) {
          parsedTranslations[lang] = formToTranslation(translations[lang]);
        } else {
          autoTranslateLanguages.push(lang);
        }
      }

      payload.translations = parsedTranslations;
      payload.autoTranslateLanguages = autoTranslateLanguages;
      payload.removedLanguages = removedLanguagesRef.current;

      const url = isNew ? "/api/admin/products" : `/api/admin/products/${initial.id}`;
      const method = isNew ? "POST" : "PUT";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");

      // Show warnings for failed translations
      if (data.warnings?.length > 0) {
        for (const w of data.warnings) {
          toast.error(`${w.language.toUpperCase()} translation failed: ${w.error}`);
        }
        toast.success("Product saved (some translations failed)");
      } else {
        toast.success("Product saved");
      }

      removedLanguagesRef.current = [];
      router.push("/admin/products");
      router.refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Delete ${initial.name}?`)) return;
    const res = await fetch(`/api/admin/products/${initial.id}`, { method: "DELETE" });
    if (res.ok) {
      router.push("/admin/products");
      router.refresh();
    } else {
      const data = await res.json();
      setError(data.error || "Delete failed");
    }
  };

  const nonEnglishSelected = form.languages.filter((l) => l !== "en");

  // English content for reference in translation tabs
  const baseContent = {
    name: form.name,
    benefits: form.benefits,
    key_ingredients: form.key_ingredients,
    how_to_use: form.how_to_use,
    cautions: form.cautions,
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <Link
          href="/admin/products"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to products
        </Link>
        {!isNew && (
          <button
            type="button"
            onClick={handleDelete}
            className="inline-flex items-center gap-1.5 rounded-md border border-destructive/30 px-3 py-1.5 text-xs text-destructive hover:bg-destructive/5"
          >
            <Trash2 className="h-3 w-3" />
            Delete
          </button>
        )}
      </div>

      <h1 className="mb-6 text-2xl font-bold">
        {isNew ? "New Product" : `Edit: ${initial.name}`}
      </h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* ── Basic Info ── */}
        <div className="rounded-lg border bg-card p-6">
          <h2 className="mb-4 text-sm font-semibold text-muted-foreground">Basic info</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="ID" required>
              <input
                type="text"
                value={form.id}
                onChange={(e) => update("id", e.target.value)}
                disabled={!isNew}
                required
                className="input"
              />
            </Field>
            <Field label="SKU" required>
              <input
                type="text"
                value={form.sku}
                onChange={(e) => update("sku", e.target.value)}
                required
                className="input"
              />
            </Field>
            <Field label="Name" required>
              <input
                type="text"
                value={form.name}
                onChange={(e) => update("name", e.target.value)}
                required
                className="input"
              />
            </Field>
            <Field label="Category" required>
              <input
                type="text"
                value={form.category}
                onChange={(e) => update("category", e.target.value)}
                required
                className="input"
              />
            </Field>
            <Field label="Type" required>
              <select value={form.type} onChange={(e) => update("type", e.target.value)} className="input">
                {TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </Field>
            <Field label="Concern category">
              <input
                type="text"
                value={form.concern_category}
                onChange={(e) => update("concern_category", e.target.value)}
                className="input"
              />
            </Field>
            <Field label="Size">
              <input
                type="text"
                value={form.size}
                onChange={(e) => update("size", e.target.value)}
                className="input"
              />
            </Field>
            <Field label="Product image">
              <ImageUpload value={form.image} onChange={(url) => update("image", url)} />
            </Field>
            <Field label="Display order">
              <input
                type="number"
                value={form.display_order}
                onChange={(e) => update("display_order", parseInt(e.target.value) || 0)}
                className="input"
              />
            </Field>
            <Field label="Active">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(e) => update("is_active", e.target.checked)}
                  className="h-4 w-4"
                />
                <span className="text-sm text-muted-foreground">Show on results page</span>
              </label>
            </Field>
          </div>
        </div>

        {/* ── Languages ── */}
        <div className="rounded-lg border bg-card p-6">
          <h2 className="mb-4 text-sm font-semibold text-muted-foreground">Languages (markets)</h2>
          <div className="flex flex-wrap gap-2">
            {SUPPORTED_LANGS.map((lang) => {
              const active = form.languages.includes(lang);
              const isEnglish = lang === "en";
              return (
                <button
                  key={lang}
                  type="button"
                  onClick={() => toggleLang(lang)}
                  disabled={isEnglish}
                  className={`rounded-full border px-3 py-1 text-xs uppercase transition-colors ${
                    active
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border text-muted-foreground hover:border-foreground/30"
                  } ${isEnglish ? "cursor-default opacity-70" : ""}`}
                >
                  {lang}
                </button>
              );
            })}
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Product will only be recommended to users in these languages. English is always included.
          </p>
        </div>

        {/* ── Content (English + Translation Tabs) ── */}
        <div className="rounded-lg border bg-card p-6">
          <h2 className="mb-4 text-sm font-semibold text-muted-foreground">Content</h2>

          {nonEnglishSelected.length > 0 ? (
            <Tabs defaultValue="en" className="w-full">
              <TabsList className="mb-4 flex flex-wrap gap-1 bg-transparent h-auto">
                <TabsTrigger
                  value="en"
                  className="rounded-md border px-3 py-1.5 text-xs uppercase data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  EN (Default)
                </TabsTrigger>
                {nonEnglishSelected.map((lang) => (
                  <TabsTrigger
                    key={lang}
                    value={lang}
                    className="rounded-md border px-3 py-1.5 text-xs uppercase data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                  >
                    {lang}
                    {hasContent(translations[lang]) && (
                      <span className="ml-1 inline-block h-1.5 w-1.5 rounded-full bg-green-500" />
                    )}
                  </TabsTrigger>
                ))}
              </TabsList>

              <TabsContent value="en">
                <EnglishContentFields form={form} update={update} />
              </TabsContent>

              {nonEnglishSelected.map((lang) => (
                <TabsContent key={lang} value={lang}>
                  {loadingTranslations ? (
                    <div className="flex items-center justify-center py-8 text-muted-foreground">
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Loading translations...
                    </div>
                  ) : (
                    <TranslationTabs
                      productId={isNew ? null : initial?.id}
                      selectedLanguages={[lang]}
                      translations={translations}
                      onTranslationsChange={setTranslations}
                      baseContent={baseContent}
                    />
                  )}
                </TabsContent>
              ))}
            </Tabs>
          ) : (
            <EnglishContentFields form={form} update={update} />
          )}
        </div>

        {error && (
          <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
        )}

        <div className="flex justify-end gap-3">
          <Link
            href="/admin/products"
            className="rounded-md border px-4 py-2 text-sm transition-colors hover:bg-muted"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </form>

      <style jsx>{`
        :global(.input) {
          width: 100%;
          padding: 0.5rem 0.75rem;
          border-radius: 0.375rem;
          border: 1px solid hsl(var(--border));
          background: hsl(var(--background));
          font-size: 0.875rem;
          outline: none;
          transition: box-shadow 0.15s;
        }
        :global(.input:focus) {
          box-shadow: 0 0 0 2px hsl(var(--ring));
        }
      `}</style>
    </div>
  );
}

function EnglishContentFields({ form, update }) {
  return (
    <div className="space-y-4">
      <Field label="Concerns (comma-separated)">
        <input
          type="text"
          value={form.concerns}
          onChange={(e) => update("concerns", e.target.value)}
          className="input"
        />
      </Field>
      <Field label="Benefits (one per line)">
        <textarea
          value={form.benefits}
          onChange={(e) => update("benefits", e.target.value)}
          rows={5}
          className="input font-mono text-xs"
        />
      </Field>
      <Field label="Key ingredients (one per line: Name | Role)">
        <textarea
          value={form.key_ingredients}
          onChange={(e) => update("key_ingredients", e.target.value)}
          rows={5}
          className="input font-mono text-xs"
          placeholder="Glycerin | Attracts and retains moisture"
        />
      </Field>
      <Field label="How to use">
        <textarea
          value={form.how_to_use}
          onChange={(e) => update("how_to_use", e.target.value)}
          rows={3}
          className="input"
        />
      </Field>
      <Field label="Cautions (one per line)">
        <textarea
          value={form.cautions}
          onChange={(e) => update("cautions", e.target.value)}
          rows={3}
          className="input font-mono text-xs"
        />
      </Field>
      <Field label='Routine step (JSON, e.g. {"time":"morning","order":3})'>
        <input
          type="text"
          value={form.routine_step}
          onChange={(e) => update("routine_step", e.target.value)}
          className="input font-mono text-xs"
        />
      </Field>
    </div>
  );
}

function Field({ label, required, children }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-muted-foreground">
        {label}
        {required && <span className="text-destructive">*</span>}
      </label>
      {children}
    </div>
  );
}
