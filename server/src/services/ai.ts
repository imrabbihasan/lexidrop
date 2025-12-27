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
 * Uses Hugging Face Serverless Inference (Qwen 2.5-72B) to explain a word.
 * Compatible with OpenAI SDK.
 */
export async function explainWord(text: string): Promise<ExplainWordResult> {
    // Lazy initialization
    if (!openai) {
        const apiKey = process.env.HUGGINGFACE_API_KEY;
        if (!apiKey) {
            console.warn("HUGGINGFACE_API_KEY is not set. Using fallback.");
            return getFallbackResult(text, "Key Missing");
        }
        openai = new OpenAI({
            baseURL: "https://router.huggingface.co/v1",
            apiKey: apiKey
        });
    }

    const systemPrompt = `You are an expert linguist. Analyze the user's word.
Return ONLY raw JSON. Do not use markdown blocks like \`\`\`json.

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
            model: "Qwen/Qwen2.5-72B-Instruct",
            max_tokens: 500,
            temperature: 0.3, // Lower temperature for more deterministic JSON
            // Note: response_format "json_object" is widely supported but sometimes Qwen raw needs prompting
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
        console.error("HF AI Error:", error);

        // Handle fallback details
        const errMsg = error.message || "";
        const status = error.status || 0;

        if (status === 503 || errMsg.includes("503")) {
            return getFallbackResult(text, "Model Warning Up", "Model is loading. Please try again in 15s.");
        }
        if (status === 429 || errMsg.includes("429")) {
            return getFallbackResult(text, "Rate Limit", "Too many requests. Please wait.");
        }

        return getFallbackResult(text, "AI Error");
    }
}

/**
 * Robust JSON extraction from potentially chatty model output
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
