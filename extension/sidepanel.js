import { EMPTY_RESULT_TEXT, MESSAGE_TYPES } from "./lib/constants.js";
import { understandText } from "./lib/ai.js";
import {
  buildCurrentResult,
  getCurrentResult,
  setCurrentResult,
} from "./lib/current-result.js";
import {
  addHistoryItem,
  buildConstellationMap,
  buildLookupRecord,
  buildReviewSession,
  createFingerprint,
  deleteHistoryItem,
  deleteSavedItem,
  filterMemoryItems,
  formatRelativeDate,
  getHistoryItems,
  getSavedItems,
  markSavedItemReviewed,
  saveLookupItem,
  updateSavedItemMeta,
} from "./lib/memory.js";
import {
  clearPendingSelection,
  getPendingSelection,
  getProviderConfig,
} from "./lib/storage.js";

const STAGE_COLORS = {
  new: "#9aa6ba",
  reviewed: "#84bdf9",
  strong: "#9ee1be",
  mastered: "#f1d38b",
};

const elements = {
  panels: Array.from(document.querySelectorAll("[data-panel]")),
  tabs: Array.from(document.querySelectorAll("[data-tab]")),
  emptyState: document.getElementById("empty-state"),
  errorState: document.getElementById("error-state"),
  errorMessage: document.getElementById("error-message"),
  loadingIndicator: document.getElementById("loading-indicator"),
  resultCard: document.getElementById("result-card"),
  resultStatus: document.getElementById("result-status"),
  retryButton: document.getElementById("retry-button"),
  errorRetry: document.getElementById("error-retry"),
  heroSettings: document.getElementById("hero-settings"),
  errorSettings: document.getElementById("error-settings"),
  openSettings: document.getElementById("open-settings"),
  translation: document.getElementById("translation"),
  explanation: document.getElementById("explanation"),
  pronunciation: document.getElementById("pronunciation"),
  sourceText: document.getElementById("source-text"),
  sourceMeta: document.getElementById("source-meta"),
  quizSection: document.getElementById("quiz-section"),
  quizQuestion: document.getElementById("quiz-question"),
  quizAnswer: document.getElementById("quiz-answer"),
  saveButton: document.getElementById("save-button"),
  saveFeedback: document.getElementById("save-feedback"),
  savedEditor: document.getElementById("saved-editor"),
  savedTag: document.getElementById("saved-tag"),
  savedNote: document.getElementById("saved-note"),
  updateSavedMeta: document.getElementById("update-saved-meta"),
  metaFeedback: document.getElementById("meta-feedback"),
  savedList: document.getElementById("saved-list"),
  savedCount: document.getElementById("saved-count"),
  savedSearch: document.getElementById("saved-search"),
  savedType: document.getElementById("saved-type"),
  savedLanguage: document.getElementById("saved-language"),
  historyList: document.getElementById("history-list"),
  historyCount: document.getElementById("history-count"),
  historySearch: document.getElementById("history-search"),
  historyLanguage: document.getElementById("history-language"),
  reviewEmpty: document.getElementById("review-empty"),
  reviewSession: document.getElementById("review-session"),
  reviewProgress: document.getElementById("review-progress"),
  reviewCard: document.getElementById("review-card"),
  startReview: document.getElementById("start-review"),
  nextReview: document.getElementById("next-review"),
  mapEmpty: document.getElementById("map-empty"),
  mapStack: document.getElementById("map-stack"),
  mapSvg: document.getElementById("map-svg"),
  mapDetail: document.getElementById("map-detail"),
  mapCount: document.getElementById("map-count"),
};

const state = {
  activeTab: "result",
  currentLookup: null,
  currentSavedId: null,
  pendingSelection: null,
  loading: false,
  savedItems: [],
  historyItems: [],
  filters: {
    savedQuery: "",
    savedType: "all",
    savedLanguage: "all",
    historyQuery: "",
    historyLanguage: "all",
  },
  review: {
    items: [],
    index: 0,
    reveal: false,
    selectedOption: null,
    markedIds: new Set(),
  },
  mapSelectedId: null,
};

function setHidden(element, hidden) {
  element.classList.toggle("hidden", hidden);
}

function openSettings() {
  chrome.runtime.openOptionsPage();
}

function setActiveTab(tab) {
  state.activeTab = tab;
  elements.tabs.forEach((button) => {
    button.classList.toggle("active", button.dataset.tab === tab);
  });
  elements.panels.forEach((panel) => {
    setHidden(panel, panel.dataset.panel !== tab);
  });
}

function formatLabel(value) {
  if (!value) return "Unknown";
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function truncateLabel(value, max = 18) {
  const text = String(value || "");
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

function getSavedMatch(lookup) {
  if (!lookup) return null;
  const fingerprint = lookup.fingerprint || createFingerprint(lookup.originalText, lookup.sourceLanguage);
  return state.savedItems.find((item) => item.fingerprint === fingerprint) || null;
}

function renderIdle() {
  state.loading = false;
  state.currentLookup = null;
  state.currentSavedId = null;

  setHidden(elements.loadingIndicator, true);
  setHidden(elements.resultCard, true);
  setHidden(elements.errorState, true);
  setHidden(elements.retryButton, true);
  setHidden(elements.savedEditor, true);
  setHidden(elements.emptyState, false);

  elements.emptyState.querySelector("h2").textContent = EMPTY_RESULT_TEXT.idleTitle;
  elements.emptyState.querySelector("p").textContent = EMPTY_RESULT_TEXT.idleBody;
}

function renderLoading(text) {
  state.loading = true;
  state.currentSavedId = null;

  setHidden(elements.emptyState, true);
  setHidden(elements.errorState, true);
  setHidden(elements.resultCard, true);
  setHidden(elements.loadingIndicator, false);
  setHidden(elements.retryButton, true);
  setHidden(elements.saveFeedback, true);
  setHidden(elements.metaFeedback, true);
  setHidden(elements.savedEditor, true);

  elements.sourceText.textContent = text;
}

function renderError(message) {
  state.loading = false;

  setHidden(elements.loadingIndicator, true);
  setHidden(elements.emptyState, true);
  setHidden(elements.resultCard, true);
  setHidden(elements.errorState, false);
  setHidden(elements.retryButton, Boolean(state.pendingSelection?.text || state.currentLookup?.originalText));

  elements.errorMessage.textContent = message;
}

function renderSourceMeta(lookup, savedMatch) {
  const chips = [
    lookup.sourceLanguage ? `<span class="meta-chip">${escapeHtml(formatLabel(lookup.sourceLanguage))}</span>` : "",
    lookup.itemType ? `<span class="meta-chip">${escapeHtml(formatLabel(lookup.itemType))}</span>` : "",
    lookup.pageDomain ? `<span class="meta-chip">${escapeHtml(lookup.pageDomain)}</span>` : "",
    lookup.pageTitle ? `<span class="meta-chip">${escapeHtml(lookup.pageTitle)}</span>` : "",
    savedMatch?.progressStage
      ? `<span class="meta-chip stage-${escapeHtml(savedMatch.progressStage)}">${escapeHtml(formatLabel(savedMatch.progressStage))}</span>`
      : "",
  ].filter(Boolean);

  elements.sourceMeta.innerHTML = chips.join("");
}

function renderResult(lookup) {
  state.loading = false;
  state.currentLookup = lookup;

  const savedMatch = getSavedMatch(lookup);
  state.currentSavedId = savedMatch?.id || null;

  setHidden(elements.loadingIndicator, true);
  setHidden(elements.emptyState, true);
  setHidden(elements.errorState, true);
  setHidden(elements.resultCard, false);
  setHidden(elements.retryButton, false);
  setHidden(elements.saveFeedback, true);
  setHidden(elements.metaFeedback, true);

  elements.resultStatus.textContent = savedMatch ? formatLabel(savedMatch.progressStage) : "Ready";
  elements.sourceText.textContent = lookup.originalText;
  elements.translation.textContent = lookup.translatedText || "No translation returned.";
  elements.explanation.textContent = lookup.explanation || "No explanation returned.";
  elements.pronunciation.textContent = lookup.pronunciation || "No pronunciation returned.";
  renderSourceMeta(lookup, savedMatch);

  if (lookup.quiz) {
    setHidden(elements.quizSection, false);
    elements.quizQuestion.textContent = lookup.quiz.question;
    elements.quizAnswer.textContent = `Answer: ${lookup.quiz.answer}`;
  } else {
    setHidden(elements.quizSection, true);
    elements.quizQuestion.textContent = "";
    elements.quizAnswer.textContent = "";
  }

  if (savedMatch) {
    setHidden(elements.savedEditor, false);
    elements.savedTag.value = savedMatch.tag || "";
    elements.savedNote.value = savedMatch.note || "";
    elements.saveButton.textContent = "Saved";
  } else {
    setHidden(elements.savedEditor, true);
    elements.savedTag.value = "";
    elements.savedNote.value = "";
    elements.saveButton.textContent = "Save";
  }
}

function toResultViewModel(record) {
  if (!record) {
    return null;
  }

  return {
    ...record,
    translatedText: record.translatedText ?? record.translationBn ?? "",
    pageUrl: record.pageUrl ?? record.sourceUrl ?? "",
    lookedUpAt: record.lookedUpAt ?? record.timestamp ?? Date.now(),
    updatedAt: record.updatedAt ?? record.timestamp ?? Date.now(),
  };
}

async function persistCurrentResult(lookup) {
  const persisted = await setCurrentResult(
    lookup.translationBn
      ? lookup
      : buildCurrentResult({
          text: lookup.originalText,
          result: {
            translation: lookup.translatedText,
            explanation: lookup.explanation,
            pronunciation: lookup.pronunciation,
            quiz: lookup.quiz,
          },
          source: {
            language: lookup.sourceLanguage,
            pageUrl: lookup.pageUrl,
            pageDomain: lookup.pageDomain,
            pageTitle: lookup.pageTitle,
          },
        })
  );
  state.currentLookup = toResultViewModel(persisted);
  return state.currentLookup;
}

function currentReviewItem() {
  return state.review.items[state.review.index] || null;
}

function renderSavedList() {
  const filtered = filterMemoryItems(state.savedItems, {
    query: state.filters.savedQuery,
    type: state.filters.savedType,
    language: state.filters.savedLanguage,
  });

  elements.savedCount.textContent = `${filtered.length} item${filtered.length === 1 ? "" : "s"}`;

  if (!filtered.length) {
    elements.savedList.innerHTML = `<div class="soft-box"><h3>No saved items</h3><p class="empty-copy">Save useful results from the Result or History tabs.</p></div>`;
    return;
  }

  elements.savedList.innerHTML = filtered
    .map(
      (item) => `
        <article class="list-card">
          <div class="meta-line">
            <span class="meta-chip">${escapeHtml(formatLabel(item.sourceLanguage))}</span>
            <span class="meta-chip">${escapeHtml(formatLabel(item.itemType))}</span>
            <span class="meta-chip">${escapeHtml(formatLabel(item.progressStage))}</span>
            <span class="meta-chip">${escapeHtml(formatRelativeDate(item.savedAt))}</span>
            ${item.tag ? `<span class="meta-chip">${escapeHtml(item.tag)}</span>` : ""}
          </div>
          <strong>${escapeHtml(item.originalText)}</strong>
          <p>${escapeHtml(item.translatedText || item.explanation || "No preview available.")}</p>
          <div class="muted">${escapeHtml(item.pageTitle || item.pageDomain || "No source details")}</div>
          ${item.note ? `<div class="muted">Note: ${escapeHtml(item.note)}</div>` : ""}
          <div class="action-row">
            <button class="secondary-button" data-action="open-saved" data-id="${item.id}" type="button">Open</button>
            <button class="secondary-button" data-action="review-saved" data-id="${item.id}" type="button">Review</button>
            <button class="secondary-button" data-action="delete-saved" data-id="${item.id}" type="button">Delete</button>
          </div>
        </article>
      `
    )
    .join("");
}

function renderHistoryList() {
  const filtered = filterMemoryItems(state.historyItems, {
    query: state.filters.historyQuery,
    language: state.filters.historyLanguage,
  });

  elements.historyCount.textContent = `${filtered.length} item${filtered.length === 1 ? "" : "s"}`;

  if (!filtered.length) {
    elements.historyList.innerHTML = `<div class="soft-box"><h3>No recent lookups</h3><p class="empty-copy">History fills automatically after successful results.</p></div>`;
    return;
  }

  elements.historyList.innerHTML = filtered
    .map(
      (item) => `
        <article class="list-card">
          <div class="meta-line">
            <span class="meta-chip">${escapeHtml(formatLabel(item.sourceLanguage))}</span>
            <span class="meta-chip">${escapeHtml(formatLabel(item.itemType))}</span>
            <span class="meta-chip">${escapeHtml(formatRelativeDate(item.lookedUpAt))}</span>
          </div>
          <strong>${escapeHtml(item.originalText)}</strong>
          <p>${escapeHtml(item.translatedText || item.explanation || "No preview available.")}</p>
          <div class="muted">${escapeHtml(item.pageTitle || item.pageDomain || "No source details")}</div>
          <div class="action-row">
            <button class="secondary-button" data-action="open-history" data-id="${item.id}" type="button">Open</button>
            <button class="secondary-button" data-action="save-history" data-id="${item.id}" type="button">Save</button>
            <button class="secondary-button" data-action="delete-history" data-id="${item.id}" type="button">Delete</button>
          </div>
        </article>
      `
    )
    .join("");
}

function renderReviewState() {
  if (!state.savedItems.length) {
    setHidden(elements.reviewEmpty, false);
    setHidden(elements.reviewSession, true);
    elements.reviewEmpty.innerHTML = `<h3>Nothing to review yet</h3><p class="empty-copy">Save a few lookups first. Review uses your saved items only.</p>`;
    return;
  }

  if (!state.review.items.length) {
    setHidden(elements.reviewEmpty, false);
    setHidden(elements.reviewSession, true);
    elements.reviewEmpty.innerHTML = `<h3>Ready to review</h3><p class="empty-copy">Start a quick session with a few saved items.</p>`;
    return;
  }

  const item = currentReviewItem();
  if (!item) {
    setHidden(elements.reviewEmpty, false);
    setHidden(elements.reviewSession, true);
    elements.reviewEmpty.innerHTML = `<h3>Review complete</h3><p class="empty-copy">Run another short session whenever you want.</p>`;
    return;
  }

  setHidden(elements.reviewEmpty, true);
  setHidden(elements.reviewSession, false);

  const optionsMarkup = item.options.length
    ? `<div class="choice-list">${item.options
        .map((option) => {
          const isSelected = state.review.selectedOption === option;
          const isCorrect = option === item.translatedText;
          const stateClass = !state.review.reveal
            ? ""
            : isCorrect
              ? "correct"
              : isSelected
                ? "incorrect"
                : "";

          return `<button class="choice-button ${stateClass}" data-review-option="${escapeHtml(option)}" type="button">${escapeHtml(option)}</button>`;
        })
        .join("")}</div>`
    : "";

  elements.reviewProgress.textContent = `${state.review.index + 1} / ${state.review.items.length}`;
  elements.reviewCard.innerHTML = `
    <div class="review-stack">
      <div class="meta-line">
        <span class="meta-chip">${escapeHtml(formatLabel(item.sourceLanguage))}</span>
        <span class="meta-chip">${escapeHtml(formatLabel(item.itemType))}</span>
        <span class="meta-chip">${escapeHtml(formatLabel(item.progressStage))}</span>
      </div>
      <div>
        <div class="section-title">Prompt</div>
        <h3>${escapeHtml(item.originalText)}</h3>
      </div>
      ${optionsMarkup}
      <div class="action-row">
        <button id="reveal-review" class="secondary-button" type="button">${state.review.reveal ? "Hide answer" : "Reveal answer"}</button>
        <button id="open-review-result" class="secondary-button" type="button">Open in Result</button>
      </div>
      ${state.review.reveal ? `<div class="soft-box"><div class="section-title">Answer</div><div class="translation">${escapeHtml(item.translatedText)}</div><div class="muted" style="margin-top: 8px;">${escapeHtml(item.explanation || item.pronunciation || "No extra context")}</div></div>` : ""}
    </div>
  `;
}

function buildMapNodeMarkup(node, selectedId) {
  const color = STAGE_COLORS[node.item.progressStage] || STAGE_COLORS.new;
  const selected = node.id === selectedId;
  const ring = selected
    ? `<circle cx="${node.x}" cy="${node.y}" r="${node.radius + 5}" fill="none" stroke="${color}" stroke-opacity="0.45" stroke-width="1.5" />`
    : "";
  const glow = `<circle cx="${node.x}" cy="${node.y}" r="${node.radius + 7}" fill="${color}" fill-opacity="0.08" />`;

  return `
    ${ring}
    ${glow}
    <circle cx="${node.x}" cy="${node.y}" r="${node.radius}" fill="${color}" fill-opacity="0.9" stroke="rgba(255,255,255,0.7)" stroke-width="${selected ? 1.4 : 0.8}" data-map-id="${node.id}">
      <title>${escapeHtml(node.item.originalText)}</title>
    </circle>
  `;
}

function renderMap() {
  elements.mapCount.textContent = `${state.savedItems.length} node${state.savedItems.length === 1 ? "" : "s"}`;

  if (!state.savedItems.length) {
    setHidden(elements.mapEmpty, false);
    setHidden(elements.mapStack, true);
    return;
  }

  const map = buildConstellationMap(state.savedItems);
  const selectedId = state.mapSelectedId && state.savedItems.some((item) => item.id === state.mapSelectedId)
    ? state.mapSelectedId
    : state.savedItems[0]?.id;
  state.mapSelectedId = selectedId;
  const selectedItem = state.savedItems.find((item) => item.id === selectedId) || null;

  setHidden(elements.mapEmpty, true);
  setHidden(elements.mapStack, false);
  elements.mapSvg.setAttribute("viewBox", `0 0 ${map.width} ${map.height}`);

  const clusters = map.clusters
    .map(
      (cluster) => `
        <text x="${cluster.center.x}" y="${cluster.center.y - 28}" fill="rgba(255,255,255,0.54)" font-size="10" text-anchor="middle" letter-spacing="0.08em">${escapeHtml(cluster.label.toUpperCase())}</text>
      `
    )
    .join("");

  const edges = map.edges
    .map(
      (edge) => `<line x1="${edge.from.x}" y1="${edge.from.y}" x2="${edge.to.x}" y2="${edge.to.y}" stroke="rgba(132, 189, 249, 0.18)" stroke-width="1" />`
    )
    .join("");

  const nodes = map.nodes.map((node) => buildMapNodeMarkup(node, selectedId)).join("");
  elements.mapSvg.innerHTML = `${clusters}${edges}${nodes}`;

  if (!selectedItem) {
    elements.mapDetail.innerHTML = `<div class="soft-box"><h3>No node selected</h3><p class="empty-copy">Pick a star to inspect it.</p></div>`;
    return;
  }

  elements.mapDetail.innerHTML = `
    <div class="meta-line">
      <span class="meta-chip">${escapeHtml(formatLabel(selectedItem.sourceLanguage))}</span>
      <span class="meta-chip">${escapeHtml(formatLabel(selectedItem.itemType))}</span>
      <span class="meta-chip stage-${escapeHtml(selectedItem.progressStage)}">${escapeHtml(formatLabel(selectedItem.progressStage))}</span>
      ${selectedItem.tag ? `<span class="meta-chip">${escapeHtml(selectedItem.tag)}</span>` : ""}
    </div>
    <div>
      <div class="section-title">Original text</div>
      <h3>${escapeHtml(selectedItem.originalText)}</h3>
    </div>
    <div>
      <div class="section-title">Translation</div>
      <div class="translation">${escapeHtml(selectedItem.translatedText || "No translation")}</div>
    </div>
    <div>
      <div class="section-title">Explanation</div>
      <div>${escapeHtml(selectedItem.explanation || "No explanation")}</div>
    </div>
    <div>
      <div class="section-title">Pronunciation</div>
      <div>${escapeHtml(selectedItem.pronunciation || "No pronunciation")}</div>
    </div>
    ${selectedItem.note ? `<div><div class="section-title">Note</div><div>${escapeHtml(selectedItem.note)}</div></div>` : ""}
    <div class="muted">${escapeHtml(selectedItem.pageTitle || selectedItem.pageDomain || "No source details")}</div>
    <div class="map-actions">
      <button class="secondary-button" data-map-action="open" data-id="${selectedItem.id}" type="button">Open in Result</button>
      <button class="secondary-button" data-map-action="review" data-id="${selectedItem.id}" type="button">Review this</button>
      <button class="secondary-button" data-map-action="delete" data-id="${selectedItem.id}" type="button">Delete</button>
    </div>
  `;
}

async function refreshMemory() {
  const [savedItems, historyItems] = await Promise.all([getSavedItems(), getHistoryItems()]);
  state.savedItems = savedItems;
  state.historyItems = historyItems;
  renderSavedList();
  renderHistoryList();
  renderReviewState();
  renderMap();

  if (state.currentLookup) {
    const replacement = getSavedMatch(state.currentLookup) || state.currentLookup;
    await setCurrentResult(replacement);
    renderResult(replacement);
  }
}

async function runUnderstanding(selection) {
  const normalizedText = (selection?.text || "").trim();
  if (!normalizedText) {
    renderIdle();
    return;
  }

  state.pendingSelection = selection;
  setActiveTab("result");
  renderLoading(normalizedText);

  try {
    const providerConfig = await getProviderConfig();
    const result = await understandText({
      text: normalizedText,
      providerConfig,
    });

    const lookup = buildLookupRecord({
      text: normalizedText,
      result,
      source: selection,
    });

    await addHistoryItem(lookup);
    const persistedLookup = await persistCurrentResult(lookup);
    await refreshMemory();
    renderResult(persistedLookup);
  } catch (error) {
    renderError(error.message || "Could not understand the selected text.");
  }
}

async function initializePanel() {
  const [savedItems, historyItems, currentResult, pending] = await Promise.all([
    getSavedItems(),
    getHistoryItems(),
    getCurrentResult(),
    getPendingSelection(),
  ]);

  state.savedItems = savedItems;
  state.historyItems = historyItems;
  renderSavedList();
  renderHistoryList();
  renderReviewState();
  renderMap();

  if (currentResult) {
    state.currentLookup = toResultViewModel(currentResult);
    renderResult(state.currentLookup);
  } else {
    renderIdle();
  }

  if (!pending?.text) {
    return;
  }

  await clearPendingSelection();
  await runUnderstanding(pending);
}

async function handleSaveCurrent() {
  if (!state.currentLookup) return;

  const existing = getSavedMatch(state.currentLookup);
  const savedItem = await saveLookupItem(state.currentLookup, {
    note: existing?.note || "",
    tag: existing?.tag || "",
  });

  await persistCurrentResult(savedItem);
  state.mapSelectedId = savedItem.id;
  await refreshMemory();
  renderResult(savedItem);
  elements.saveFeedback.textContent = existing ? "Updated in Saved" : "Saved";
  setHidden(elements.saveFeedback, false);
}

async function handleUpdateSavedMeta() {
  if (!state.currentSavedId) return;

  const updated = await updateSavedItemMeta(state.currentSavedId, {
    note: elements.savedNote.value,
    tag: elements.savedTag.value,
  });

  if (!updated) return;

  await persistCurrentResult(updated);
  state.mapSelectedId = updated.id;
  await refreshMemory();
  renderResult(updated);
  elements.metaFeedback.textContent = "Updated";
  setHidden(elements.metaFeedback, false);
}

async function openLookupInResult(item) {
  state.pendingSelection = {
    text: item.originalText,
    pageTitle: item.pageTitle,
    pageUrl: item.pageUrl,
    pageDomain: item.pageDomain,
    language: item.sourceLanguage,
  };
  await persistCurrentResult(item);
  setActiveTab("result");
  renderResult(item);
}

function startReviewSession(prioritizedId = null) {
  state.review.items = buildReviewSession(state.savedItems, 5, prioritizedId);
  state.review.index = 0;
  state.review.reveal = false;
  state.review.selectedOption = null;
  state.review.markedIds = new Set();
  setActiveTab("review");
  renderReviewState();
}

async function markCurrentReviewItem() {
  const item = currentReviewItem();
  if (!item || state.review.markedIds.has(item.id)) {
    return;
  }

  state.review.markedIds.add(item.id);
  await markSavedItemReviewed(item.id);
  await refreshMemory();
}

function nextReviewItem() {
  state.review.index += 1;
  state.review.reveal = false;
  state.review.selectedOption = null;
  renderReviewState();
}

async function handleSavedListClick(event) {
  const action = event.target.dataset.action;
  const id = event.target.dataset.id;
  if (!action || !id) return;

  const item = state.savedItems.find((entry) => entry.id === id);
  if (!item) return;

  if (action === "open-saved") {
    await openLookupInResult(item);
    return;
  }

  if (action === "review-saved") {
    startReviewSession(id);
    return;
  }

  if (action === "delete-saved") {
    await deleteSavedItem(id);
    if (state.currentSavedId === id) {
      state.currentSavedId = null;
      setHidden(elements.savedEditor, true);
      elements.saveButton.textContent = "Save";
      elements.resultStatus.textContent = "Ready";
    }
    if (state.mapSelectedId === id) {
      state.mapSelectedId = null;
    }
    await refreshMemory();
  }
}

async function handleHistoryListClick(event) {
  const action = event.target.dataset.action;
  const id = event.target.dataset.id;
  if (!action || !id) return;

  const item = state.historyItems.find((entry) => entry.id === id);
  if (!item) return;

  if (action === "open-history") {
    await openLookupInResult(item);
    return;
  }

  if (action === "save-history") {
    const savedItem = await saveLookupItem(item);
    state.mapSelectedId = savedItem.id;
    await refreshMemory();
    return;
  }

  if (action === "delete-history") {
    await deleteHistoryItem(id);
    await refreshMemory();
  }
}

async function handleReviewClick(event) {
  const option = event.target.dataset.reviewOption;
  if (option) {
    state.review.selectedOption = option;
    state.review.reveal = true;
    await markCurrentReviewItem();
    renderReviewState();
    return;
  }

  if (event.target.id === "reveal-review") {
    state.review.reveal = !state.review.reveal;
    if (state.review.reveal) {
      await markCurrentReviewItem();
    }
    renderReviewState();
    return;
  }

  if (event.target.id === "open-review-result") {
    const item = currentReviewItem();
    if (item) await openLookupInResult(item);
  }
}

async function handleMapClick(event) {
  const nodeId = event.target.dataset.mapId;
  if (nodeId) {
    state.mapSelectedId = nodeId;
    renderMap();
    return;
  }

  const action = event.target.dataset.mapAction;
  const id = event.target.dataset.id;
  if (!action || !id) return;

  const item = state.savedItems.find((entry) => entry.id === id);
  if (!item) return;

  if (action === "open") {
    await openLookupInResult(item);
    return;
  }

  if (action === "review") {
    startReviewSession(id);
    return;
  }

  if (action === "delete") {
    await deleteSavedItem(id);
    state.mapSelectedId = null;
    await refreshMemory();
  }
}

function registerEvents() {
  chrome.runtime.onMessage.addListener((message) => {
    if (message?.type !== MESSAGE_TYPES.UNDERSTAND_TEXT_REQUEST) {
      return;
    }

    if (message?.payload?.text) {
      runUnderstanding(message.payload);
    }
  });

  elements.tabs.forEach((button) => {
    button.addEventListener("click", () => setActiveTab(button.dataset.tab));
  });

  elements.retryButton.addEventListener("click", () => runUnderstanding(state.pendingSelection || { text: state.currentLookup?.originalText || "" }));
  elements.errorRetry.addEventListener("click", () => runUnderstanding(state.pendingSelection || { text: state.currentLookup?.originalText || "" }));
  elements.heroSettings.addEventListener("click", openSettings);
  elements.errorSettings.addEventListener("click", openSettings);
  elements.openSettings.addEventListener("click", openSettings);
  elements.saveButton.addEventListener("click", handleSaveCurrent);
  elements.updateSavedMeta.addEventListener("click", handleUpdateSavedMeta);
  elements.savedList.addEventListener("click", handleSavedListClick);
  elements.historyList.addEventListener("click", handleHistoryListClick);
  elements.startReview.addEventListener("click", () => startReviewSession());
  elements.nextReview.addEventListener("click", nextReviewItem);
  elements.reviewSession.addEventListener("click", handleReviewClick);
  elements.mapSvg.addEventListener("click", handleMapClick);
  elements.mapDetail.addEventListener("click", handleMapClick);

  elements.savedSearch.addEventListener("input", (event) => {
    state.filters.savedQuery = event.target.value;
    renderSavedList();
  });
  elements.savedType.addEventListener("change", (event) => {
    state.filters.savedType = event.target.value;
    renderSavedList();
  });
  elements.savedLanguage.addEventListener("change", (event) => {
    state.filters.savedLanguage = event.target.value;
    renderSavedList();
  });
  elements.historySearch.addEventListener("input", (event) => {
    state.filters.historyQuery = event.target.value;
    renderHistoryList();
  });
  elements.historyLanguage.addEventListener("change", (event) => {
    state.filters.historyLanguage = event.target.value;
    renderHistoryList();
  });
}

registerEvents();
initializePanel();
