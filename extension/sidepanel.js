// LexiDrop Serverless Side Panel Script

console.log("[LexiDrop] Side panel script loaded.");

// DOM Elements
const statusContainer = document.getElementById("status-container");
const contentContainer = document.getElementById("content-container");

// Helper to show/hide status
function showStatus(html, type = "info") {
    if (!statusContainer) return;
    statusContainer.innerHTML = html;
    statusContainer.className = `status-${type}`; // CSS class for styling
    statusContainer.style.display = "block";
}

function hideStatus() {
    if (statusContainer) statusContainer.style.display = "none";
}

// 1. Listen for messages from background.js
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log("[LexiDrop] Received message:", message);

    switch (message.action) {
        case "lexidrop_loading":
            showStatus(`
                <div class="loader"></div>
                <p>Analyzing <strong>"${message.term}"</strong>...</p>
            `, "loading");
            break;

        case "lexidrop_success":
            // Render the result directly in the side panel
            showStatus(`
                <div class="result-card">
                    <h3>${message.term}</h3>
                    <p class="secondary">${message.secondaryTerm || ""}</p>
                    <hr/>
                    <div class="usage">${message.usageMarkdown || ""}</div>
                </div>
            `, "success");

            // Optional: If we still want to use the iframe app, we could postMessage to it here
            // const iframe = document.querySelector('iframe');
            // if (iframe) iframe.contentWindow.postMessage({ type: 'LEXIDROP_DATA', payload: message }, '*');
            break;

        case "lexidrop_error":
            showStatus(`
                <div class="error-icon">⚠️</div>
                <p>${message.error}</p>
                ${message.error.includes("API Key") ? '<button id="open-options">Open Settings</button>' : ''}
            `, "error");

            // Attach listener for the button if present
            setTimeout(() => {
                const btn = document.getElementById("open-options");
                if (btn) btn.onclick = () => chrome.runtime.openOptionsPage();
            }, 0);
            break;
    }
});
