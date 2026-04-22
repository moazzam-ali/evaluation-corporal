#!/usr/bin/env node

/**
 * Validates that all locale translation files have the same key structure as English.
 * Checks both frontend (/public/locales/) and backend (/public/backend-locales/) directories.
 *
 * Usage: node scripts/validate-locales.mjs
 */

import { readFileSync, readdirSync } from "fs";
import { join } from "path";

const ROOT = process.cwd();

function getLeafKeys(obj, prefix = "") {
  const keys = [];
  for (const [key, value] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === "object" && !Array.isArray(value)) {
      keys.push(...getLeafKeys(value, path));
    } else {
      keys.push(path);
    }
  }
  return keys.sort();
}

function validateDirectory(dir, label) {
  const fullDir = join(ROOT, dir);
  let dirs;
  try {
    dirs = readdirSync(fullDir, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => d.name);
  } catch {
    console.log(`  Skipping ${label}: directory not found`);
    return 0;
  }

  if (!dirs.includes("en")) {
    console.log(`  Skipping ${label}: no English reference found`);
    return 0;
  }

  const enFile = join(fullDir, "en", "translation.json");
  const enData = JSON.parse(readFileSync(enFile, "utf-8"));
  const enKeys = new Set(getLeafKeys(enData));

  let totalIssues = 0;

  for (const lang of dirs) {
    if (lang === "en") continue;

    const langFile = join(fullDir, lang, "translation.json");
    let langData;
    try {
      langData = JSON.parse(readFileSync(langFile, "utf-8"));
    } catch (err) {
      console.log(`  [${lang}] ERROR: Failed to parse JSON - ${err.message}`);
      totalIssues++;
      continue;
    }

    const langKeys = new Set(getLeafKeys(langData));

    const missing = [...enKeys].filter((k) => !langKeys.has(k));
    const extra = [...langKeys].filter((k) => !enKeys.has(k));

    if (missing.length > 0 || extra.length > 0) {
      totalIssues += missing.length + extra.length;
      console.log(`  [${lang}] ${missing.length} missing, ${extra.length} extra`);
      if (missing.length > 0) {
        console.log(`    Missing: ${missing.slice(0, 10).join(", ")}${missing.length > 10 ? ` ... and ${missing.length - 10} more` : ""}`);
      }
      if (extra.length > 0) {
        console.log(`    Extra:   ${extra.slice(0, 10).join(", ")}${extra.length > 10 ? ` ... and ${extra.length - 10} more` : ""}`);
      }
    } else {
      console.log(`  [${lang}] OK (${langKeys.size} keys)`);
    }
  }

  return totalIssues;
}

console.log("\nValidating locale files against English reference...\n");

console.log("Frontend locales (public/locales/):");
const frontendIssues = validateDirectory("public/locales", "frontend");

console.log("\nBackend locales (public/backend-locales/):");
const backendIssues = validateDirectory("public/backend-locales", "backend");

const total = frontendIssues + backendIssues;
console.log(`\n${total === 0 ? "All locales in sync." : `Found ${total} issue(s).`}\n`);
process.exit(total > 0 ? 1 : 0);
