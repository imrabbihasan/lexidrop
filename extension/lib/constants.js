export const MESSAGE_TYPES = {
  UNDERSTAND_TEXT_REQUEST: "LEXIDROP_UNDERSTAND_TEXT_REQUEST",
};

export const STORAGE_KEYS = {
  PROVIDER_CONFIG: "providerConfig",
  LEGACY_GEMINI_KEY: "userGeminiKey",
  PENDING_SELECTION: "pendingSelection",
  CURRENT_RESULT: "currentResult",
  SAVED_ITEMS: "savedItems",
  HISTORY_ITEMS: "historyItems",
  NATIVE_LANGUAGE: "nativeLanguage",
};

export const DEFAULT_PROVIDER_CONFIG = {
  provider: "openrouter",
  model: "google/gemini-2.0-flash-001",
  apiKey: "",
};

export const REQUEST_TIMEOUT_MS = 20000;
export const HISTORY_LIMIT = 80;
export const SAVED_LIMIT = 250;
export const REVIEW_SESSION_SIZE = 5;

export const EMPTY_RESULT_TEXT = {
  idleTitle: "Understand text without leaving the page",
  idleBody:
    "Highlight Chinese or English text, then choose LexiDrop from the context menu.",
};
