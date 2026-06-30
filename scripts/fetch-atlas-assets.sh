#!/usr/bin/env bash
# Visual Atlas asset fetcher — run from the repo root of evaluacion-corporal.
# Downloads each generated image and converts PNG -> WebP at its final path.
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

get "https://d8j0ntlcm91z4.cloudfront.net/user_39MesriSRZdxNCuZhchnP0o93sz/hf_20260630_065846_0f6e5946-92fb-47d7-9105-99e7a7a2f776.png" "public/stages/bodyfat-essential.webp"
get "https://d8j0ntlcm91z4.cloudfront.net/user_39MesriSRZdxNCuZhchnP0o93sz/hf_20260630_065848_c49b5e2e-3b99-4c5a-a47e-e1a0582e9cf3.png" "public/stages/bodyfat-athletic.webp"
get "https://d8j0ntlcm91z4.cloudfront.net/user_39MesriSRZdxNCuZhchnP0o93sz/hf_20260630_060432_7dfdd61b-9359-49ba-8427-a1589423367a.png" "public/stages/bodyfat-fitness.webp"
get "https://d8j0ntlcm91z4.cloudfront.net/user_39MesriSRZdxNCuZhchnP0o93sz/hf_20260630_065851_f69ae236-e8c9-481c-8f74-4a4160fae1d2.png" "public/stages/bodyfat-average.webp"
get "https://d8j0ntlcm91z4.cloudfront.net/user_39MesriSRZdxNCuZhchnP0o93sz/hf_20260630_065853_60f09b12-d8ea-4421-a779-eda3b4d097eb.png" "public/stages/bodyfat-high.webp"
get "https://d8j0ntlcm91z4.cloudfront.net/user_39MesriSRZdxNCuZhchnP0o93sz/hf_20260630_070801_d45961d8-4594-4ec1-8bce-bc9847eec688.png" "public/stages/bmi-under.webp"
get "https://d8j0ntlcm91z4.cloudfront.net/user_39MesriSRZdxNCuZhchnP0o93sz/hf_20260630_065858_3c41fb30-0138-4250-a10f-b9a9d54871c3.png" "public/stages/bmi-healthy.webp"
get "https://d8j0ntlcm91z4.cloudfront.net/user_39MesriSRZdxNCuZhchnP0o93sz/hf_20260630_070803_2cb4fd26-bac7-4674-aff9-d70e9f3c1ec0.png" "public/stages/bmi-over.webp"
get "https://d8j0ntlcm91z4.cloudfront.net/user_39MesriSRZdxNCuZhchnP0o93sz/hf_20260630_070807_776427f1-07a7-4020-b80c-bf6ed16e9e6b.png" "public/stages/bmi-obese.webp"
get "https://d8j0ntlcm91z4.cloudfront.net/user_39MesriSRZdxNCuZhchnP0o93sz/hf_20260630_065905_39bd72a0-7b4d-41d5-9abd-861b699fb912.png" "public/stages/whr-low.webp"
get "https://d8j0ntlcm91z4.cloudfront.net/user_39MesriSRZdxNCuZhchnP0o93sz/hf_20260630_065907_6d5c9124-a596-42f5-a936-cba7fe4e6338.png" "public/stages/whr-moderate.webp"
get "https://d8j0ntlcm91z4.cloudfront.net/user_39MesriSRZdxNCuZhchnP0o93sz/hf_20260630_065909_54946b34-2dcc-45c2-9224-39aa20770860.png" "public/stages/whr-high.webp"
get "https://d8j0ntlcm91z4.cloudfront.net/user_39MesriSRZdxNCuZhchnP0o93sz/hf_20260630_070402_fee53a67-334f-4922-a2d9-efd05cc73e38.png" "public/atlas/external-female-bodyfat-essential.webp"
get "https://d8j0ntlcm91z4.cloudfront.net/user_39MesriSRZdxNCuZhchnP0o93sz/hf_20260630_071331_50e3e0b1-2c96-41cc-b344-4393e5a404d6.png" "public/atlas/external-female-bodyfat-athletic.webp"
get "https://d8j0ntlcm91z4.cloudfront.net/user_39MesriSRZdxNCuZhchnP0o93sz/hf_20260630_070407_ff87c8ad-ee36-49cb-8a51-68bf0e1b8566.png" "public/atlas/external-female-bodyfat-fitness.webp"
get "https://d8j0ntlcm91z4.cloudfront.net/user_39MesriSRZdxNCuZhchnP0o93sz/hf_20260630_070409_6de69f9b-bfc9-4f65-bb82-3903f7214264.png" "public/atlas/external-female-bodyfat-average.webp"
get "https://d8j0ntlcm91z4.cloudfront.net/user_39MesriSRZdxNCuZhchnP0o93sz/hf_20260630_070412_ac9cbff4-3c33-4818-a945-27eeba9bf353.png" "public/atlas/external-female-bodyfat-high.webp"
get "https://d8j0ntlcm91z4.cloudfront.net/user_39MesriSRZdxNCuZhchnP0o93sz/hf_20260630_070414_43c34f72-7587-4b7f-8a45-4c392abddcf5.png" "public/atlas/external-female-bmi-under.webp"
get "https://d8j0ntlcm91z4.cloudfront.net/user_39MesriSRZdxNCuZhchnP0o93sz/hf_20260630_070417_ebfc589f-052b-4bdb-9fad-ce5b6ffd9133.png" "public/atlas/external-female-bmi-healthy.webp"
get "https://d8j0ntlcm91z4.cloudfront.net/user_39MesriSRZdxNCuZhchnP0o93sz/hf_20260630_070420_fcc32ce2-a734-4d94-abe6-389601f19319.png" "public/atlas/external-female-bmi-over.webp"
get "https://d8j0ntlcm91z4.cloudfront.net/user_39MesriSRZdxNCuZhchnP0o93sz/hf_20260630_070423_7ad542d9-20ba-4c84-8b2c-44ff5abb1c51.png" "public/atlas/external-female-bmi-obese.webp"
get "https://d8j0ntlcm91z4.cloudfront.net/user_39MesriSRZdxNCuZhchnP0o93sz/hf_20260630_070425_b40c4929-2d3f-467a-8129-944a69b36030.png" "public/atlas/external-female-whr-low.webp"
get "https://d8j0ntlcm91z4.cloudfront.net/user_39MesriSRZdxNCuZhchnP0o93sz/hf_20260630_070428_959ace67-1939-4e67-b496-5ff6f872d624.png" "public/atlas/external-female-whr-moderate.webp"
get "https://d8j0ntlcm91z4.cloudfront.net/user_39MesriSRZdxNCuZhchnP0o93sz/hf_20260630_070430_78cb643e-47eb-4b06-b23a-026317889dfe.png" "public/atlas/external-female-whr-high.webp"
get "https://d8j0ntlcm91z4.cloudfront.net/user_39MesriSRZdxNCuZhchnP0o93sz/hf_20260630_070451_86e1e999-1aa9-427a-ac41-d1da7160b1ab.png" "public/atlas/internal-male-minimal.webp"
get "https://d8j0ntlcm91z4.cloudfront.net/user_39MesriSRZdxNCuZhchnP0o93sz/hf_20260630_070452_6affde38-16a6-4d38-add8-2f5c4678cf33.png" "public/atlas/internal-male-low.webp"
get "https://d8j0ntlcm91z4.cloudfront.net/user_39MesriSRZdxNCuZhchnP0o93sz/hf_20260630_070453_e273b13a-096d-4dcd-84f0-ff4fe0c9f4b4.png" "public/atlas/internal-male-moderate.webp"
get "https://d8j0ntlcm91z4.cloudfront.net/user_39MesriSRZdxNCuZhchnP0o93sz/hf_20260630_070454_5cb20b5a-4c4b-4921-9dc4-b12432d43b1d.png" "public/atlas/internal-male-high.webp"
get "https://d8j0ntlcm91z4.cloudfront.net/user_39MesriSRZdxNCuZhchnP0o93sz/hf_20260630_070457_74527985-dc63-44fb-b557-26c62567c301.png" "public/atlas/internal-male-severe.webp"
get "https://d8j0ntlcm91z4.cloudfront.net/user_39MesriSRZdxNCuZhchnP0o93sz/hf_20260630_070500_1127ddbd-d0a9-4246-9e12-1a5abe564cc8.png" "public/atlas/internal-female-minimal.webp"
get "https://d8j0ntlcm91z4.cloudfront.net/user_39MesriSRZdxNCuZhchnP0o93sz/hf_20260630_070502_c41ed252-d854-4933-92aa-9b3b79f94358.png" "public/atlas/internal-female-low.webp"
get "https://d8j0ntlcm91z4.cloudfront.net/user_39MesriSRZdxNCuZhchnP0o93sz/hf_20260630_070505_b7737bd3-75fc-40c0-b804-30c24b55415a.png" "public/atlas/internal-female-moderate.webp"
get "https://d8j0ntlcm91z4.cloudfront.net/user_39MesriSRZdxNCuZhchnP0o93sz/hf_20260630_070508_28ca6346-d8b0-4570-a335-f84a6f561cf8.png" "public/atlas/internal-female-high.webp"
get "https://d8j0ntlcm91z4.cloudfront.net/user_39MesriSRZdxNCuZhchnP0o93sz/hf_20260630_070510_4f78f272-f4f1-43d2-989c-13c861b832cb.png" "public/atlas/internal-female-severe.webp"
get "https://d8j0ntlcm91z4.cloudfront.net/user_39MesriSRZdxNCuZhchnP0o93sz/hf_20260630_070525_e2ec1546-ddfc-4cdb-9b76-b831edddfa14.png" "public/atlas/cross-male-lean.webp"
get "https://d8j0ntlcm91z4.cloudfront.net/user_39MesriSRZdxNCuZhchnP0o93sz/hf_20260630_070527_9f24e70a-6a97-4f53-8a7a-754d4520ece9.png" "public/atlas/cross-male-average.webp"
get "https://d8j0ntlcm91z4.cloudfront.net/user_39MesriSRZdxNCuZhchnP0o93sz/hf_20260630_070530_eb409cb1-3c67-48f6-aca0-588f78245ebc.png" "public/atlas/cross-male-high.webp"
get "https://d8j0ntlcm91z4.cloudfront.net/user_39MesriSRZdxNCuZhchnP0o93sz/hf_20260630_070532_9c81c6ad-d5ae-452c-a82c-bd59f6ac22ff.png" "public/atlas/cross-female-lean.webp"
get "https://d8j0ntlcm91z4.cloudfront.net/user_39MesriSRZdxNCuZhchnP0o93sz/hf_20260630_070535_d5c4c74c-d0b2-4b07-a443-f98890ada231.png" "public/atlas/cross-female-average.webp"
get "https://d8j0ntlcm91z4.cloudfront.net/user_39MesriSRZdxNCuZhchnP0o93sz/hf_20260630_070538_2e9e77fb-a81d-4e42-a72e-569c9e3db534.png" "public/atlas/cross-female-high.webp"
get "https://d8j0ntlcm91z4.cloudfront.net/user_39MesriSRZdxNCuZhchnP0o93sz/hf_20260630_070605_87f9b9b6-3f01-476f-913a-662294698da2.png" "public/atlas/facial-male-vibrant.webp"
get "https://d8j0ntlcm91z4.cloudfront.net/user_39MesriSRZdxNCuZhchnP0o93sz/hf_20260630_070608_c1636c3d-e396-4fbb-9f42-9aa2d49e1e0c.png" "public/atlas/facial-male-balanced.webp"
get "https://d8j0ntlcm91z4.cloudfront.net/user_39MesriSRZdxNCuZhchnP0o93sz/hf_20260630_070611_a74c0898-a63a-4ed9-9b6d-f6dc34b4e825.png" "public/atlas/facial-male-fatigued.webp"
get "https://d8j0ntlcm91z4.cloudfront.net/user_39MesriSRZdxNCuZhchnP0o93sz/hf_20260630_070613_895c3d16-25da-4314-adb6-5329ba5fcd8f.png" "public/atlas/facial-male-depleted.webp"
get "https://d8j0ntlcm91z4.cloudfront.net/user_39MesriSRZdxNCuZhchnP0o93sz/hf_20260630_070616_90b6feb4-d7d8-4ea3-9d1f-d9e57f804545.png" "public/atlas/facial-female-vibrant.webp"
get "https://d8j0ntlcm91z4.cloudfront.net/user_39MesriSRZdxNCuZhchnP0o93sz/hf_20260630_070618_f5526ce2-c032-45cb-9ba8-24f9b62d2b19.png" "public/atlas/facial-female-balanced.webp"
get "https://d8j0ntlcm91z4.cloudfront.net/user_39MesriSRZdxNCuZhchnP0o93sz/hf_20260630_070620_d89e4f20-6468-4811-a586-d9b5a4e5604b.png" "public/atlas/facial-female-fatigued.webp"
get "https://d8j0ntlcm91z4.cloudfront.net/user_39MesriSRZdxNCuZhchnP0o93sz/hf_20260630_070622_d6c23cc7-f81a-44d1-92df-d6fa3c25c671.png" "public/atlas/facial-female-depleted.webp"
get "https://d8j0ntlcm91z4.cloudfront.net/user_39MesriSRZdxNCuZhchnP0o93sz/hf_20260630_070542_b308842e-8cdb-4afc-9baf-4558a56fca18.png" "public/atlas/posture-male-aligned.webp"
get "https://d8j0ntlcm91z4.cloudfront.net/user_39MesriSRZdxNCuZhchnP0o93sz/hf_20260630_070544_84d0ccc0-1a2c-4744-ac96-0b91f6976d3d.png" "public/atlas/posture-male-rounded.webp"
get "https://d8j0ntlcm91z4.cloudfront.net/user_39MesriSRZdxNCuZhchnP0o93sz/hf_20260630_070546_3f0a76f2-c421-4066-924e-aec8d5cb68f0.png" "public/atlas/posture-male-tilted.webp"
get "https://d8j0ntlcm91z4.cloudfront.net/user_39MesriSRZdxNCuZhchnP0o93sz/hf_20260630_070549_a336c89d-c6fb-4927-a911-6691ef61909e.png" "public/atlas/posture-female-aligned.webp"
get "https://d8j0ntlcm91z4.cloudfront.net/user_39MesriSRZdxNCuZhchnP0o93sz/hf_20260630_070551_0c07aea5-ceb4-440f-9d7c-19f2247552ef.png" "public/atlas/posture-female-rounded.webp"
get "https://d8j0ntlcm91z4.cloudfront.net/user_39MesriSRZdxNCuZhchnP0o93sz/hf_20260630_071332_691a9d54-06dd-4a6d-91a9-c7b91ef80405.png" "public/atlas/posture-female-tilted.webp"

echo "Done — $(find public/atlas public/stages -name '*.webp' | wc -l) webp files present."
