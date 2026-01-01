// Save options
document.getElementById('save').addEventListener('click', () => {
    const apiKey = document.getElementById('apiKey').value.trim();

    chrome.storage.sync.set({ userGeminiKey: apiKey }, () => {
        const status = document.getElementById('status');
        status.style.display = 'block';
        setTimeout(() => {
            status.style.display = 'none';
        }, 2000);
    });
});

// Restore options
document.addEventListener('DOMContentLoaded', () => {
    chrome.storage.sync.get(['userGeminiKey'], (result) => {
        if (result.userGeminiKey) {
            document.getElementById('apiKey').value = result.userGeminiKey;
        }
    });
});
