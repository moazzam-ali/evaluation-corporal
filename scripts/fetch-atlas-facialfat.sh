#!/usr/bin/env bash
# Visual Atlas — NEW "Facial fat" view assets (10 facialfat-*.webp).
# Run from the repo root. Head-and-shoulders portraits showing the face across
# the body-fat range; each sex shares one locked base (Fitness), with the other
# stages derived from it so it stays the same person, only the facial fat changes.
# Needs a converter: cwebp | magick | convert | ffmpeg | sips.
set -euo pipefail

conv() {
  if command -v cwebp >/dev/null; then cwebp -quiet -q 90 "$1" -o "$2";
  elif command -v magick >/dev/null; then magick "$1" -quality 90 "$2";
  elif command -v convert >/dev/null; then convert "$1" -quality 90 "$2";
  elif command -v ffmpeg >/dev/null; then ffmpeg -y -loglevel error -i "$1" "$2";
  elif command -v sips >/dev/null; then sips -s format webp "$1" --out "$2" >/dev/null;
  else echo "No webp converter found (install cwebp/imagemagick/ffmpeg)"; exit 1; fi
}

get() {
  local url="$1" dst="$2" tmp; mkdir -p "$(dirname "$dst")"; tmp="$(mktemp).png"
  echo "-> $dst"; curl -fsSL "$url" -o "$tmp"; conv "$tmp" "$dst"; rm -f "$tmp"
}

get "https://d8j0ntlcm91z4.cloudfront.net/user_39MesriSRZdxNCuZhchnP0o93sz/hf_20260630_080650_a97e12c6-3b7f-4155-9b1c-4c5c6c7a0647.png" "public/atlas/facialfat-male-essential.webp"
get "https://d8j0ntlcm91z4.cloudfront.net/user_39MesriSRZdxNCuZhchnP0o93sz/hf_20260630_080652_9cd86f90-bb8a-42b4-b9d6-a1e887bff85c.png" "public/atlas/facialfat-male-athletic.webp"
get "https://d8j0ntlcm91z4.cloudfront.net/user_39MesriSRZdxNCuZhchnP0o93sz/hf_20260630_074933_bc413a5d-e390-47e1-bedc-0c81b700c1e1.png" "public/atlas/facialfat-male-fitness.webp"
get "https://d8j0ntlcm91z4.cloudfront.net/user_39MesriSRZdxNCuZhchnP0o93sz/hf_20260630_080655_1361ac49-dd10-480c-b62b-6a2557d92456.png" "public/atlas/facialfat-male-average.webp"
get "https://d8j0ntlcm91z4.cloudfront.net/user_39MesriSRZdxNCuZhchnP0o93sz/hf_20260630_080657_df126bed-e630-494b-8bc8-48aaf1a22c5f.png" "public/atlas/facialfat-male-high.webp"
get "https://d8j0ntlcm91z4.cloudfront.net/user_39MesriSRZdxNCuZhchnP0o93sz/hf_20260630_080700_0d09c51b-c735-4b40-adab-329625fe301a.png" "public/atlas/facialfat-female-essential.webp"
get "https://d8j0ntlcm91z4.cloudfront.net/user_39MesriSRZdxNCuZhchnP0o93sz/hf_20260630_080702_7f36ae0c-19c6-47fd-a6e4-14ea6169f1bf.png" "public/atlas/facialfat-female-athletic.webp"
get "https://d8j0ntlcm91z4.cloudfront.net/user_39MesriSRZdxNCuZhchnP0o93sz/hf_20260630_074935_1872761a-5e91-4120-8379-fe50b3c24bef.png" "public/atlas/facialfat-female-fitness.webp"
get "https://d8j0ntlcm91z4.cloudfront.net/user_39MesriSRZdxNCuZhchnP0o93sz/hf_20260630_080704_beb9c27c-f195-4928-a9d9-bf76d590d315.png" "public/atlas/facialfat-female-average.webp"
get "https://d8j0ntlcm91z4.cloudfront.net/user_39MesriSRZdxNCuZhchnP0o93sz/hf_20260630_080706_46d035db-9599-4d2c-8fa7-c59ec20f86c6.png" "public/atlas/facialfat-female-high.webp"

echo "Done — 10 facialfat-*.webp present."
