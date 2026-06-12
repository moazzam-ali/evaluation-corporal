// Mirror the English locale into all other locale files: any key present in
// English but missing in a target locale is copied over (as a placeholder)
// so nothing in the UI ever falls back to showing the raw key. Existing
// translations are left untouched.
//
// Usage: node scripts/mirror-locales.mjs

import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const LOCALES_DIR = join(ROOT, "public", "locales");
const SOURCE_LANG = "en";
const TARGET_LANGS = ["de", "es", "fr", "in", "it", "pt", "tr"];

function deepMergeMissing(source, target, addedPaths, prefix = "") {
  for (const [k, v] of Object.entries(source)) {
    const path = prefix ? `${prefix}.${k}` : k;
    if (v !== null && typeof v === "object" && !Array.isArray(v)) {
      if (target[k] === undefined || typeof target[k] !== "object" || target[k] === null || Array.isArray(target[k])) {
        target[k] = {};
      }
      deepMergeMissing(v, target[k], addedPaths, path);
    } else {
      if (target[k] === undefined) {
        target[k] = v;
        addedPaths.push(path);
      }
    }
  }
}

const en = JSON.parse(readFileSync(join(LOCALES_DIR, SOURCE_LANG, "translation.json"), "utf8"));

for (const lang of TARGET_LANGS) {
  const path = join(LOCALES_DIR, lang, "translation.json");
  const target = JSON.parse(readFileSync(path, "utf8"));
  const added = [];
  deepMergeMissing(en, target, added);
  writeFileSync(path, JSON.stringify(target, null, 2) + "\n");
  console.log(`${lang}: +${added.length} keys mirrored from en`);
  if (added.length && added.length <= 20) added.forEach((p) => console.log(`  + ${p}`));
}
