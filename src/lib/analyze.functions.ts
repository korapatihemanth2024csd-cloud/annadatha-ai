import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { AIResult, ProviderType } from "./store";

const Input = z.object({
  images: z.array(z.string().startsWith("data:image/")).min(1).max(3),
  details: z.record(z.string()),
  provider: z.enum(["auto", "gemini", "openrouter"]).optional().default("auto"),
  lang: z.enum(["en", "ta", "hi", "te"]).optional().default("en"),
});

const DEFAULT_GEMINI_MODEL = "gemini-2.5-flash";
const DEFAULT_OPENROUTER_MODEL = "google/gemma-3-27b-it:free";

const BANNED_MODELS = new Set([
  "gemini-1.0-pro-vision",
  "gemini-1.0-pro-vision-latest",
  "gemini-pro-vision",
]);

function buildPrompt(d: Record<string, string>, lang: string = "en"): string {
  const langInstructions: Record<string, string> = {
    ta: "Provide all farmer-facing text, explanations, recommendations, disease descriptions, severity explanations, risk explanations, and advice in Tamil. Keep the JSON field names exactly unchanged.",
    hi: "Provide all farmer-facing text, explanations, recommendations, disease descriptions, severity explanations, risk explanations, and advice in Hindi. Keep the JSON field names exactly unchanged.",
    te: "Provide all farmer-facing text, explanations, recommendations, disease descriptions, severity explanations, risk explanations, and advice in Telugu. Keep the JSON field names exactly unchanged.",
    en: "Provide all farmer-facing text in English.",
  };
  const langInstruction = langInstructions[lang] ?? langInstructions["en"];

  const detailText = `
Farmer Name: ${d["Farmer name"] ?? "Not provided"}
Location: ${d["Location"] ?? "Not provided"}
District: ${d["District"] ?? "Not provided"}
State: ${d["State"] ?? "Not provided"}
Farm Size: ${d["Farm size"] ?? "Not provided"} acres
Contact: ${d["Contact"] ?? "Not provided"}

Crop Type: ${d["Crop type"] ?? "Not provided"}
Variety: ${d["Variety"] ?? "Not provided"}
Growth Stage: ${d["Growth stage"] ?? "Not provided"}
Cultivated Area: ${d["Cultivated area"] ?? "Not provided"} acres
Planting Date: ${d["Planting date"] ?? "Not provided"}

Soil Type: ${d["Soil type"] ?? "Not provided"}
Soil pH: ${d["Soil pH"] ?? "Not provided"}
Organic Matter: ${d["Organic matter"] ?? "Not provided"}%
Nitrogen (N): ${d["Nitrogen"] ?? "Not provided"} kg/ha
Phosphorus (P): ${d["Phosphorus"] ?? "Not provided"} kg/ha
Potassium (K): ${d["Potassium"] ?? "Not provided"} kg/ha
Soil Moisture: ${d["Soil moisture"] ?? "Not provided"}%

Fertilizer Type: ${d["Fertilizer"] ?? "Not provided"}
Fertilizer Quantity: ${d["Fertilizer qty"] ?? "Not provided"} kg
Irrigation Method: ${d["Irrigation type"] ?? "Not provided"}
Irrigation Frequency: ${d["Irrigation frequency"] ?? "Not provided"}
Irrigation Amount: ${d["Irrigation amount"] ?? "Not provided"} liters/day
Pesticide Usage: ${d["Pesticide usage"] ?? "Not provided"}

Average Temperature: ${d["Temperature"] ?? "Not provided"} °C
Average Humidity: ${d["Humidity"] ?? "Not provided"}%
Rainfall Last 7 Days: ${d["Rainfall"] ?? "Not provided"} mm
Current Weather Condition: ${d["Weather"] ?? "Not provided"}
`.trim();

  return `You are Annadatha AI, an AI-powered smart agriculture assistant.

Analyze the uploaded crop image together with the farmer, crop, soil, agricultural input, and weather information below.

Language instruction:
${langInstruction}

Identify the crop if possible.
Detect possible diseases or pest problems visible in the image.
Estimate disease severity and affected area.
Estimate crop health.
Estimate potential yield and expected yield using the supplied crop, farm area, growth stage, soil, weather, irrigation and fertilizer information.
Assess disease risk, weather risk and yield risk.
Provide practical recommendations that a farmer can understand.
Do not claim that an AI image analysis is a confirmed agricultural diagnosis.
If the image is unclear or insufficient, report low confidence.
Do not invent missing values.

${detailText}

Return ONLY valid JSON (no markdown fences, no extra text) matching EXACTLY this structure:
{
  "crop_analysis": {
    "crop_name": "",
    "crop_confidence": 0,
    "growth_stage": "",
    "health_score": 0,
    "health_status": "",
    "summary": ""
  },
  "disease_detection": {
    "disease_name": "",
    "disease_confidence": 0,
    "disease_status": "",
    "description": ""
  },
  "severity_analysis": {
    "severity_level": "",
    "affected_area_percentage": 0,
    "healthy_area_percentage": 0,
    "severity_explanation": ""
  },
  "yield_prediction": {
    "expected_yield": 0,
    "potential_yield": 0,
    "yield_unit": "",
    "estimated_loss": 0,
    "loss_percentage": 0,
    "yield_explanation": ""
  },
  "risk_assessment": {
    "disease_risk": "",
    "yield_risk": "",
    "weather_risk": "",
    "overall_risk": ""
  },
  "recommendations": {
    "immediate_actions": [],
    "fertilizer_recommendation": "",
    "irrigation_recommendation": "",
    "disease_management": "",
    "preventive_measures": []
  },
  "farmer_advice": {
    "short_term": [],
    "long_term": [],
    "expert_verification_required": false
  }
}

Rules:
- crop_confidence, disease_confidence, health_score: integers 0-100
- affected_area_percentage + healthy_area_percentage must equal 100
- severity_level: "Low" | "Moderate" | "High" | "Critical"
- health_status: "Healthy" | "Needs Attention" | "Critical"
- disease_risk, yield_risk, weather_risk, overall_risk: "Low" | "Moderate" | "High" | "Critical"
- disease_status: "No Disease" | "Suspected" | "Confirmed Likely" | "Severe Infection"
- immediate_actions, preventive_measures, short_term, long_term: arrays of strings (at least 2 items each)
- expert_verification_required: boolean
- yield_unit: e.g. "tons/acre" or "quintals/acre"
Return ONLY the JSON object.`;
}

export function validateAIResponse(parsed: any): AIResult {
  if (!parsed || typeof parsed !== "object") {
    throw new Error("Invalid AI response structure");
  }

  const ca = parsed.crop_analysis;
  const dd = parsed.disease_detection;
  const sa = parsed.severity_analysis;
  const yp = parsed.yield_prediction;
  const ra = parsed.risk_assessment;
  const rec = parsed.recommendations;
  const fa = parsed.farmer_advice;

  if (!ca || !dd || !sa || !yp || !ra || !rec || !fa) {
    throw new Error("Missing required sections in AI JSON response");
  }

  const affectedArea = Math.min(100, Math.max(0, Number(sa.affected_area_percentage) || 0));

  return {
    crop_analysis: {
      crop_name: String(ca.crop_name || "Unknown Crop"),
      crop_confidence: Math.min(100, Math.max(0, Math.round(Number(ca.crop_confidence) || 80))),
      growth_stage: String(ca.growth_stage || "Vegetative"),
      health_score: Math.min(100, Math.max(0, Math.round(Number(ca.health_score) || 70))),
      health_status: ["Healthy", "Needs Attention", "Critical"].includes(ca.health_status)
        ? ca.health_status
        : "Needs Attention",
      summary: String(ca.summary || "Crop analysis completed."),
    },
    disease_detection: {
      disease_name: String(dd.disease_name || "Healthy / No Disease"),
      disease_confidence: Math.min(100, Math.max(0, Math.round(Number(dd.disease_confidence) || 80))),
      disease_status: ["No Disease", "Suspected", "Confirmed Likely", "Severe Infection"].includes(dd.disease_status)
        ? dd.disease_status
        : "Suspected",
      description: String(dd.description || "No major disease symptoms observed."),
    },
    severity_analysis: {
      severity_level: ["Low", "Moderate", "High", "Critical"].includes(sa.severity_level)
        ? sa.severity_level
        : "Moderate",
      affected_area_percentage: affectedArea,
      healthy_area_percentage: 100 - affectedArea,
      severity_explanation: String(sa.severity_explanation || "Analysis of crop surface."),
    },
    yield_prediction: {
      expected_yield: Number(yp.expected_yield) || 0,
      potential_yield: Number(yp.potential_yield) || 0,
      yield_unit: String(yp.yield_unit || "tons/acre"),
      estimated_loss: Number(yp.estimated_loss) || 0,
      loss_percentage: Number(yp.loss_percentage) || 0,
      yield_explanation: String(yp.yield_explanation || "Yield estimation based on crop parameters."),
    },
    risk_assessment: {
      disease_risk: ["Low", "Moderate", "High", "Critical"].includes(ra.disease_risk) ? ra.disease_risk : "Moderate",
      yield_risk: ["Low", "Moderate", "High", "Critical"].includes(ra.yield_risk) ? ra.yield_risk : "Moderate",
      weather_risk: ["Low", "Moderate", "High", "Critical"].includes(ra.weather_risk) ? ra.weather_risk : "Low",
      overall_risk: ["Low", "Moderate", "High", "Critical"].includes(ra.overall_risk) ? ra.overall_risk : "Moderate",
    },
    recommendations: {
      immediate_actions: Array.isArray(rec.immediate_actions) && rec.immediate_actions.length > 0
        ? rec.immediate_actions.map(String)
        : ["Monitor affected plant area closely.", "Ensure balanced irrigation."],
      fertilizer_recommendation: String(rec.fertilizer_recommendation || "Apply balanced NPK fertilizer based on soil nutrient levels."),
      irrigation_recommendation: String(rec.irrigation_recommendation || "Maintain consistent soil moisture levels."),
      disease_management: String(rec.disease_management || "Apply targeted organic or chemical treatments as needed."),
      preventive_measures: Array.isArray(rec.preventive_measures) && rec.preventive_measures.length > 0
        ? rec.preventive_measures.map(String)
        : ["Rotate crops seasonally.", "Maintain proper plant spacing."],
    },
    farmer_advice: {
      short_term: Array.isArray(fa.short_term) && fa.short_term.length > 0
        ? fa.short_term.map(String)
        : ["Check field daily for symptom progression.", "Avoid excess overhead watering."],
      long_term: Array.isArray(fa.long_term) && fa.long_term.length > 0
        ? fa.long_term.map(String)
        : ["Perform annual soil test.", "Use disease-resistant crop varieties."],
      expert_verification_required: Boolean(fa.expert_verification_required ?? true),
    },
  };
}

export function getDemoAnalysis(): AIResult {
  return {
    provider: "Demo Mode",
    crop_analysis: {
      crop_name: "Tomato",
      crop_confidence: 94,
      growth_stage: "Fruiting",
      health_score: 68,
      health_status: "Needs Attention",
      summary: "Tomato crop showing early signs of fungal infection (Early Blight) on foliage. Overall crop vigour is moderate with high potential recovery if treated promptly.",
    },
    disease_detection: {
      disease_name: "Early Blight",
      disease_confidence: 91,
      disease_status: "Confirmed Likely",
      description: "Early Blight caused by Alternaria solani. Characterized by dark brown concentric rings (target spots) on lower leaves, leading to yellowing and premature leaf drop.",
    },
    severity_analysis: {
      severity_level: "Moderate",
      affected_area_percentage: 32,
      healthy_area_percentage: 68,
      severity_explanation: "Moderate infection affecting lower and middle canopy (32% leaf area). Upper canopy and fruits remain largely uninfected.",
    },
    yield_prediction: {
      expected_yield: 8.2,
      potential_yield: 9.5,
      yield_unit: "tons/acre",
      estimated_loss: 1.3,
      loss_percentage: 13.7,
      yield_explanation: "Without intervention, foliage loss will reduce fruit sizing. Timely treatment can recover up to 1.0 ton/acre of potential yield.",
    },
    risk_assessment: {
      disease_risk: "Moderate",
      yield_risk: "Moderate",
      weather_risk: "High",
      overall_risk: "Moderate",
    },
    recommendations: {
      immediate_actions: [
        "Prune and safely discard heavily infected lower leaves showing concentric brown spots.",
        "Apply copper oxychloride (3g/liter) or Mancozeb (2g/liter) spray during low humidity hours.",
        "Avoid overhead irrigation to prevent spore dispersal across foliage.",
      ],
      fertilizer_recommendation: "Apply Potassium Sulfate (SOP) at 25 kg/acre to bolster plant cell wall resistance. Temporarily reduce high-nitrogen fertilizers.",
      irrigation_recommendation: "Switch to drip irrigation. Maintain consistent soil moisture (60-70%) without waterlogging.",
      disease_management: "Fungicidal foliar spray every 7-10 days until new foliage appears clear. Rotate active ingredients to prevent resistance.",
      preventive_measures: [
        "Implement crop rotation with non-solanaceous crops like maize or pulse crops for the next season.",
        "Maintain proper plant spacing (45-60 cm) for optimum air circulation.",
        "Apply organic mulch around plant bases to prevent soil splash onto foliage.",
      ],
    },
    farmer_advice: {
      short_term: [
        "Inspect field daily in early morning for new lesion spots on middle leaves.",
        "Ensure spray coverage reaches both upper and lower surfaces of leaves.",
      ],
      long_term: [
        "Use certified disease-resistant tomato varieties for upcoming planting seasons.",
        "Incorporate Trichoderma viride bio-fungicide into soil prior to next planting.",
      ],
      expert_verification_required: true,
    },
  };
}

function getEnv(key: string): string | undefined {
  if (typeof process !== "undefined" && process.env) {
    return process.env[key];
  }
  return undefined;
}

export async function analyzeWithGemini(
  images: string[],
  details: Record<string, string>,
  lang: string = "en"
): Promise<AIResult> {
  const geminiKey = getEnv("GEMINI_API_KEY");
  if (!geminiKey || geminiKey === "your_gemini_api_key" || geminiKey === "YOUR_GEMINI_API_KEY_HERE") {
    console.error("[Gemini Error] GEMINI_API_KEY is not configured in environment variables.");
    throw new Error("Gemini API key unavailable");
  }

  const modelName = (getEnv("GEMINI_MODEL") ?? DEFAULT_GEMINI_MODEL).trim();
  if (BANNED_MODELS.has(modelName)) {
    console.error(`[Gemini Error] Banned deprecated model configured: ${modelName}`);
    throw new Error(`Deprecated Gemini model: ${modelName}`);
  }

  const prompt = buildPrompt(details, lang);
  const firstImage = images[0]!;
  const mimeMatch = firstImage.match(/^data:(image\/[a-zA-Z+]+);base64,/);
  const mimeType = mimeMatch ? mimeMatch[1] : "image/jpeg";
  const imageData = firstImage.split(",")[1]!;

  const requestBody = {
    contents: [
      {
        role: "user",
        parts: [
          { text: prompt },
          { inlineData: { mimeType, data: imageData } },
        ],
      },
    ],
    generationConfig: {
      responseMimeType: "application/json",
    },
  };

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${geminiKey}`;

  const maxRetries = 2;
  const backoffDelays = [2000, 5000];

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      if (!res.ok) {
        const status = res.status;
        console.error(`[Gemini Error] Attempt ${attempt + 1} returned HTTP ${status}`);

        // Immediate failure for 400, 401, 403, 404 (no retries)
        const isTemporary = [503, 429, 500, 502, 504].includes(status);
        if (isTemporary && attempt < maxRetries) {
          await new Promise((r) => setTimeout(r, backoffDelays[attempt]));
          continue;
        }

        throw new Error(`Gemini HTTP failure status ${status}`);
      }

      const json = (await res.json()) as {
        candidates?: { content?: { parts?: { text?: string }[] } }[];
      };
      let text = json.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
      if (!text) {
        console.error(`[Gemini Error] Empty candidate content returned on attempt ${attempt + 1}`);
        throw new Error("Gemini returned empty text response");
      }

      text = text
        .replace(/^```json\s*/i, "")
        .replace(/^```\s*/i, "")
        .replace(/\s*```$/i, "")
        .trim();

      const parsed = JSON.parse(text);
      const validated = validateAIResponse(parsed);
      return { ...validated, provider: "Gemini AI" };
    } catch (err) {
      console.error(`[Gemini Error] Attempt ${attempt + 1} exception:`, err instanceof Error ? err.message : String(err));
      const isNetworkErr = err instanceof TypeError || (err instanceof Error && err.message.includes("fetch"));
      if (isNetworkErr && attempt < maxRetries) {
        await new Promise((r) => setTimeout(r, backoffDelays[attempt]));
        continue;
      }
      throw err;
    }
  }

  throw new Error("Gemini failed after retries");
}

export async function analyzeWithOpenRouter(
  images: string[],
  details: Record<string, string>,
  lang: string = "en"
): Promise<AIResult> {
  const openrouterKey = getEnv("OPENROUTER_API_KEY");
  if (
    !openrouterKey ||
    openrouterKey === "your_openrouter_api_key" ||
    openrouterKey === "YOUR_OPENROUTER_API_KEY_HERE"
  ) {
    console.error("[OpenRouter Error] OPENROUTER_API_KEY is not configured in environment variables.");
    throw new Error("OpenRouter API key unavailable");
  }

  const modelName = (getEnv("OPENROUTER_MODEL") ?? DEFAULT_OPENROUTER_MODEL).trim();
  const prompt = buildPrompt(details, lang);

  // Note: response_format is NOT included — most free models don't support it.
  // The prompt explicitly asks for JSON-only output.
  const requestBody = {
    model: modelName,
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: prompt },
          { type: "image_url", image_url: { url: images[0] } },
        ],
      },
    ],
  };

  const maxRetries = 2;
  const backoffDelays = [2000, 5000];

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${openrouterKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://annadatha.ai",
          "X-Title": "Annadatha AI",
        },
        body: JSON.stringify(requestBody),
      });

      if (!res.ok) {
        const status = res.status;
        const bodyText = await res.text().catch(() => "");
        console.error(`[OpenRouter Error] Attempt ${attempt + 1} HTTP ${status}:`, bodyText);

        const isTemporary = [503, 429, 500, 502, 504].includes(status);
        if (isTemporary && attempt < maxRetries) {
          await new Promise((r) => setTimeout(r, backoffDelays[attempt]));
          continue;
        }
        throw new Error(`OpenRouter HTTP failure status ${status}`);
      }

      const json = (await res.json()) as {
        choices?: { message?: { content?: string | { text?: string }[] } }[];
        error?: { message?: string };
      };

      // Surface API-level errors (e.g. model not found, credits exhausted)
      if (json.error?.message) {
        console.error("[OpenRouter Error] API error:", json.error.message);
        throw new Error(`OpenRouter API error: ${json.error.message}`);
      }

      let text = json.choices?.[0]?.message?.content ?? "";
      if (Array.isArray(text)) {
        text = text.map((part) => (part as { text?: string }).text || "").join("");
      }

      if (!text) {
        console.error("[OpenRouter Error] Empty response content returned");
        throw new Error("OpenRouter returned empty text");
      }

      text = text
        .replace(/^```json\s*/i, "")
        .replace(/^```\s*/i, "")
        .replace(/\s*```$/i, "")
        .trim();

      const parsed = JSON.parse(text);
      const validated = validateAIResponse(parsed);
      return { ...validated, provider: "OpenRouter" };
    } catch (err) {
      console.error(`[OpenRouter Error] Attempt ${attempt + 1} exception:`, err instanceof Error ? err.message : String(err));
      const isNetworkErr = err instanceof TypeError || (err instanceof Error && err.message.includes("fetch"));
      if (isNetworkErr && attempt < maxRetries) {
        await new Promise((r) => setTimeout(r, backoffDelays[attempt]));
        continue;
      }
      throw err;
    }
  }

  throw new Error("OpenRouter failed after retries");
}

export const analyzeCrop = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => Input.parse(d))
  .handler(async ({ data }) => {
    const { images, details, provider = "auto", lang = "en" } = data;

    if (provider === "gemini") {
      try {
        const result = await analyzeWithGemini(images, details, lang);
        return { success: true, provider: "Gemini AI" as ProviderType, result };
      } catch {
        return { success: false, message: "Gemini is temporarily unavailable.", canFallback: true };
      }
    }

    if (provider === "openrouter") {
      try {
        const result = await analyzeWithOpenRouter(images, details, lang);
        return { success: true, provider: "OpenRouter" as ProviderType, result };
      } catch {
        return { success: false, message: "⚠️ AI services are temporarily unavailable.", canFallback: false };
      }
    }

    // Auto mode: Gemini -> Retries -> OpenRouter Fallback -> Safe error response
    try {
      const geminiResult = await analyzeWithGemini(images, details, lang);
      return { success: true, provider: "Gemini AI" as ProviderType, result: geminiResult };
    } catch {
      try {
        const openrouterResult = await analyzeWithOpenRouter(images, details, lang);
        return { success: true, provider: "OpenRouter" as ProviderType, result: openrouterResult };
      } catch {
        return { success: false, message: "⚠️ AI services are temporarily unavailable." };
      }
    }
  });
