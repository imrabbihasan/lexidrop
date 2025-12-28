import OpenAI from "openai";

let openai: OpenAI | null = null;

export interface ExplainWordResult {
    translatedText: string;
    secondaryTranslation: string;
    pinyin?: string;
    explanation: string;
    language: string;
}

/**
 * Uses OpenRouter (DeepSeek) to explain a word.
 */
export async function explainWord(text: string): Promise<ExplainWordResult> {
    // Lazy initialization
    if (!openai) {
        const apiKey = process.env.OPENROUTER_API_KEY;
        if (!apiKey) {
            console.warn("OPENROUTER_API_KEY is not set. Using fallback.");
            return getFallbackResult(text, "Key Missing");
        }
        openai = new OpenAI({
            baseURL: "https://openrouter.ai/api/v1",
            apiKey: apiKey,
            defaultHeaders: {
                "HTTP-Referer": "http://localhost:3000", // Required by OpenRouter for rankings
                "X-Title": "LexiDrop"
            }
        });
    }

    const systemPrompt = `You are an expert linguist. Analyze the user's word.
Return ONLY raw JSON.

Required JSON Structure:
{
  "language": "Detected valid language name",
  "translatedText": "English translation",
  "secondaryTerm": "Bangla translation (Mandatory)",
  "pinyin": "Pinyin (only if Chinese, else null)",
  "usageMarkdown": "Concise explanation of meaning/usage."
}`;

    try {
        const completion = await openai.chat.completions.create({
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: `Word: "${text}"` }
            ],
            model: "google/gemini-2.0-flash-exp:free", // OpenRouter model ID
            response_format: { type: "json_object" },
            temperature: 0.3,
        });

        const content = completion.choices[0].message.content;
        if (!content) throw new Error("Empty response from AI");

        const result = parseJSONSafe(content);

        // Map Keys
        return {
            translatedText: result.translatedText || text,
            secondaryTranslation: result.secondaryTerm || "...",
            pinyin: result.pinyin || undefined,
            explanation: result.usageMarkdown || "No explanation.",
            language: result.language || "Unknown",
        };

    } catch (error: any) {
        console.error("OpenRouter AI Error:", error);

        // Handle fallback details
        const errMsg = error.message || "";
        const status = error.status || 0;

        if (status === 502 || status === 503) {
            return getFallbackResult(text, "Service Busy", "OpenRouter/DeepSeek is currently busy. Try again.");
        }
        if (status === 429) {
            return getFallbackResult(text, "Rate Limit", "Too many requests. Please wait.");
        }
        if (status === 402) {
            return getFallbackResult(text, "No Credits", "OpenRouter credits exhausted.");
        }

        return getFallbackResult(text, "AI Error");
    }
}

/**
 * Robust JSON extraction
 */
function parseJSONSafe(content: string): any {
    const cleaned = content.replace(/```json/g, "").replace(/```/g, "").trim();

    try {
        return JSON.parse(cleaned);
    } catch (e) {
        // Attempt to find the first { and last }
        const firstBrace = cleaned.indexOf("{");
        const lastBrace = cleaned.lastIndexOf("}");

        if (firstBrace !== -1 && lastBrace !== -1) {
            const substring = cleaned.substring(firstBrace, lastBrace + 1);
            try {
                return JSON.parse(substring);
            } catch (inner) {
                throw new Error("Failed to parse JSON substring");
            }
        }
        throw new Error("No JSON found in response");
    }
}

function getFallbackResult(text: string, errorType: string, customMsg?: string): ExplainWordResult {
    return {
        translatedText: `${text} (${errorType})`,
        secondaryTranslation: "Loading...",
        explanation: customMsg || "Service unavailable. Please check logs.",
        language: "Unknown",
        pinyin: undefined
    };
}
