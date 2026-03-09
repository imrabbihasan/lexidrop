const DEFAULT_PROVIDER_CONFIG = {
    provider: "openrouter",
    model: "moonshotai/kimi-k2-instruct-0905",
    apiKey: "",
};

function getElements() {
    return {
        provider: document.getElementById("provider"),
        model: document.getElementById("model"),
        apiKey: document.getElementById("apiKey"),
        status: document.getElementById("status"),
        save: document.getElementById("save"),
    };
}

function normalizeStoredConfig(result) {
    const legacyKey = result.userGeminiKey || "";
    const stored = result.providerConfig || {};

    return {
        provider: stored.provider || DEFAULT_PROVIDER_CONFIG.provider,
        model: stored.model || DEFAULT_PROVIDER_CONFIG.model,
        apiKey: stored.apiKey || legacyKey || DEFAULT_PROVIDER_CONFIG.apiKey,
    };
}

function saveOptions() {
    const { provider, model, apiKey, status } = getElements();

    const providerConfig = {
        provider: provider.value,
        model: model.value.trim(),
        apiKey: apiKey.value.trim(),
    };

    chrome.storage.sync.set({ providerConfig }, () => {
        status.style.display = "block";
        setTimeout(() => {
            status.style.display = "none";
        }, 2000);
    });
}

function restoreOptions() {
    const { provider, model, apiKey } = getElements();

    chrome.storage.sync.get(["providerConfig", "userGeminiKey"], (result) => {
        const config = normalizeStoredConfig(result);
        provider.value = config.provider;
        model.value = config.model;
        apiKey.value = config.apiKey;
    });
}

document.addEventListener("DOMContentLoaded", () => {
    const { save } = getElements();
    restoreOptions();
    save.addEventListener("click", saveOptions);
});
