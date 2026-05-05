import getOpenAI from "./openai";

const LANGUAGE_NAMES = {
  es: "Spanish",
  fr: "French",
  de: "German",
  it: "Italian",
  tr: "Turkish",
  in: "Indonesian",
  pt: "Portuguese",
};

/**
 * Translate product content from English to a target language using OpenAI.
 * Returns the translated content in the same structure as the input.
 */
export async function translateProductContent(englishContent, targetLanguage) {
  const langName = LANGUAGE_NAMES[targetLanguage];
  if (!langName) {
    throw new Error(`Unsupported translation language: ${targetLanguage}`);
  }

  const openai = getOpenAI();

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.3,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: `You are a professional translator specializing in skincare and beauty products. Translate the following product content from English to ${langName}.

Rules:
- Preserve scientific/chemical ingredient names that are universally recognized (e.g., "Niacinamide", "Hyaluronic Acid", "Retinol", "CoQ10")
- Translate the "role" descriptions of ingredients naturally
- Keep the exact same JSON structure as the input
- "benefits" is an array of strings — translate each string
- "key_ingredients" is an array of objects with "name" and "role" — translate both fields (but keep universal scientific names)
- "how_to_use" is a single string — translate it
- "cautions" is an array of strings — translate each string
- "name" is the product display name — translate it naturally
- Output valid JSON only, no markdown`,
      },
      {
        role: "user",
        content: JSON.stringify(englishContent),
      },
    ],
  });

  const content = completion.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("AI returned empty translation response");
  }

  const parsed = JSON.parse(content);
  return {
    name: parsed.name || englishContent.name,
    benefits: parsed.benefits || englishContent.benefits,
    key_ingredients: parsed.key_ingredients || englishContent.key_ingredients,
    how_to_use: parsed.how_to_use || englishContent.how_to_use,
    cautions: parsed.cautions || englishContent.cautions,
  };
}
