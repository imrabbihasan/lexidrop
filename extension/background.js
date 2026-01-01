// LexiDrop Background Script (Bridge Mode)

chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
        id: "save-to-lexidrop",
        title: "Add '%s' to LexiDrop",
        contexts: ["selection"]
    });
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
    if (info.menuItemId !== "save-to-lexidrop" || !info.selectionText) return;

    const term = info.selectionText.trim();
    console.log("[LexiDrop] Selected term:", term);

    // 1. Open Side Panel
    try {
        await chrome.sidePanel.open({ windowId: tab.windowId });
    } catch (err) {
        console.error("[LexiDrop] Failed to open side panel:", err);
    }

    // 2. Wait briefly for panel to open (if not already), then send message
    // The sidepanel.js will relay this to the React app
    setTimeout(() => {
        chrome.runtime.sendMessage({
            action: "ADD_WORD_REQUEST",
            term: term
        }).catch(() => {
            console.log("Side panel not ready yet. Retrying...");
            // Simple retry once
            setTimeout(() => {
                chrome.runtime.sendMessage({ action: "ADD_WORD_REQUEST", term: term }).catch(e => console.log("Final send failed", e));
            }, 500);
        });
    }, 300);
});
