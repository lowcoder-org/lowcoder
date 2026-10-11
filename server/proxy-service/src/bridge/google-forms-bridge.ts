import * as Y from "yjs";
import { HocuspocusProvider, WebSocketStatus } from "@hocuspocus/provider";
import { initTypeformCursorPresence } from "./cursor-presence/initTypeformCursorPresence";

declare global {
  interface Window {
    __LOWCODER_HOCUSPOCUS__?: { url?: string; token?: string };
  }
}

type FormControl = HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
type ChoiceWidget = HTMLElement;
type NavigationAction = "next" | "back" | "submit";

interface NavigationCommand {
  id: string;
  action: NavigationAction;
  fromPage: string;
  editorId: string;
}

(() => {
  const params = new URLSearchParams(window.location.search);
  const root = document.documentElement;
  const roomId = params.get("roomId") || root.dataset.lowcoderRoomId || "";
  const role = params.get("role") || root.dataset.lowcoderRole || "driver";
  const editorId = params.get("editorId") || root.dataset.lowcoderEditorId || "local";
  const collabId = params.get("collab") || root.dataset.lowcoderCollabId || "";
  const debug = params.get("debug") === "1";
  const peerId = `${editorId}|${role}|${Math.random().toString(36).slice(2, 10)}`;

  if (!roomId || !collabId) {
    console.error(
      "[google-forms-bridge] Missing roomId/collab. Load the form through /proxy/google-forms " +
        "and create a session with createGoogleFormsProxySession before Fill Together."
    );
    return;
  }

  if (!window.location.pathname.includes("/proxy/google-forms")) {
    console.error(
      "[google-forms-bridge] Form left the Lowcoder proxy (often after Google sign-in on an /edit URL). " +
        "Use the published .../viewform responder URL instead of webViewLink."
    );
    return;
  }
  const hocuspocusConfig = window.__LOWCODER_HOCUSPOCUS__ ?? {};
  const hocuspocusUrl =
    hocuspocusConfig.url || root.dataset.lowcoderHocuspocusUrl || "ws://localhost:3006";
  const hocuspocusToken =
    hocuspocusConfig.token || root.dataset.lowcoderHocuspocusToken || "";
  const documentName = `googleform_${roomId}_${collabId}`;

  let providerReady = false;
  let isApplyingRemoteState = false;
  let lastNavigationId = "";
  let navigationTimer: number | undefined;

  const doc = new Y.Doc();
  const fields = doc.getMap<string>("fields");
  const state = doc.getMap<string>("state");
  const provider = new HocuspocusProvider({
    url: hocuspocusUrl,
    name: documentName,
    document: doc,
    token: hocuspocusToken || undefined,
    onAuthenticationFailed: (data) => {
      console.error("[google-forms-bridge] Hocuspocus auth failed", data);
    },
  });

  function log(...args: unknown[]): void {
    if (debug) console.log("[google-forms-bridge]", role, ...args);
  }

  function listControls(): FormControl[] {
    return Array.from(
      document.querySelectorAll<FormControl>("input, textarea, select")
    ).filter((control) => {
      if (control.disabled) return false;
      if (control.getAttribute("name") === "g-recaptcha-response") return false;
      if (control instanceof HTMLInputElement) {
        const type = (control.type || "text").toLowerCase();
        return !["hidden", "button", "submit", "reset", "file", "password", "image"].includes(type);
      }
      const rect = control.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0;
    });
  }

  function listChoiceWidgets(): ChoiceWidget[] {
    return Array.from(
      document.querySelectorAll<ChoiceWidget>(
        '[role="radio"], [role="checkbox"], [role="listbox"]'
      )
    ).filter((widget) => widget.getAttribute("aria-disabled") !== "true");
  }

  function stableHash(value: string): string {
    let hash = 5381;
    for (let index = 0; index < value.length; index += 1) {
      hash = (hash * 33) ^ value.charCodeAt(index);
    }
    return (hash >>> 0).toString(36);
  }

  function widgetGroup(widget: ChoiceWidget): HTMLElement {
    return (
      widget.closest<HTMLElement>('[role="radiogroup"], [role="group"]') ||
      widget.closest<HTMLElement>('[role="listitem"], [data-params]') ||
      widget.parentElement ||
      widget
    );
  }

  function widgetIdentity(widget: ChoiceWidget): string {
    const group = widgetGroup(widget);
    const question = widget.closest<HTMLElement>("[data-params]");
    const dataParams = question?.getAttribute("data-params");
    if (dataParams) {
      const groups = Array.from(
        question.querySelectorAll<HTMLElement>('[role="radiogroup"], [role="group"], [role="listbox"]')
      );
      return `question:${stableHash(dataParams)}:group:${Math.max(0, groups.indexOf(group))}`;
    }
    const listItems = Array.from(document.querySelectorAll<HTMLElement>('[role="listitem"]'));
    const listItem = widget.closest<HTMLElement>('[role="listitem"]');
    if (listItem) return `listitem:${Math.max(0, listItems.indexOf(listItem))}`;
    return `widget:${Math.max(0, listChoiceWidgets().indexOf(widget))}`;
  }

  function widgetKey(widget: ChoiceWidget): string {
    const identity = widgetIdentity(widget);
    if (widget.getAttribute("role") === "checkbox") {
      return `widget-checkbox:${identity}:${widget.dataset.value || widget.getAttribute("aria-label") || ""}`;
    }
    return `widget-${widget.getAttribute("role")}:${identity}`;
  }

  function widgetValue(widget: ChoiceWidget): string {
    const role = widget.getAttribute("role");
    if (role === "checkbox") return widget.getAttribute("aria-checked") === "true" ? "1" : "0";
    if (role === "radio") {
      const selected = widgetGroup(widget).querySelector<HTMLElement>(
        '[role="radio"][aria-checked="true"]'
      );
      return selected?.dataset.value || selected?.getAttribute("aria-label") || "";
    }
    const selected = widget.querySelector<HTMLElement>('[role="option"][aria-selected="true"]');
    return selected?.dataset.value || selected?.textContent?.trim() || "";
  }

  function controlIdentity(control: FormControl): string {
    const name = control.getAttribute("name")?.trim();
    if (name) return `name:${name}`;
    const id = control.id?.trim();
    if (id) return `id:${id}`;
    const ariaLabel = control.getAttribute("aria-label")?.trim();
    if (ariaLabel) return `aria:${ariaLabel}`;
    const all = listControls();
    return `index:${all.indexOf(control)}`;
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

  function optionValue(input: HTMLInputElement): string {
    return (
      input.closest<HTMLElement>("[data-value]")?.dataset.value ||
      input.getAttribute("data-value") ||
      input.value
    );
  }

  function controlKey(control: FormControl): string {
    const identity = controlIdentity(control);
    if (control instanceof HTMLInputElement && control.type === "radio") {
      return `radio:${identity}`;
    }
    if (control instanceof HTMLInputElement && control.type === "checkbox") {
      const peers = listControls().filter(
        (candidate) =>
          candidate instanceof HTMLInputElement &&
          candidate.type === "checkbox" &&
          controlIdentity(candidate) === identity
      ) as HTMLInputElement[];
      const sameValueIndex = peers
        .filter((candidate) => optionValue(candidate) === optionValue(control))
        .indexOf(control);
      return `checkbox:${identity}:${optionValue(control)}:${Math.max(0, sameValueIndex)}`;
    }
    const sameIdentity = listControls().filter(
      (candidate) =>
        !(candidate instanceof HTMLInputElement && ["radio", "checkbox"].includes(candidate.type)) &&
        controlIdentity(candidate) === identity
    );
    return `field:${identity}:${Math.max(0, sameIdentity.indexOf(control))}`;
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
      } else {
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
    if (isApplyingRemoteState) return;
    const key = controlKey(control);
    const value = controlValue(control);
    if (fields.get(key) === value) return;
    doc.transact(() => fields.set(key, value), peerId);
    log("published field", key);
  }

  function publishAllControls(onlyMissing = false): void {
    doc.transact(() => {
      listControls().forEach((control) => {
        const key = controlKey(control);
        if (onlyMissing && fields.has(key)) return;
        fields.set(key, controlValue(control));
      });
    }, peerId);
  }

  function publishWidget(widget: ChoiceWidget): void {
    if (isApplyingRemoteState) return;
    const key = widgetKey(widget);
    const value = widgetValue(widget);
    if (fields.get(key) === value) return;
    doc.transact(() => fields.set(key, value), peerId);
    log("published widget", key);
  }

  function publishAllWidgets(onlyMissing = false): void {
    const seen = new Set<string>();
    doc.transact(() => {
      listChoiceWidgets().forEach((widget) => {
        const key = widgetKey(widget);
        if (seen.has(key) || (onlyMissing && fields.has(key))) return;
        seen.add(key);
        fields.set(key, widgetValue(widget));
      });
    }, peerId);
  }

  function findWidget(key: string): ChoiceWidget | null {
    return listChoiceWidgets().find((widget) => widgetKey(widget) === key) ?? null;
  }

  function applyWidget(key: string): void {
    const widget = findWidget(key);
    const value = fields.get(key);
    if (!widget || typeof value !== "string" || widgetValue(widget) === value) return;

    let target: HTMLElement | null = null;
    const role = widget.getAttribute("role");
    if (role === "checkbox") {
      target = widget;
    } else if (role === "radio") {
      target =
        Array.from(widgetGroup(widget).querySelectorAll<HTMLElement>('[role="radio"]')).find(
          (option) =>
            (option.dataset.value || option.getAttribute("aria-label") || "") === value
        ) ?? null;
    } else {
      target =
        Array.from(widget.querySelectorAll<HTMLElement>('[role="option"]')).find(
          (option) => (option.dataset.value || option.textContent?.trim() || "") === value
        ) ?? null;
    }
    if (!target) return;

    isApplyingRemoteState = true;
    try {
      target.click();
      log("applied widget", key);
    } finally {
      window.setTimeout(() => {
        isApplyingRemoteState = false;
      }, 0);
    }
  }

  function applyField(key: string): void {
    if (key.startsWith("widget-")) {
      applyWidget(key);
      return;
    }
    const control = findControl(key);
    const value = fields.get(key);
    if (!control || typeof value !== "string" || controlValue(control) === value) return;
    isApplyingRemoteState = true;
    try {
      setNativeValue(control, value);
      log("applied field", key);
    } finally {
      isApplyingRemoteState = false;
    }
  }

  function applyAllFields(): void {
    fields.forEach((_value, key) => applyField(key));
  }

  function pageMarker(): string {
    const history = document.querySelector<HTMLInputElement>(
      'input[name="pageHistory"], input[name="pagehistory"]'
    )?.value;
    if (history) return history;
    const visibleQuestion = Array.from(
      document.querySelectorAll<HTMLElement>('[role="listitem"], [data-params]')
    ).find((element) => {
      const rect = element.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0;
    });
    return visibleQuestion?.getAttribute("data-params")?.slice(0, 200) || window.location.pathname;
  }

  function navigationAction(target: Element): NavigationAction | null {
    const button = target.closest<HTMLElement>(
      'button, input[type="submit"], [role="button"], [jsname]'
    );
    if (!button) return null;
    const jsname = button.getAttribute("jsname") || "";
    const text = (button.textContent || (button as HTMLInputElement).value || "")
      .trim()
      .toLowerCase();
    if (jsname === "e19J0b" || /^(back|previous)$/.test(text)) return "back";
    if (jsname === "OCpkoe" || /^(next|continue)$/.test(text)) return "next";
    if (jsname === "M2UYVd" || /^(submit|send)$/.test(text)) return "submit";
    return null;
  }

  function findNavigationButton(action: "next" | "back"): HTMLElement | null {
    const jsname = action === "next" ? "OCpkoe" : "e19J0b";
    const byJsName = document.querySelector<HTMLElement>(`[jsname="${jsname}"]`);
    if (byJsName) return byJsName;
    return (
      Array.from(
        document.querySelectorAll<HTMLElement>('button, input[type="submit"], [role="button"]')
      ).find((button) => navigationAction(button) === action) ?? null
    );
  }

  function publishNavigation(action: NavigationAction): void {
    publishAllControls();
    publishAllWidgets();
    const command: NavigationCommand = {
      id: `${peerId}:${Date.now()}:${Math.random().toString(36).slice(2, 7)}`,
      action,
      fromPage: pageMarker(),
      editorId: peerId,
    };
    lastNavigationId = command.id;
    doc.transact(() => state.set("navigationJson", JSON.stringify(command)), peerId);
    log("published navigation", command);
  }

  function applyRemoteNavigation(): void {
    const raw = state.get("navigationJson");
    if (typeof raw !== "string" || !raw) return;
    let command: NavigationCommand;
    try {
      command = JSON.parse(raw) as NavigationCommand;
    } catch {
      return;
    }
    if (
      !command.id ||
      command.id === lastNavigationId ||
      command.editorId === peerId ||
      command.action === "submit" ||
      command.fromPage !== pageMarker()
    ) {
      return;
    }
    lastNavigationId = command.id;
    window.clearTimeout(navigationTimer);
    navigationTimer = window.setTimeout(() => {
      applyAllFields();
      const button = findNavigationButton(command.action);
      if (!button) {
        log("navigation button not found", command.action);
        return;
      }
      isApplyingRemoteState = true;
      button.click();
      window.setTimeout(() => {
        isApplyingRemoteState = false;
      }, 500);
      log("applied navigation", command.action);
    }, 100);
  }

  fields.observe((event) => {
    if (event.transaction.origin === peerId) return;
    event.keysChanged.forEach((key) => applyField(key));
  });
  state.observe((event) => {
    if (event.transaction.origin === peerId) return;
    if (event.keysChanged.has("navigationJson")) applyRemoteNavigation();
  });

  function onProviderReady(): void {
    if (!providerReady) {
      providerReady = true;
      publishAllControls(true);
      publishAllWidgets(true);
    }
    applyAllFields();
    applyRemoteNavigation();
  }

  provider.on("status", ({ status }) => {
    if (status === WebSocketStatus.Connected) onProviderReady();
  });
  provider.on("synced", onProviderReady);

  document.addEventListener(
    "input",
    (event) => {
      if (!event.isTrusted || isApplyingRemoteState) return;
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement ||
        event.target instanceof HTMLSelectElement
      ) {
        publishControl(event.target);
      }
    },
    true
  );
  document.addEventListener(
    "change",
    (event) => {
      if (!event.isTrusted || isApplyingRemoteState) return;
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement ||
        event.target instanceof HTMLSelectElement
      ) {
        publishControl(event.target);
      }
    },
    true
  );
  document.addEventListener(
    "click",
    (event) => {
      if (!event.isTrusted || isApplyingRemoteState || !(event.target instanceof Element)) return;
      const action = navigationAction(event.target);
      if (action) {
        publishNavigation(action);
        return;
      }
      const widget = event.target.closest<HTMLElement>(
        '[role="radio"], [role="checkbox"], [role="listbox"], [role="option"]'
      );
      if (widget) {
        const root =
          widget.getAttribute("role") === "option"
            ? widget.closest<HTMLElement>('[role="listbox"]')
            : widget;
        if (root) window.setTimeout(() => publishWidget(root), 0);
      }
    },
    true
  );

  let mutationTimer: number | undefined;
  const observer = new MutationObserver(() => {
    window.clearTimeout(mutationTimer);
    mutationTimer = window.setTimeout(() => {
      if (!isApplyingRemoteState) {
        publishAllControls(true);
        publishAllWidgets(true);
        applyAllFields();
      }
    }, 100);
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });

  initTypeformCursorPresence({
    provider,
    editorId,
    role,
    debug,
    getFieldKey: (field) => controlKey(field),
    findFieldByKey: (key) => {
      const field = findControl(key);
      return field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement ? field : null;
    },
    getCurrentStep: () => {
      const marker = pageMarker();
      const last = marker.split(",").pop();
      return Number(last) || 0;
    },
    getSessionStarted: () => true,
    isWelcomeScreen: () => false,
    isSyncing: () => isApplyingRemoteState,
  });

  console.info("[google-forms-bridge] ready", { roomId, collabId, role, editorId, documentName });
  log("ready", { roomId, collabId, role, editorId, documentName });

  window.addEventListener("beforeunload", () => {
    window.clearTimeout(mutationTimer);
    window.clearTimeout(navigationTimer);
    observer.disconnect();
    provider.destroy();
    doc.destroy();
  });
})();
