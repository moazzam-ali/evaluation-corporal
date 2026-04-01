import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
import getOpenAI from "@/lib/openai";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { query } from "@/lib/db";
import { getPromptForLanguage } from "@/lib/prompts";
import { sendAnalysisToTelegram } from "@/lib/telegram";
import { readFile } from "fs/promises";
import { join } from "path";

function extractJSON(content) {
  // 1. Try direct parse
  try {
    return JSON.parse(content);
  } catch {}

  // 2. Try extracting from markdown code blocks
  const codeBlockMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) {
    try {
      return JSON.parse(codeBlockMatch[1].trim());
    } catch {}
  }

  // 3. Try finding the first { ... } or [ ... ] block
  const braceMatch = content.match(/\{[\s\S]*\}/);
  if (braceMatch) {
    try {
      return JSON.parse(braceMatch[0]);
    } catch {}
  }

  return null;
}

export async function POST(request) {
  try {
    const formDataReq = await request.formData();
    const image = formDataReq.get("image");
    const formData = JSON.parse(formDataReq.get("formData"));
    const chatIDs = JSON.parse(formDataReq.get("chatIDs") || "[]");
    const botIndex = formDataReq.get("botIndex") || "1";
    const accountIDs = JSON.parse(formDataReq.get("accountIDs") || "[]");
    const contactIDs = JSON.parse(formDataReq.get("contactIDs") || "[]");
    const lng = formDataReq.get("lng") || "en";

    if (!image) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }

    // 1. Generate unique ID
    const id = nanoid(22);

    // 2. Upload image to Cloudinary (optional — falls back to base64)
    const imageBuffer = Buffer.from(await image.arrayBuffer());
    let imageUrl;
    try {
      const cloudResult = await uploadToCloudinary(imageBuffer, `skin-${id}.jpg`);
      imageUrl = cloudResult.url;
    } catch (err) {
      console.error("Cloudinary upload skipped:", err.message);
      imageUrl = `data:image/jpeg;base64,${imageBuffer.toString("base64")}`;
    }

    // 3. Call OpenAI Vision API
    const prompt = getPromptForLanguage(lng);
    const completion = await getOpenAI().chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: prompt,
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Analyze this facial skin photo. The user is ${formData.age} years old and reports their skin type as "${formData.skin_type}". Provide the analysis in ${lng === "es" ? "Spanish" : "English"}.`,
            },
            {
              type: "image_url",
              image_url: {
                url: imageUrl,
                detail: "high",
              },
            },
          ],
        },
      ],
      max_tokens: 2000,
      temperature: 0.3,
      response_format: { type: "json_object" },
    });

    const content = completion.choices[0].message.content;
    const results = extractJSON(content);

    if (!results) {
      console.error("Raw AI response:", content);
      return NextResponse.json(
        { error: "AI returned an invalid response. Please try again." },
        { status: 502 }
      );
    }

    // 4. Store in PostgreSQL (optional — skip if no DATABASE_URL)
    if (process.env.DATABASE_URL) {
      try {
        await query(
          "INSERT INTO analyses (id, form_data, results, image_url, language, created_at) VALUES ($1, $2, $3, $4, $5, NOW())",
          [id, JSON.stringify(formData), JSON.stringify(results), imageUrl.startsWith("data:") ? null : imageUrl, lng]
        );
      } catch (dbErr) {
        console.error("DB insert failed (continuing without storage):", dbErr.message);
      }
    }

    // 5. Send to Telegram (if chat IDs provided)
    let telegramStatus = { telegramStatus: "skipped" };
    if (chatIDs.length > 0) {
      try {
        const translationsPath = join(process.cwd(), "public", "backend-locales", lng, "translation.json");
        let translations;
        try {
          const file = await readFile(translationsPath, "utf-8");
          const translationData = JSON.parse(file);
          translations = (key) => {
            const keys = key.split(".");
            let val = translationData;
            for (const k of keys) {
              val = val?.[k];
            }
            return val || key;
          };
        } catch {
          translations = (key) => key;
        }

        const baseUrl = request.headers.get("origin") || request.headers.get("host") || "";
        const resultsUrl = `${baseUrl.startsWith("http") ? baseUrl : `https://${baseUrl}`}/results/${id}`;

        telegramStatus = await sendAnalysisToTelegram({
          chatIDs,
          botIndex: parseInt(botIndex),
          analysisData: { formData, results },
          resultsUrl,
          translations,
        });
      } catch (err) {
        console.error("Telegram send failed:", err.message);
        telegramStatus = { telegramStatus: "failed", error: err.message };
      }
    }

    return NextResponse.json({
      id,
      status: "success",
      results,
      ...telegramStatus,
    });
  } catch (error) {
    console.error("Analysis error:", error);
    return NextResponse.json(
      { error: error.message || "Analysis failed" },
      { status: 500 }
    );
  }
}
