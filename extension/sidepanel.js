// LexiDrop Side Panel Script (Bridge Mode)
console.log("[LexiDrop] Side panel script loaded.");

const statusContainer = document.getElementById("status-container");
const iframe = document.querySelector('iframe');

// 1. Listen for background messages
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log("[LexiDrop] Received message:", message);

    if (message.action === "ADD_WORD_REQUEST" && message.term) {
        // Show brief toast
        if (statusContainer) {
            statusContainer.innerText = `Adding "${message.term}"...`;
            statusContainer.style.display = 'block';
            statusContainer.className = 'status-loading';

            setTimeout(() => {
                statusContainer.style.display = 'none';
            }, 2000);
        }

        // Forward to Iframe (React App)
        if (iframe && iframe.contentWindow) {
            iframe.contentWindow.postMessage({
                type: 'LEXIDROP_ADD_WORD',
                payload: message.term
            }, '*'); // In production, replace '*' with specific origin if possible
        }
    }
});
