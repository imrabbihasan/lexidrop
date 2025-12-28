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
 * Uses OpenRouter with Automatic Fallback.
 * Strategy: Gemini 2.0 Flash (Free) -> DeepSeek R1 (Free)
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
                "HTTP-Referer": "http://localhost:3000",
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

    // Define model routing strategy
    // Primary: Gemini 2.0 Flash (Free)
    // Fallback: DeepSeek R1 (Free)
    // OpenRouter uses 'models' in extra_body for fallback chain
    const fallbackModels = [
        "google/gemini-2.0-flash-exp:free",
        "deepseek/deepseek-r1:free",
        "meta-llama/llama-3.2-3b-instruct:free",
        "microsoft/phi-3-mini-128k-instruct:free"
    ];

    try {
        const completion = await openai.chat.completions.create({
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: `Word: "${text}"` }
            ],
            // Primary model identifier (usually required by SDK type, though OpenRouter routes based on extra_body if provided)
            model: "google/gemini-2.0-flash-exp:free",
            // Fallback configuration
            // @ts-ignore: OpenRouter specific parameter not in OpenAI types
            extra_body: {
                models: fallbackModels
            },
            temperature: 0.3,
            // DeepSeek R1 might not support strict "json_object" mode, so we rely on prompt + cleaning
            // But Gemini does. We'll leave it out for maximum compatibility with R1 fallback, 
            // or keep it if we trust Gemini to succeed most times. 
            // Given R1 is fallback, we should probably output raw text and parse it safe.
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
        console.error("OpenRouter (Fallback) AI Error:", error);

        const errMsg = error.message || "";
        const status = error.status || 0;

        if (status === 502 || status === 503 || status === 429) {
            return getFallbackResult(text, "Service Busy", "All AI models are currently busy. Please try again later.");
        }

        return getFallbackResult(text, "AI Error");
    }
}

/**
 * Robust JSON extraction handling Markdown and <think> tags (DeepSeek R1)
 */
function parseJSONSafe(content: string): any {
    // 1. Remove <think>...</think> blocks (DeepSeek R1 reasoning)
    let cleaned = content.replace(/<think>[\s\S]*?<\/think>/g, "").trim();

    // 2. Remove Markdown code blocks
    cleaned = cleaned.replace(/```json/g, "").replace(/```/g, "").trim();

    try {
        return JSON.parse(cleaned);
    } catch (e) {
        // 3. Attempt to find the first { and last }
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
