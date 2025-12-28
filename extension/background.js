chrome.runtime.onInstalled.addListener(() => {
    console.log("LexiDrop extension installed!");
    chrome.contextMenus.create({
        id: "save-to-lexidrop",
        // %s will be replaced by the selected word (e.g. "Add 'Serendipity' to LexiDrop")
        title: "Add '%s' to LexiDrop",
        contexts: ["selection"]
    });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
    console.log("Context menu clicked!", info.menuItemId);

    if (info.menuItemId === "save-to-lexidrop" && info.selectionText) {
        const word = info.selectionText.trim();
        console.log("Selected word:", word);

        // Open Side Panel
        chrome.sidePanel.open({ windowId: tab.windowId })
            .catch((error) => console.error("failed to open side panel", error));

        // Show notification
        const notifId = "lexidrop-" + Date.now();
        console.log("Creating notification with ID:", notifId);

        chrome.notifications.create(notifId, {
            type: "basic",
            iconUrl: "icons/icon48.png",
            title: "LexiDrop",
            message: `Analyzing: "${word}"...`,
            priority: 2
        }, (createdId) => {
            if (chrome.runtime.lastError) {
                console.error("NOTIFICATION ERROR:", chrome.runtime.lastError.message);
            } else {
                console.log("Notification created successfully, ID:", createdId);
            }
        });

        // Make API call
        console.log("Sending to server...");
        fetch("http://localhost:3001/api/save", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text: word, targetLang: "bn" })
        })
            .then(response => {
                console.log("Server response status:", response.status);
                if (!response.ok) throw new Error("Server error: " + response.status);
                return response.json();
            })
            .then(data => {
                console.log("Success! Data:", data);

                // Notify Side Panel (if open)
                chrome.runtime.sendMessage({
                    action: "WORD_SAVED",
                    word: word,
                    data: data
                }).catch(() => {
                    // Ignore error if no receivers (side panel closed)
                });

                // Clear analyzing notification and show success
                chrome.notifications.clear(notifId);
                chrome.notifications.create(notifId + "-done", {
                    type: "basic",
                    iconUrl: chrome.runtime.getURL("icons/icon48.png"),
                    title: "LexiDrop ✓",
                    message: `Saved: "${word}"`,
                    priority: 2
                });
            })
            .catch(error => {
                console.error("Fetch error:", error);
                chrome.notifications.clear(notifId);
                chrome.notifications.create(notifId + "-err", {
                    type: "basic",
                    iconUrl: chrome.runtime.getURL("icons/icon48.png"),
                    title: "LexiDrop Error",
                    message: "Server not responding",
                    priority: 2
                });
            });
    }
});
