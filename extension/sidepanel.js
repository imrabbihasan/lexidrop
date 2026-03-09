// LexiDrop Side Panel Script (Bridge Mode)
console.log("[LexiDrop] Side panel script loaded.");

const statusContainer = document.getElementById("status-container");
const iframe = document.querySelector('iframe');

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log("[LexiDrop] Received message:", message);

    if (message.action === "UNDERSTAND_TEXT_REQUEST" && message.term) {
        if (statusContainer) {
            statusContainer.innerText = `Understanding "${message.term}"...`;
            statusContainer.style.display = 'block';
            statusContainer.className = 'status-loading';

            setTimeout(() => {
                statusContainer.style.display = 'none';
            }, 2000);
        }

        if (iframe && iframe.contentWindow) {
            iframe.contentWindow.postMessage({
                type: 'LEXIDROP_UNDERSTAND_TEXT',
                payload: message.term
            }, '*'); // In production, replace '*' with specific origin if possible
        }
    }
});
