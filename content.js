(() => {
  const BLOCKED_EMOJI = ["\u{1F51E}"]; // 🔞
  const BLOCKED_KEYWORDS = [
    /porn/i,
    /nsfw/i,
    /adult\s*content/i,
    /18\s*\+/i,
    /18\s*plus/i,
    /onlyfans/i,
    /onlyfan\b/i,
    /fansly/i,
    /justforfans/i,
    /manyvids/i,
    /avn\s*stars/i,
    /loyalfans/i,
    /pocketstars/i
  ];
  const PROFILE_ONLY_BLOCKED_KEYWORDS = [
    /single/i,
    /relationship/i,
    /new here/i,
    /looking for/i,
    /serious relationship/i,
    /dm me/i,
    /message me/i,
    /chat with me/i,
    /fun to chat/i,
    /talk to me/i,
    /available/i,
    /hook\s*up/i,
    /sugar/i
  ];
  const BLOCKED_LINK_KEYWORDS = [
    /onlyfans/i,
    /onlyfan\b/i,
    /fansly/i,
    /justforfans/i,
    /manyvids/i,
    /avn\s*stars/i,
    /loyalfans/i,
    /pocketstars/i,
    /beacons\.ai/i,
    /campsite\.bio/i,
    /t\.me/i,
    /telegram/i,
    /wa\.me/i,
    /whatsapp/i,
    /snapchat/i,
    /snap\b/i,
    /kik/i,
    /linktr\.ee/i
  ];
  const SENSITIVE_MEDIA_TEXTS = [
    "Sensitive content",
    "Adult Content",
    "Content warning",
    "Caution: This profile may include potentially sensitive content",
    "You’re seeing this warning because they use potentially sensitive images or language",
    "You're seeing this warning because they use potentially sensitive images or language",
    "This media may contain sensitive material",
    "The media may contain sensitive material",
    "Potentially sensitive content"
  ];
  const SENSITIVE_VIEW_LABELS = ["view", "show", "see", "display"];

  const state = {
    blocked: false,
    observer: null,
    debounceId: null,
    lastUrl: location.href,
    notified: false
  };

  const normalize = (value) => (value || "").toString();

  const hasBlockedEmoji = (text) =>
    BLOCKED_EMOJI.some((emoji) => normalize(text).includes(emoji));

  const matchesBlockedKeyword = (text) =>
    BLOCKED_KEYWORDS.some((pattern) => pattern.test(normalize(text)));

  const matchesProfileOnlyKeyword = (text) =>
    PROFILE_ONLY_BLOCKED_KEYWORDS.some((pattern) => pattern.test(normalize(text)));

  const uniquePush = (list, value) => {
    if (!list.includes(value)) list.push(value);
  };

  const collectAltText = (root) => {
    if (!root) return [];
    return Array.from(root.querySelectorAll("img[alt]"))
      .map((img) => img.getAttribute("alt") || "")
      .filter(Boolean);
  };

  const collectHrefText = (root) => {
    if (!root) return [];
    return Array.from(root.querySelectorAll("a[href]"))
      .map((link) => link.getAttribute("href") || "")
      .filter(Boolean);
  };

  const collectLinkText = (root) => {
    if (!root) return [];
    return Array.from(root.querySelectorAll("a[href]"))
      .map((link) => link.textContent || "")
      .filter(Boolean);
  };

  const getProfileText = () => {
    const texts = [];
    const bio = document.querySelector('[data-testid="UserDescription"]');
    const name = document.querySelector('[data-testid="UserName"]');
    const url = document.querySelector('[data-testid="UserUrl"]');

    if (bio?.textContent) texts.push(bio.textContent);
    if (name?.textContent) texts.push(name.textContent);
    if (url?.textContent) texts.push(url.textContent);

    collectAltText(bio).forEach((text) => texts.push(text));
    collectAltText(name).forEach((text) => texts.push(text));
    collectAltText(url).forEach((text) => texts.push(text));
    collectHrefText(url).forEach((text) => texts.push(text));
    collectLinkText(url).forEach((text) => texts.push(text));

    return texts.join(" ");
  };

  const getProfileLinks = () => {
    const url = document.querySelector('[data-testid="UserUrl"]');
    return collectHrefText(url)
      .concat(collectLinkText(url))
      .concat(url?.textContent || "");
  };

  const getPostTexts = () =>
    Array.from(document.querySelectorAll('[data-testid="tweetText"]'))
      .map((node) => node.textContent || "")
      .filter(Boolean);

  const getPostLinks = () =>
    Array.from(document.querySelectorAll("article"))
      .flatMap((article) => collectHrefText(article).concat(collectLinkText(article)))
      .filter(Boolean);

  const hasSensitiveMediaGate = () => {
    const bodyText = document.body?.innerText || "";
    const hasSensitiveText = SENSITIVE_MEDIA_TEXTS.some((text) =>
      bodyText.includes(text)
    );
    if (!hasSensitiveText) return false;

    const viewButtons = Array.from(
      document.querySelectorAll("button, a, div[role='button']")
    ).filter((el) => {
      const text = (el.textContent || "").trim().toLowerCase();
      const label = (el.getAttribute("aria-label") || "").trim().toLowerCase();
      return SENSITIVE_VIEW_LABELS.includes(text) || SENSITIVE_VIEW_LABELS.includes(label);
    });

    return viewButtons.length > 0;
  };

  const hasSensitiveMediaTestId = () =>
    document.querySelector("[data-testid*='sensitive' i]") !== null;

  const blockPage = (reasons) => {
    if (state.blocked) return;
    state.blocked = true;
    if (state.debounceId) clearTimeout(state.debounceId);

    try {
      window.stop();
    } catch (error) {
      // Ignore stop failures for SPA routes.
    }

    notifyBlock(reasons);

    const overlay = document.createElement("div");
    overlay.setAttribute("data-x-xxx-blocker", "true");
    overlay.style.position = "fixed";
    overlay.style.top = "0";
    overlay.style.left = "0";
    overlay.style.width = "100%";
    overlay.style.height = "100%";
    overlay.style.background = "rgba(8, 8, 10, 0.96)";
    overlay.style.color = "#fff";
    overlay.style.zIndex = "2147483647";
    overlay.style.display = "flex";
    overlay.style.alignItems = "center";
    overlay.style.justifyContent = "center";
    overlay.style.padding = "32px";
    overlay.style.boxSizing = "border-box";
    overlay.style.textAlign = "center";
    overlay.style.fontFamily = "system-ui, -apple-system, sans-serif";
    overlay.style.backdropFilter = "blur(2px)";

    const card = document.createElement("div");
    card.style.width = "min(680px, 92vw)";
    card.style.background = "rgba(18, 18, 22, 0.95)";
    card.style.border = "1px solid rgba(255, 255, 255, 0.08)";
    card.style.borderRadius = "16px";
    card.style.padding = "28px";
    card.style.boxShadow = "0 24px 60px rgba(0, 0, 0, 0.55)";
    card.style.display = "flex";
    card.style.flexDirection = "column";
    card.style.gap = "12px";

    const title = document.createElement("h1");
    title.textContent = "Page Blocked";
    title.style.fontSize = "24px";
    title.style.margin = "0";

    const message = document.createElement("p");
    message.textContent =
      "This page appears to contain porn or sensitive media.";
    message.style.margin = "0";
    message.style.opacity = "0.85";

    const urlText = document.createElement("div");
    urlText.textContent = location.href;
    urlText.style.fontSize = "12px";
    urlText.style.opacity = "0.6";
    urlText.style.wordBreak = "break-all";

    const reasonsList = document.createElement("ul");
    reasonsList.style.listStyle = "disc";
    reasonsList.style.padding = "0 0 0 20px";
    reasonsList.style.margin = "4px 0 8px";
    reasonsList.style.textAlign = "left";
    reasonsList.style.maxWidth = "600px";

    reasons.forEach((reason) => {
      const item = document.createElement("li");
      item.textContent = reason;
      reasonsList.appendChild(item);
    });

    const actions = document.createElement("div");
    actions.style.display = "flex";
    actions.style.gap = "12px";
    actions.style.justifyContent = "center";
    actions.style.marginTop = "8px";
    actions.style.flexWrap = "wrap";

    const backButton = document.createElement("button");
    backButton.textContent = "Get Me Outta Here!";
    backButton.style.background = "#fff";
    backButton.style.color = "#111";
    backButton.style.border = "none";
    backButton.style.padding = "10px 18px";
    backButton.style.borderRadius = "8px";
    backButton.style.cursor = "pointer";
    backButton.addEventListener("click", () => {
      window.location.assign("https://openfront.io");
    });

    const closeButton = document.createElement("button");
    closeButton.textContent = "Close Tab";
    closeButton.style.background = "transparent";
    closeButton.style.color = "#fff";
    closeButton.style.border = "1px solid rgba(255, 255, 255, 0.4)";
    closeButton.style.padding = "10px 18px";
    closeButton.style.borderRadius = "8px";
    closeButton.style.cursor = "pointer";
    closeButton.addEventListener("click", () => {
      window.close();
    });

    actions.appendChild(backButton);
    actions.appendChild(closeButton);

    card.appendChild(title);
    card.appendChild(message);
    card.appendChild(urlText);
    card.appendChild(reasonsList);
    card.appendChild(actions);
    overlay.appendChild(card);

    document.documentElement.style.overflow = "hidden";
    (document.body || document.documentElement).appendChild(overlay);
  };

  const removeOverlay = () => {
    const overlay = document.querySelector("[data-x-xxx-blocker='true']");
    if (overlay) overlay.remove();
    document.documentElement.style.overflow = "";
  };

  const maybeResetForNavigation = () => {
    if (location.href !== state.lastUrl) {
      state.lastUrl = location.href;
      state.blocked = false;
      state.notified = false;
      removeOverlay();
    }
  };

  const notifyBlock = (reasons) => {
    if (state.notified) return;
    state.notified = true;
    try {
      chrome.runtime.sendMessage({
        type: "X_BLOCKED",
        url: location.href,
        reasons
      });
    } catch (error) {
      // Ignore if messaging is unavailable.
    }
  };

  const scanAndBlock = () => {
    if (state.blocked) return;
    const reasons = [];

    const profileText = getProfileText();
    if (hasBlockedEmoji(profileText)) {
      uniquePush(reasons, "Profile includes 🔞 emoji.");
    }
    if (matchesBlockedKeyword(profileText) || matchesProfileOnlyKeyword(profileText)) {
      uniquePush(reasons, "Profile text contains blocked keywords.");
    }

    const profileLinks = getProfileLinks().join(" ");
    if (BLOCKED_LINK_KEYWORDS.some((pattern) => pattern.test(profileLinks))) {
      uniquePush(reasons, "Profile link contains blocked keywords.");
    }

    getPostTexts().forEach((post) => {
      if (matchesBlockedKeyword(post)) {
        uniquePush(reasons, "Post text contains blocked keywords.");
      }
    });

    getPostLinks().forEach((link) => {
      if (BLOCKED_LINK_KEYWORDS.some((pattern) => pattern.test(link))) {
        uniquePush(reasons, "Post link contains blocked keywords.");
      }
    });

    if (hasSensitiveMediaGate() || hasSensitiveMediaTestId()) {
      uniquePush(reasons, "Sensitive media gate detected.");
    }

    if (reasons.length) {
      blockPage(reasons);
    }
  };

  const scheduleScan = () => {
    maybeResetForNavigation();
    if (state.blocked) return;
    if (state.debounceId) clearTimeout(state.debounceId);
    state.debounceId = setTimeout(scanAndBlock, 300);
  };

  const startObserver = () => {
    state.observer = new MutationObserver(scheduleScan);
    state.observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
      characterData: true
    });
  };

  scanAndBlock();
  startObserver();
})();
