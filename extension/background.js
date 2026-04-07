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

async function openPanel(windowId) {
  await chrome.sidePanel.open({ windowId });
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

chrome.runtime.onInstalled.addListener(async (details) => {
  await createContextMenu();

  if (details.reason === chrome.runtime.OnInstalledReason.INSTALL) {
    chrome.tabs.create({ url: chrome.runtime.getURL("onboarding.html") });
  }
});

chrome.runtime.onStartup.addListener(async () => {
  await createContextMenu();
});

chrome.action.onClicked.addListener((tab) => {
  if (!tab.windowId) return;

  openPanel(tab.windowId).catch((error) => {
    console.error("[LexiDrop] Failed to open side panel from toolbar:", error);
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId !== CONTEXT_MENU_ID || !info.selectionText || !tab?.windowId) {
    return;
  }

  const text = info.selectionText.trim();
  if (!text) return;

  const selection = {
    text,
    pageTitle: tab.title || "",
    pageUrl: tab.url || "",
    pageDomain: (() => {
      try {
        return new URL(tab.url || "").hostname.replace(/^www\./, "");
      } catch {
        return "";
      }
    })(),
  };

  openPanel(tab.windowId)
    .then(() => queueSelection(selection))
    .catch((error) => {
      console.error("[LexiDrop] Failed to open side panel:", error);
    });
});
