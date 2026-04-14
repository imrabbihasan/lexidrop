// background.js

import { MESSAGE_TYPES } from "./lib/constants.js";
import { getNativeLanguage, setPendingSelection } from "./lib/storage.js";

const CONTEXT_MENU_ID = "lexidrop-understand-text";

// Feature flags — evaluated once at startup
const HAS_SIDE_PANEL = typeof chrome["sidePanel"] !== "undefined";
const HAS_SIDEBAR_ACTION = typeof chrome["sidebarAction"] !== "undefined";

// --- 1. INITIALIZATION ---

async function setupNativeBehavior() {
  try {
    await chrome.contextMenus.removeAll();
    chrome.contextMenus.create({
      id: CONTEXT_MENU_ID,
      title: 'Understand "%s" with LexiDrop',
      contexts: ["selection"],
    });
  } catch (e) {
    console.error("[LexiDrop] Context menu error:", e);
  }

  // Chrome/Edge/Opera only — Firefox does not implement setPanelBehavior
  if (HAS_SIDE_PANEL && typeof chrome["sidePanel"]["setPanelBehavior"] === "function") {
    chrome["sidePanel"]["setPanelBehavior"]({ openPanelOnActionClick: true }).catch(() => {});
  }
}

// --- 2. UTILITY FUNCTIONS ---

function openPanel(windowId) {
  // Chromium browsers (Chrome, Edge, Opera)
  if (HAS_SIDE_PANEL && typeof chrome["sidePanel"]["open"] === "function") {
    return chrome["sidePanel"]["open"]({ windowId }).catch((error) => {
      console.warn("[LexiDrop] sidePanel.open error:", error);
    });
  }

  // Firefox fallback via sidebar_action
  if (HAS_SIDEBAR_ACTION && typeof chrome["sidebarAction"]["open"] === "function") {
    return chrome["sidebarAction"]["open"]().catch((error) => {
      console.warn("[LexiDrop] sidebarAction.open error:", error);
    });
  }

  // No panel API available — resolve silently
  return Promise.resolve();
}

async function queueSelection(selection) {
  await setPendingSelection(selection);
  const nativeLanguage = await getNativeLanguage();

  try {
    await chrome.runtime.sendMessage({
      type: MESSAGE_TYPES.UNDERSTAND_TEXT_REQUEST,
      payload: { ...selection, nativeLanguage },
    });
  } catch (_error) {
    // Side panel not yet open — it will read pending selection on load
  }
}

// --- 3. EVENT LISTENERS ---

chrome.runtime.onInstalled.addListener(async () => {
  await setupNativeBehavior();
});

chrome.runtime.onStartup.addListener(async () => {
  await setupNativeBehavior();
});

// Context menu right-click handler
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId !== CONTEXT_MENU_ID || !info.selectionText) return;

  const text = info.selectionText.trim();
  if (!text) return;

  // Step 1: Open panel FIRST — must be synchronous to preserve the user gesture.
  // Any await before this call would expire the gesture token and throw an error.
  openPanel(tab?.windowId);

  // Step 2: Async storage/messaging work — gesture is no longer needed here.
  const selection = {
    text,
    pageTitle: tab?.title || "",
    pageUrl: tab?.url || "",
    pageDomain: (() => {
      try { return new URL(tab?.url || "").hostname.replace(/^www\./, ""); }
      catch { return ""; }
    })(),
  };

  queueSelection(selection).catch((error) =>
    console.error("[LexiDrop] Failed to queue selection:", error)
  );
});

// Toolbar icon click
chrome.action.onClicked.addListener((tab) => {
  openPanel(tab?.windowId);
});