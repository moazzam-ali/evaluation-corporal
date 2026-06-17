# Evaluación Corporal — project context

AI body & nutrition assessment (Next.js 16, App Router). Warm-neutral
editorial design system. Multi-language (en, es, fr, de, it, tr, pt, in).

## Stack
- **Next.js 16** (App Router) + React 19.
- **Postgres** via `pg` (raw SQL) — see `src/lib/db.js`. We use **Neon**.
- **OpenAI** for analysis (`src/lib/openai.js`, `src/lib/body-analysis.js`).
- **Cloudinary** (signed `fetch` uploads) for photos — optional, gated by
  `isCloudinaryConfigured()`.
- **Elasticsearch / App Search** for CRM indexing — optional, skipped if unset.
- **Telegram** bots for notifications (`src/lib/telegram.js`, `bots` table).
- i18n: `react-i18next`, dictionaries in `public/locales/<lng>/translation.json`.
  Results page strings live under the `rd` namespace.

## Environment
Copy `.env.example` → `.env.local` and fill in. Required to boot:
`DATABASE_URL`, `OPENAI_API_KEY`, `ADMIN_SESSION_SECRET`. Optional:
`CLOUDINARY_*` (photos), `ELASTIC_*` (CRM). Telegram tokens live in the `bots`
table (seeded by migrate), not env.

## Database setup
With `DATABASE_URL` set in `.env.local`:

```bash
npm install
npm run db:setup     # = db:migrate (tables, bots, admin) then db:seed (products + metric map)
```

Individual steps: `npm run db:migrate`, `npm run db:seed`.

- **Run migrate before seed.** `migrate.mjs` creates the tables and seeds
  `bots` + default `admin`. `seed-products.mjs` seeds `products` from
  `src/data/products.json` and then the `metric_product_map` from
  `src/data/metric-product-map.json` (kept after products so the FK holds).
- **Default admin:** `admin@beautyandglow.ai` / `changeme123` — change it from
  the admin panel after first login. (Email is a leftover default; fine to
  change.)

## Tables (all created by migrate.mjs)
`analyses`, `forms`, `products`, `product_translations`, `metric_product_map`,
`bots`, `admins`. Schema is the source of truth inside `scripts/migrate.mjs`.

## Key flows / routes
- `POST /api/forms` — store intake questionnaire (`forms`).
- `POST /api/analyze` and `/api/analyze-body` — run OpenAI analysis, persist to
  `analyses`, optional Cloudinary upload + Elastic indexing.
- `GET /api/results` (+ `/api/results/products`) — read an analysis by id.
- `/api/admin/*` — bcrypt login (`admins`) + product/translation CRUD.
- Canonical results UI: `src/app/results/demo/page.jsx` (chaptered dashboard).
  The dynamic `src/app/results/[id]/page.jsx` is the older skin-based skin and
  is being superseded.

## Body metrics (ids used across analysis, dictionaries, and the metric map)
`bmi, body_fat, lean_mass, waist_hip_ratio, healthy_weight, total_body_water,
hydration_target, bmr, calorie_target, protein_target, carbs_target, fat_target`.

## Notes / TODO
- **Seed catalog is starter data.** `src/data/products.json` is a generic,
  brand-neutral nutrition catalog (type `ingestible`) adapted for body
  composition; replace with the real catalog (edit the JSON or use the admin
  panel) before launch.
- **Telegram tokens are still hardcoded** in `scripts/migrate.mjs` and committed
  to git — rotate them and move to a secret store when convenient.
- i18n: after adding any `t("key", "default")`, run `node scripts/sync-en-locale.mjs`,
  then translations via `scripts/apply-translations.mjs`, then
  `node scripts/mirror-locales.mjs` and `npm run validate-locales`.
