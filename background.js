// Toggles the guides on the active tab. Injects content script on first use,
// afterwards just sends a toggle message so state persists per tab.
const api = typeof browser !== "undefined" ? browser : chrome;

const ICON_ON = { 48: "icon.png", 128: "icon128.png" };
const ICON_OFF = { 48: "icon-off.png", 128: "icon-off128.png" };

// Pages where extensions can't inject scripts.
const BLOCKED = [
  /^chrome:/i, /^chrome-extension:/i, /^chrome-untrusted:/i, /^devtools:/i,
  /^edge:/i, /^brave:/i, /^opera:/i, /^vivaldi:/i, /^arc:/i,
  /^about:/i, /^moz-extension:/i, /^view-source:/i, /^data:/i, /^blob:/i,
  /^https?:\/\/chromewebstore\.google\.com\//i,
  /^https?:\/\/chrome\.google\.com\/webstore/i,
  /^https?:\/\/microsoftedge\.microsoft\.com\/addons/i,
  /^https?:\/\/addons\.mozilla\.org\//i,
];

function isBlocked(url) {
  if (!url) return true;
  return BLOCKED.some((re) => re.test(url));
}

async function refreshIcon(tabId, url) {
  const blocked = isBlocked(url);
  try {
    await api.action.setIcon({ tabId, path: blocked ? ICON_OFF : ICON_ON });
    await api.action.setTitle({
      tabId,
      title: blocked
        ? "Sito Inspector Rules: not available on this page"
        : "Toggle alignment guides (Alt+Shift+R)",
    });
    if (blocked) await api.action.disable(tabId);
    else await api.action.enable(tabId);
  } catch {}
}

async function toggle(tab) {
  if (!tab?.id || isBlocked(tab.url)) return;
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

// Keep the icon in sync with whatever page each tab shows.
api.tabs.onUpdated.addListener((tabId, info, tab) => {
  if (info.url || info.status === "loading") refreshIcon(tabId, tab.url);
});
api.tabs.onActivated.addListener(async ({ tabId }) => {
  try { const t = await api.tabs.get(tabId); refreshIcon(tabId, t.url); } catch {}
});
api.tabs.onCreated.addListener((tab) => refreshIcon(tab.id, tab.url || tab.pendingUrl));

async function refreshAll() {
  try {
    const tabs = await api.tabs.query({});
    for (const t of tabs) refreshIcon(t.id, t.url);
  } catch {}
}
api.runtime.onInstalled.addListener(refreshAll);
api.runtime.onStartup.addListener(refreshAll);
