import OpenAI from "openai";
import { prisma } from "./prisma";

export type AIProvider = "openai" | "grok";

export interface AIClientConfig {
    client: OpenAI;
    model: string;
}

// In-memory cache for the resolved Groq model (resets on server restart)
let cachedGroqModel: string | null = null;

/**
 * Preferred Groq models in order of preference (most capable → most available).
 * Updated as Groq adds new models.
 */
const GROQ_PREFERRED_MODELS = [
    "llama-3.3-70b-specdec",
    "llama-3.1-8b-instant",
    "meta-llama/llama-4-maverick-17b-128e-instruct",
    "meta-llama/llama-4-scout-17b-16e-instruct",
    "compound-beta",
    "compound-beta-mini",
    "deepseek-r1-distill-llama-70b",
    "qwen-qwq-32b",
];

/**
 * Query the Groq /models endpoint and return the best available text model.
 * Caches the result in memory so subsequent calls are instant.
 */
async function resolveGroqModel(client: OpenAI, preferredModel?: string): Promise<string> {
    // Return cached result if available
    if (cachedGroqModel) return cachedGroqModel;

    try {
        const modelsResponse = await client.models.list();
        const availableIds = new Set(modelsResponse.data.map((m: any) => m.id));

        // If admin configured a specific model and it's available, use it
        if (preferredModel && availableIds.has(preferredModel)) {
            cachedGroqModel = preferredModel;
            return preferredModel;
        }

        // Walk the preference list and pick the first available model
        for (const model of GROQ_PREFERRED_MODELS) {
            if (availableIds.has(model)) {
                console.log(`[AI] Auto-selected Groq model: ${model}`);
                cachedGroqModel = model;
                return model;
            }
        }

        // Last resort: pick any available non-whisper/vision/guard text model
        const fallback = modelsResponse.data.find((m: any) =>
            !m.id.includes("whisper") &&
            !m.id.includes("vision") &&
            !m.id.includes("guard")
        );
        if (fallback) {
            console.log(`[AI] Fallback Groq model: ${fallback.id}`);
            cachedGroqModel = fallback.id;
            return fallback.id;
        }

        throw new Error("No suitable Groq text model found in available models list.");
    } catch (err: any) {
        // If model listing fails, use configured model or first preferred
        const fallback = preferredModel || GROQ_PREFERRED_MODELS[0];
        console.warn(`[AI] Could not list Groq models (${err?.message}), falling back to: ${fallback}`);
        return fallback;
    }
}

export async function getAIClient(): Promise<AIClientConfig> {
    // Fetch settings from DB
    const settings = await prisma.systemSettings.findMany({
        where: {
            key: {
                in: ["AI_PROVIDER", "OPENAI_API_KEY", "GROK_API_KEY", "AI_MODEL"]
            }
        }
    });

    const settingsMap = settings.reduce((acc, s) => {
        acc[s.key] = s.value;
        return acc;
    }, {} as Record<string, string>);

    const provider = (settingsMap["AI_PROVIDER"] as AIProvider) || "openai";
    const configuredModel = settingsMap["AI_MODEL"] || undefined;

    // OpenAI/xAI model aliases for renamed models
    const STATIC_ALIASES: Record<string, string> = {
        "gpt-4": "gpt-4o",
        "grok-beta": "grok-3",
        "grok-1": "grok-3",
    };

    if (provider === "grok") {
        const apiKey = settingsMap["GROK_API_KEY"];
        if (!apiKey) throw new Error("Grok API Key not configured.");

        // Detect provider from API key prefix:
        // gsk_... → Groq (groq.com) | xai-... → xAI Grok (x.ai)
        const isGroq = apiKey.startsWith("gsk_");
        const baseURL = isGroq
            ? "https://api.groq.com/openai/v1"
            : "https://api.x.ai/v1";

        const client = new OpenAI({ apiKey, baseURL });

        if (isGroq) {
            // Dynamically resolve the best currently available model
            const model = await resolveGroqModel(client, configuredModel);
            return { client, model };
        } else {
            // xAI Grok — use configured or default to grok-3
            const model = (configuredModel && STATIC_ALIASES[configuredModel])
                ? STATIC_ALIASES[configuredModel]
                : (configuredModel || "grok-3");
            return { client, model };
        }
    } else {
        const apiKey = settingsMap["OPENAI_API_KEY"] || process.env.OPENAI_API_KEY;
        if (!apiKey) throw new Error("OpenAI API Key not configured.");
        const model = configuredModel
            ? (STATIC_ALIASES[configuredModel] ?? configuredModel)
            : "gpt-4o";
        return { client: new OpenAI({ apiKey }), model };
    }
}
