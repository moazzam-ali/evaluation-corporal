// Apply translation files (flat dotted-key JSON) to the matching locale.
// Usage: node scripts/apply-translations.mjs [lang ...]
// Defaults to all 7 non-English languages if none given.

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const LOCALES_DIR = join(process.cwd(), "public", "locales");
const ALL_LANGS = ["de", "es", "fr", "in", "it", "pt", "tr"];
const langs = process.argv.slice(2).length ? process.argv.slice(2) : ALL_LANGS;

function setByPath(obj, dottedKey, value) {
  const parts = dottedKey.split(".");
  let cur = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    const k = parts[i];
    if (typeof cur[k] !== "object" || cur[k] === null || Array.isArray(cur[k])) cur[k] = {};
    cur = cur[k];
  }
  cur[parts.at(-1)] = value;
}

for (const lang of langs) {
  const tmpPath = `/tmp/locale-${lang}.json`;
  const localePath = join(LOCALES_DIR, lang, "translation.json");
  if (!existsSync(tmpPath)) {
    console.log(`${lang}: source ${tmpPath} not found — skipping`);
    continue;
  }
  const translations = JSON.parse(readFileSync(tmpPath, "utf8"));
  const locale = JSON.parse(readFileSync(localePath, "utf8"));
  let count = 0;
  for (const [key, value] of Object.entries(translations)) {
    if (typeof value === "string" && value.trim()) {
      setByPath(locale, key, value);
      count++;
    }
  }
  writeFileSync(localePath, JSON.stringify(locale, null, 2) + "\n");
  console.log(`${lang}: applied ${count} translations to ${localePath}`);
}
