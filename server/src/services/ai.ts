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
 * Uses Local Ollama (Qwen 2.5) to explain a word.
 * Requires Ollama running locally: `ollama run qwen2.5:7b`
 */
export async function explainWord(text: string): Promise<ExplainWordResult> {
    // Lazy initialization
    if (!openai) {
        // Ollama local endpoint (OpenAI compatible)
        openai = new OpenAI({
            baseURL: "https://api.groq.com/openai/v1",
            apiKey: process.env.GROQ_API_KEY
        });
    }

    const systemPrompt = `You are an expert linguist. Translate and explain the word.
Task:
1. Detect language.
2. Translate to English.
3. Translate to Bengali (Mandatory).
4. Provide Pinyin if Chinese.
5. Provide a concise usage explanation.

Constraint: Return ONLY raw JSON. Do NOT use markdown code blocks.

Required JSON Structure:
{
  "language": "Detected language",
  "translatedText": "English translation",
  "secondaryTerm": "Bengali translation",
  "pinyin": "Pinyin or null",
  "usageMarkdown": "Explanation"
}`;

    try {
        const completion = await openai.chat.completions.create({
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: `Word: "${text}"` }
            ],
            model: "moonshotai/kimi-k2-instruct-0905",
            temperature: 0.3,
        });

        const content = completion.choices[0].message.content;
        if (!content) throw new Error("Empty response from AI");

        const result = parseJSONSafe(content);

        return {
            translatedText: result.translatedText || text,
            secondaryTranslation: result.secondaryTerm || "...",
            pinyin: result.pinyin || undefined,
            explanation: result.usageMarkdown || "No explanation.",
            language: result.language || "Unknown",
        };

    } catch (error: any) {
        console.error("Ollama AI Error:", error.message || error);

        // Handle connection refused (Ollama not running)
        if (error.cause && (error.cause.code === "ECONNREFUSED" || error.message.includes("fetch failed"))) {
            return getFallbackResult(text, "Connection Failed", "Is Ollama running? Run 'ollama run qwen2.5:7b' in your terminal.");
        }

        return getFallbackResult(text, "AI Error");
    }
}

/**
 * Robust JSON extraction for local models
 */
function parseJSONSafe(content: string): any {
    // 1. Remove <think>...</think> blocks (if using reasoning models)
    let cleaned = content.replace(/<think>[\s\S]*?<\/think>/g, "").trim();

    // 2. Remove Markdown code blocks
    cleaned = cleaned.replace(/```json/g, "").replace(/```/g, "").trim();

    // 3. Simple cleanup of conversational filler prefix
    // (Local models often say "Here is the JSON:")
    const firstBrace = cleaned.indexOf("{");
    const lastBrace = cleaned.lastIndexOf("}");

    if (firstBrace !== -1 && lastBrace !== -1) {
        cleaned = cleaned.substring(firstBrace, lastBrace + 1);
    }

    try {
        return JSON.parse(cleaned);
    } catch (e) {
        throw new Error("Failed to parse JSON response");
    }
}

function getFallbackResult(text: string, errorType: string, customMsg?: string): ExplainWordResult {
    return {
        translatedText: `${text} (${errorType})`,
        secondaryTranslation: "Error",
        explanation: customMsg || "Check Ollama connection.",
        language: "Unknown",
        pinyin: undefined
    };
}
