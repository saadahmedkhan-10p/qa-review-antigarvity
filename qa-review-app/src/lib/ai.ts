import OpenAI from "openai";
import { prisma } from "./prisma";

export type AIProvider = "openai" | "grok";

export interface AIClientConfig {
    client: OpenAI;
    model: string;
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
    const model = settingsMap["AI_MODEL"];

    // Map deprecated/incorrect model names to current equivalents
    const MODEL_ALIASES: Record<string, string> = {
        "grok-beta": "grok-3",
        "grok-1": "grok-3",
        "gpt-4": "gpt-4o",
        // Groq decommissioned models → gemma2-9b-it (active on all plans)
        "llama-3.3-70b-versatile": "gemma2-9b-it",
        "llama-3.1-70b-versatile": "gemma2-9b-it",
        "llama-3.1-8b-instant": "gemma2-9b-it",
        "llama3-70b-8192": "gemma2-9b-it",
        "llama3-8b-8192": "gemma2-9b-it",
    };
    const resolveModel = (m: string | undefined, fallback: string): string => {
        if (!m) return fallback;
        return MODEL_ALIASES[m] ?? m;
    };

    if (provider === "grok") {
        const apiKey = settingsMap["GROK_API_KEY"];
        if (!apiKey) {
            throw new Error("Grok API Key not configured.");
        }

        // Auto-detect provider from key prefix:
        // gsk_... → Groq (groq.com)   |   xai-... → xAI Grok (x.ai)
        const isGroq = apiKey.startsWith("gsk_");
        const baseURL = isGroq
            ? "https://api.groq.com/openai/v1"
            : "https://api.x.ai/v1";
        const defaultModel = isGroq
            ? "gemma2-9b-it"    // active on all Groq plans
            : "grok-3";         // xAI flagship model

        return {
            client: new OpenAI({ apiKey, baseURL }),
            model: resolveModel(model, defaultModel),
        };
    } else {
        const apiKey = settingsMap["OPENAI_API_KEY"] || process.env.OPENAI_API_KEY;
        if (!apiKey) {
            throw new Error("OpenAI API Key not configured.");
        }
        return {
            client: new OpenAI({ apiKey }),
            model: resolveModel(model, "gpt-4o"),
        };
    }
}
