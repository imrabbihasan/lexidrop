import { REQUEST_TIMEOUT_MS } from "./constants.js";
import { getProvider } from "./providers.js";

const LANGUAGE_CODES = {
  English: "en",
  Bengali: "bn",
  Spanish: "es",
  French: "fr",
  Hindi: "hi",
  German: "de",
  Arabic: "ar",
  Portuguese: "pt",
  Japanese: "ja",
  Korean: "ko",
  Chinese: "zh",
  Russian: "ru",
  Turkish: "tr",
  Italian: "it",
  Dutch: "nl",
  Polish: "pl",
  Vietnamese: "vi",
  Thai: "th",
  Indonesian: "id",
  Malay: "ms",
  Urdu: "ur",
};

function getLangCode(nativeLanguage) {
  return LANGUAGE_CODES[nativeLanguage] || "en";
}

function buildPrompt(text, nativeLanguage = "English") {
  return [
    `You are LexiDrop. Respond ONLY with valid JSON. Target language: ${nativeLanguage}`,
    "Schema:",
    JSON.stringify({
      translation: `Concise ${nativeLanguage} translation`,
      explanation: `Short context in ${nativeLanguage}`,
      partOfSpeech: "Noun/Verb/etc.",
      exampleSentence: {
        original: "A practical sentence written strictly in the EXACT SAME language as the selected text",
        translation: `Translation of the sentence in ${nativeLanguage}`
      },
      pronunciation: "Short phonetic guide",
      pinyin: "Standard Pinyin with tone marks ONLY if Chinese, else null",
      quiz: {
        question: `Short recall question in ${nativeLanguage}`,
        answer: "Short answer"
      }
    }),
    "Rules: Be concise. Return JSON without markdown fences. Set pinyin to null for non-Chinese text.",
    `Selected text: ${text}`
  ].join("\n");
}

function parseJsonPayload(rawText) {
  const trimmed = rawText.trim();

  try {
    return JSON.parse(trimmed);
  } catch {
    const match = trimmed.match(/\{[\s\S]*\}/);
    if (!match) {
      throw new Error("Could not parse the response");
    }
    return JSON.parse(match[0]);
  }
}

function normalizeField(value, fallback = "") {
  if (typeof value !== "string") {
    return fallback;
  }
  return value.trim();
}

function normalizeQuiz(quiz) {
  if (!quiz || typeof quiz !== "object") {
    return null;
  }

  const question = normalizeField(quiz.question);
  const answer = normalizeField(quiz.answer);

  if (!question || !answer) {
    return null;
  }

  return { question, answer };
}

export function normalizeResult(parsed, isFallback = false) {
  let exampleSentence = null;
  if (parsed.exampleSentence && typeof parsed.exampleSentence === "object") {
    const original = normalizeField(parsed.exampleSentence.original);
    const translation = normalizeField(parsed.exampleSentence.translation);
    if (original && translation) exampleSentence = { original, translation };
  }

  const result = {
    translation: normalizeField(parsed.translation),
    explanation: normalizeField(parsed.explanation),
    partOfSpeech: normalizeField(parsed.partOfSpeech),
    exampleSentence,
    pronunciation: normalizeField(parsed.pronunciation),
    pinyin: normalizeField(parsed.pinyin, null),
    quiz: normalizeQuiz(parsed.quiz),
    isFallback,
  };

  if (!result.translation && !result.explanation && !result.pronunciation && !result.pinyin) {
    throw new Error("The response was empty");
  }

  return result;
}

function mapProviderError(response, errorText) {
  if (response.status === 401 || response.status === 403) {
    return new Error("API key rejected. Check your provider settings.");
  }

  if (response.status === 404) {
    return new Error("Model not found. Try another model.");
  }

  if (response.status === 429) {
    return new Error("Rate limited. Wait a moment and try again.");
  }

  if (response.status >= 500) {
    return new Error("Provider error. Try again in a moment.");
  }

  return new Error(errorText || "Request failed");
}

function mapNetworkError(error) {
  if (error.name === "AbortError") {
    return new Error("The request timed out. Try again or use a faster model.");
  }

  return error;
}

export async function understandText({ text, providerConfig, nativeLanguage = "English" }) {
  const provider = getProvider(providerConfig.provider);
  const apiKey = (providerConfig.apiKey || "").trim();
  const langCode = getLangCode(nativeLanguage);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    if (!apiKey) {
      // Hybrid Fallback Architecture: if NO key, use MyMemory free API
      const fallbackUrl = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=Autodetect|${langCode}`;
      const fallbackResponse = await fetch(fallbackUrl, { signal: controller.signal });
      
      if (!fallbackResponse.ok) {
        throw new Error("Fallback translation service unavailable.");
      }
      
      const fallbackData = await fallbackResponse.json();
      const translation = fallbackData.responseData?.translatedText || "Could not translate text.";
      
      return normalizeResult({
        translation: translation,
        explanation: `Basic translation provided. 🔒 Add an API key for grammar context and examples.`,
        partOfSpeech: "",
        exampleSentence: null,
        pronunciation: "",
        pinyin: null,
        quiz: null,
      }, true);
    }

    const response = await fetch(`${provider.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: providerConfig.model || provider.defaultModel,
        temperature: 0.2,
        messages: [
          {
            role: "system",
            content: "Return strict JSON for LexiDrop.",
          },
          {
            role: "user",
            content: buildPrompt(text, nativeLanguage),
          },
        ],
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw mapProviderError(response, errorText);
    }

    const payload = await response.json();
    const content = payload?.choices?.[0]?.message?.content;

    if (typeof content !== "string" || !content.trim()) {
      throw new Error("The model returned an empty response");
    }

    return normalizeResult(parseJsonPayload(content), false);
  } catch (error) {
    throw mapNetworkError(error);
  } finally {
    clearTimeout(timeoutId);
  }
}
