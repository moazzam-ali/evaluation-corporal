#!/usr/bin/env bash
# Visual Atlas — REBUILT cross-sections fetcher (replaces the 6 cross-*.webp).
# Run from the repo root. Each sex shares one locked base (Lean); Average/High
# are derived from it, changing only the subcutaneous + visceral fat thickness
# so the slice, intestines and muscle ring stay fixed across stages.
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

get "https://d8j0ntlcm91z4.cloudfront.net/user_39MesriSRZdxNCuZhchnP0o93sz/hf_20260630_074059_21e0f153-45f3-4103-9235-b715b6b35ef5.png" "public/atlas/cross-male-lean.webp"
get "https://d8j0ntlcm91z4.cloudfront.net/user_39MesriSRZdxNCuZhchnP0o93sz/hf_20260630_074324_0ee6f6db-8d13-483d-8081-295e7b40db7e.png" "public/atlas/cross-male-average.webp"
get "https://d8j0ntlcm91z4.cloudfront.net/user_39MesriSRZdxNCuZhchnP0o93sz/hf_20260630_074327_ce5fb47f-8165-41a2-b015-f2c68e33d656.png" "public/atlas/cross-male-high.webp"
get "https://d8j0ntlcm91z4.cloudfront.net/user_39MesriSRZdxNCuZhchnP0o93sz/hf_20260630_074101_b7022a59-67ad-4d9c-ae2a-e8ce0f26d442.png" "public/atlas/cross-female-lean.webp"
get "https://d8j0ntlcm91z4.cloudfront.net/user_39MesriSRZdxNCuZhchnP0o93sz/hf_20260630_074329_0849ca28-271b-4da7-bab1-475a893f15e9.png" "public/atlas/cross-female-average.webp"
get "https://d8j0ntlcm91z4.cloudfront.net/user_39MesriSRZdxNCuZhchnP0o93sz/hf_20260630_074331_3fe95f8d-797d-44f3-b00f-c70f50ab57cc.png" "public/atlas/cross-female-high.webp"

echo "Done — 6 cross-*.webp replaced."
