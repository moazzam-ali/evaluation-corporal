#!/usr/bin/env bash
# Visual Atlas — REBUILT internals fetcher (replaces the 10 internal-*.webp).
# Run from the repo root. Overwrites the old inconsistent internal cutaways
# with the new base-derived set (locked organs/pose/clothing, fat grows by stage).
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

get "https://d8j0ntlcm91z4.cloudfront.net/user_39MesriSRZdxNCuZhchnP0o93sz/hf_20260630_073523_84e298a8-c719-4981-9324-d6c418a3c18e.png" "public/atlas/internal-male-minimal.webp"
get "https://d8j0ntlcm91z4.cloudfront.net/user_39MesriSRZdxNCuZhchnP0o93sz/hf_20260630_073632_88267af6-57b3-46f4-a74f-49f719d9359a.png" "public/atlas/internal-male-low.webp"
get "https://d8j0ntlcm91z4.cloudfront.net/user_39MesriSRZdxNCuZhchnP0o93sz/hf_20260630_073635_9c21a7e9-12e8-4148-8abd-4c45f3d1ec32.png" "public/atlas/internal-male-moderate.webp"
get "https://d8j0ntlcm91z4.cloudfront.net/user_39MesriSRZdxNCuZhchnP0o93sz/hf_20260630_073638_936cc6c8-43b5-4554-8bac-89286ee4ace3.png" "public/atlas/internal-male-high.webp"
get "https://d8j0ntlcm91z4.cloudfront.net/user_39MesriSRZdxNCuZhchnP0o93sz/hf_20260630_073641_48ce6b21-0541-4e0e-aca9-80e85d4286ab.png" "public/atlas/internal-male-severe.webp"
get "https://d8j0ntlcm91z4.cloudfront.net/user_39MesriSRZdxNCuZhchnP0o93sz/hf_20260630_073526_5ed02520-a966-4a2f-b7d4-54fa5758c80a.png" "public/atlas/internal-female-minimal.webp"
get "https://d8j0ntlcm91z4.cloudfront.net/user_39MesriSRZdxNCuZhchnP0o93sz/hf_20260630_073701_0830f9a4-0163-497d-9e95-c4c560504925.png" "public/atlas/internal-female-low.webp"
get "https://d8j0ntlcm91z4.cloudfront.net/user_39MesriSRZdxNCuZhchnP0o93sz/hf_20260630_073703_718718d2-3af7-4cc5-9de0-13c55603e4f1.png" "public/atlas/internal-female-moderate.webp"
get "https://d8j0ntlcm91z4.cloudfront.net/user_39MesriSRZdxNCuZhchnP0o93sz/hf_20260630_073706_45d92270-e8e9-444a-b22b-aaf5aed3d4c3.png" "public/atlas/internal-female-high.webp"
get "https://d8j0ntlcm91z4.cloudfront.net/user_39MesriSRZdxNCuZhchnP0o93sz/hf_20260630_073709_c0519903-24b8-4c81-8f48-0b1e58614934.png" "public/atlas/internal-female-severe.webp"

echo "Done — 10 internal-*.webp replaced."
