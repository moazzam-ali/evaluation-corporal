# Stage spectrum imagery

These images power the "spectrum" filmstrips on the results page
(`StageStrip` component) — they show how a body looks across the stages of
each banded metric. Until a file is present, the strip renders a width-scaled
brand silhouette as a graceful fallback, so the page always looks intentional.

> **Status:** all 12 stage photos are present. They were generated with
> Higgsfield (Nano Banana) from a single base figure reused as a reference, so
> it's the same male subject with identical framing, pose, lighting and warm
> cream background across the whole set — only the body composition changes
> per stage. 3:4 portrait WebP, ~1493×2000.

## Expected files (drop them here)

Body fat (male reference, lean → heavy):
- `bodyfat-essential.webp`  (2–8%)
- `bodyfat-athletic.webp`   (8–14%)
- `bodyfat-fitness.webp`    (14–18%)
- `bodyfat-average.webp`    (18–25%)
- `bodyfat-high.webp`       (25%+)

BMI:
- `bmi-under.webp`     (<18.5)
- `bmi-healthy.webp`   (18.5–25)
- `bmi-over.webp`      (25–30)
- `bmi-obese.webp`     (30+)

Waist-to-hip ratio:
- `whr-low.webp`       (<0.90)
- `whr-moderate.webp`  (0.90–0.95)
- `whr-high.webp`      (0.95+)

## Specs
- **Aspect ratio:** 3:4 portrait (frames are 3:4). 768×1024 is plenty.
- **Format:** WebP, quality ~82, ~30–60 KB each.
- **Framing:** identical across a set — same camera distance, same pose
  (front-facing, neutral arms), figure centered, full body head-to-mid-calf.
  Consistency is what makes the row read as one spectrum.
- **Background:** solid warm cream (#F4EFE7) or neutral studio. The component
  applies a warm duotone wash, so plain neutral backgrounds work best.
- **Subject:** keep one consistent body type / model per metric set so only
  the composition changes stage to stage.

## Higgsfield prompt template (GPT Image 2 or Soul 2.0)

Base prompt — substitute the {STAGE} clause per file:

> Full-body studio photograph of {a fit man in his early 30s}, front-facing,
> relaxed neutral pose, arms slightly away from the body, visible head to
> mid-calf. {STAGE}. Wearing minimal fitted neutral grey shorts (men) — no
> logos, no text. Soft even studio lighting, warm cream seamless background
> (#F4EFE7), no harsh shadows. Calm, clinical-editorial wellness aesthetic,
> restrained warm-neutral palette, photographic, sharp focus, centered
> composition with generous headroom and footroom. No props, no equipment.

{STAGE} clauses:
- essential: "extremely lean, visible muscle striations, ~6% body fat physique"
- athletic:  "lean athletic build with clear muscle definition, ~12% body fat"
- fitness:   "fit toned build, light definition, healthy ~16% body fat"
- average:   "average healthy build, soft midsection, ~22% body fat"
- high:      "heavier build, rounded midsection, ~28%+ body fat"
- BMI under/healthy/over/obese: same idea, vary overall body width/volume
- WHR low/moderate/high: vary waist vs hip proportion (low = tapered waist,
  high = wider waist relative to hips / central fat)

**Negative prompt:** logos, text, watermark, gym equipment, props, harsh
shadows, cool blue tones, multiple people, cropped head or feet, exaggerated
or cartoonish proportions, underwear branding.

After generating, save each as the filename above (convert to .webp). The
strip will pick them up automatically and apply the duotone treatment.
