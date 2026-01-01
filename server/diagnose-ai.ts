
import dotenv from "dotenv";
import OpenAI from "openai";

// Load environment variables
dotenv.config();

async function testAI() {
    console.log("🔍 Starting AI Diagnosis (Full Prompt Test)...");

    const openai = new OpenAI({
        baseURL: "https://api.groq.com/openai/v1",
        apiKey: process.env.GROQ_API_KEY,
    });

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
        // Test 1: English -> Bengali
        const testEnglish = "Serendipity";
        console.log(`\n📡 Test 1: English ("${testEnglish}")`);
        const res1 = await openai.chat.completions.create({
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: `Word: "${testEnglish}"` }
            ],
            model: "moonshotai/kimi-k2-instruct-0905",
            temperature: 0.3,
        });
        console.log("Response:", res1.choices[0].message.content);

        // Test 2: Chinese -> English + Bengali
        const testChinese = "苹果";
        console.log(`\n📡 Test 2: Chinese ("${testChinese}")`);
        const res2 = await openai.chat.completions.create({
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: `Word: "${testChinese}"` }
            ],
            model: "moonshotai/kimi-k2-instruct-0905",
            temperature: 0.3,
        });
        console.log("Response:", res2.choices[0].message.content);

    } catch (error: any) {
        console.error("❌ API Call Failed!");
        console.error("Error Message:", error.message);
    }
}

testAI();
