import { getProviderEntries, getProvider } from "./lib/providers.js";
import { getProviderConfig, getNativeLanguage, saveProviderConfig, setNativeLanguage } from "./lib/storage.js";

const form = document.getElementById("settings-form");
const providerSelect = document.getElementById("provider");
const modelInput = document.getElementById("model");
const apiKeyInput = document.getElementById("api-key");
const langSelect = document.getElementById("options-language-select");
const status = document.getElementById("status");

function setStatus(message) {
  status.textContent = message;
}

function renderProviderOptions() {
  providerSelect.innerHTML = getProviderEntries()
    .map(
      (provider) =>
        `<option value="${provider.id}">${provider.label}</option>`
    )
    .join("");
}

function syncModelPlaceholder() {
  const provider = getProvider(providerSelect.value);
  modelInput.placeholder = provider.defaultModel;
  apiKeyInput.placeholder = provider.apiKeyPlaceholder;

  if (!modelInput.value.trim()) {
    modelInput.value = provider.defaultModel;
  }
}

async function loadSettings() {
  renderProviderOptions();

  const [config, nativeLanguage] = await Promise.all([
    getProviderConfig(),
    getNativeLanguage(),
  ]);

  providerSelect.value = config.provider;
  modelInput.value = config.model;
  apiKeyInput.value = config.apiKey;
  if (langSelect) langSelect.value = nativeLanguage;
  syncModelPlaceholder();
  setStatus("Ready");
}

providerSelect.addEventListener("change", () => {
  const provider = getProvider(providerSelect.value);
  modelInput.value = provider.defaultModel;
  syncModelPlaceholder();
  setStatus("Unsaved changes");
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const nextConfig = {
    provider: providerSelect.value,
    model: modelInput.value.trim(),
    apiKey: apiKeyInput.value.trim(),
  };

  if (!nextConfig.apiKey) {
    setStatus("API key required");
    return;
  }

  const selectedLang = langSelect ? langSelect.value : "Bengali";
  await Promise.all([
    saveProviderConfig(nextConfig),
    setNativeLanguage(selectedLang),
  ]);
  setStatus("Saved");
});

loadSettings();
