const BADGE_KEY = "blockedCount";

const getCount = async () => {
  const data = await chrome.storage.session.get(BADGE_KEY);
  return Number(data[BADGE_KEY] || 0);
};

const setBadge = async (count) => {
  await chrome.action.setBadgeText({ text: count ? String(count) : "" });
  await chrome.action.setBadgeBackgroundColor({ color: "#d93025" });
};

chrome.runtime.onInstalled.addListener(async () => {
  const count = await getCount();
  await setBadge(count);
});

chrome.runtime.onStartup.addListener(async () => {
  await chrome.storage.session.set({ [BADGE_KEY]: 0 });
  await setBadge(0);
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type !== "X_BLOCKED") return;

  (async () => {
    const count = (await getCount()) + 1;
    await chrome.storage.session.set({ [BADGE_KEY]: count });
    await setBadge(count);
    sendResponse({ ok: true, count });
  })();

  return true;
});
