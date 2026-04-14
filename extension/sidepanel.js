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
  clearHistoryItems,
  getSavedItems,
  markSavedItemReviewed,
  saveLookupItem,
  updateSavedItemMeta,
} from "./lib/memory.js";
import {
  clearPendingSelection,
  getNativeLanguage,
  getPendingSelection,
  getProviderConfig,
  getChineseVoiceName,
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
  activeState: document.getElementById("active-state"),
  resultStatus: document.getElementById("result-status"),
  errorRetry: document.getElementById("error-retry"),
  errorSettings: document.getElementById("error-settings"),
  openSettings: document.getElementById("open-settings"),
  clearButton: document.getElementById("clear-button"),
  retryButton: document.getElementById("retry-button"),
  translation: document.getElementById("translation"),
  explanation: document.getElementById("explanation"),
  pronunciation: document.getElementById("pronunciation"),
  sourceText: document.getElementById("source-text"),
  pinyinDisplay: document.getElementById("pinyin-display"),
  sourceMeta: document.getElementById("source-meta"),
  quizSection: document.getElementById("quiz-section"),
  quizQuestion: document.getElementById("quiz-question"),
  posTag: document.getElementById("pos-tag"),
  exampleContainer: document.getElementById("example-container"),
  exampleOriginal: document.getElementById("example-original"),
  exampleTranslation: document.getElementById("example-translation"),
  listenExampleBtn: document.getElementById("listen-example-btn"),
  examplePinyin: document.getElementById("example-pinyin"),
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
  clearHistoryButton: document.getElementById("clear-history-button"),
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
  upsellBanner: document.getElementById("upsell-banner"),
  upsellButton: document.getElementById("upsell-button"),
  listenBtn: document.getElementById("listen-btn"),
  translationLabel: document.getElementById("translation-label"),
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
  feedbackTimeoutId: null,
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

function playAudio(text) {
  if (!('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();

  const isChinese = /[\u4e00-\u9fa5]/.test(text);

  if (isChinese) {
    getChineseVoiceName().then(savedVoiceName => {
      executeVoice(text, 'zh-CN', true, savedVoiceName);
    });
  } else {
    chrome.i18n.detectLanguage(text, (result) => {
      let langCode = 'en-US';
      if (result && result.languages && result.languages.length > 0) {
        langCode = result.languages[0].language;
      }
      executeVoice(text, langCode, false, null);
    });
  }
}

function executeVoice(text, langCode, isChinese, savedVoiceName) {
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = isChinese ? 'zh-CN' : langCode;
  utterance.rate = isChinese ? 0.85 : 0.85;

  const voices = window.speechSynthesis.getVoices();
  if (voices.length > 0) {
    let voice;
    if (isChinese) {
      // First: honour the user's saved voice preference
      if (savedVoiceName) {
        voice = voices.find(v => v.name === savedVoiceName);
      }
      // Fallback: pick best quality Chinese voice automatically
      if (!voice) voice = voices.find(v => (v.name.includes('Natural') || v.name.includes('Online') || v.name.includes('Neural')) && v.lang.includes('zh'));
      if (!voice) voice = voices.find(v => v.name.includes('Microsoft') && v.lang.includes('zh'));
      if (!voice) voice = voices.find(v => v.name.includes('Google 普通话'));
      if (!voice) voice = voices.find(v => v.lang.includes('zh'));
    } else {
      const shortLang = langCode.split('-')[0];
      voice = voices.find(v => v.name.includes('Natural') && v.lang.startsWith(shortLang));
      if (!voice) voice = voices.find(v => v.name.includes('Google') && v.lang.startsWith(shortLang));
      if (!voice) voice = voices.find(v => v.lang.startsWith(shortLang));
      if (!voice) voice = voices.find(v => v.lang.includes('en-US') || v.lang.includes('en-GB'));
    }

    if (voice) {
      utterance.voice = voice;
    }
  }

  window.speechSynthesis.speak(utterance);
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
  setHidden(elements.activeState, true);
  setHidden(elements.errorState, true);
  setHidden(elements.savedEditor, true);
  setHidden(elements.emptyState, false);
}

function renderLoading(text) {
  state.loading = true;
  state.currentSavedId = null;

  setHidden(elements.emptyState, true);
  setHidden(elements.errorState, true);
  setHidden(elements.activeState, true);
  setHidden(elements.loadingIndicator, false);
  setHidden(elements.saveFeedback, true);
  setHidden(elements.metaFeedback, true);
  setHidden(elements.savedEditor, true);

  elements.sourceText.textContent = text;
}

function renderError(message) {
  state.loading = false;

  setHidden(elements.loadingIndicator, true);
  setHidden(elements.emptyState, true);
  setHidden(elements.activeState, true);
  setHidden(elements.errorState, false);

  elements.errorMessage.textContent = message;
}

function renderSourceMeta(lookup, savedMatch) {
  // 1. Clear the container safely
  elements.sourceMeta.textContent = "";

  // 2. Create a helper to build chips without textContent
  const addChip = (text, extraClass = null) => {
    if (!text) return;
    const span = document.createElement('span');
    span.className = 'meta-chip';
    if (extraClass) span.classList.add(extraClass);
    span.textContent = text; // Safe: browser treats this as text, not HTML
    elements.sourceMeta.appendChild(span);
  };

  // 3. Add each piece of data
  addChip(lookup.sourceLanguage ? formatLabel(lookup.sourceLanguage) : null);
  addChip(lookup.itemType ? formatLabel(lookup.itemType) : null);
  addChip(lookup.pageDomain);
  addChip(lookup.pageTitle);

  if (savedMatch?.progressStage) {
    addChip(
      formatLabel(savedMatch.progressStage),
      `stage-${savedMatch.progressStage}`
    );
  }
}

function renderResult(lookup) {
  state.loading = false;
  state.currentLookup = lookup;

  const savedMatch = getSavedMatch(lookup);
  state.currentSavedId = savedMatch?.id || null;

  setHidden(elements.loadingIndicator, true);
  setHidden(elements.emptyState, true);
  setHidden(elements.errorState, true);
  setHidden(elements.activeState, false);
  setHidden(elements.saveFeedback, true);
  setHidden(elements.metaFeedback, true);

  elements.resultStatus.textContent = savedMatch ? formatLabel(savedMatch.progressStage) : "Ready";
  elements.sourceText.textContent = lookup.originalText;
  elements.translation.textContent = lookup.translatedText || lookup.translation || "No translation returned.";
  elements.explanation.textContent = lookup.explanation || "No explanation returned.";
  elements.pronunciation.textContent = lookup.pronunciation || "No pronunciation returned.";

  if (lookup.partOfSpeech) {
    elements.posTag.textContent = lookup.partOfSpeech;
    setHidden(elements.posTag, false);
  } else {
    setHidden(elements.posTag, true);
  }

  if (lookup.exampleSentence) {
    elements.exampleOriginal.textContent = lookup.exampleSentence.original;
    elements.exampleTranslation.textContent = lookup.exampleSentence.translation;

    setHidden(elements.listenExampleBtn, false);

    const isExampleChinese = /[\u4e00-\u9fa5]/.test(lookup.exampleSentence.original);
    if (isExampleChinese && window.pinyinPro) {
      const examplePinyinText = window.pinyinPro.pinyin(lookup.exampleSentence.original);
      elements.examplePinyin.textContent = examplePinyinText;
      setHidden(elements.examplePinyin, false);
    } else {
      setHidden(elements.examplePinyin, true);
    }

    setHidden(elements.exampleContainer, false);
  } else {
    setHidden(elements.exampleContainer, true);
    setHidden(elements.listenExampleBtn, true);
    setHidden(elements.examplePinyin, true);
  }

  const isChinese = /[\u4e00-\u9fa5]/.test(lookup.originalText);
  if (isChinese) {
    if (window.pinyinPro) {
      elements.pinyinDisplay.textContent = window.pinyinPro.pinyin(lookup.originalText);
      setHidden(elements.pinyinDisplay, false);
    } else if (lookup.pinyin) {
      elements.pinyinDisplay.textContent = lookup.pinyin;
      setHidden(elements.pinyinDisplay, false);
    } else {
      setHidden(elements.pinyinDisplay, true);
    }
  } else {
    setHidden(elements.pinyinDisplay, true);
  }

  renderSourceMeta(lookup, savedMatch);

  setHidden(elements.listenBtn, !lookup.originalText);

  if (lookup.isFallback) {
    setHidden(elements.upsellBanner, false);
    setHidden(elements.quizSection, true);
  } else {
    setHidden(elements.upsellBanner, true);
    if (lookup.quiz) {
      setHidden(elements.quizSection, false);
      elements.quizQuestion.textContent = lookup.quiz.question;
      elements.quizAnswer.textContent = `Answer: ${lookup.quiz.answer}`;
    } else {
      setHidden(elements.quizSection, true);
      elements.quizQuestion.textContent = "";
      elements.quizAnswer.textContent = "";
    }
  }

  if (savedMatch) {
    setHidden(elements.savedEditor, false);
    elements.savedTag.value = savedMatch.tag || "";
    elements.savedNote.value = savedMatch.note || "";
    elements.saveButton.textContent = "Saved";
    elements.saveButton.disabled = true;
    elements.saveButton.style.opacity = "0.5";
    elements.saveButton.style.cursor = "not-allowed";
  } else {
    setHidden(elements.savedEditor, true);
    elements.savedTag.value = "";
    elements.savedNote.value = "";
    elements.saveButton.textContent = "Save";
    elements.saveButton.disabled = false;
    elements.saveButton.style.opacity = "1";
    elements.saveButton.style.cursor = "pointer";
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
          partOfSpeech: lookup.partOfSpeech,
          exampleSentence: lookup.exampleSentence,
          pinyin: lookup.pinyin,
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

function getPinyinHtml(item, fontSize = "11px") {
  let pinyinText = item.pinyin || "";
  const isChinese = /[\u4e00-\u9fa5]/.test(item.originalText);
  if (isChinese && window.pinyinPro) {
    pinyinText = window.pinyinPro.pinyin(item.originalText);
  }
  if (!pinyinText) return "";
  return `<div class="pinyin-text" style="margin-top: 0; font-size: ${fontSize}; font-weight: 600; font-style: normal; color: var(--accent); letter-spacing: 0.04em; text-transform: lowercase;">${escapeHtml(pinyinText)}</div>`;
}

function renderSavedList() {
  const filtered = filterMemoryItems(state.savedItems, {
    query: state.filters.savedQuery,
    type: state.filters.savedType,
    language: state.filters.savedLanguage,
  });

  elements.savedCount.textContent = `${filtered.length} item${filtered.length === 1 ? "" : "s"}`;
  elements.savedList.textContent = '';

  if (!filtered.length) {
    elements.savedList.appendChild(createEmptyState("No saved items", "Save results from Result or History."));
    return;
  }

  filtered.forEach(item => {
    elements.savedList.appendChild(createItemCard(item, true));
  });
}

function renderHistoryList() {
  const filtered = filterMemoryItems(state.historyItems, {
    query: state.filters.historyQuery,
    language: state.filters.historyLanguage,
  });

  elements.historyCount.textContent = `${filtered.length} item${filtered.length === 1 ? "" : "s"}`;
  elements.historyList.textContent = '';

  if (!filtered.length) {
    elements.historyList.appendChild(createEmptyState("No recent lookups", "History fills after successful results."));
    return;
  }

  filtered.forEach(item => {
    elements.historyList.appendChild(createItemCard(item, false));
  });
}

function renderReviewState() {
  // 1. CLEAR the raw text bug first
  elements.reviewEmpty.textContent = '';

  // 2. Handle the three "Empty" cases using the helper
  if (!state.savedItems.length) {
    setHidden(elements.reviewEmpty, false);
    setHidden(elements.reviewSession, true);
    elements.reviewEmpty.appendChild(createEmptyState(
      "Nothing to review yet",
      "Save a few lookups first. Review uses your saved items only."
    ));
    return;
  }

  if (!state.review.items.length) {
    setHidden(elements.reviewEmpty, false);
    setHidden(elements.reviewSession, true);
    elements.reviewEmpty.appendChild(createEmptyState(
      "Ready to review",
      "Start a quick session with a few saved items."
    ));
    return;
  }

  const item = currentReviewItem();
  if (!item) {
    setHidden(elements.reviewEmpty, false);
    setHidden(elements.reviewSession, true);
    elements.reviewEmpty.appendChild(createEmptyState(
      "Review complete",
      "Run another short session whenever you want."
    ));
    return;
  }

  // 2. Setup Active Session UI
  setHidden(elements.reviewEmpty, true);
  setHidden(elements.reviewSession, false);
  elements.reviewProgress.textContent = `${state.review.index + 1} / ${state.review.items.length}`;

  // 3. Build the Review Stack safely
  const stack = document.createElement('div');
  stack.className = 'review-stack';

  // --- Meta Chips ---
  const metaLine = document.createElement('div');
  metaLine.className = 'meta-line';
  [formatLabel(item.sourceLanguage), formatLabel(item.itemType), formatLabel(item.progressStage)]
    .forEach(text => {
      const span = document.createElement('span');
      span.className = 'meta-chip';
      span.textContent = text;
      metaLine.appendChild(span);
    });
  stack.appendChild(metaLine);

  // --- Prompt Section ---
  const promptDiv = document.createElement('div');
  const title = document.createElement('div');
  title.className = 'section-title';
  title.textContent = 'Prompt';
  promptDiv.appendChild(title);

  // Handle Pinyin
  if (item.pinyin) {
    const pinyinEl = document.createElement('div');
    pinyinEl.className = 'pinyin-text';
    pinyinEl.style.fontSize = "12px";
    pinyinEl.textContent = item.pinyin;
    promptDiv.appendChild(pinyinEl);
  }

  const h3 = document.createElement('h3');
  h3.style.marginTop = '2px';
  h3.textContent = item.originalText;
  promptDiv.appendChild(h3);
  stack.appendChild(promptDiv);

  // --- Multiple Choice Buttons ---
  if (item.options && item.options.length) {
    const choiceList = document.createElement('div');
    choiceList.className = 'choice-list';

    item.options.forEach(option => {
      const btn = document.createElement('button');
      btn.className = 'choice-button';
      btn.type = 'button';
      btn.dataset.reviewOption = option;
      btn.textContent = option;

      // Add "Correct/Incorrect" styling if the answer is revealed
      if (state.review.reveal) {
        const isSelected = state.review.selectedOption === option;
        const isCorrect = option === item.translatedText;
        if (isCorrect) btn.classList.add('correct');
        else if (isSelected) btn.classList.add('incorrect');
      }
      choiceList.appendChild(btn);
    });
    stack.appendChild(choiceList);
  }

  // --- Action Row (Reveal & Open) ---
  const actionRow = document.createElement('div');
  actionRow.className = 'action-row';

  const revealBtn = document.createElement('button');
  revealBtn.id = 'reveal-review';
  revealBtn.className = 'secondary-button';
  revealBtn.textContent = state.review.reveal ? "Hide answer" : "Reveal answer";

  const openBtn = document.createElement('button');
  openBtn.id = 'open-review-result';
  openBtn.className = 'secondary-button';
  openBtn.textContent = "Open in Result";

  actionRow.append(revealBtn, openBtn);
  stack.appendChild(actionRow);

  // --- Answer Section (The "Soft Box") ---
  if (state.review.reveal) {
    const softBox = document.createElement('div');
    softBox.className = 'soft-box';

    const ansTitle = document.createElement('div');
    ansTitle.className = 'section-title';
    ansTitle.textContent = 'Answer';

    const trans = document.createElement('div');
    trans.className = 'translation';
    trans.textContent = item.translatedText;

    const context = document.createElement('div');
    context.className = 'muted';
    context.style.marginTop = '8px';
    context.textContent = item.explanation || item.pronunciation || "No extra context";

    softBox.append(ansTitle, trans, context);
    stack.appendChild(softBox);
  }

  // 4. Final Injection
  elements.reviewCard.textContent = ''; // Final clear
  elements.reviewCard.appendChild(stack);
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
  // SVG content is built from safe escapeHtml values — innerHTML is correct here
  elements.mapSvg.innerHTML = `${clusters}${edges}${nodes}`;

  // --- Replace the Map Detail rendering with this ---
  elements.mapDetail.textContent = ''; // Clear safely

  if (!selectedItem) {
    elements.mapDetail.appendChild(createEmptyState("No node selected", "Pick a star to inspect it."));
    return;
  }

  const detailContainer = document.createElement('div');
  detailContainer.className = 'map-detail-content';

  // Meta Chips
  const metaLine = document.createElement('div');
  metaLine.className = 'meta-line';
  [formatLabel(selectedItem.sourceLanguage), formatLabel(selectedItem.itemType), formatLabel(selectedItem.progressStage), selectedItem.tag]
    .filter(Boolean).forEach(text => {
      const span = document.createElement('span');
      span.className = 'meta-chip';
      if (text === formatLabel(selectedItem.progressStage)) span.classList.add(`stage-${selectedItem.progressStage}`);
      span.textContent = text;
      metaLine.appendChild(span);
    });
  detailContainer.appendChild(metaLine);

  // Text Section
  const textDiv = document.createElement('div');
  const textTitle = document.createElement('div');
  textTitle.className = 'section-title';
  textTitle.style.marginBottom = '4px';
  textTitle.textContent = 'Original text';
  textDiv.appendChild(textTitle);

  // Pinyin — only show if Chinese
  if (selectedItem.pinyin) {
    const pinyinEl = document.createElement('div');
    pinyinEl.className = 'pinyin-text';
    pinyinEl.style.fontSize = '12px';
    pinyinEl.textContent = selectedItem.pinyin;
    textDiv.appendChild(pinyinEl);
  }

  const h3 = document.createElement('h3');
  h3.style.marginTop = '2px';
  h3.textContent = selectedItem.originalText;
  textDiv.appendChild(h3);
  detailContainer.appendChild(textDiv);

  // Sections (Translation, Explanation, Pronunciation)
  const addMapSection = (title, content, className = "") => {
    const div = document.createElement('div');
    const t = document.createElement('div');
    t.className = 'section-title';
    t.textContent = title;
    const c = document.createElement('div');
    if (className) c.className = className;
    c.textContent = content;
    div.append(t, c);
    detailContainer.appendChild(div);
  };

  addMapSection("Translation", selectedItem.translatedText || "No translation", "translation");
  addMapSection("Explanation", selectedItem.explanation || "No explanation");
  addMapSection("Pronunciation", selectedItem.pronunciation || "No pronunciation");
  if (selectedItem.note) addMapSection("Note", selectedItem.note);

  const muted = document.createElement('div');
  muted.className = 'muted';
  muted.textContent = selectedItem.pageTitle || selectedItem.pageDomain || "No source details";
  detailContainer.appendChild(muted);

  // Map Action Buttons
  const actions = document.createElement('div');
  actions.className = 'map-actions';
  [['Open in Result', 'open'], ['Review this', 'review'], ['Delete', 'delete']].forEach(([lab, act]) => {
    const btn = document.createElement('button');
    btn.className = 'secondary-button';
    btn.dataset.mapAction = act;
    btn.dataset.id = selectedItem.id;
    btn.textContent = lab;
    actions.appendChild(btn);
  });
  detailContainer.appendChild(actions);

  elements.mapDetail.appendChild(detailContainer);
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
    const nativeLanguage = await getNativeLanguage();

    // Keep translation label in sync with current language setting
    if (elements.translationLabel) {
      elements.translationLabel.textContent = `${nativeLanguage} Translation`;
    }

    const result = await understandText({
      text: normalizedText,
      providerConfig,
      nativeLanguage,
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
  const [savedItems, historyItems, currentResult, pending, nativeLanguage] = await Promise.all([
    getSavedItems(),
    getHistoryItems(),
    getCurrentResult(),
    getPendingSelection(),
    getNativeLanguage(),
  ]);

  if (elements.translationLabel) {
    elements.translationLabel.textContent = `${nativeLanguage} Translation`;
  }

  state.savedItems = savedItems;
  state.historyItems = historyItems;

  // Render lists in the background
  renderSavedList();
  renderHistoryList();
  renderReviewState();
  renderMap();

  // --- CRITICAL CHANGE START ---
  // If there is a NEW word waiting (from right-click), ignore the old result
  if (pending && pending.text) {
    await clearPendingSelection();
    await runUnderstanding(pending);
    return; // Exit early so we don't render the old result
  }

  // If NO new word, then show the last thing the user looked up
  if (currentResult) {
    state.currentLookup = toResultViewModel(currentResult);
    renderResult(state.currentLookup);
  } else {
    renderIdle();
  }
  // --- CRITICAL CHANGE END ---
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
  if (state.feedbackTimeoutId) clearTimeout(state.feedbackTimeoutId);
  state.feedbackTimeoutId = setTimeout(() => {
    setHidden(elements.saveFeedback, true);
  }, 2000);
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
  if (state.feedbackTimeoutId) clearTimeout(state.feedbackTimeoutId);
  state.feedbackTimeoutId = setTimeout(() => {
    setHidden(elements.metaFeedback, true);
  }, 2000);
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

  if (elements.clearButton) {
    elements.clearButton.addEventListener("click", () => {
      clearPendingSelection();
      renderIdle();
    });
  }

  if (elements.retryButton) {
    elements.retryButton.addEventListener("click", () => {
      const textToRetry = state.pendingSelection?.text || state.currentLookup?.originalText;
      if (textToRetry) {
        runUnderstanding({ text: textToRetry, sourceUrl: state.pendingSelection?.sourceUrl || state.currentLookup?.pageUrl, sourceTitle: state.pendingSelection?.sourceTitle || state.currentLookup?.pageTitle });
      }
    });
  }

  elements.errorRetry.addEventListener("click", () => runUnderstanding(state.pendingSelection || { text: state.currentLookup?.originalText || "" }));
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
  elements.upsellButton.addEventListener("click", openSettings);
  elements.listenBtn.addEventListener("click", () => {
    if (state.currentLookup?.originalText) {
      playAudio(state.currentLookup.originalText);
    }
  });

  elements.listenExampleBtn.addEventListener("click", () => {
    if (state.currentLookup?.exampleSentence?.original) {
      playAudio(state.currentLookup.exampleSentence.original);
    }
  });

  if (elements.clearHistoryButton) {
    elements.clearHistoryButton.addEventListener("click", async () => {
      // Optional: add confirmation logic here if desired
      await clearHistoryItems();
      await refreshMemory();
    });
  }
}

// --- Add these at the bottom of sidepanel.js ---

function createItemCard(item, isSavedType) {
  const article = document.createElement('article');
  article.className = 'list-card';

  // 1. Chips
  const metaLine = document.createElement('div');
  metaLine.className = 'meta-line';
  const chipTexts = isSavedType
    ? [formatLabel(item.sourceLanguage), formatLabel(item.itemType), formatLabel(item.progressStage), formatRelativeDate(item.savedAt)]
    : [formatLabel(item.sourceLanguage), formatLabel(item.itemType), formatRelativeDate(item.lookedUpAt)];

  chipTexts.filter(Boolean).forEach(text => {
    const span = document.createElement('span');
    span.className = 'meta-chip';
    span.textContent = text;
    metaLine.appendChild(span);
  });
  article.appendChild(metaLine);

  // 2. Pinyin & Word (The part showing as code in your screenshot)
  const contentDiv = document.createElement('div');
  contentDiv.style.cssText = "display: flex; flex-direction: column; gap: 2px; margin: 4px 0 8px 0;";

  // FIX: Don't use a string for Pinyin. Build the element.
  if (item.pinyin) {
    const pinyinEl = document.createElement('div');
    pinyinEl.className = 'pinyin-text';
    pinyinEl.style.cssText = "margin-top: 0; font-size: 11px; font-weight: 600; color: var(--accent);";
    pinyinEl.textContent = item.pinyin;
    contentDiv.appendChild(pinyinEl);
  }

  const wordEl = document.createElement('strong');
  wordEl.style.fontSize = "16px";
  wordEl.textContent = item.originalText;
  contentDiv.appendChild(wordEl);
  article.appendChild(contentDiv);

  // 3. Translation
  const p = document.createElement('p');
  p.textContent = item.translatedText || item.explanation || "";
  article.appendChild(p);

  // 4. Source
  const muted = document.createElement('div');
  muted.className = 'muted';
  muted.textContent = item.pageTitle || item.pageDomain || "Gemini";
  article.appendChild(muted);

  // 5. Icons (The other part showing as code)
  const actionRow = document.createElement('div');
  actionRow.className = 'action-icon-row';

  const icons = isSavedType
    ? [{ id: 'review', act: 'review-saved' }, { id: 'open', act: 'open-saved' }, { id: 'trash', act: 'delete-saved', danger: true }]
    : [{ id: 'saved', act: 'save-history' }, { id: 'open', act: 'open-history' }, { id: 'trash', act: 'delete-history', danger: true }];

  icons.forEach(icon => {
    const btn = document.createElement('button');
    btn.className = `action-icon-btn${icon.danger ? ' danger' : ''}`;
    btn.type = 'button';
    btn.dataset.action = icon.act;
    btn.dataset.id = item.id;
    // Icons are static hardcoded strings with no user data — innerHTML is safe here
    btn.innerHTML = `<svg width="16" height="16" style="pointer-events: none;"><use href="#icon-${icon.id}"/></svg>`;
    actionRow.appendChild(btn);
  });
  article.appendChild(actionRow);

  return article;
}

function createEmptyState(title, sub) {
  const container = document.createElement('div');
  container.style.cssText = "display: flex; flex-direction: column; align-items: center; text-align: center; margin-top: 24px;";

  const illustration = document.createElement('div');
  illustration.className = 'empty-illustration';
  illustration.setAttribute('aria-hidden', 'true');
  illustration.style.margin = "0 auto 12px auto";

  const h1 = document.createElement('h1');
  h1.style.cssText = "font-size: 18px; color: var(--text-soft); margin-bottom: 6px;";
  h1.textContent = title;

  const p = document.createElement('p');
  p.className = 'muted';
  p.style.cssText = "font-size: 13px; max-width: 250px; margin: 0 auto;";
  p.textContent = sub;

  container.append(illustration, h1, p);
  return container;
}

registerEvents();
initializePanel();
