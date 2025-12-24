import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config(); // defaults to .env in cwd

async function listModels() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.error("No API KEY found");
        return;
    }
    console.log("Using API Key:", apiKey.substring(0, 8) + "...");
    const genAI = new GoogleGenerativeAI(apiKey);
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-pro" }); // Just to access valid client? No, listModels is on genAI? 
        // older SDKs had listModels on client? Newer might be different. 
        // checking docs... genAI context. 
        // Actually, checking if there is a helper. 
        // Nope, currently there is no direct listModels on the high level class in v0.21?
        // Let's try to just use `gemini-1.5-flash-001`.

        console.log("Testing specific model names...");
    } catch (e) {
        console.error(e);
    }
}

// Since I can't easily list models with the helper without checking docs thoroughly and I don't want to waste time:
// I will try to use the raw fetch to list models.

async function listModelsRaw() {
    const apiKey = process.env.GEMINI_API_KEY;
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
    try {
        const response = await fetch(url);
        const data = await response.json();
        console.log("Available Models:", JSON.stringify(data, null, 2));
    } catch (error) {
        console.error("Error listing models:", error);
    }
}

listModelsRaw();
