export const PROVIDERS = {
  openrouter: {
    id: "openrouter",
    label: "OpenRouter",
    baseUrl: "https://openrouter.ai/api/v1",
    defaultModel: "moonshotai/kimi-k2-instruct-0905",
    apiKeyPlaceholder: "sk-or-...",
  },
  deepseek: {
    id: "deepseek",
    label: "DeepSeek",
    baseUrl: "https://api.deepseek.com",
    defaultModel: "deepseek-chat",
    apiKeyPlaceholder: "sk-...",
  },
  groq: {
    id: "groq",
    label: "Groq",
    baseUrl: "https://api.groq.com/openai/v1",
    defaultModel: "llama-3.3-70b-versatile",
    apiKeyPlaceholder: "gsk_...",
  },
};

export function getProvider(providerId) {
  return PROVIDERS[providerId] || PROVIDERS.openrouter;
}

export function getProviderEntries() {
  return Object.values(PROVIDERS);
}
