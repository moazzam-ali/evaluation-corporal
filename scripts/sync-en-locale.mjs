// Scan the codebase for every t("key", "default") call and ensure the
// English locale has an entry for it. Adds missing keys with their default
// string in-place. Idempotent.
//
// Usage: node scripts/sync-en-locale.mjs

import { readFileSync, writeFileSync, readdirSync, statSync } from "node:fs";
import { join, extname } from "node:path";

const ROOT = process.cwd();
const SRC = join(ROOT, "src");
const EN_PATH = join(ROOT, "public", "locales", "en", "translation.json");

const EXTS = new Set([".js", ".jsx", ".mjs"]);

function walk(dir, files = []) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) walk(full, files);
    else if (EXTS.has(extname(name))) files.push(full);
  }
  return files;
}

// Match: t("key", "default"), t('key', 'default'), or t(`key`, "default")
// Multiline-tolerant. Defaults containing escaped quotes / interpolations are
// captured verbatim and JS-parsed below.
const T_CALL = /\bt\(\s*(["'`])([\w.\-]+)\1\s*(?:,\s*(["'`])([\s\S]*?)\3)?\s*[,)]/g;

function unescapeJsString(s) {
  // Replace common escapes; this is a best-effort decode for static strings.
  return s
    .replace(/\\n/g, "\n")
    .replace(/\\t/g, "\t")
    .replace(/\\"/g, '"')
    .replace(/\\'/g, "'")
    .replace(/\\`/g, "`")
    .replace(/\\\\/g, "\\");
}

function setByPath(obj, dottedKey, value) {
  const parts = dottedKey.split(".");
  let cur = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    const k = parts[i];
    if (typeof cur[k] !== "object" || cur[k] === null || Array.isArray(cur[k])) {
      cur[k] = {};
    }
    cur = cur[k];
  }
  if (cur[parts.at(-1)] === undefined) {
    cur[parts.at(-1)] = value;
    return true;
  }
  return false;
}

function getByPath(obj, dottedKey) {
  return dottedKey.split(".").reduce((acc, k) => (acc && typeof acc === "object" ? acc[k] : undefined), obj);
}

const files = walk(SRC);

const found = new Map();
for (const file of files) {
  const src = readFileSync(file, "utf8");
  let m;
  T_CALL.lastIndex = 0;
  while ((m = T_CALL.exec(src))) {
    const key = m[2];
    const defaultVal = m[4] ? unescapeJsString(m[4]) : null;
    if (!found.has(key) && defaultVal !== null) {
      found.set(key, defaultVal);
    } else if (!found.has(key)) {
      found.set(key, null);
    }
  }
}

const en = JSON.parse(readFileSync(EN_PATH, "utf8"));

const added = [];
const missingNoDefault = [];
for (const [key, def] of found) {
  if (getByPath(en, key) !== undefined) continue;
  if (def === null) {
    missingNoDefault.push(key);
    continue;
  }
  if (setByPath(en, key, def)) added.push(key);
}

writeFileSync(EN_PATH, JSON.stringify(en, null, 2) + "\n");

console.log(`Scanned ${files.length} files.`);
console.log(`Distinct t() keys found: ${found.size}`);
console.log(`Added ${added.length} new keys to en.`);
if (added.length) console.log("  +", added.slice(0, 40).join("\n  + "));
if (missingNoDefault.length) {
  console.log(`Keys referenced without a default (will need manual review): ${missingNoDefault.length}`);
  console.log("  ?", missingNoDefault.slice(0, 40).join("\n  ? "));
}
