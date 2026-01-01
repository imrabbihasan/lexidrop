
import dotenv from "dotenv";
import OpenAI from "openai";

// Load environment variables
dotenv.config();

async function testAI() {
    console.log("🔍 Starting AI Diagnosis (Local Ollama)...");

    const openai = new OpenAI({
        baseURL: "http://localhost:11434/v1",
        apiKey: "ollama",
    });

    try {
        console.log("📡 Sending test request to Ollama (qwen2.5:7b)...");
        const response = await openai.chat.completions.create({
            messages: [{ role: "user", content: "Return JSON: {\"status\": \"ok\"}" }],
            model: "qwen2.5:7b",
            max_tokens: 50,
        });

        console.log("✅ API Connection Successful!");
        console.log("📄 Response:", response.choices[0].message.content);
    } catch (error: any) {
        console.error("❌ API Call Failed!");
        console.error("Error Message:", error.message);
        if (error.cause && error.cause.code === "ECONNREFUSED") {
            console.error("👉 CAUSE: Connection refused. Is Ollama running?");
        }
    }
}

testAI();
