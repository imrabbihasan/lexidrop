
import dotenv from "dotenv";
import OpenAI from "openai";

// Load environment variables
dotenv.config();

async function testAI() {
    console.log("🔍 Starting AI Diagnosis (Round 4 - Full Prompt)...");

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) { console.error("Missing Key"); return; }

    const openai = new OpenAI({
        baseURL: "https://openrouter.ai/api/v1",
        apiKey: apiKey,
        defaultHeaders: {
            "HTTP-Referer": "http://localhost:3000",
            "X-Title": "LexiDrop Diagnosis"
        }
    });

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

    // Test Word: "Serendipity"
    const text = "Serendipity";

    try {
        console.log("📡 Sending FULL COMPLEX request to OpenRouter (Gemini Flash 2.0)...");
        const response = await openai.chat.completions.create({
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: `Word: "${text}"` }
            ],
            model: "google/gemini-2.0-flash-exp:free",
            response_format: { type: "json_object" }, // Keep this to test it
            temperature: 0.3,
        });

        console.log("✅ API Connection Successful!");
        console.log("📄 Response:", response.choices[0].message.content);
    } catch (error: any) {
        console.error("❌ API Call Failed!");
        console.error("Error Message:", error.message);
        if (error.status) console.error("Status Code:", error.status);
        if (error.response) console.error("Details:", JSON.stringify(error.response.data || {}, null, 2));
    }
}

testAI();
