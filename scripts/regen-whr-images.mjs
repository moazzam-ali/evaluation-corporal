#!/usr/bin/env node
/**
 * regen-whr-images.mjs
 *
 * Downloads the regenerated Waist-to-Hip Ratio figures — a clear
 * low → moderate → high progression, same person within each set — into
 * public/stages (male) and public/atlas (female), replacing the old
 * near-identical figures in place (same filenames → no code changes needed).
 *
 * Run from the repo root:
 *     node scripts/regen-whr-images.mjs
 *
 * Requirements: Node >= 18 (global fetch). Uses `sharp` to resize + write webp;
 * if it's missing the script installs it transiently with
 * `npm i --no-save sharp` (no changes to package.json / lockfile).
 */
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const WIDTH = 900; // matches the original figure width

// repo-relative target (unchanged filename)  →  Higgsfield result URL
const IMAGES = [
  ["public/stages/whr-low.webp",                    "https://d8j0ntlcm91z4.cloudfront.net/user_39MesriSRZdxNCuZhchnP0o93sz/hf_20260701_062814_615cdc07-7124-42c0-8d9f-1c1db130dd24.png"],
  ["public/stages/whr-moderate.webp",               "https://d8j0ntlcm91z4.cloudfront.net/user_39MesriSRZdxNCuZhchnP0o93sz/hf_20260701_062817_82d80054-ec83-4444-8d7f-5cdd8f0325e1.png"],
  ["public/stages/whr-high.webp",                   "https://d8j0ntlcm91z4.cloudfront.net/user_39MesriSRZdxNCuZhchnP0o93sz/hf_20260701_062820_12ee3df2-7bc6-4a1b-bba3-771a62f7046e.png"],
  ["public/atlas/external-female-whr-low.webp",     "https://d8j0ntlcm91z4.cloudfront.net/user_39MesriSRZdxNCuZhchnP0o93sz/hf_20260701_062824_7fa60313-d807-468a-bbc5-5165ef60223c.png"],
  ["public/atlas/external-female-whr-moderate.webp","https://d8j0ntlcm91z4.cloudfront.net/user_39MesriSRZdxNCuZhchnP0o93sz/hf_20260701_062826_93ec2a55-2ba9-4646-aeec-3757777ced5f.png"],
  ["public/atlas/external-female-whr-high.webp",    "https://d8j0ntlcm91z4.cloudfront.net/user_39MesriSRZdxNCuZhchnP0o93sz/hf_20260701_062828_2b29a1f8-70be-426e-8471-bff6b246fe61.png"],
];

async function loadSharp() {
  try {
    return (await import("sharp")).default;
  } catch {
    console.log("• sharp not found — installing transiently (npm i --no-save sharp)…");
    try {
      execSync("npm i --no-save sharp", { stdio: "inherit" });
      return (await import("sharp")).default;
    } catch {
      console.warn("⚠ Could not load/install sharp — falling back to raw download (no resize / webp encode).");
      return null;
    }
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
      if (sharp) {
        await sharp(buf).resize({ width: WIDTH, withoutEnlargement: true }).webp({ quality: 88 }).toFile(dest);
      } else {
        await writeFile(dest, buf);
      }
      ok++;
      console.log("done");
    } catch (err) {
      console.log(`ERROR — ${err.message}`);
    }
  }
  console.log(`\n✓ Updated ${ok}/${IMAGES.length} WHR figures.`);
  if (ok > 0) console.log("Next: git add public/stages public/atlas && git commit -m \"Regenerate WHR figures\" && git push");
}

main().catch((e) => { console.error(e); process.exit(1); });
