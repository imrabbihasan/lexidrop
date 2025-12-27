
import dotenv from "dotenv";
import OpenAI from "openai";

// Load environment variables
dotenv.config();

async function testAI() {
    console.log("🔍 Starting AI Diagnosis (Round 3)...");

    const apiKey = process.env.HUGGINGFACE_API_KEY;
    // Check for "sk-" which usually means OpenAI/DeepSeek key, not HF
    if (apiKey && apiKey.startsWith("sk-")) {
        console.warn("⚠️  WARNING: Your key starts with 'sk-', but Hugging Face keys usually start with 'hf_'. You may have pasted the wrong key.");
    }

    // Correct Router URL
    const baseURL = "https://router.huggingface.co/hf-inference/v1";
    // Wait, the search result 1 said https://router.huggingface.co/v1
    // But let's try that.

    // Actually, let's try the one searching result 1 said specifically.
    const url = "https://router.huggingface.co/v1";

    console.log(`Testing URL: ${url}`);

    const openai = new OpenAI({
        baseURL: url,
        apiKey: apiKey
    });

    try {
        console.log("📡 Sending test request...");
        const response = await openai.chat.completions.create({
            messages: [{ role: "user", content: "Return JSON: {\"status\": \"ok\"}" }],
            model: "Qwen/Qwen2.5-72B-Instruct",
            max_tokens: 50,
        });

        console.log("✅ API Connection Successful!");
        console.log("📄 Response:", response.choices[0].message.content);
    } catch (error: any) {
        console.error("❌ API Call Failed!");
        console.error("Error Message:", error.message);
        if (error.status) console.error("Status Code:", error.status);
    }
}

testAI();
