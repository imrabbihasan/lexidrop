import { STORAGE_KEYS } from "./constants.js";
import { detectItemType, detectSourceLanguage } from "./memory.js";

function normalizeText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function uniqueId() {
  return `result_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function normalizeQuiz(quiz) {
  if (!quiz || typeof quiz !== "object") {
    return null;
  }

  const question = normalizeText(quiz.question);
  const answer = normalizeText(quiz.answer);

  if (!question || !answer) {
    return null;
  }

  return { question, answer };
}

export function buildCurrentResult({ text, result, source = {} }) {
  const originalText = normalizeText(text);
  const sourceLanguage = source.language || detectSourceLanguage(originalText);

  return {
    id: uniqueId(),
    originalText,
    translationBn: normalizeText(result.translation),
    explanation: normalizeText(result.explanation),
    pronunciation: normalizeText(result.pronunciation),
    quiz: normalizeQuiz(result.quiz),
    sourceLanguage,
    itemType: detectItemType(originalText),
    sourceUrl: normalizeText(source.pageUrl || source.sourceUrl),
    sourceDomain: normalizeText(source.pageDomain || source.sourceDomain),
    pageTitle: normalizeText(source.pageTitle),
    timestamp: Date.now(),
  };
}

export function normalizeCurrentResult(value) {
  if (!value || typeof value !== "object") {
    return null;
  }

  const originalText = normalizeText(value.originalText);
  if (!originalText) {
    return null;
  }

  return {
    id: normalizeText(value.id) || uniqueId(),
    originalText,
    translationBn: normalizeText(value.translationBn || value.translatedText),
    explanation: normalizeText(value.explanation),
    pronunciation: normalizeText(value.pronunciation),
    quiz: normalizeQuiz(value.quiz),
    sourceLanguage:
      normalizeText(value.sourceLanguage) || detectSourceLanguage(originalText),
    itemType: normalizeText(value.itemType) || detectItemType(originalText),
    sourceUrl: normalizeText(value.sourceUrl || value.pageUrl),
    sourceDomain: normalizeText(value.sourceDomain || value.pageDomain),
    pageTitle: normalizeText(value.pageTitle),
    timestamp: Number.isFinite(value.timestamp)
      ? value.timestamp
      : Number.isFinite(value.updatedAt)
        ? value.updatedAt
        : Date.now(),
  };
}

export async function getCurrentResult() {
  const stored = await chrome.storage.local.get(STORAGE_KEYS.CURRENT_RESULT);
  return normalizeCurrentResult(stored[STORAGE_KEYS.CURRENT_RESULT]);
}

export async function setCurrentResult(result) {
  const normalized = normalizeCurrentResult(result);
  if (!normalized) {
    await chrome.storage.local.remove(STORAGE_KEYS.CURRENT_RESULT);
    return null;
  }

  await chrome.storage.local.set({
    [STORAGE_KEYS.CURRENT_RESULT]: normalized,
  });

  return normalized;
}

export async function clearCurrentResult() {
  await chrome.storage.local.remove(STORAGE_KEYS.CURRENT_RESULT);
}

