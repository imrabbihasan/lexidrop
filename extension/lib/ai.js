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
      quiz: {
        question: "Optional short recall question in Bengali",
        answer: "Optional short answer",
      },
    }),
    "Rules:",
    "- Keep translation concise and natural.",
    "- Explanation should focus on meaning in context.",
    "- Pronunciation can be brief.",
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

export function normalizeResult(parsed) {
  const result = {
    translation: normalizeField(parsed.translation),
    explanation: normalizeField(parsed.explanation),
    pronunciation: normalizeField(parsed.pronunciation),
    quiz: normalizeQuiz(parsed.quiz),
  };

  if (!result.translation && !result.explanation && !result.pronunciation) {
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

  if (!apiKey) {
    throw new Error("API key required");
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
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

    return normalizeResult(parseJsonPayload(content));
  } catch (error) {
    throw mapNetworkError(error);
  } finally {
    clearTimeout(timeoutId);
  }
}
