// LexiDrop Serverless Background Script

// 1. Initialize Context Menu
chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
        id: "save-to-lexidrop",
        title: "Add '%s' to LexiDrop",
        contexts: ["selection"]
    });
});

// 2. Handle Clicks
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
    if (info.menuItemId !== "save-to-lexidrop" || !info.selectionText) return;

    const term = info.selectionText.trim();
    console.log("[LexiDrop] Selected term:", term);

    // 2.1 Open Side Panel immediately (User Gesture)
    // Note: This requires the "sidePanel" permission and Chrome 114+
    try {
        await chrome.sidePanel.open({ windowId: tab.windowId });
    } catch (err) {
        console.error("[LexiDrop] Failed to open side panel:", err);
    }

    // 2.2 Get API Key
    chrome.storage.sync.get(["userGeminiKey"], async (result) => {
        const apiKey = result.userGeminiKey;

        if (!apiKey) {
            console.warn("[LexiDrop] No API Key found.");
            chrome.runtime.openOptionsPage();
            // Notify sidepanel to show "Key Missing" state if possible
            sendMessage("lexidrop_error", { error: "Missing API Key. Please check extension options." });
            return;
        }

        // 2.3 Notify UI: Loading
        sendMessage("lexidrop_loading", { term });

        // 2.4 Call AI
        try {
            const data = await callAI(term, apiKey);
            console.log("[LexiDrop] AI Success:", data);

            // 2.5 Notify UI: Success
            // We pass the original term + the AI result
            sendMessage("lexidrop_success", {
                term,
                ...data
            });

        } catch (error) {
            console.error("[LexiDrop] AI Error:", error);
            sendMessage("lexidrop_error", { error: error.message || "Failed to fetch translation." });
        }
    });
});

// Helper to safely send messages to runtime (Side Panel)
function sendMessage(action, payload = {}) {
    chrome.runtime.sendMessage({ action, ...payload }).catch(() => {
        // Suppress error if side panel is closed/not listening
        // console.log("Side panel not active or listening.");
    });
}

// 3. Direct AI Call (Serverless)
// Uses OpenRouter/DeepSeek as requested
async function callAI(text, apiKey) {
    const API_URL = "https://openrouter.ai/api/v1/chat/completions";

    // System Prompt asking for STRICT JSON
    const systemPrompt = `You are a dictionary helper. Translate to Bengali. Return ONLY valid JSON with keys: 'secondaryTerm' and 'usageMarkdown'. Do not use markdown formatting blocks.`;

    const response = await fetch(API_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`,
            "HTTP-Referer": "https://lexidrop.extension", // OpenRouter requirement
            "X-Title": "LexiDrop"
        },
        body: JSON.stringify({
            model: "deepseek/deepseek-chat", // Or fallback if user prefers
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: `Word: "${text}"` }
            ]
        })
    });

    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`API Error ${response.status}: ${errText}`);
    }

    const data = await response.json();
    const rawContent = data.choices?.[0]?.message?.content;

    if (!rawContent) throw new Error("Empty response from AI.");

    // 4. Robust Parsing
    // Remove potential markdown code blocks like ```json ... ```
    const cleanedContent = rawContent
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();

    try {
        return JSON.parse(cleanedContent);
    } catch (e) {
        console.error("JSON Parse Error. Raw:", rawContent);
        throw new Error("Failed to parse AI response.");
    }
}
