#!/usr/bin/env node

/**
 * Integration test for the admin product management flow.
 *
 * Tests:
 *   1. Admin login
 *   2. List products
 *   3. Create product
 *   4. Get product by ID
 *   5. Upload product image to Cloudinary
 *   6. Update product with image + translations
 *   7. Get translations for product
 *   8. Auto-translate a language
 *   9. Update translation manually
 *  10. Remove a language (delete translation)
 *  11. Delete product
 *
 * Usage:
 *   1. Start the dev server:  npm run dev
 *   2. Run this script:       node scripts/test-admin-products.mjs
 *
 * Optional env vars:
 *   BASE_URL     — default http://localhost:3000
 *   ADMIN_EMAIL  — default admin@evaluation-corporal.ai
 *   ADMIN_PASS   — default admin1234
 */

const BASE = process.env.BASE_URL || "http://localhost:3000";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@evaluation-corporal.ai";
const ADMIN_PASS = process.env.ADMIN_PASS || "admin1234";

const TEST_PRODUCT_ID = `__test_product_${Date.now()}`;

let sessionCookie = "";
let passed = 0;
let failed = 0;
const results = [];

// ── Helpers ──────────────────────────────────────────────────────

function log(icon, msg) {
  console.log(`  ${icon} ${msg}`);
}

async function api(method, path, body, opts = {}) {
  const url = `${BASE}${path}`;
  const headers = {};
  if (sessionCookie) headers.cookie = sessionCookie;

  let fetchOpts = { method, headers, redirect: "manual" };

  if (body instanceof FormData) {
    fetchOpts.body = body;
  } else if (body) {
    headers["content-type"] = "application/json";
    fetchOpts.body = JSON.stringify(body);
  }

  const res = await fetch(url, fetchOpts);

  // Capture set-cookie for login
  const setCookie = res.headers.get("set-cookie");
  if (setCookie) {
    const match = setCookie.match(/bg_admin_session=[^;]+/);
    if (match) sessionCookie = match[0];
  }

  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch { json = null; }

  return { status: res.status, json, text, ok: res.ok };
}

function assert(condition, msg) {
  if (!condition) throw new Error(msg);
}

async function test(name, fn) {
  process.stdout.write(`  [ ] ${name}...`);
  try {
    await fn();
    passed++;
    results.push({ name, pass: true });
    process.stdout.write(`\r  ✓  ${name}   \n`);
  } catch (err) {
    failed++;
    results.push({ name, pass: false, error: err.message });
    process.stdout.write(`\r  ✗  ${name}\n`);
    log("   ", `Error: ${err.message}`);
  }
}

// Create a tiny 1x1 red JPEG for image upload tests
function createTestJPEG() {
  // Minimal JPEG: FF D8 FF E0 (SOI + APP0) ... FF D9 (EOI)
  const hex =
    "ffd8ffe000104a46494600010100000100010000" +
    "ffdb004300080606070605080707070909080a0c" +
    "140d0c0b0b0c1912130f141d1a1f1e1d1a1c1c" +
    "20242e2720222c231c1c2837292c30313434341f" +
    "27393d38323c2e333432ffc0000b080001000101" +
    "011100ffc4001f000001050101010101010000000" +
    "0000000000102030405060708090a0bffc4001f01" +
    "0003010101010101010101000000000000010203" +
    "0405060708090a0bffda00080101000003f00037" +
    "b40002db40003ffd9";
  return Buffer.from(hex, "hex");
}

// ── Tests ────────────────────────────────────────────────────────

async function run() {
  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("  Admin Product Management — Integration Tests");
  console.log(`  Target: ${BASE}`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  // ──── 1. Auth ────

  await test("Reject unauthenticated request", async () => {
    const res = await api("GET", "/api/admin/products");
    assert(res.status === 401, `Expected 401, got ${res.status}`);
  });

  await test("Admin login", async () => {
    const res = await api("POST", "/api/admin/login", {
      email: ADMIN_EMAIL,
      password: ADMIN_PASS,
    });
    assert(res.ok, `Login failed: ${res.text}`);
    assert(sessionCookie, "No session cookie received");
    assert(res.json?.admin?.email === ADMIN_EMAIL, "Email mismatch in response");
  });

  // ──── 2. List products ────

  await test("List all products", async () => {
    const res = await api("GET", "/api/admin/products");
    assert(res.ok, `List failed: ${res.text}`);
    assert(Array.isArray(res.json?.products), "Expected products array");
    log("   ", `Found ${res.json.products.length} products`);
  });

  // ──── 3. Create product ────

  await test("Create test product", async () => {
    const res = await api("POST", "/api/admin/products", {
      id: TEST_PRODUCT_ID,
      sku: "TEST-001",
      name: "Test Night Serum",
      category: "Serum",
      type: "topical",
      concern_category: "Hydration",
      size: "30 ml",
      image: "",
      concerns: ["dryness", "fine_lines"],
      benefits: ["Deep hydration", "Reduces fine lines"],
      key_ingredients: [
        { name: "Hyaluronic Acid", role: "Moisture retention" },
        { name: "Niacinamide", role: "Brightening" },
      ],
      how_to_use: "Apply 2-3 drops to clean skin before moisturizer.",
      cautions: ["Avoid contact with eyes"],
      routine_step: { time: "evening", order: 2 },
      languages: ["en", "es", "fr"],
      is_active: true,
      display_order: 99,
    });
    assert(res.ok, `Create failed: ${res.text}`);
    assert(res.json?.product?.id === TEST_PRODUCT_ID, "Product ID mismatch");
    log("   ", `Created product: ${res.json.product.id}`);
  });

  // ──── 4. Get product by ID ────

  await test("Get product by ID", async () => {
    const res = await api("GET", `/api/admin/products/${TEST_PRODUCT_ID}`);
    assert(res.ok, `Get failed: ${res.text}`);
    assert(res.json?.product?.sku === "TEST-001", "SKU mismatch");
    assert(res.json?.product?.name === "Test Night Serum", "Name mismatch");
  });

  // ──── 5. Upload image ────

  await test("Upload product image to Cloudinary", async () => {
    const jpegBuffer = createTestJPEG();
    const blob = new Blob([jpegBuffer], { type: "image/jpeg" });
    const formData = new FormData();
    formData.append("file", blob, "test-product.jpg");

    const res = await api("POST", "/api/admin/products/upload-image", formData);
    assert(res.ok, `Upload failed: ${res.text}`);
    assert(res.json?.url, "No URL returned");
    assert(res.json.url.includes("cloudinary"), "URL is not a Cloudinary URL");
    log("   ", `Uploaded: ${res.json.url.substring(0, 60)}...`);

    // Save URL for update test
    globalThis.__testImageUrl = res.json.url;
  });

  // ──── 6. Update product with image ────

  await test("Update product with Cloudinary image", async () => {
    const res = await api("PUT", `/api/admin/products/${TEST_PRODUCT_ID}`, {
      id: TEST_PRODUCT_ID,
      sku: "TEST-001",
      name: "Test Night Serum (Updated)",
      category: "Serum",
      type: "topical",
      concern_category: "Hydration",
      size: "30 ml",
      image: globalThis.__testImageUrl || "",
      concerns: ["dryness", "fine_lines", "texture"],
      benefits: ["Deep hydration", "Reduces fine lines", "Smooths texture"],
      key_ingredients: [
        { name: "Hyaluronic Acid", role: "Moisture retention" },
        { name: "Niacinamide", role: "Brightening" },
      ],
      how_to_use: "Apply 2-3 drops to clean skin before moisturizer.",
      cautions: ["Avoid contact with eyes"],
      routine_step: { time: "evening", order: 2 },
      languages: ["en", "es", "fr"],
      is_active: true,
      display_order: 99,
    });
    assert(res.ok, `Update failed: ${res.text}`);
    assert(res.json?.product?.name === "Test Night Serum (Updated)", "Name not updated");
  });

  // ──── 7. Manual translation (PUT) ────

  await test("Save manual Spanish translation", async () => {
    const res = await api("PUT", `/api/admin/products/${TEST_PRODUCT_ID}/translations`, {
      language: "es",
      data: {
        name: "Suero de Noche de Prueba",
        benefits: ["Hidratacion profunda", "Reduce lineas finas"],
        key_ingredients: [
          { name: "Acido Hialuronico", role: "Retencion de humedad" },
          { name: "Niacinamida", role: "Iluminacion" },
        ],
        how_to_use: "Aplicar 2-3 gotas sobre la piel limpia antes de la crema hidratante.",
        cautions: ["Evitar el contacto con los ojos"],
      },
    });
    assert(res.ok, `Translation save failed: ${res.text}`);
    assert(res.json?.ok === true, "Expected { ok: true }");
  });

  // ──── 8. Get translations ────

  await test("Fetch translations for product", async () => {
    const res = await api("GET", `/api/admin/products/${TEST_PRODUCT_ID}/translations`);
    assert(res.ok, `Fetch translations failed: ${res.text}`);
    assert(res.json?.translations?.es, "Spanish translation missing");
    assert(
      res.json.translations.es.name === "Suero de Noche de Prueba",
      "Spanish name mismatch"
    );
    const langCount = Object.keys(res.json.translations).length;
    log("   ", `Found ${langCount} translation(s)`);
  });

  // ──── 9. Auto-translate ────

  await test("Auto-translate to French (AI)", async () => {
    const res = await api("POST", `/api/admin/products/${TEST_PRODUCT_ID}/auto-translate`, {
      language: "fr",
    });
    assert(res.ok, `Auto-translate failed: ${res.text}`);
    assert(res.json?.translation, "No translation object in response");
    assert(res.json.translation.name, "Translated name is empty");
    log("   ", `French name: "${res.json.translation.name}"`);
  });

  // ──── 10. Verify both translations exist ────

  await test("Both translations now in DB", async () => {
    const res = await api("GET", `/api/admin/products/${TEST_PRODUCT_ID}/translations`);
    assert(res.ok, `Fetch failed: ${res.text}`);
    assert(res.json?.translations?.es, "Spanish missing");
    assert(res.json?.translations?.fr, "French missing (auto-translate didn't save)");
    log("   ", `Languages: ${Object.keys(res.json.translations).join(", ")}`);
  });

  // ──── 11. Delete a translation ────

  await test("Delete French translation", async () => {
    const res = await api("DELETE", `/api/admin/products/${TEST_PRODUCT_ID}/translations`, {
      language: "fr",
    });
    assert(res.ok, `Delete translation failed: ${res.text}`);

    // Verify it's gone
    const check = await api("GET", `/api/admin/products/${TEST_PRODUCT_ID}/translations`);
    assert(!check.json?.translations?.fr, "French translation still exists after delete");
  });

  // ──── 12. Create with auto-translate on save ────

  await test("Create product with autoTranslateLanguages", async () => {
    const autoId = `${TEST_PRODUCT_ID}_auto`;
    const res = await api("POST", "/api/admin/products", {
      id: autoId,
      sku: "TEST-AUTO",
      name: "Auto Translate Test Cream",
      category: "Cream",
      type: "topical",
      concerns: ["dryness"],
      benefits: ["Intense moisture"],
      key_ingredients: [{ name: "Shea Butter", role: "Nourishment" }],
      how_to_use: "Apply generously.",
      cautions: [],
      languages: ["en", "de"],
      is_active: false,
      display_order: 100,
      autoTranslateLanguages: ["de"],
    });
    assert(res.ok, `Create with auto-translate failed: ${res.text}`);

    // Check if German translation was generated
    const check = await api("GET", `/api/admin/products/${autoId}/translations`);
    if (check.json?.translations?.de) {
      log("   ", `German name: "${check.json.translations.de.name}"`);
    } else if (res.json?.warnings?.length > 0) {
      log("   ", `Auto-translate had warnings: ${res.json.warnings.map(w => w.error).join(", ")}`);
    }

    // Cleanup
    await api("DELETE", `/api/admin/products/${autoId}`);
    log("   ", "Cleaned up auto-translate test product");
  });

  // ──── 13. Reject invalid image ────

  await test("Reject non-image upload", async () => {
    const textBlob = new Blob(["not an image"], { type: "text/plain" });
    const formData = new FormData();
    formData.append("file", textBlob, "fake.jpg");

    const res = await api("POST", "/api/admin/products/upload-image", formData);
    assert(res.status === 400, `Expected 400, got ${res.status}`);
    assert(res.json?.error?.includes("Invalid"), `Expected invalid format error, got: ${res.json?.error}`);
  });

  // ──── 14. Reject auto-translate for English ────

  await test("Reject auto-translate for English", async () => {
    const res = await api("POST", `/api/admin/products/${TEST_PRODUCT_ID}/auto-translate`, {
      language: "en",
    });
    assert(res.status === 400, `Expected 400, got ${res.status}`);
  });

  // ──── 15. Cleanup — delete test product ────

  await test("Delete test product", async () => {
    const res = await api("DELETE", `/api/admin/products/${TEST_PRODUCT_ID}`);
    assert(res.ok, `Delete failed: ${res.text}`);

    // Verify it's gone
    const check = await api("GET", `/api/admin/products/${TEST_PRODUCT_ID}`);
    assert(check.status === 404, "Product still exists after delete");
  });

  // ──── Summary ────

  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`  Results: ${passed} passed, ${failed} failed, ${passed + failed} total`);

  if (failed > 0) {
    console.log("\n  Failed tests:");
    for (const r of results.filter((r) => !r.pass)) {
      console.log(`    ✗ ${r.name}: ${r.error}`);
    }
  }

  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
  process.exit(failed > 0 ? 1 : 0);
}

run().catch((err) => {
  console.error("\nFatal error:", err);
  process.exit(1);
});
