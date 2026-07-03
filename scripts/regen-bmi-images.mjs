#!/usr/bin/env node
/**
 * regen-bmi-images.mjs
 *
 * Downloads the two new "Obese II+" (BMI 35+) figures — same man/woman as the
 * existing BMI sets — into public/stages and public/atlas. This completes the
 * 5-stage BMI spectrum (Under / Healthy / Over / Obese I / Obese II+),
 * matching the 5-stage body-fat card.
 *
 * Run from the repo root:
 *     node scripts/regen-bmi-images.mjs
 *
 * Requirements: Node >= 18. Uses `sharp` for resize + webp; installs it
 * transiently (npm i --no-save sharp) if missing.
 */
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const WIDTH = 900;

const IMAGES = [
  ["public/stages/bmi-obese2.webp",                 "https://d8j0ntlcm91z4.cloudfront.net/user_39MesriSRZdxNCuZhchnP0o93sz/hf_20260703_080632_58161c65-aa45-4faf-bbda-a51f62037727.png"],
  ["public/atlas/external-female-bmi-obese2.webp",  "https://d8j0ntlcm91z4.cloudfront.net/user_39MesriSRZdxNCuZhchnP0o93sz/hf_20260703_080634_168cb3d7-d5be-4779-af36-e0356ec94ca5.png"],
];

async function loadSharp() {
  try { return (await import("sharp")).default; }
  catch {
    console.log("• sharp not found — installing transiently (npm i --no-save sharp)…");
    try { execSync("npm i --no-save sharp", { stdio: "inherit" }); return (await import("sharp")).default; }
    catch { console.warn("⚠ sharp unavailable — saving raw bytes."); return null; }
  }
}

async function main() {
  const sharp = await loadSharp();
  let ok = 0;
  for (const [rel, url] of IMAGES) {
    const dest = resolve(ROOT, rel);
    await mkdir(dirname(dest), { recursive: true });
    process.stdout.write(`→ ${rel} … `);
    try {
      const res = await fetch(url);
      if (!res.ok) { console.log(`FAILED (HTTP ${res.status})`); continue; }
      const buf = Buffer.from(await res.arrayBuffer());
      if (sharp) await sharp(buf).resize({ width: WIDTH, withoutEnlargement: true }).webp({ quality: 88 }).toFile(dest);
      else await writeFile(dest, buf);
      ok++; console.log("done");
    } catch (err) { console.log(`ERROR — ${err.message}`); }
  }
  console.log(`\n✓ Updated ${ok}/${IMAGES.length} BMI figures.`);
  if (ok > 0) console.log('Next: git add public/stages public/atlas && git commit -m "Add Obese II+ BMI figures" && git push');
}

main().catch((e) => { console.error(e); process.exit(1); });
