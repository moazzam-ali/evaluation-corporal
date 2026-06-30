#!/usr/bin/env node
/**
 * regen-product-images.mjs
 *
 * Downloads the freshly re-staged Herbalife product shots (generated with
 * Higgsfield) and writes them into public/images/products/, replacing the old
 * white-background pack-shots in place.
 *
 * The filenames are kept identical to the originals, so there is NO change to
 * src/data/products.json and NO database reseed required — the new files simply
 * take the place of the old ones at the same paths.
 *
 * Usage (from the repo root):
 *     node scripts/regen-product-images.mjs
 *
 * Requirements:
 *   - Node >= 18 (uses the global fetch).
 *   - `sharp` for resize + format matching. It is NOT a project dependency, so
 *     if it is missing the script installs it transiently with
 *     `npm i --no-save sharp` (this does not touch package.json or the lockfile).
 *     If sharp cannot be installed, the script falls back to saving the raw
 *     downloaded bytes (still renders fine, just without resize/recompression).
 */
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = resolve(__dirname, "..", "public", "images", "products");
const TARGET_WIDTH = 1400; // ample for the 200px card panel and the lightbox zoom

// originalFilename (unchanged → no products.json / DB edits)  →  Higgsfield result URL
const IMAGES = [
  ["formula1.jpg",             "https://d8j0ntlcm91z4.cloudfront.net/user_39MesriSRZdxNCuZhchnP0o93sz/hf_20260630_125819_c846b636-0d6b-4b0d-8034-b94484d50cbf.png"],
  ["protein-drink-mix.jpg",    "https://d8j0ntlcm91z4.cloudfront.net/user_39MesriSRZdxNCuZhchnP0o93sz/hf_20260630_125820_65294348-5ebc-42d8-9266-4fde817dd7c5.png"],
  ["herbal-tea.jpg",           "https://d8j0ntlcm91z4.cloudfront.net/user_39MesriSRZdxNCuZhchnP0o93sz/hf_20260630_125822_81af0e3b-ca97-4967-bf03-b1b50ec8db23.png"],
  ["aloe-concentrate.png",     "https://d8j0ntlcm91z4.cloudfront.net/user_39MesriSRZdxNCuZhchnP0o93sz/hf_20260630_125823_cee68474-9bd5-4a85-ba27-957851f46ccb.png"],
  ["oat-apple-fiber.png",      "https://d8j0ntlcm91z4.cloudfront.net/user_39MesriSRZdxNCuZhchnP0o93sz/hf_20260630_125827_16675470-829d-457c-94dc-c5de010cf1df.png"],
  ["fiber-concentrate.jpg",    "https://d8j0ntlcm91z4.cloudfront.net/user_39MesriSRZdxNCuZhchnP0o93sz/hf_20260630_125829_5b2dad1c-ec2d-43ab-8c31-8bb7cd92e1fc.png"],
  ["collagen.png",             "https://d8j0ntlcm91z4.cloudfront.net/user_39MesriSRZdxNCuZhchnP0o93sz/hf_20260630_125833_e2941048-230f-4c3d-8481-467a9dc40ac5.png"],
  ["phyto-complete.jpg",       "https://d8j0ntlcm91z4.cloudfront.net/user_39MesriSRZdxNCuZhchnP0o93sz/hf_20260630_125837_770c92ab-a55e-464c-95aa-fbbcfb6d64aa.png"],
  ["restore.jpg",              "https://d8j0ntlcm91z4.cloudfront.net/user_39MesriSRZdxNCuZhchnP0o93sz/hf_20260630_130105_2f958db0-d7d9-42e1-b993-02a7003c76d3.png"],
  ["niteworks.png",            "https://d8j0ntlcm91z4.cloudfront.net/user_39MesriSRZdxNCuZhchnP0o93sz/hf_20260630_130109_0f9282a7-c9ae-4fbf-a8c3-527bb0209f93.png"],
  ["betaheart.png",            "https://d8j0ntlcm91z4.cloudfront.net/user_39MesriSRZdxNCuZhchnP0o93sz/hf_20260630_130113_1aa6cfe8-3ee2-497c-b9fe-824a2feb1b39.png"],
  ["herbalifeline-omega3.png", "https://d8j0ntlcm91z4.cloudfront.net/user_39MesriSRZdxNCuZhchnP0o93sz/hf_20260630_130117_87accf34-e229-4893-ac78-6c9b8b129625.png"],
  ["microbiotic-max.png",      "https://d8j0ntlcm91z4.cloudfront.net/user_39MesriSRZdxNCuZhchnP0o93sz/hf_20260630_130119_b6806f66-bc90-4b79-aa57-1acd42a85f2b.png"],
  ["bioniq-go.png",            "https://d8j0ntlcm91z4.cloudfront.net/user_39MesriSRZdxNCuZhchnP0o93sz/hf_20260630_131554_9060a3d9-b711-441b-b26e-0d36c74ae03a.png"],
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
      console.warn("⚠ Could not load/install sharp — falling back to raw download (no resize / format conversion).");
      return null;
    }
  }
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  const sharp = await loadSharp();

  let ok = 0;
  for (const [name, url] of IMAGES) {
    const dest = resolve(OUT_DIR, name);
    process.stdout.write(`→ ${name} … `);
    try {
      const res = await fetch(url);
      if (!res.ok) {
        console.log(`FAILED (HTTP ${res.status})`);
        continue;
      }
      const buf = Buffer.from(await res.arrayBuffer());

      if (sharp) {
        const isJpg = /\.jpe?g$/i.test(name);
        let img = sharp(buf).resize({ width: TARGET_WIDTH, withoutEnlargement: true });
        img = isJpg
          ? img.flatten({ background: "#F4EFE7" }).jpeg({ quality: 88, mozjpeg: true })
          : img.png({ compressionLevel: 9 });
        await img.toFile(dest);
      } else {
        await writeFile(dest, buf);
      }
      ok++;
      console.log("done");
    } catch (err) {
      console.log(`ERROR — ${err.message}`);
    }
  }

  console.log(`\n✓ Updated ${ok}/${IMAGES.length} images in public/images/products/`);
  if (ok > 0) {
    console.log("Next: git add public/images/products && git commit -m \"Regenerate product images\" && git push");
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
