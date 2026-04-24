import axios from "axios";

const GROQ_BASE_URL = "https://api.groq.com/openai/v1";
const DEFAULT_MODEL = process.env.GROQ_MODEL || "llama-3.1-8b-instant";

const extractJsonObject = (text) => {
  if (typeof text !== "string") {
    return null;
  }

  const trimmed = text.trim();
  if (!trimmed) {
    return null;
  }

  const fencedMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fencedMatch ? fencedMatch[1].trim() : trimmed;

  try {
    return JSON.parse(candidate);
  } catch {
    const start = candidate.indexOf("{");
    const end = candidate.lastIndexOf("}");
    if (start < 0 || end <= start) {
      return null;
    }

    try {
      return JSON.parse(candidate.slice(start, end + 1));
    } catch {
      return null;
    }
  }
};

const getGroqClient = () => {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return null;
  }

  return axios.create({
    baseURL: GROQ_BASE_URL,
    timeout: Number(process.env.GROQ_TIMEOUT_MS || 20000),
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
  });
};

export const generateSearchInsights = async ({ query, matches = [] }) => {
  const client = getGroqClient();
  if (!client) {
    return null;
  }

  const compactMatches = matches.slice(0, 5).map((item) => ({
    title: item?.title || "",
    location: item?.location || "",
    crime_type: item?.crime_type || "",
    summary: item?.case_summary || item?.description || "",
    similarity: Number(item?.similarity || 0),
  }));

  const prompt = `
You are assisting a police case management search experience.
Given a user query and matched cases, output strict JSON only with this shape:
{
  "refinedQuery": "string",
  "themes": ["string", "string"],
  "insights": ["string", "string"],
  "followUps": ["string", "string"]
}
Rules:
- Keep each list item short and actionable.
- themes max 5 items, insights max 4, followUps max 4.
- refinedQuery should be clearer than user query.
`;

  const completion = await client.post("/chat/completions", {
    model: DEFAULT_MODEL,
    temperature: 0.2,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: prompt },
      {
        role: "user",
        content: JSON.stringify({
          query,
          matches: compactMatches,
        }),
      },
    ],
  });

  const content = completion.data?.choices?.[0]?.message?.content || "";
  const parsed = extractJsonObject(content);

  if (!parsed || typeof parsed !== "object") {
    return null;
  }

  return {
    refinedQuery:
      typeof parsed.refinedQuery === "string" ? parsed.refinedQuery.trim() : "",
    themes: Array.isArray(parsed.themes) ? parsed.themes.filter((item) => typeof item === "string") : [],
    insights: Array.isArray(parsed.insights)
      ? parsed.insights.filter((item) => typeof item === "string")
      : [],
    followUps: Array.isArray(parsed.followUps)
      ? parsed.followUps.filter((item) => typeof item === "string")
      : [],
  };
};
