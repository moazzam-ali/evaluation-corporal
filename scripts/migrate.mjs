// Run: node scripts/migrate.mjs
// Creates all DB tables and seeds bots + admin password.

import { Pool } from "pg";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import bcrypt from "bcryptjs";
import { config } from "dotenv";

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: join(__dirname, "..", ".env.local") });

if (!process.env.DATABASE_URL) {
  console.error("❌ DATABASE_URL is not set in .env.local");
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

const SCHEMA = `
-- ANALYSES (existing)
CREATE TABLE IF NOT EXISTS analyses (
  id           VARCHAR(32) PRIMARY KEY,
  form_data    JSONB NOT NULL,
  results      JSONB NOT NULL,
  image_url    TEXT,
  language     VARCHAR(5) NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_analyses_language    ON analyses(language);
CREATE INDEX IF NOT EXISTS idx_analyses_created_at  ON analyses(created_at DESC);

-- BOTS
CREATE TABLE IF NOT EXISTS bots (
  id           INTEGER PRIMARY KEY,
  language     VARCHAR(5) NOT NULL,
  name         VARCHAR(100) NOT NULL,
  api_key      VARCHAR(200) NOT NULL,
  is_active    BOOLEAN NOT NULL DEFAULT TRUE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_bots_language ON bots(language);

-- PRODUCTS
CREATE TABLE IF NOT EXISTS products (
  id                VARCHAR(64) PRIMARY KEY,
  sku               VARCHAR(32) NOT NULL,
  name              VARCHAR(200) NOT NULL,
  category          VARCHAR(100) NOT NULL,
  type              VARCHAR(20) NOT NULL CHECK (type IN ('topical','ingestible')),
  concern_category  VARCHAR(100),
  size              VARCHAR(50),
  image             TEXT,
  concerns          JSONB NOT NULL DEFAULT '[]'::jsonb,
  benefits          JSONB NOT NULL DEFAULT '[]'::jsonb,
  key_ingredients   JSONB NOT NULL DEFAULT '[]'::jsonb,
  how_to_use        TEXT,
  cautions          JSONB NOT NULL DEFAULT '[]'::jsonb,
  routine_step      JSONB,
  languages         JSONB NOT NULL DEFAULT '["en"]'::jsonb,
  is_active         BOOLEAN NOT NULL DEFAULT TRUE,
  display_order     INTEGER NOT NULL DEFAULT 0,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_products_active     ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_languages  ON products USING GIN (languages);
CREATE INDEX IF NOT EXISTS idx_products_concerns   ON products USING GIN (concerns);

-- PRODUCT TRANSLATIONS
CREATE TABLE IF NOT EXISTS product_translations (
  product_id        VARCHAR(64) NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  language          VARCHAR(5) NOT NULL,
  name              VARCHAR(200),
  benefits          JSONB,
  key_ingredients   JSONB,
  how_to_use        TEXT,
  cautions          JSONB,
  PRIMARY KEY (product_id, language)
);
CREATE INDEX IF NOT EXISTS idx_translations_lang ON product_translations(language);

-- METRIC → PRODUCT MAP
CREATE TABLE IF NOT EXISTS metric_product_map (
  metric_id    VARCHAR(64) NOT NULL,
  product_id   VARCHAR(64) NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  priority     INTEGER NOT NULL DEFAULT 1,
  language     VARCHAR(5) NOT NULL DEFAULT '_all_',
  PRIMARY KEY (metric_id, product_id, language)
);
CREATE INDEX IF NOT EXISTS idx_metric_map_metric ON metric_product_map(metric_id);

-- FORMS (intake submissions captured before optional body-photo analysis)
CREATE TABLE IF NOT EXISTS forms (
  id           VARCHAR(32) PRIMARY KEY,
  data         JSONB NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_forms_created_at ON forms(created_at DESC);

-- ADMINS
CREATE TABLE IF NOT EXISTS admins (
  id            SERIAL PRIMARY KEY,
  email         VARCHAR(200) UNIQUE NOT NULL,
  password_hash VARCHAR(200) NOT NULL,
  name          VARCHAR(100),
  role          VARCHAR(20) NOT NULL DEFAULT 'editor' CHECK (role IN ('editor','admin')),
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_login_at TIMESTAMPTZ
);
`;

const BOTS = [
  [1,  'es', 'coach_hbl_bot',          '1324657341:AAEf_Gvzc8TOcggrDYvFZ_Ag3mXDQUBBijg'],
  [2,  'en', 'coach_hbl_en_bot',       '1608533900:AAHY7CbZlEef3dSQJb_ZzPC4e4pcva_ZEp8'],
  [3,  'tr', 'coach_hbl_tr_bot',       '1712068075:AAHfjYWi-pSWvPuvFW73t3S0LgwDcP1PJTE'],
  [4,  'it', 'coach_hbl_it_bot',       '1858729854:AAH3mnpBYTYfyNAiPtW02tE7hAV0hoJmSx4'],
  [5,  'pt', 'coach_hbl_pt_bot',       '1809929729:AAGuehjEIy0SazEX2AmTUFnG1-cbQwLhZC8'],
  [6,  'bg', 'coach_hbl_bg_bot',       '1733348438:AAHuT1XZLF5Z8nVq98PeGeFflRhGh2OwY7g'],
  [7,  'fr', 'coach_hbl_fr_bot',       '1833120551:AAGR7amR3xwOswAovtf7ZQhHkS-ojYrzE7w'],
  [8,  'de', 'coach_hbl_de_bot',       '1863829533:AAGGRxagwhFJG8T7oL94blGcdk4p1vnwHz4'],
  [9,  'jp', 'coach_hbl_jp_bot',       '1841275477:AAFkofg_2pPjnlLC_91At9SquLtT8BYt8eU'],
  [10, 'th', 'coach_hbl_th_bot',       '5708046834:AAFyiW_83ADWmp_gHfBoRg_c0uW6yq2FDBA'],
  [11, 'mx', 'coach_hbl_mx_bot',       '1970661883:AAEN2yAs1xRxYcX94VX8qFbqym-R_0uFVfg'],
  [12, 'in', 'coach_hbl_in_bot',       '1978279063:AAFWrLQ5U5dx8nrBCQ5pftx1TRIUCka07v4'],
  [14, 'es', 'hlskin_bot',              '8296673752:AAE2UBOrRu3YoIAn5THG0Jb3KDm_LiEjBd0'],
  [20, 'es', 'coach_hatipikal_bot',    '6630724535:AAE98vXCdDYhD8noyqCkYWfeMFFEJaPjhSk'],
];

async function main() {
  const client = await pool.connect();
  try {
    console.log("📦 Creating tables...");
    await client.query(SCHEMA);
    console.log("✅ Tables created\n");

    console.log("🤖 Seeding bots...");
    for (const [id, lang, name, key] of BOTS) {
      await client.query(
        `INSERT INTO bots (id, language, name, api_key)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (id) DO UPDATE SET
           language = EXCLUDED.language,
           name = EXCLUDED.name,
           api_key = EXCLUDED.api_key,
           updated_at = NOW()`,
        [id, lang, name, key]
      );
    }
    console.log(`✅ Seeded ${BOTS.length} bots\n`);

    // NOTE: the metric → product map is seeded by scripts/seed-products.mjs,
    // after products exist, so its foreign key to products is satisfied.

    console.log("🔐 Setting up default admin (admin@evaluation-corporal.ai / admin1234)...");
    const passwordHash = await bcrypt.hash("admin1234", 10);
    await client.query(
      `INSERT INTO admins (email, password_hash, name, role)
       VALUES ($1, $2, $3, 'admin')
       ON CONFLICT (email) DO NOTHING`,
      ["admin@evaluation-corporal.ai", passwordHash, "Admin"]
    );
    console.log("✅ Default admin ready\n");

    console.log("🎉 Migration complete!");
    console.log("\n📋 Summary:");
    const r1 = await client.query("SELECT COUNT(*) FROM bots");
    const r3 = await client.query("SELECT COUNT(*) FROM admins");
    console.log(`   Bots: ${r1.rows[0].count}`);
    console.log(`   Admins: ${r3.rows[0].count}`);
    console.log(`   (Products + metric map are seeded by: npm run db:seed)`);
    console.log(`\n   Default admin login:`);
    console.log(`     Email: admin@evaluation-corporal.ai`);
    console.log(`     Password: admin1234`);
    console.log(`   ⚠️  Change this password from the admin panel after first login.`);
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error("❌ Migration failed:", err.message);
  process.exit(1);
});
