import { getProviderEntries, getProvider } from "./lib/providers.js";
import { getProviderConfig, saveProviderConfig } from "./lib/storage.js";

const form = document.getElementById("settings-form");
const providerSelect = document.getElementById("provider");
const modelInput = document.getElementById("model");
const apiKeyInput = document.getElementById("api-key");
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

  const config = await getProviderConfig();
  providerSelect.value = config.provider;
  modelInput.value = config.model;
  apiKeyInput.value = config.apiKey;
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

  await saveProviderConfig(nextConfig);
  setStatus("Saved");
});

loadSettings();
