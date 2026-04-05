import {
  HISTORY_LIMIT,
  REVIEW_SESSION_SIZE,
  SAVED_LIMIT,
  STORAGE_KEYS,
} from "./constants.js";

function normalizeText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function uniqueId(prefix) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function shuffle(items) {
  const next = [...items];
  for (let index = next.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
  }
  return next;
}

export function detectSourceLanguage(text) {
  if (/[\u4e00-\u9fff]/.test(text)) return "chinese";
  if (/[a-zA-Z]/.test(text)) return "english";
  return "unknown";
}

export function detectItemType(text) {
  const normalized = normalizeText(text);
  if (!normalized) return "phrase";
  if (/[。！？.!?]/.test(normalized) || normalized.split(/\s+/).length >= 7) return "sentence";
  if (normalized.includes(" ")) return "phrase";
  return "word";
}

export function createFingerprint(text, sourceLanguage = "unknown") {
  return `${sourceLanguage}:${normalizeText(text).toLowerCase()}`;
}

function extractDomain(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

export function deriveProgressStage(reviewCount = 0) {
  if (reviewCount >= 6) return "mastered";
  if (reviewCount >= 3) return "strong";
  if (reviewCount >= 1) return "reviewed";
  return "new";
}

export function buildLookupRecord({ text, result, source = {} }) {
  const normalizedText = normalizeText(text);
  const sourceLanguage = source.language || detectSourceLanguage(normalizedText);
  const itemType = detectItemType(normalizedText);

  return {
    id: uniqueId("lookup"),
    fingerprint: createFingerprint(normalizedText, sourceLanguage),
    originalText: normalizedText,
    translatedText: normalizeText(result.translation),
    explanation: normalizeText(result.explanation),
    pronunciation: normalizeText(result.pronunciation),
    pinyin: typeof result.pinyin === "string" ? normalizeText(result.pinyin) : null,
    quiz: result.quiz || null,
    isFallback: result.isFallback || false,
    sourceLanguage,
    itemType,
    pageTitle: normalizeText(source.pageTitle),
    pageUrl: normalizeText(source.pageUrl),
    pageDomain: normalizeText(source.pageDomain) || extractDomain(source.pageUrl || ""),
    note: normalizeText(source.note),
    tag: normalizeText(source.tag),
    lookedUpAt: Date.now(),
    savedAt: null,
    updatedAt: Date.now(),
    reviewCount: 0,
    lastReviewedAt: null,
    progressStage: "new",
  };
}

function normalizeSavedItem(item) {
  const reviewCount = Number.isFinite(item.reviewCount) ? item.reviewCount : 0;
  return {
    ...item,
    note: normalizeText(item.note),
    tag: normalizeText(item.tag),
    isFallback: item.isFallback || false,
    reviewCount,
    lastReviewedAt: item.lastReviewedAt || null,
    progressStage: deriveProgressStage(reviewCount),
    updatedAt: item.updatedAt || Date.now(),
  };
}

async function readLocal(key) {
  const stored = await chrome.storage.local.get(key);
  return stored[key] || [];
}

async function writeLocal(key, value) {
  await chrome.storage.local.set({ [key]: value });
  return value;
}

export async function getSavedItems() {
  const items = await readLocal(STORAGE_KEYS.SAVED_ITEMS);
  return items.map(normalizeSavedItem);
}

export async function getHistoryItems() {
  return readLocal(STORAGE_KEYS.HISTORY_ITEMS);
}

export async function addHistoryItem(lookup) {
  const current = await getHistoryItems();
  const nextItem = {
    ...lookup,
    id: uniqueId("history"),
    updatedAt: Date.now(),
    lookedUpAt: Date.now(),
  };

  const deduped = current.filter((item) => item.fingerprint !== lookup.fingerprint);
  const next = [nextItem, ...deduped].slice(0, HISTORY_LIMIT);
  await writeLocal(STORAGE_KEYS.HISTORY_ITEMS, next);
  return next;
}

export async function saveLookupItem(lookup, overrides = {}) {
  const current = await getSavedItems();
  const existing = current.find((item) => item.fingerprint === lookup.fingerprint);
  const now = Date.now();

  const nextItem = normalizeSavedItem({
    ...lookup,
    ...existing,
    ...overrides,
    id: existing?.id || uniqueId("saved"),
    savedAt: existing?.savedAt || now,
    updatedAt: now,
  });

  const deduped = current.filter((item) => item.id !== nextItem.id);
  const next = [nextItem, ...deduped].slice(0, SAVED_LIMIT);
  await writeLocal(STORAGE_KEYS.SAVED_ITEMS, next);
  return nextItem;
}

export async function updateSavedItemMeta(id, updates) {
  const current = await getSavedItems();
  const next = current.map((item) =>
    item.id === id
      ? normalizeSavedItem({
          ...item,
          note: updates.note,
          tag: updates.tag,
          updatedAt: Date.now(),
        })
      : item
  );

  await writeLocal(STORAGE_KEYS.SAVED_ITEMS, next);
  return next.find((item) => item.id === id) || null;
}

export async function markSavedItemReviewed(id) {
  const current = await getSavedItems();
  const next = current.map((item) =>
    item.id === id
      ? normalizeSavedItem({
          ...item,
          reviewCount: (item.reviewCount || 0) + 1,
          lastReviewedAt: Date.now(),
          updatedAt: Date.now(),
        })
      : item
  );

  await writeLocal(STORAGE_KEYS.SAVED_ITEMS, next);
  return next.find((item) => item.id === id) || null;
}

export async function deleteSavedItem(id) {
  const current = await getSavedItems();
  const next = current.filter((item) => item.id !== id);
  await writeLocal(STORAGE_KEYS.SAVED_ITEMS, next);
  return next;
}

export async function deleteHistoryItem(id) {
  const current = await getHistoryItems();
  const next = current.filter((item) => item.id !== id);
  await writeLocal(STORAGE_KEYS.HISTORY_ITEMS, next);
  return next;
}

export async function clearHistoryItems() {
  await writeLocal(STORAGE_KEYS.HISTORY_ITEMS, []);
  return [];
}

export function filterMemoryItems(items, filters = {}) {
  const query = normalizeText(filters.query).toLowerCase();
  const type = filters.type || "all";
  const language = filters.language || "all";

  return items.filter((item) => {
    if (type !== "all" && item.itemType !== type) return false;
    if (language !== "all" && item.sourceLanguage !== language) return false;

    if (!query) return true;

    const haystack = [
      item.originalText,
      item.translatedText,
      item.explanation,
      item.pronunciation,
      item.note,
      item.tag,
      item.pageTitle,
      item.pageDomain,
    ]
      .join(" ")
      .toLowerCase();

    return haystack.includes(query);
  });
}

function buildReviewOptions(item, allItems) {
  const distractors = allItems
    .filter((candidate) => candidate.id !== item.id && candidate.translatedText)
    .map((candidate) => candidate.translatedText);

  const uniqueDistractors = [...new Set(distractors)].slice(0, 3);
  const options = shuffle([item.translatedText, ...uniqueDistractors]).slice(0, 4);
  return options.length >= 2 ? options : [];
}

export function buildReviewSession(savedItems, size = REVIEW_SESSION_SIZE, prioritizedId = null) {
  const base = savedItems.filter((item) => item.translatedText);
  const prioritized = prioritizedId ? base.find((item) => item.id === prioritizedId) : null;
  const rest = shuffle(base.filter((item) => item.id !== prioritizedId));
  const selected = prioritized ? [prioritized, ...rest] : rest;

  return selected.slice(0, size).map((item) => ({
    ...item,
    options: buildReviewOptions(item, base),
  }));
}

export function formatRelativeDate(timestamp) {
  if (!timestamp) return "";
  return new Date(timestamp).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function clusterKeyForItem(item, tagCounts) {
  if (item.tag && tagCounts[item.tag] >= 2) {
    return `tag:${item.tag}`;
  }
  return `lang:${item.sourceLanguage}`;
}

function clusterLabelFromKey(key) {
  if (key.startsWith("tag:")) return key.slice(4);
  return key.slice(5).replace(/^./, (value) => value.toUpperCase());
}

function buildClusterCenters(count, width, rowHeight) {
  const columns = count <= 2 ? count : 2;
  const rows = Math.ceil(count / columns);
  const centers = [];

  for (let index = 0; index < count; index += 1) {
    const column = index % columns;
    const row = Math.floor(index / columns);
    const x = ((column + 1) * width) / (columns + 1);
    const y = 70 + row * rowHeight;
    centers.push({ x, y });
  }

  return { centers, height: Math.max(240, 120 + rows * rowHeight) };
}

function nodeRadius(item) {
  if (item.progressStage === "mastered") return 9;
  if (item.progressStage === "strong") return 8;
  if (item.progressStage === "reviewed") return 7;
  return 6;
}

export function buildConstellationMap(savedItems) {
  const width = 320;
  const tagCounts = savedItems.reduce((accumulator, item) => {
    if (item.tag) accumulator[item.tag] = (accumulator[item.tag] || 0) + 1;
    return accumulator;
  }, {});

  const grouped = new Map();
  savedItems.forEach((item) => {
    const key = clusterKeyForItem(item, tagCounts);
    const current = grouped.get(key) || [];
    current.push(item);
    grouped.set(key, current);
  });

  const clusters = Array.from(grouped.entries())
    .sort((left, right) => right[1].length - left[1].length)
    .map(([key, items]) => ({
      key,
      label: clusterLabelFromKey(key),
      items: items.sort((a, b) => {
        if ((b.reviewCount || 0) !== (a.reviewCount || 0)) {
          return (b.reviewCount || 0) - (a.reviewCount || 0);
        }
        return (b.updatedAt || 0) - (a.updatedAt || 0);
      }),
    }));

  const { centers, height } = buildClusterCenters(clusters.length || 1, width, 150);
  const nodes = [];
  const edges = [];
  const clusterMeta = [];

  clusters.forEach((cluster, clusterIndex) => {
    const center = centers[clusterIndex] || { x: width / 2, y: 90 };
    clusterMeta.push({ ...cluster, center });

    cluster.items.forEach((item, itemIndex) => {
      const ring = Math.floor(itemIndex / 6);
      const positionInRing = itemIndex % 6;
      const countInRing = Math.min(6, cluster.items.length - ring * 6);
      const angle = (Math.PI * 2 * positionInRing) / Math.max(countInRing, 1) - Math.PI / 2;
      const distance = 24 + ring * 28;
      const node = {
        id: item.id,
        item,
        clusterKey: cluster.key,
        clusterLabel: cluster.label,
        x: center.x + Math.cos(angle) * distance,
        y: center.y + Math.sin(angle) * distance,
        radius: nodeRadius(item),
      };
      nodes.push(node);
    });
  });

  const nodesByCluster = nodes.reduce((accumulator, node) => {
    accumulator[node.clusterKey] = accumulator[node.clusterKey] || [];
    accumulator[node.clusterKey].push(node);
    return accumulator;
  }, {});

  Object.values(nodesByCluster).forEach((clusterNodes) => {
    for (let index = 1; index < clusterNodes.length; index += 1) {
      edges.push({
        from: clusterNodes[index - 1],
        to: clusterNodes[index],
      });
    }
  });

  return {
    width,
    height,
    clusters: clusterMeta,
    nodes,
    edges,
  };
}
