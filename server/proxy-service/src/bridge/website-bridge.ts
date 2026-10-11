import * as Y from "yjs";
import { HocuspocusProvider } from "@hocuspocus/provider";
import { getUserColor } from "./cursor-presence/userColor";
import { initPointerPresence } from "./pointer-presence/initPointerPresence";

declare global {
  interface Window {
    __LOWCODER_HOCUSPOCUS__?: { url?: string; token?: string };
  }
}

interface ScrollState {
  xRatio: number;
  yRatio: number;
}

interface ClickState {
  xRatio: number;
  yRatio: number;
  ts: number;
  editorId: string;
  username: string;
  kind: "button" | "generic";
  label: string;
  rect?: { leftRatio: number; topRatio: number; wRatio: number; hRatio: number };
}

interface NavOffer {
  url: string;
  navSeq: number;
  editorId: string;
  username: string;
}

type FormControl = HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;

(() => {
  const params = new URLSearchParams(window.location.search);
  const root = document.documentElement;
  const roomId = params.get("roomId") || root.dataset.lowcoderRoomId || "";
  const role = params.get("role") || root.dataset.lowcoderRole || "driver";
  const editorId = params.get("editorId") || root.dataset.lowcoderEditorId || "local";
  const collabId = params.get("collab") || root.dataset.lowcoderCollabId || "";
  const username =
    params.get("username") || root.dataset.lowcoderUsername || editorId;
  const debug = params.get("debug") === "1";
  const isPresenter = role === "driver";
  const peerId = `${editorId}|${role}|${Math.random().toString(36).slice(2, 10)}`;

  if (!roomId || !collabId) {
    console.error(
      "[website-bridge] Missing roomId/collab. Load the page through /proxy/website " +
        "and create a session with createWebsiteProxySession before Explore Together."
    );
    return;
  }

  if (!window.location.pathname.includes("/proxy/website")) {
    console.error(
      "[website-bridge] Page left the Lowcoder proxy. Keep browsing through /proxy/website."
    );
    return;
  }

  const hocuspocusConfig = window.__LOWCODER_HOCUSPOCUS__ ?? {};
  const hocuspocusUrl =
    hocuspocusConfig.url || root.dataset.lowcoderHocuspocusUrl || "ws://localhost:3006";
  const hocuspocusToken =
    hocuspocusConfig.token || root.dataset.lowcoderHocuspocusToken || "";
  const documentName = `website_${roomId}_${collabId}`;

  let isApplyingRemote = false;
  let isApplyingRemoteFields = false;
  let lastAppliedNavSeq = 0;
  let lastAppliedClickTs = 0;
  let scrollPublishTimer: number | undefined;
  let fieldPublishTimer: number | undefined;
  let lastPublishedScroll = "";
  let dismissedNavSeq = 0;
  let followPromptEl: HTMLDivElement | null = null;

  const doc = new Y.Doc();
  const state = doc.getMap<string>("state");
  const fields = doc.getMap<string>("fields");
  const provider = new HocuspocusProvider({
    url: hocuspocusUrl,
    name: documentName,
    document: doc,
    token: hocuspocusToken || undefined,
    onAuthenticationFailed: (data) => {
      console.error("[website-bridge] Hocuspocus auth failed", data);
    },
  });

  const pointer = initPointerPresence({
    provider,
    editorId,
    role,
    username,
    debug,
  });

  function log(...args: unknown[]): void {
    if (debug) console.log("[website-bridge]", role, ...args);
  }

  function listControls(): FormControl[] {
    return Array.from(
      document.querySelectorAll<FormControl>("input, textarea, select")
    ).filter((control) => {
      if (control.disabled) return false;
      if (control instanceof HTMLInputElement) {
        const type = (control.type || "text").toLowerCase();
        return !["hidden", "button", "submit", "reset", "file", "password", "image"].includes(
          type
        );
      }
      return true;
    });
  }

  function controlIdentity(control: FormControl): string {
    const name = control.getAttribute("name")?.trim();
    if (name) return `name:${name}`;
    const id = control.id?.trim();
    if (id) return `id:${id}`;
    const ariaLabel = control.getAttribute("aria-label")?.trim();
    if (ariaLabel) return `aria:${ariaLabel}`;
    const placeholder =
      control instanceof HTMLInputElement || control instanceof HTMLTextAreaElement
        ? control.placeholder?.trim()
        : "";
    if (placeholder) return `placeholder:${placeholder}`;
    return `index:${listControls().indexOf(control)}`;
  }

  function optionValue(input: HTMLInputElement): string {
    return input.getAttribute("data-value") || input.value;
  }

  function controlKey(control: FormControl): string {
    const identity = controlIdentity(control);
    if (control instanceof HTMLInputElement && control.type === "radio") {
      return `radio:${identity}`;
    }
    if (control instanceof HTMLInputElement && control.type === "checkbox") {
      return `checkbox:${identity}:${optionValue(control)}`;
    }
    const sameIdentity = listControls().filter(
      (candidate) =>
        !(candidate instanceof HTMLInputElement && ["radio", "checkbox"].includes(candidate.type)) &&
        controlIdentity(candidate) === identity
    );
    return `field:${identity}:${Math.max(0, sameIdentity.indexOf(control))}`;
  }

  function controlValue(control: FormControl): string {
    if (control instanceof HTMLInputElement && control.type === "checkbox") {
      return control.checked ? "1" : "0";
    }
    if (control instanceof HTMLInputElement && control.type === "radio") {
      const group = listControls().filter(
        (candidate) =>
          candidate instanceof HTMLInputElement &&
          candidate.type === "radio" &&
          controlIdentity(candidate) === controlIdentity(control)
      ) as HTMLInputElement[];
      const checked = group.find((candidate) => candidate.checked);
      return checked ? optionValue(checked) : "";
    }
    if (control instanceof HTMLSelectElement && control.multiple) {
      return JSON.stringify(Array.from(control.selectedOptions).map((option) => option.value));
    }
    return control.value;
  }

  function findControl(key: string): FormControl | null {
    return listControls().find((control) => controlKey(control) === key) ?? null;
  }

  function setNativeValue(control: FormControl, value: string): void {
    if (control instanceof HTMLInputElement && control.type === "radio") {
      const target = listControls().find(
        (candidate) =>
          candidate instanceof HTMLInputElement &&
          candidate.type === "radio" &&
          controlKey(candidate) === controlKey(control) &&
          optionValue(candidate) === value
      ) as HTMLInputElement | undefined;
      if (target && !target.checked) target.click();
      return;
    }

    if (control instanceof HTMLInputElement && control.type === "checkbox") {
      const checked = value === "1";
      if (control.checked !== checked) control.click();
      return;
    }

    if (control instanceof HTMLSelectElement) {
      if (control.multiple) {
        let selected: string[] = [];
        try {
          selected = JSON.parse(value) as string[];
        } catch {
          selected = [];
        }
        Array.from(control.options).forEach((option) => {
          option.selected = selected.includes(option.value);
        });
      } else if (control.value !== value) {
        control.value = value;
      }
      control.dispatchEvent(new Event("change", { bubbles: true }));
      return;
    }

    if (control.value === value) return;
    const prototype =
      control instanceof HTMLTextAreaElement
        ? HTMLTextAreaElement.prototype
        : HTMLInputElement.prototype;
    const setter = Object.getOwnPropertyDescriptor(prototype, "value")?.set;
    if (setter) setter.call(control, value);
    else control.value = value;
    control.dispatchEvent(new InputEvent("input", { bubbles: true, inputType: "insertText" }));
    control.dispatchEvent(new Event("change", { bubbles: true }));
  }

  function publishControl(control: FormControl): void {
    if (isApplyingRemoteFields || !provider.isSynced) return;
    const key = controlKey(control);
    const value = controlValue(control);
    if (fields.get(key) === value) return;
    doc.transact(() => fields.set(key, value), peerId);
    log("published field", key, value.slice(0, 40));
  }

  function schedulePublishControl(control: FormControl): void {
    window.clearTimeout(fieldPublishTimer);
    fieldPublishTimer = window.setTimeout(() => publishControl(control), 80);
  }

  function applyField(key: string): void {
    const control = findControl(key);
    const value = fields.get(key);
    if (!control || typeof value !== "string") return;
    if (controlValue(control) === value) return;
    isApplyingRemoteFields = true;
    try {
      setNativeValue(control, value);
    } finally {
      window.setTimeout(() => {
        isApplyingRemoteFields = false;
      }, 30);
    }
  }

  function applyAllRemoteFields(): void {
    fields.forEach((_value, key) => applyField(key));
  }

  function currentUpstreamUrl(): string {
    const fromQuery = params.get("target");
    if (fromQuery) return fromQuery;
    return root.dataset.lowcoderUpstreamUrl || "";
  }

  function buildProxiedUrlForTarget(targetUrl: string): string {
    const next = new URL(window.location.href);
    next.searchParams.set("target", targetUrl);
    return `${next.pathname}?${next.searchParams.toString()}`;
  }

  function readScroll(): ScrollState {
    const maxX = Math.max(0, document.documentElement.scrollWidth - window.innerWidth);
    const maxY = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
    return {
      xRatio: maxX > 0 ? window.scrollX / maxX : 0,
      yRatio: maxY > 0 ? window.scrollY / maxY : 0,
    };
  }

  function applyScroll(scroll: ScrollState): void {
    const maxX = Math.max(0, document.documentElement.scrollWidth - window.innerWidth);
    const maxY = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
    isApplyingRemote = true;
    try {
      window.scrollTo({
        left: clamp(scroll.xRatio, 0, 1) * maxX,
        top: clamp(scroll.yRatio, 0, 1) * maxY,
        behavior: "auto",
      });
    } finally {
      window.setTimeout(() => {
        isApplyingRemote = false;
      }, 50);
    }
  }

  /** Presenter-only: publish navigation for attendees to accept/decline. */
  function publishUrl(url: string): void {
    if (!isPresenter || isApplyingRemote || !provider.isSynced) return;
    const navSeq = Number(state.get("navSeq") || "0") + 1;
    doc.transact(() => {
      state.set("url", url);
      state.set("navSeq", String(navSeq));
      state.set(
        "navOffer",
        JSON.stringify({
          url,
          navSeq,
          editorId,
          username,
        } satisfies NavOffer)
      );
    });
    log("publish url", url, navSeq);
  }

  /** Presenter-only: followers apply this scroll. */
  function publishScroll(): void {
    if (!isPresenter || isApplyingRemote || !provider.isSynced) return;
    const scroll = readScroll();
    const encoded = JSON.stringify(scroll);
    if (encoded === lastPublishedScroll) return;
    lastPublishedScroll = encoded;
    state.set("scroll", encoded);
  }

  function publishClick(event: MouseEvent): void {
    if (!provider.isSynced) return;
    const xRatio = window.innerWidth > 0 ? event.clientX / window.innerWidth : 0;
    const yRatio = window.innerHeight > 0 ? event.clientY / window.innerHeight : 0;
    const button = findButtonTarget(event.target);
    const color = getUserColor(editorId);

    let click: ClickState = {
      xRatio,
      yRatio,
      ts: Date.now(),
      editorId,
      username,
      kind: "generic",
      label: "",
    };

    if (button) {
      const rect = button.getBoundingClientRect();
      const label =
        (button.getAttribute("aria-label") ||
          button.textContent ||
          (button instanceof HTMLInputElement ? button.value : "") ||
          "Button")
          .trim()
          .replace(/\s+/g, " ")
          .slice(0, 80);
      click = {
        ...click,
        kind: "button",
        label,
        rect: {
          leftRatio: rect.left / (window.innerWidth || 1),
          topRatio: rect.top / (window.innerHeight || 1),
          wRatio: rect.width / (window.innerWidth || 1),
          hRatio: rect.height / (window.innerHeight || 1),
        },
      };
      pointer.showButtonClickFlash(
        { left: rect.left, top: rect.top, width: rect.width, height: rect.height },
        color,
        `${username}: ${label}`
      );
    } else {
      pointer.showClickRipple(xRatio, yRatio, color);
    }

    state.set("click", JSON.stringify(click));
  }

  function hideFollowPrompt(): void {
    followPromptEl?.remove();
    followPromptEl = null;
  }

  function showFollowPrompt(offer: NavOffer): void {
    if (isPresenter) return;
    if (offer.navSeq <= dismissedNavSeq) return;
    if (offer.url === currentUpstreamUrl()) return;

    hideFollowPrompt();

    const panel = document.createElement("div");
    panel.id = "lowcoder-website-follow-prompt";
    Object.assign(panel.style, {
      position: "fixed",
      left: "50%",
      top: "56px",
      transform: "translateX(-50%)",
      zIndex: "2147483647",
      maxWidth: "min(440px, calc(100vw - 24px))",
      padding: "14px 16px",
      borderRadius: "10px",
      background: "rgba(20, 24, 28, 0.94)",
      color: "#fff",
      font: "13px/1.4 system-ui,sans-serif",
      boxShadow: "0 8px 28px rgba(0,0,0,.35)",
      pointerEvents: "auto",
    });

    const title = document.createElement("div");
    title.style.fontWeight = "600";
    title.style.marginBottom = "6px";
    title.textContent = `${offer.username || "Presenter"} opened a new page`;

    const urlLine = document.createElement("div");
    urlLine.style.opacity = "0.85";
    urlLine.style.fontSize = "12px";
    urlLine.style.wordBreak = "break-all";
    urlLine.style.marginBottom = "12px";
    urlLine.textContent = offer.url;

    const actions = document.createElement("div");
    Object.assign(actions.style, {
      display: "flex",
      gap: "8px",
      justifyContent: "flex-end",
    });

    const stayBtn = document.createElement("button");
    stayBtn.type = "button";
    stayBtn.textContent = "Stay";
    Object.assign(stayBtn.style, {
      padding: "6px 12px",
      borderRadius: "6px",
      border: "1px solid rgba(255,255,255,.25)",
      background: "transparent",
      color: "#fff",
      cursor: "pointer",
    });
    stayBtn.addEventListener("click", () => {
      dismissedNavSeq = offer.navSeq;
      hideFollowPrompt();
      log("dismissed follow", offer.url);
    });

    const followBtn = document.createElement("button");
    followBtn.type = "button";
    followBtn.textContent = "Follow";
    Object.assign(followBtn.style, {
      padding: "6px 12px",
      borderRadius: "6px",
      border: "none",
      background: "#1E88E5",
      color: "#fff",
      cursor: "pointer",
      fontWeight: "600",
    });
    followBtn.addEventListener("click", () => {
      dismissedNavSeq = offer.navSeq;
      hideFollowPrompt();
      isApplyingRemote = true;
      window.location.assign(buildProxiedUrlForTarget(offer.url));
    });

    actions.appendChild(stayBtn);
    actions.appendChild(followBtn);
    panel.appendChild(title);
    panel.appendChild(urlLine);
    panel.appendChild(actions);
    document.documentElement.appendChild(panel);
    followPromptEl = panel;
  }

  function applyRemoteClick(click: ClickState): void {
    const color = getUserColor(click.editorId);
    if (click.kind === "button" && click.rect) {
      pointer.showButtonClickFlash(
        {
          left: click.rect.leftRatio * window.innerWidth,
          top: click.rect.topRatio * window.innerHeight,
          width: click.rect.wRatio * window.innerWidth,
          height: click.rect.hRatio * window.innerHeight,
        },
        color,
        `${click.username || "User"}: ${click.label || "Button"}`
      );
      return;
    }
    pointer.showClickRipple(click.xRatio, click.yRatio, color);
  }

  function applyRemoteState(): void {
    const navSeq = Number(state.get("navSeq") || "0");
    const offerRaw = state.get("navOffer");
    if (offerRaw && navSeq > lastAppliedNavSeq) {
      lastAppliedNavSeq = navSeq;
      try {
        const offer = JSON.parse(offerRaw) as NavOffer;
        if (!isPresenter && offer.url && offer.url !== currentUpstreamUrl()) {
          showFollowPrompt(offer);
        }
      } catch {
        // ignore malformed nav offer
      }
    }

    // Presenter scroll → attendees follow (approximate by viewport ratio)
    if (!isPresenter) {
      const scrollRaw = state.get("scroll");
      if (scrollRaw) {
        try {
          const scroll = JSON.parse(scrollRaw) as ScrollState;
          const local = readScroll();
          if (
            Math.abs(local.xRatio - scroll.xRatio) > 0.01 ||
            Math.abs(local.yRatio - scroll.yRatio) > 0.01
          ) {
            applyScroll(scroll);
            lastPublishedScroll = scrollRaw;
          }
        } catch {
          // ignore malformed scroll
        }
      }
    }

    const clickRaw = state.get("click");
    if (clickRaw) {
      try {
        const click = JSON.parse(clickRaw) as ClickState;
        if (click.ts > lastAppliedClickTs && click.editorId !== editorId) {
          lastAppliedClickTs = click.ts;
          applyRemoteClick(click);
        }
      } catch {
        // ignore malformed click
      }
    }
  }

  // --- Form field sync (mutual): text / textarea / select / checkbox / radio ---
  document.addEventListener(
    "input",
    (event) => {
      if (!event.isTrusted || isApplyingRemoteFields) return;
      const target = event.target;
      if (
        !(target instanceof HTMLInputElement) &&
        !(target instanceof HTMLTextAreaElement) &&
        !(target instanceof HTMLSelectElement)
      ) {
        return;
      }
      schedulePublishControl(target);
    },
    true
  );

  document.addEventListener(
    "change",
    (event) => {
      if (!event.isTrusted || isApplyingRemoteFields) return;
      const target = event.target;
      if (
        !(target instanceof HTMLInputElement) &&
        !(target instanceof HTMLTextAreaElement) &&
        !(target instanceof HTMLSelectElement)
      ) {
        return;
      }
      publishControl(target);
    },
    true
  );

  fields.observe((event) => {
    if (event.transaction.origin === peerId) return;
    event.keysChanged.forEach((key) => applyField(key));
  });

  // --- Clicks: button highlight for all; navigation publish for presenter ---
  document.addEventListener(
    "click",
    (event) => {
      if (!event.isTrusted) return;

      // Checkbox / radio clicks are handled via change; still show ripple for other clicks
      const formControl = event.target;
      const isFormControl =
        formControl instanceof HTMLInputElement ||
        formControl instanceof HTMLTextAreaElement ||
        formControl instanceof HTMLSelectElement;
      if (!isFormControl) {
        publishClick(event);
      } else if (
        formControl instanceof HTMLInputElement &&
        ["checkbox", "radio"].includes(formControl.type)
      ) {
        // ensure value publishes even if change is delayed
        window.setTimeout(() => publishControl(formControl), 0);
      }

      const anchor = (event.target as Element | null)?.closest?.("a[href]");
      if (!(anchor instanceof HTMLAnchorElement)) return;

      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("#") || href.startsWith("javascript:")) return;

      try {
        const resolved = new URL(anchor.href, window.location.href);
        if (resolved.pathname.includes("/proxy/website")) {
          const target = resolved.searchParams.get("target");
          if (target && isPresenter) {
            publishUrl(target);
          }
          return;
        }
        if (resolved.protocol === "http:" || resolved.protocol === "https:") {
          event.preventDefault();
          if (isPresenter) {
            publishUrl(resolved.toString());
          }
          window.location.assign(buildProxiedUrlForTarget(resolved.toString()));
        }
      } catch {
        // ignore invalid href
      }
    },
    true
  );

  const originalPushState = history.pushState.bind(history);
  const originalReplaceState = history.replaceState.bind(history);

  function onHistoryChange(): void {
    if (!isPresenter) return;
    const url = currentUpstreamUrl();
    if (url) publishUrl(url);
  }

  history.pushState = function (...args) {
    const result = originalPushState(...args);
    onHistoryChange();
    return result;
  };
  history.replaceState = function (...args) {
    const result = originalReplaceState(...args);
    onHistoryChange();
    return result;
  };
  window.addEventListener("popstate", onHistoryChange);
  window.addEventListener("hashchange", onHistoryChange);

  // --- Scroll: presenter publishes; attendees apply ---
  window.addEventListener(
    "scroll",
    () => {
      if (isApplyingRemote || !isPresenter) return;
      window.clearTimeout(scrollPublishTimer);
      scrollPublishTimer = window.setTimeout(() => publishScroll(), 80);
    },
    { passive: true }
  );

  state.observe(() => applyRemoteState());

  provider.on("synced", () => {
    log("synced", documentName);
    const localUrl = currentUpstreamUrl();
    if (isPresenter) {
      if (localUrl) {
        publishUrl(localUrl);
        publishScroll();
      }
    } else {
      applyRemoteState();
    }
    applyAllRemoteFields();
  });

  log("ready", {
    documentName,
    editorId,
    username,
    isPresenter,
    upstream: currentUpstreamUrl(),
  });
})();

function findButtonTarget(target: EventTarget | null): Element | null {
  if (!(target instanceof Element)) return null;
  return target.closest(
    "button, [role='button'], input[type='button'], input[type='submit'], input[type='reset']"
  );
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
