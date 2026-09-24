// Toggles the guides on the active tab. Injects content script on first use,
// afterwards just sends a toggle message so state persists per tab.
const api = typeof browser !== "undefined" ? browser : chrome;

async function toggle(tab) {
  if (!tab?.id) return;
  try {
    await api.tabs.sendMessage(tab.id, { type: "sito-rules-toggle" });
  } catch {
    // Not injected yet on this tab.
    await api.scripting.insertCSS({ target: { tabId: tab.id }, files: ["content.css"] });
    await api.scripting.executeScript({ target: { tabId: tab.id }, files: ["content.js"] });
    await api.tabs.sendMessage(tab.id, { type: "sito-rules-toggle" });
  }
}

api.action.onClicked.addListener(toggle);

api.runtime.onMessage.addListener((msg, sender) => {
  if (msg?.type === "sito-rules-state" && sender.tab?.id != null) {
    api.action.setBadgeText({ tabId: sender.tab.id, text: msg.on ? "ON" : "" });
    api.action.setBadgeBackgroundColor({ tabId: sender.tab.id, color: "#3b82f6" });
  }
  return false;
});
