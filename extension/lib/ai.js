import { REQUEST_TIMEOUT_MS } from "./constants.js";
import { getProvider } from "./providers.js";

function buildPrompt(text) {
  return [
    "You are LexiDrop, a browser reading assistant for Bengali speakers.",
    "Return valid JSON only.",
    "Do not wrap the JSON in markdown fences.",
    "Output schema:",
    JSON.stringify({
      translation: "Bengali translation of the selected text",
      explanation: "Short contextual explanation in Bengali",
      pronunciation: "Pronunciation guidance in Bengali or simple phonetics",
      pinyin: "Provide precise Mandarin Pinyin with tone marks (e.g. 'nǐ hǎo'), or null if the text is not Chinese.",
      quiz: {
        question: "Optional short recall question in Bengali",
        answer: "Optional short answer",
      },
    }),
    "Rules:",
    "- Keep translation concise and natural.",
    "- Explanation should focus on meaning in context.",
    "- Pronunciation can be brief.",
    "- If the selected text contains Chinese characters, provide standard Mandarin Pinyin with tone marks. Otherwise, set it strictly to null.",
    "- If quiz is not useful, return quiz as null.",
    `Selected text: ${text}`,
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
  const result = {
    translation: normalizeField(parsed.translation),
    explanation: normalizeField(parsed.explanation),
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

export async function understandText({ text, providerConfig }) {
  const provider = getProvider(providerConfig.provider);
  const apiKey = (providerConfig.apiKey || "").trim();

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    if (!apiKey) {
      // Hybrid Fallback Architecture: if NO key, use MyMemory free API
      const fallbackUrl = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=Autodetect|bn`;
      const fallbackResponse = await fetch(fallbackUrl, { signal: controller.signal });
      
      if (!fallbackResponse.ok) {
        throw new Error("Fallback translation service unavailable.");
      }
      
      const fallbackData = await fallbackResponse.json();
      const translation = fallbackData.responseData?.translatedText || "Could not translate text.";
      
      return normalizeResult({
        translation: translation,
        explanation: "Basic translation provided. 🔒 Add an API key for grammar context and examples.",
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
            content: buildPrompt(text),
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
