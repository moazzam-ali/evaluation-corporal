#!/usr/bin/env node

/**
 * End-to-end integration test for the full analysis flow.
 *
 * Tests:
 *   1.  Submit analysis with full questionnaire data + image
 *   2.  Verify response structure (steps, results, metrics, products)
 *   3.  Verify Cloudinary image upload (step tracker)
 *   4.  Verify AI analysis response shape and validation
 *   5.  Verify database persistence
 *   6.  Verify product enrichment
 *   7.  Retrieve results by ID via /api/results
 *   8.  Verify results page data structure matches store expectations
 *   9.  Test with different language
 *  10.  Test validation: missing image
 *  11.  Test validation: invalid image format
 *  12.  Test validation: missing form data
 *  13.  Test demo results endpoint
 *
 * Usage:
 *   1. Start the dev server:  npm run dev
 *   2. Run this script:       node scripts/test-analysis-flow.mjs
 *
 * Note: Test #1 calls OpenAI which costs ~$0.01 and takes ~10-20 seconds.
 *
 * Optional env vars:
 *   BASE_URL  — default http://localhost:3000
 */

import { readFileSync, existsSync } from "fs";
import { join } from "path";

const BASE = process.env.BASE_URL || "http://localhost:3000";

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
  let fetchOpts = { method, headers };

  if (body instanceof FormData) {
    fetchOpts.body = body;
  } else if (body) {
    headers["content-type"] = "application/json";
    fetchOpts.body = JSON.stringify(body);
  }

  const res = await fetch(url, fetchOpts);
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

/**
 * Get a test image. Tries to use a real face photo if available at
 * scripts/test-face.jpg. Otherwise, uses a product PNG from the repo
 * (OpenAI accepts any image — it'll just note it's not a face).
 */
function getTestImage() {
  // Prefer a real face photo if the user has placed one
  const facePath = join(process.cwd(), "scripts", "test-face.jpg");
  if (existsSync(facePath)) {
    log("   ", "Using real test face image from scripts/test-face.jpg");
    return { buffer: readFileSync(facePath), mime: "image/jpeg" };
  }

  // Fall back to a product PNG from the repo — it's a real image OpenAI can process
  // (AI will respond it can't see a face, but the structural flow still validates)
  const fallbackPath = join(process.cwd(), "public", "images", "products", "night-cream-539k.png");
  if (existsSync(fallbackPath)) {
    log("   ", "Using product image as fallback (no scripts/test-face.jpg found)");
    return { buffer: readFileSync(fallbackPath), mime: "image/png" };
  }

  throw new Error(
    "No test image available. Place a face photo at scripts/test-face.jpg or ensure public/images/products/ has images."
  );
}

/** Complete questionnaire form data matching the 9-step scan schema. */
const MOCK_FORM_DATA = {
  // Step 1: Basic Info
  name: "Test",
  surname: "User",
  email: "test@example.com",
  birthDate: "1990-05-15",
  phone: "+1234567890",
  country: "United States",
  city: "New York",
  // Step 2: Main Goal
  skinConcerns: ["dryness", "fine_lines"],
  skinConcernsOther: "",
  priorityConcern: "dryness",
  improvementZones: ["face", "under_eyes"],
  // Step 3: Skin Perception
  skinType: "combination",
  skinFeelGeneral: "tight",
  skinFeelEndOfDay: "oily_tzone",
  // Step 4: Current Routine
  routineFrequency: "daily",
  productsUsed: ["cleanser", "moisturizer", "sunscreen"],
  productsUsedOther: "",
  essentialProduct: "moisturizer",
  missingProduct: "serum",
  supplements: "none",
  retinoidPreference: "open_to_try",
  // Step 5: Sensitivity
  reactionLevel: "moderate",
  recentSigns: ["redness"],
  // Step 6: Habits
  sunscreenUse: "daily",
  makeupFrequency: "rarely",
  sleepHours: "7_8",
  stressImpact: "moderate",
  waterIntake: "1_2_liters",
  // Step 7: Past Experience
  treatmentHistory: "basic_skincare",
  frustrations: ["products_dont_work"],
  // Step 8: Goals / Commercial
  lookingFor: "complete_routine",
  wantRoutineRecommendation: "yes",
  budgetLevel: "mid_range",
};

// Expected metric IDs from the system prompt
const EXPECTED_METRICS = [
  "oily_skin", "uneven_skin_tone", "eye_wrinkles", "crows_feet",
  "radiance", "firmness", "hydration", "dark_spots",
  "smoothness", "fine_lines_wrinkles", "texture", "dark_circles",
];

// ── Tests ────────────────────────────────────────────────────────

let analysisId = null;
let analysisResult = null;

async function run() {
  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("  Full Analysis Flow — End-to-End Integration Tests");
  console.log(`  Target: ${BASE}`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  // ──── Validation Tests (fast, run first) ────

  await test("Reject request with no image", async () => {
    const formData = new FormData();
    formData.append("formData", JSON.stringify(MOCK_FORM_DATA));
    formData.append("lng", "en");

    const res = await api("POST", "/api/analyze", formData);
    assert(res.status === 400, `Expected 400, got ${res.status}`);
    assert(res.json?.error?.includes("image"), `Expected image error, got: ${res.json?.error}`);
  });

  await test("Reject request with invalid image format", async () => {
    const formData = new FormData();
    const fakeBlob = new Blob([Buffer.from("not an image at all")], { type: "image/jpeg" });
    formData.append("image", fakeBlob, "fake.jpg");
    formData.append("formData", JSON.stringify(MOCK_FORM_DATA));
    formData.append("lng", "en");

    const res = await api("POST", "/api/analyze", formData);
    assert(res.status === 400, `Expected 400, got ${res.status}`);
    assert(res.json?.error?.includes("Invalid image"), `Expected format error, got: ${res.json?.error}`);
  });

  await test("Handle malformed formData JSON gracefully", async () => {
    const formData = new FormData();
    const jpegHex = "ffd8ffe000104a46494600010100000100010000ffdb004300080606070605080707070909080a0c140d0c0b0b0c1912130f141d1a1f1e1d1a1c1c20242e2720222c231c1c2837292c30313434341f27393d38323c2e333432ffc0000b0800010001010111" + "00ffc4001f0000010501010101010100000000000000000102030405060708090a0bffc4001f010003010101010101010100000000000001020304050607" + "08090a0bffda00080101000003f00037b40002db40003ffd9";
    const jpegBuf = Buffer.from(jpegHex, "hex");
    const blob = new Blob([jpegBuf], { type: "image/jpeg" });
    formData.append("image", blob, "test.jpg");
    formData.append("formData", "{invalid json{{{");
    formData.append("lng", "en");

    const res = await api("POST", "/api/analyze", formData);
    assert(res.status === 400, `Expected 400, got ${res.status}`);
  });

  // ──── Full Analysis (calls OpenAI — ~15s) ────

  await test("Submit full analysis (questionnaire + image)", async () => {
    const { buffer: imageBuffer, mime } = getTestImage();
    const blob = new Blob([imageBuffer], { type: mime });

    const formData = new FormData();
    formData.append("image", blob, "skin-photo.jpg");
    formData.append("formData", JSON.stringify(MOCK_FORM_DATA));
    formData.append("chatIDs", JSON.stringify([]));
    formData.append("botIndex", "1");
    formData.append("accountIDs", JSON.stringify([]));
    formData.append("contactIDs", JSON.stringify([]));
    formData.append("lng", "en");

    log("   ", "Sending analysis request (this may take 10-20s)...");
    const start = Date.now();
    const res = await api("POST", "/api/analyze", formData);
    const elapsed = ((Date.now() - start) / 1000).toFixed(1);

    assert(res.ok, `Analysis failed (${res.status}): ${res.json?.error || res.text}`);
    assert(res.json?.id, "No analysis ID in response");
    assert(res.json?.results, "No results in response");
    assert(res.json?.steps, "No steps tracker in response");

    analysisId = res.json.id;
    analysisResult = res.json;
    log("   ", `Completed in ${elapsed}s — ID: ${analysisId}, Score: ${res.json.results.overall_score}`);
  });

  // ──── Validate Step Tracker ────

  await test("Step tracker reports per-step status", async () => {
    assert(analysisResult, "No analysis result (previous test failed)");
    const { steps } = analysisResult;

    assert(steps, "steps object missing");
    assert(steps.ai_analysis?.status === "success", `AI analysis step: ${steps.ai_analysis?.status}`);

    // Cloudinary should be success (or failed with base64 fallback)
    assert(
      steps.cloudinary?.status === "success" || steps.cloudinary?.status === "failed",
      `Unexpected cloudinary status: ${steps.cloudinary?.status}`
    );

    // Database should be success
    assert(steps.database?.status === "success", `Database step: ${steps.database?.status} — ${steps.database?.error}`);

    // Telegram should be skipped (no chatIDs)
    assert(steps.telegram?.status === "skipped", `Telegram step: ${steps.telegram?.status}`);

    // Elasticsearch should be skipped (no accountIDs/contactIDs)
    assert(steps.elasticsearch?.status === "skipped", `Elasticsearch step: ${steps.elasticsearch?.status}`);

    log("   ", `Steps: ${Object.entries(steps).map(([k, v]) => `${k}=${v.status}`).join(", ")}`);
  });

  // ──── Validate AI Results Structure ────

  await test("AI results have correct shape", async () => {
    assert(analysisResult, "No analysis result");
    const r = analysisResult.results;

    // Overall score
    assert(typeof r.overall_score === "number", `overall_score is ${typeof r.overall_score}`);
    assert(r.overall_score >= 0 && r.overall_score <= 100, `overall_score out of range: ${r.overall_score}`);

    // Skin type
    const validTypes = ["oily", "dry", "combination", "normal", "sensitive"];
    assert(validTypes.includes(r.skin_type), `Invalid skin_type: ${r.skin_type}`);

    // Summary
    assert(typeof r.summary === "string" && r.summary.length > 10, "Summary too short or missing");

    log("   ", `Score: ${r.overall_score}, Type: ${r.skin_type}, Summary: ${r.summary.substring(0, 60)}...`);
  });

  await test("AI returns all 12 metrics with valid scores", async () => {
    assert(analysisResult, "No analysis result");
    const metrics = analysisResult.results.metrics;

    assert(Array.isArray(metrics), "metrics is not an array");
    assert(metrics.length >= 12, `Expected 12 metrics, got ${metrics.length}`);

    const validStatuses = ["good", "normal", "needs_attention"];
    const metricIds = new Set();

    for (const m of metrics) {
      assert(m.id, "Metric missing id");
      assert(typeof m.score === "number", `Metric ${m.id} score is ${typeof m.score}`);
      assert(m.score >= 0 && m.score <= 100, `Metric ${m.id} score out of range: ${m.score}`);
      assert(validStatuses.includes(m.status), `Metric ${m.id} invalid status: ${m.status}`);
      assert(typeof m.insight === "string" && m.insight.length > 0, `Metric ${m.id} missing insight`);
      metricIds.add(m.id);
    }

    // Check all expected metrics are present
    for (const expected of EXPECTED_METRICS) {
      assert(metricIds.has(expected), `Missing metric: ${expected}`);
    }

    const attentionCount = metrics.filter((m) => m.status === "needs_attention").length;
    const goodCount = metrics.filter((m) => m.status === "good").length;
    log("   ", `12 metrics validated — ${goodCount} good, ${metrics.length - goodCount - attentionCount} normal, ${attentionCount} needs attention`);
  });

  await test("AI returns product recommendations", async () => {
    assert(analysisResult, "No analysis result");
    const recs = analysisResult.results.recommendations;

    assert(Array.isArray(recs), "recommendations is not an array");
    assert(recs.length >= 1, "No recommendations returned");

    for (const rec of recs) {
      assert(rec.product_id, "Recommendation missing product_id");
      assert(typeof rec.priority === "number", `Recommendation priority is ${typeof rec.priority}`);
      assert(typeof rec.reason === "string" && rec.reason.length > 0, "Recommendation missing reason");
    }

    log("   ", `${recs.length} recommendations: ${recs.map((r) => r.product_id).join(", ")}`);
  });

  await test("AI returns structured insights", async () => {
    assert(analysisResult, "No analysis result");
    const insights = analysisResult.results.insights;

    assert(Array.isArray(insights), "insights is not an array");
    assert(insights.length >= 1, "No insights returned");

    const validCategories = ["strengths", "concerns", "lifestyle", "goals"];
    for (const i of insights) {
      assert(validCategories.includes(i.category), `Invalid insight category: ${i.category}`);
      assert(typeof i.title === "string", "Insight missing title");
      assert(Array.isArray(i.points) && i.points.length > 0, "Insight missing points");
    }

    log("   ", `${insights.length} insight categories: ${insights.map((i) => i.category).join(", ")}`);
  });

  await test("Product enrichment returns full product data", async () => {
    assert(analysisResult, "No analysis result");
    const enriched = analysisResult.results.enriched_products;

    assert(Array.isArray(enriched), "enriched_products is not an array");

    if (enriched.length > 0) {
      const first = enriched[0];
      assert(first.id, "Enriched product missing id");
      assert(first.name, "Enriched product missing name");
      assert(first.sku, "Enriched product missing sku");
      assert(first.category, "Enriched product missing category");
      assert(first.reason, "Enriched product missing reason (from AI)");
      assert(typeof first.priority === "number", "Enriched product missing priority");
      log("   ", `${enriched.length} enriched products, first: "${first.name}" (${first.sku})`);
    } else {
      log("   ", "No enriched products (recommendations may not match active products)");
    }
  });

  // ──── Results Retrieval ────

  await test("Retrieve analysis results by ID", async () => {
    assert(analysisId, "No analysis ID (analysis test failed)");

    const res = await api("GET", `/api/results?id=${analysisId}`);
    assert(res.ok, `Results fetch failed: ${res.text}`);
    assert(res.json?.data, "No data object in response");

    const data = res.json.data;
    assert(data.id === analysisId, "ID mismatch");
    assert(data.results, "No results in retrieved data");
    assert(data.results.overall_score === analysisResult.results.overall_score, "Score mismatch between submit and retrieve");
    assert(data.formData, "No formData in retrieved data");
    assert(data.formData.name === "Test", "FormData name mismatch");
    assert(data.language === "en", `Language mismatch: ${data.language}`);
    assert(data.createdAt, "Missing createdAt timestamp");

    log("   ", `Retrieved OK — created at ${data.createdAt}`);
  });

  await test("Retrieved results have enriched products", async () => {
    assert(analysisId, "No analysis ID");

    const res = await api("GET", `/api/results?id=${analysisId}`);
    const enriched = res.json?.data?.results?.enriched_products;

    assert(Array.isArray(enriched), "enriched_products missing from retrieved results");
    log("   ", `${enriched.length} enriched products in retrieved results`);
  });

  await test("Cloudinary image URL stored in database", async () => {
    assert(analysisId, "No analysis ID");
    assert(analysisResult?.steps?.cloudinary?.status === "success", "Cloudinary step didn't succeed");

    const res = await api("GET", `/api/results?id=${analysisId}`);
    const imageUrl = res.json?.data?.imageUrl;

    assert(imageUrl, "No imageUrl in retrieved data");
    assert(imageUrl.includes("cloudinary"), `imageUrl is not Cloudinary: ${imageUrl}`);
    log("   ", `Stored URL: ${imageUrl.substring(0, 60)}...`);
  });

  // ──── Non-existent & Demo ────

  await test("Return 404 for non-existent analysis ID", async () => {
    const res = await api("GET", "/api/results?id=nonexistent_id_12345");
    assert(res.status === 404, `Expected 404, got ${res.status}`);
  });

  await test("Return 400 for missing analysis ID", async () => {
    const res = await api("GET", "/api/results");
    assert(res.status === 400, `Expected 400, got ${res.status}`);
  });

  await test("Demo results endpoint works", async () => {
    const res = await api("GET", "/api/results?id=demo");
    assert(res.ok, `Demo results failed: ${res.text}`);
    assert(res.json?.data?.results, "Demo results missing data");
    assert(res.json.data.results.overall_score, "Demo missing overall_score");
    log("   ", `Demo score: ${res.json.data.results.overall_score}`);
  });

  // ──── Response duration ────

  await test("Analysis response includes duration", async () => {
    assert(analysisResult, "No analysis result");
    assert(typeof analysisResult.duration === "number", `duration is ${typeof analysisResult.duration}`);
    assert(analysisResult.duration > 0, "duration is 0 or negative");
    log("   ", `Server-reported duration: ${(analysisResult.duration / 1000).toFixed(1)}s`);
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
