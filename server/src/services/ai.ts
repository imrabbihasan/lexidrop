import { GoogleGenerativeAI } from "@google/generative-ai";

let genAI: GoogleGenerativeAI | null = null;

export interface ExplainWordResult {
    translatedText: string;
    explanation: string;
}

/**
 * Uses Google Gemini to translate and explain a word/phrase.
 * @param text - The word or phrase to explain
 * @param targetLang - Target language for translation (default: "English")
 * @returns JSON with translatedText and explanation
 */
export async function explainWord(
    text: string,
    targetLang: string = "English"
): Promise<ExplainWordResult> {
    // Lazy initialization to ensure process.env is populated
    if (!genAI) {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            throw new Error("GEMINI_API_KEY is not set in environment variables");
        }
        genAI = new GoogleGenerativeAI(apiKey);
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

    const prompt = `You are a vocabulary learning assistant. Analyze the following word or phrase and provide:
1. The translation to ${targetLang}
2. A clear, concise explanation of its meaning, usage, and any important context

Word/Phrase: "${text}"

Respond ONLY with valid JSON in this exact format (no markdown, no code blocks):
{
  "translatedText": "the translation here",
  "explanation": "A clear explanation of the word including its meaning, common usage, and any relevant context. Use simple language suitable for language learners."
}`;

    try {
        const result = await model.generateContent(prompt);
        const response = result.response;
        const responseText = response.text().trim();

        // Clean up response - remove any markdown code blocks if present
        const cleanedResponse = responseText
            .replace(/```json\n?/g, "")
            .replace(/```\n?/g, "")
            .trim();

        const parsed: ExplainWordResult = JSON.parse(cleanedResponse);
        return parsed;
    } catch (error: any) {
        console.error("Error calling Gemini API:", error);
        // Propagate the actual error message for better debugging
        throw new Error(`AI Service Error: ${error.message || error}`);
    }
}
