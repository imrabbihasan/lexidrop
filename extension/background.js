import { MESSAGE_TYPES } from "./lib/constants.js";
import { getNativeLanguage, setPendingSelection } from "./lib/storage.js";

const CONTEXT_MENU_ID = "lexidrop-understand-text";

async function createContextMenu() {
  try {
    await chrome.contextMenus.removeAll();
  } catch (_error) {
    // Ignore startup race conditions.
  }

  chrome.contextMenus.create({
    id: CONTEXT_MENU_ID,
    title: 'Understand "%s" with LexiDrop',
    contexts: ["selection"],
  });
}

/**
 * Opens LexiDrop in the native Chrome Side Panel.
 */
async function openPanel(windowId) {
  if (typeof chrome.sidePanel !== "undefined" && typeof chrome.sidePanel.open === "function") {
    try {
      const targetWindowId = windowId || chrome.windows.WINDOW_ID_CURRENT;
      await chrome.sidePanel.open({ windowId: targetWindowId });
    } catch (error) {
      console.warn("[LexiDrop] sidePanel.open threw error.", error);
    }
  }
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
    // The side panel may not be ready yet. It will read the pending selection on load.
  }
}

async function setupNativeBehavior() {
  await createContextMenu();
  // Let Chrome natively handle toolbar icon clicks for the richest integration
  if (typeof chrome.sidePanel !== "undefined" && chrome.sidePanel.setPanelBehavior) {
    chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(() => {});
  }
}

chrome.runtime.onInstalled.addListener(async (details) => {
  await setupNativeBehavior();

  if (details.reason === chrome.runtime.OnInstalledReason.INSTALL) {
    chrome.tabs.create({ url: chrome.runtime.getURL("onboarding.html") });
  }
});

chrome.runtime.onStartup.addListener(async () => {
  await setupNativeBehavior();
});

chrome.action.onClicked.addListener((tab) => {
  openPanel(tab?.windowId).catch((error) => {
    console.error("[LexiDrop] Failed to open panel from toolbar:", error);
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId !== CONTEXT_MENU_ID || !info.selectionText) {
    return;
  }

  const text = info.selectionText.trim();
  if (!text) return;

  const selection = {
    text,
    pageTitle: tab?.title || "",
    pageUrl: tab?.url || "",
    pageDomain: (() => {
      try {
        return new URL(tab?.url || "").hostname.replace(/^www\./, "");
      } catch {
        return "";
      }
    })(),
  };

  openPanel(tab?.windowId)
    .then(() => queueSelection(selection))
    .catch((error) => {
      console.error("[LexiDrop] Failed to open panel:", error);
    });
});
