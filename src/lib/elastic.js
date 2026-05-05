import { Client } from "@elastic/elasticsearch";

const ELASTIC_SERVER = process.env.ELASTIC_SERVER;
const ELASTIC_USER = process.env.ELASTIC_USER;
const ELASTIC_PASSWORD = process.env.ELASTIC_PASSWORD;
const ELASTIC_ENGINE = process.env.ELASTIC_ENGINE;

let _client;

function getElasticClient() {
  if (!_client && ELASTIC_SERVER) {
    _client = new Client({
      node: ELASTIC_SERVER,
      auth: {
        username: ELASTIC_USER,
        password: ELASTIC_PASSWORD,
      },
    });
  }
  return _client;
}

/**
 * Index documents in Elastic App Search.
 * Creates one document per unique accountID/contactID pair.
 */
export async function indexDocumentsInAppSearch(documents) {
  if (!ELASTIC_SERVER || !ELASTIC_ENGINE) {
    console.warn("[elastic] Elasticsearch not configured, skipping indexing");
    return [];
  }

  const appSearchUrl = `${ELASTIC_SERVER}/api/as/v1/engines/${ELASTIC_ENGINE}/documents`;
  const auth = Buffer.from(`${ELASTIC_USER}:${ELASTIC_PASSWORD}`).toString("base64");

  try {
    const response = await fetch(appSearchUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${auth}`,
      },
      body: JSON.stringify(documents),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`App Search API error: ${JSON.stringify(errorData)}`);
    }

    const result = await response.json();
    console.log("[elastic] Successfully indexed", result.length, "documents");
    return result;
  } catch (error) {
    console.error("[elastic] Error indexing documents:", error.message);
    throw error;
  }
}

/**
 * Build Elastic documents from analysis data.
 * One document per accountID/contactID pair (same as nutritional project).
 */
export function buildElasticDocuments({
  formData,
  results,
  accountIDs,
  contactIDs,
  language,
  analysisId,
  answersText,
}) {
  const now = new Date();
  const uniqueAccountIDs = [...new Set(accountIDs.filter((id) => id && id.toString().trim() !== ""))];
  const uniqueContactIDs = [...new Set(contactIDs.filter((id) => id && id.toString().trim() !== ""))];

  const maxPairs = Math.max(uniqueAccountIDs.length, uniqueContactIDs.length, 1);
  const documents = [];

  for (let i = 0; i < maxPairs; i++) {
    const accountId = uniqueAccountIDs[i] || uniqueAccountIDs[0] || "";
    const contactId = uniqueContactIDs[i] || uniqueContactIDs[0] || "";

    documents.push({
      email: formData.email || "",
      firstname: formData.name || "",
      lastname: formData.surname || "",
      phone: formData.phone || "",
      account_id: accountId.toString(),
      contact_id: contactId.toString(),
      language: language || "en",
      typeform: "Beauty & Glow AI Analysis",
      created_timestamp: Math.floor(now.getTime() / 1000),
      created_month: now.toISOString().slice(0, 7).replace("-", ""),
      answers: answersText,
    });
  }

  return documents;
}

export { getElasticClient };
