import { DEFAULT_PROVIDER_CONFIG, STORAGE_KEYS } from "./constants.js";
import { getProvider } from "./providers.js";

export async function getProviderConfig() {
  const stored = await chrome.storage.sync.get([
    STORAGE_KEYS.PROVIDER_CONFIG,
    STORAGE_KEYS.LEGACY_GEMINI_KEY,
  ]);

  const providerConfig = {
    ...DEFAULT_PROVIDER_CONFIG,
    ...(stored[STORAGE_KEYS.PROVIDER_CONFIG] || {}),
  };

  if (!providerConfig.apiKey && stored[STORAGE_KEYS.LEGACY_GEMINI_KEY]) {
    providerConfig.apiKey = stored[STORAGE_KEYS.LEGACY_GEMINI_KEY];
  }

  const provider = getProvider(providerConfig.provider);

  return {
    provider: provider.id,
    model: providerConfig.model || provider.defaultModel,
    apiKey: providerConfig.apiKey || "",
  };
}

export async function saveProviderConfig(config) {
  const provider = getProvider(config.provider);
  const nextConfig = {
    provider: provider.id,
    model: config.model || provider.defaultModel,
    apiKey: (config.apiKey || "").trim(),
  };

  await chrome.storage.sync.set({
    [STORAGE_KEYS.PROVIDER_CONFIG]: nextConfig,
  });

  return nextConfig;
}

export async function setPendingSelection(selection) {
  if (!selection?.text?.trim()) {
    await chrome.storage.session.remove(STORAGE_KEYS.PENDING_SELECTION);
    return;
  }

  await chrome.storage.session.set({
    [STORAGE_KEYS.PENDING_SELECTION]: {
      ...selection,
      text: selection.text.trim(),
      updatedAt: Date.now(),
    },
  });
}

export async function getPendingSelection() {
  const stored = await chrome.storage.session.get(STORAGE_KEYS.PENDING_SELECTION);
  return stored[STORAGE_KEYS.PENDING_SELECTION] || null;
}

export async function clearPendingSelection() {
  await chrome.storage.session.remove(STORAGE_KEYS.PENDING_SELECTION);
}
