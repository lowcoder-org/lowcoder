import * as Y from "yjs";
import { HocuspocusProvider, WebSocketStatus } from "@hocuspocus/provider";
import { initTypeformCursorPresence } from "./cursor-presence/initTypeformCursorPresence";

declare global {
  interface Window {
    __LOWCODER_HOCUSPOCUS__?: { url?: string; token?: string };
  }
}

(() => {
  type TypeformPatch = {
    formId?: string;
    answers: Record<string, unknown>;
    /** Absolute step index the peer is on after this action. */
    currentStep: number;
    /** Answers were collected for this question key. */
    questionKey: string;
    version: number;
    lastEditor?: string;
    submitted?: boolean;
    started?: boolean;
    /** Optional explicit navigation hint. */
    nav?: "answer" | "next" | "prev" | "start";
  };

  const pageParams = new URLSearchParams(window.location.search);
  const roomId =
    pageParams.get("roomId") ||
    document.documentElement.getAttribute("data-lowcoder-room-id") ||
    "";
  const role =
    pageParams.get("role") ||
    document.documentElement.getAttribute("data-lowcoder-role") ||
    "driver";
  const editorId =
    pageParams.get("editorId") ||
    document.documentElement.getAttribute("data-lowcoder-editor-id") ||
    "local";
  // Unique per iframe load so two tabs of the same user still sync.
  const peerId = `${editorId}|${role}|${Math.random().toString(36).slice(2, 10)}`;
  const collabId =
    pageParams.get("collab") ||
    document.documentElement.getAttribute("data-lowcoder-collab-id") ||
    "default";
  const debug = pageParams.get("debug") === "1";

  const hocuspocusConfig = window.__LOWCODER_HOCUSPOCUS__ ?? {};
  const hocuspocusUrl =
    hocuspocusConfig.url ||
    document.documentElement.getAttribute("data-lowcoder-hocuspocus-url") ||
    "ws://localhost:3006";
  const hocuspocusToken =
    hocuspocusConfig.token ||
    document.documentElement.getAttribute("data-lowcoder-hocuspocus-token") ||
    "";

  const documentName = `typeform_${roomId}_${collabId}`;

  let version = 0;
  let lastAppliedVersion = 0;
  let localStep = 0;
  let isApplyingRemoteState = false;
  let lastSentPayload = "";
  let sessionStarted = false;
  let welcomeClickPending = false;
  let providerReady = false;
  let lastNavAt = 0;
  let lastLocalInputAt = 0;
  let isApplyingInputText = false;
  let publishInputTimer: number | undefined;
  let applyingGeneration = 0;
  const outboundQueue: TypeformPatch[] = [];
  let allAnswers: Record<string, unknown> = {};

  const doc = new Y.Doc();
  const stateMap = doc.getMap<unknown>("state");

  const provider = new HocuspocusProvider({
    url: hocuspocusUrl,
    name: documentName,
    document: doc,
    token: hocuspocusToken || undefined,
    onAuthenticationFailed: (data) => {
      console.error("[typeform-bridge] Hocuspocus auth failed", data);
    },
  });

  function log(...args: unknown[]) {
    if (debug) console.log("[typeform-bridge]", role, ...args);
  }

  function nextVersion(): number {
    const remote = Number(stateMap.get("version") || 0);
    version = Math.max(version, remote) + 1;
    return version;
  }

  function publishPatch(patch: TypeformPatch): void {
    if (!providerReady) {
      outboundQueue.push(patch);
      return;
    }
    doc.transact(() => {
      if (patch.started) {
        stateMap.set("started", true);
      }
      stateMap.set("version", patch.version);
      stateMap.set("patchJson", JSON.stringify(patch));
    });
    log("published", {
      version: patch.version,
      step: patch.currentStep,
      nav: patch.nav,
      q: patch.questionKey,
    });
  }

  function flushOutboundQueue(): void {
    while (outboundQueue.length > 0) {
      const patch = outboundQueue.shift();
      if (patch) publishPatch(patch);
    }
  }

  function parseRemotePatch(): TypeformPatch | null {
    const raw = stateMap.get("patchJson");
    if (typeof raw !== "string" || !raw) return null;
    try {
      return JSON.parse(raw) as TypeformPatch;
    } catch {
      return null;
    }
  }

  function shouldApplyPatch(patch: TypeformPatch): boolean {
    if (!patch) return false;
    if (patch.lastEditor === peerId) return false;
    if ((patch.version ?? 0) <= lastAppliedVersion && patch.currentStep === localStep) {
      return false;
    }
    return true;
  }

  function syncFromRemoteState(): void {
    const started = Boolean(stateMap.get("started"));
    const patch = parseRemotePatch();

    // Only followers mirror a remote start; driver always lands on welcome until local Start.
    if (started && !sessionStarted && role === "follower") {
      onRemoteSessionStarted();
    }

    // Apply navigation/answers first; inputTextsJson wins for in-progress typing.
    if (patch && shouldApplyPatch(patch)) {
      applyRemoteState(patch);
    }

    applyRemoteInputText();
  }

  provider.on("status", ({ status }) => {
    log("status", status, documentName);
    if (status === WebSocketStatus.Connected) {
      providerReady = true;
      flushOutboundQueue();
      syncFromRemoteState();
    }
  });

  provider.on("synced", () => {
    providerReady = true;
    flushOutboundQueue();
    syncFromRemoteState();
  });

  stateMap.observe((event) => {
    if (
      event.keysChanged.has("patchJson") ||
      event.keysChanged.has("version") ||
      event.keysChanged.has("started") ||
      event.keysChanged.has("inputTextJson") ||
      event.keysChanged.has("inputTextsJson")
    ) {
      syncFromRemoteState();
    }
  });

  function isVisible(el: Element): boolean {
    const node = el as HTMLElement;
    if (!node.getBoundingClientRect) return true;
    const rect = node.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
  }

  function listVisibleTextFields(
    container: Element | Document = document
  ): Array<HTMLInputElement | HTMLTextAreaElement> {
    return Array.from(
      container.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>(
        [
          'input[type="text"]',
          'input[type="email"]',
          'input[type="number"]',
          'input[type="tel"]',
          'input[type="url"]',
          'input[type="search"]',
          'input[type="short_text"]',
          'input[type="long_text"]',
          'input[type="phone_number"]',
          'input[name]',
          'input:not([type])',
          "textarea",
        ].join(", ")
      )
    ).filter((field) => {
      const type = (field.getAttribute("type") || field.type || "").toLowerCase();
      if (["hidden", "checkbox", "radio", "button", "submit", "file", "password"].includes(type)) {
        return false;
      }
      return isVisible(field);
    });
  }

  function getFocusedTextField(): HTMLInputElement | HTMLTextAreaElement | null {
    const el = document.activeElement;
    if (!el) return null;
    if (el instanceof HTMLInputElement) {
      const type = (el.getAttribute("type") || el.type || "text").toLowerCase();
      if (["hidden", "checkbox", "radio", "button", "submit", "file", "password"].includes(type)) {
        return null;
      }
      return el;
    }
    if (el instanceof HTMLTextAreaElement) return el;
    return null;
  }

  function extractQuestionUuid(value: string): string | null {
    const match = value.match(
      /([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i
    );
    return match?.[1] ?? null;
  }

  /** Stable field key shared across peers (name / Typeform question uuid). */
  function getFieldKey(field: HTMLInputElement | HTMLTextAreaElement): string {
    const name = field.getAttribute("name")?.trim();
    if (name) return `name:${name}`;

    const labelledBy = field.getAttribute("aria-labelledby") || "";
    const fromLabel = extractQuestionUuid(labelledBy);
    if (fromLabel) return `qid:${fromLabel}`;

    const id = field.getAttribute("id") || "";
    const fromId = extractQuestionUuid(id);
    if (fromId) return `qid:${fromId}`;

    const typeAttr = (field.getAttribute("type") || field.type || "text").toLowerCase();
    return `type:${typeAttr}:step:${localStep}`;
  }

  function findFieldByKey(key: string): HTMLInputElement | HTMLTextAreaElement | null {
    const visible = listVisibleTextFields(document);
    for (const field of visible) {
      if (getFieldKey(field) === key) return field;
    }

    if (key.startsWith("name:")) {
      const name = key.slice("name:".length);
      const el = document.querySelector<HTMLInputElement>(`input[name="${CSS.escape(name)}"]`);
      if (el && isVisible(el)) return el;
    }

    if (key.startsWith("qid:")) {
      const qid = key.slice("qid:".length);
      const matches = Array.from(
        document.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>(
          `input[aria-labelledby*="${CSS.escape(qid)}"], input[id*="${CSS.escape(qid)}"], textarea[aria-labelledby*="${CSS.escape(qid)}"]`
        )
      ).filter(isVisible);
      if (matches[0]) return matches[0];
    }

    return null;
  }

  function getActiveQuestionContainer(): Element | null {
    const candidates = [
      '[data-qa="question-container"]',
      '[data-qa="question"]',
      "fieldset",
      '[role="group"]',
    ];
    for (const selector of candidates) {
      const nodes = Array.from(document.querySelectorAll(selector)).filter(isVisible);
      if (nodes.length > 0) {
        return nodes[nodes.length - 1];
      }
    }
    return null;
  }

  function readInputTextsMap(): Record<string, string> {
    const raw = stateMap.get("inputTextsJson");
    if (typeof raw !== "string" || !raw) return {};
    try {
      const parsed = JSON.parse(raw) as Record<string, string>;
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch {
      return {};
    }
  }

  function syncAllAnswersForField(fieldKey: string, text: string): void {
    const qKey = stepKey(localStep);
    const container = getActiveQuestionContainer() || document;
    listVisibleTextFields(container).forEach((field, index) => {
      if (getFieldKey(field) === fieldKey) {
        allAnswers[`${qKey}::field-${index}`] = text;
      }
    });
  }

  function publishInputText(): void {
    if (!canPublish()) return;
    if (isApplyingInputText || isApplyingRemoteState) return;
    const field = getFocusedTextField() || listVisibleTextFields(document)[0];
    if (!field) return;

    const fieldKey = getFieldKey(field);
    const text = field.value;
    const remoteMap = readInputTextsMap();
    // Skip only when Yjs already has this exact value (allows re-publishing after delete-back).
    if ((remoteMap[fieldKey] ?? "") === text) return;

    if (!providerReady) return;

    syncAllAnswersForField(fieldKey, text);
    const nextMap = { ...remoteMap, [fieldKey]: text };
    const payload = {
      fieldKey,
      step: localStep,
      text,
      peerId,
      version: nextVersion(),
    };
    doc.transact(() => {
      stateMap.set("inputTextJson", JSON.stringify(payload));
      stateMap.set("inputTextsJson", JSON.stringify(nextMap));
      stateMap.set("version", payload.version);
    });
    log("published input text", payload);
  }

  /** Debounce publish so fast typing doesn't race with remote echoes. */
  function schedulePublishInputText(): void {
    lastLocalInputAt = Date.now();
    window.clearTimeout(publishInputTimer);
    publishInputTimer = window.setTimeout(() => {
      publishInputText();
    }, 120);
  }

  function flushPublishInputText(): void {
    window.clearTimeout(publishInputTimer);
    publishInputText();
  }

  function readLatestInputPayload(): {
    fieldKey?: string;
    text?: string;
    peerId?: string;
  } | null {
    const raw = stateMap.get("inputTextJson");
    if (typeof raw !== "string" || !raw) return null;
    try {
      return JSON.parse(raw) as { fieldKey?: string; text?: string; peerId?: string };
    } catch {
      return null;
    }
  }

  /** Apply stored text only onto matching visible fields (by name / question uuid). */
  function applyRemoteInputText(): void {
    if (isOnWelcomeScreen()) return;
    if (isApplyingInputText) return;

    const map = readInputTextsMap();
    const visible = listVisibleTextFields(document);
    const latestInput = readLatestInputPayload();
    // Only protect against overwrite while THIS client is actively typing.
    // Typeform auto-focuses inputs, so "has focus" alone must not block follower sync.
    const locallyTyping = Date.now() - lastLocalInputAt < 800;

    isApplyingInputText = true;
    try {
      for (const field of visible) {
        const key = getFieldKey(field);
        if (!Object.prototype.hasOwnProperty.call(map, key)) continue;
        // Never overwrite the field the user is actively typing in.
        if (locallyTyping && document.activeElement === field) continue;
        const next = map[key] ?? "";
        // Ignore stale self-echo while the DOM is ahead of our last publish.
        if (
          latestInput?.peerId === peerId &&
          latestInput.fieldKey === key &&
          document.activeElement === field &&
          field.value !== next
        ) {
          continue;
        }
        if (field.value === next) continue;
        setNativeInputValue(field, next);
        log("applied field text", key, next);
      }

      const payload = latestInput;
      if (
        payload &&
        payload.peerId !== peerId &&
        typeof payload.text === "string" &&
        payload.fieldKey
      ) {
        const target = findFieldByKey(payload.fieldKey);
        if (
          target &&
          !(locallyTyping && document.activeElement === target) &&
          target.value !== payload.text
        ) {
          setNativeInputValue(target, payload.text);
          log("applied field text (payload)", payload.fieldKey, payload.text);
        }
      }
    } finally {
      window.setTimeout(() => {
        isApplyingInputText = false;
      }, 50);
    }
  }

  function stepKey(step: number): string {
    return `question-${Math.max(0, step)}`;
  }

  function collectVisibleAnswersForKey(qKey: string): Record<string, unknown> {
    const result: Record<string, unknown> = {};
    const container = getActiveQuestionContainer() || document;

    listVisibleTextFields(container).forEach((field, index) => {
      result[`${qKey}::field-${index}`] = field.value;
    });

    container
      .querySelectorAll<HTMLElement>(
        '[data-qa*="choice"], [role="radio"], [role="checkbox"], [role="option"], button[data-qa]'
      )
      .forEach((el, index) => {
        const selected =
          el.getAttribute("aria-checked") === "true" ||
          el.getAttribute("aria-pressed") === "true" ||
          el.getAttribute("aria-selected") === "true" ||
          el.classList.contains("selected");
        if (!selected) return;
        const value = el.getAttribute("data-qa") || el.textContent?.trim() || String(index);
        result[`${qKey}::choice`] = value;
      });

    return result;
  }

  function collectAnswers(forStep = localStep): Record<string, unknown> {
    const visible = collectVisibleAnswersForKey(stepKey(forStep));
    allAnswers = { ...allAnswers, ...visible };
    return allAnswers;
  }

  function getFormId(): string {
    const target = pageParams.get("target");
    if (target) {
      try {
        const match = new URL(target).pathname.match(/\/to\/([^/?#]+)/);
        if (match?.[1]) return match[1];
      } catch {
        // ignore
      }
    }
    const match = window.location.pathname.match(/\/to\/([^/?#]+)/);
    return match?.[1] ?? "";
  }

  function isOnWelcomeScreen(): boolean {
    return !!(
      document.querySelector('[data-qa="start-button"]') ||
      document.querySelector('[data-qa="welcome-screen"]') ||
      document.querySelector('[data-qa="landing-wrapper"]') ||
      document.querySelector('[data-qa="welcome-screen-paragraph"]')
    );
  }

  function buttonText(el: Element): string {
    return (el.textContent ?? "").trim().toLowerCase();
  }

  function isStartButton(el: Element | null): boolean {
    if (!el) return false;
    const button = el.closest('button, [role="button"], a');
    if (!button) return false;
    const qa = button.getAttribute("data-qa") ?? "";
    if (/start/i.test(qa)) return true;
    const text = buttonText(button);
    return text === "start" || text === "begin" || text === "get started" || text.includes("start");
  }

  function isSubmitButton(el: Element | null): boolean {
    if (!el) return false;
    const button = el.closest('button, [role="button"], a, input');
    if (!button) return false;
    const qa = (button.getAttribute("data-qa") ?? "").toLowerCase();
    const aria = (button.getAttribute("aria-label") ?? "").toLowerCase();
    const type = (button.getAttribute("type") ?? "").toLowerCase();
    if (/submit/i.test(qa) || /submit/i.test(aria) || type === "submit") return true;
    const text = buttonText(button);
    return text === "submit" || text === "done" || text === "send" || text === "finish";
  }

  function isOkButton(el: Element | null): boolean {
    if (!el) return false;
    const button = el.closest('button, [role="button"]');
    if (!button) return false;
    if (isBackButton(button)) return false;
    const qa = button.getAttribute("data-qa") ?? "";
    if (/ok-button|submit-button|next/i.test(qa)) return true;
    const text = buttonText(button);
    return ["ok", "next", "continue", "submit", "done"].includes(text);
  }

  function isBackButton(el: Element | null): boolean {
    if (!el) return false;
    const button = el.closest('button, [role="button"], a');
    if (!button) return false;
    const qa = (button.getAttribute("data-qa") ?? "").toLowerCase();
    const aria = (button.getAttribute("aria-label") ?? "").toLowerCase();
    const title = (button.getAttribute("title") ?? "").toLowerCase();
    if (/prev|previous|back/.test(qa) || /prev|previous|back/.test(aria) || /prev|previous|back/.test(title)) {
      return true;
    }
    const text = buttonText(button);
    return text === "previous" || text === "prev" || text === "back" || text === "←";
  }

  /**
   * Advance to the next question. By default never clicks Submit — that is only
   * allowed when the remote peer explicitly marked the form as submitted.
   */
  function clickOkButton(allowSubmit = false): boolean {
    const selectors = [
      '[data-qa="ok-button-visible"]',
      '[data-qa="ok-button"]',
      '[data-qa*="next"]',
    ];
    if (allowSubmit) {
      selectors.splice(1, 0, '[data-qa="submit-button"]');
    }
    for (const selector of selectors) {
      const btn = document.querySelector<HTMLElement>(selector);
      if (btn && isVisible(btn) && !isBackButton(btn)) {
        if (!allowSubmit && isSubmitButton(btn)) continue;
        btn.click();
        return true;
      }
    }
    const fallback = Array.from(document.querySelectorAll<HTMLElement>("button, [role='button']")).find(
      (btn) => {
        if (!isVisible(btn) || isBackButton(btn)) return false;
        if (!allowSubmit && isSubmitButton(btn)) return false;
        const text = buttonText(btn);
        return ["ok", "next", "continue"].includes(text) ||
          (allowSubmit && ["submit", "done"].includes(text));
      }
    );
    if (fallback) {
      fallback.click();
      return true;
    }
    // Do not synthesize Enter — it often triggers Typeform's final Submit.
    return false;
  }

  function clickBackButton(): boolean {
    const selectors = [
      '[data-qa*="previous"]',
      '[data-qa*="prev"]',
      '[data-qa*="back"]',
      '[aria-label*="Previous" i]',
      '[aria-label*="Back" i]',
      '[title*="Previous" i]',
      '[title*="Back" i]',
    ];
    for (const selector of selectors) {
      try {
        const btn = document.querySelector<HTMLElement>(selector);
        if (btn && isVisible(btn)) {
          btn.click();
          return true;
        }
      } catch {
        // Some browsers don't support i flag in querySelector; ignore.
      }
    }
    const fallback = Array.from(document.querySelectorAll<HTMLElement>("button, [role='button'], a")).find(
      (btn) => isVisible(btn) && isBackButton(btn)
    );
    if (fallback) {
      fallback.click();
      return true;
    }
    return false;
  }

  function advancePastWelcomeIfNeeded(): void {
    if (!isOnWelcomeScreen()) return;
    const startButton = document.querySelector(
      '[data-qa="start-button"]'
    ) as HTMLButtonElement | null;
    if (startButton) {
      startButton.click();
      return;
    }
    const fallback = Array.from(document.querySelectorAll("button, [role='button']")).find((node) =>
      isStartButton(node)
    ) as HTMLButtonElement | undefined;
    fallback?.click();
  }

  function buildPatch(opts: {
    submitted?: boolean;
    answeredStep?: number;
    currentStep?: number;
    nav?: TypeformPatch["nav"];
  } = {}): TypeformPatch {
    const answeredStep = opts.answeredStep ?? localStep;
    const current = opts.currentStep ?? localStep;
    return {
      formId: getFormId(),
      answers: collectAnswers(answeredStep),
      currentStep: current,
      questionKey: stepKey(answeredStep),
      version: nextVersion(),
      lastEditor: peerId,
      submitted: Boolean(opts.submitted),
      started: true,
      nav: opts.nav ?? "answer",
    };
  }

  function markSessionStarted(): void {
    if (sessionStarted) return;
    // Only the driver (or first Start click) announces start; follower mirrors remotely.
    sessionStarted = true;
    welcomeClickPending = false;
    localStep = 0;

    if (role === "driver") {
      const startedPatch = buildPatch({ currentStep: 0, answeredStep: 0, nav: "start" });
      publishPatch(startedPatch);
      log("session started (local)");
    }
  }

  function onRemoteSessionStarted(): void {
    if (sessionStarted) return;
    sessionStarted = true;
    localStep = 0;
    // Follower mirrors the driver's Start click; driver navigates via native click.
    if (role === "follower") {
      advancePastWelcomeIfNeeded();
      log("session started (remote)");
    }
  }

  function canPublish(): boolean {
    return sessionStarted && !isApplyingRemoteState;
  }

  /** Publish in-progress answers on the current step (no navigation). */
  function sendPatch(submitted = false) {
    if (!canPublish()) return;

    const payload = buildPatch({
      submitted,
      answeredStep: localStep,
      currentStep: localStep,
      nav: "answer",
    });
    const serialized = JSON.stringify({
      answers: payload.answers,
      currentStep: payload.currentStep,
      submitted: payload.submitted,
      nav: payload.nav,
    });
    if (serialized === lastSentPayload && !submitted) return;
    lastSentPayload = serialized;
    publishPatch(payload);
  }

  function publishNext(fromStep: number, submitted = false): void {
    if (!canPublish()) return;
    const now = Date.now();
    if (!submitted && now - lastNavAt < 350) return;
    lastNavAt = now;

    const payload = buildPatch({
      submitted,
      answeredStep: fromStep,
      currentStep: fromStep + 1,
      nav: "next",
    });
    localStep = fromStep + 1;
    lastSentPayload = "";
    lastAppliedVersion = Math.max(lastAppliedVersion, payload.version);
    publishPatch(payload);
    log("next", fromStep, "->", localStep);
    window.setTimeout(() => applyRemoteInputText(), 300);
  }

  function publishPrev(fromStep: number): void {
    if (!canPublish()) return;
    if (fromStep <= 0) return;
    const now = Date.now();
    if (now - lastNavAt < 350) return;
    lastNavAt = now;

    const payload = buildPatch({
      answeredStep: fromStep,
      currentStep: fromStep - 1,
      nav: "prev",
    });
    localStep = fromStep - 1;
    lastSentPayload = "";
    lastAppliedVersion = Math.max(lastAppliedVersion, payload.version);
    publishPatch(payload);
    log("prev", fromStep, "->", localStep);
    window.setTimeout(() => applyRemoteInputText(), 300);
  }

  function applyChoice(value: string): boolean {
    const container = getActiveQuestionContainer() || document;
    const choices = container.querySelectorAll<HTMLElement>(
      '[data-qa*="choice"], [role="radio"], [role="checkbox"], [role="option"], button[data-qa]'
    );
    for (const el of choices) {
      if (!isVisible(el)) continue;
      const label = el.textContent?.trim() || "";
      const qa = el.getAttribute("data-qa") || "";
      if (qa === value || label === value || qa.includes(value) || label.includes(value)) {
        el.click();
        return true;
      }
    }
    return false;
  }

  function setNativeInputValue(field: HTMLInputElement | HTMLTextAreaElement, nextValue: string) {
    if (field.value === nextValue) return;
    const previous = field.value;
    const proto =
      field instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
    const setter = Object.getOwnPropertyDescriptor(proto, "value")?.set;
    const tracker = (field as HTMLInputElement & { _valueTracker?: { setValue: (v: string) => void } })
      ._valueTracker;
    if (tracker) {
      tracker.setValue(previous);
    }
    if (setter) {
      setter.call(field, nextValue);
    } else {
      field.value = nextValue;
    }
    const inputType =
      nextValue.length < previous.length
        ? "deleteContentBackward"
        : nextValue.length > previous.length
          ? "insertText"
          : "insertReplacementText";
    field.dispatchEvent(
      new InputEvent("input", {
        bubbles: true,
        cancelable: true,
        data: inputType === "insertText" ? nextValue.slice(previous.length) : nextValue,
        inputType,
      })
    );
    field.dispatchEvent(new Event("change", { bubbles: true }));
  }

  function applyAnswersForQuestion(answers: Record<string, unknown>, questionKey: string) {
    const container = getActiveQuestionContainer() || document;

    Object.entries(answers).forEach(([key, value]) => {
      if (!key.startsWith(`${questionKey}::`)) return;

      if (key.endsWith("::choice")) {
        applyChoice(String(value ?? ""));
        return;
      }

      if (key.includes("::field-")) {
        const index = Number(key.split("::field-")[1] ?? 0);
        const field = listVisibleTextFields(container)[index];
        if (!field) return;
        const fieldKey = getFieldKey(field);
        const inputTexts = readInputTextsMap();
        // Real-time typing uses inputTextsJson; avoid stale patch answers overwriting deletes.
        if (Object.prototype.hasOwnProperty.call(inputTexts, fieldKey)) return;
        if (document.activeElement === field && Date.now() - lastLocalInputAt < 800) return;
        setNativeInputValue(field, value == null ? "" : String(value));
      }
    });
  }

  function alignToRemoteStep(patch: TypeformPatch, generation: number) {
    if (generation !== applyingGeneration) return;

    const remoteStep = Math.max(0, patch.currentStep ?? 0);

    if (localStep === remoteStep) {
      applyAnswersForQuestion(patch.answers, stepKey(localStep));
      lastAppliedVersion = Math.max(lastAppliedVersion, patch.version ?? 0);
      isApplyingRemoteState = false;
      log("aligned on step", localStep);
      window.setTimeout(() => applyRemoteInputText(), 250);
      return;
    }

    if (localStep < remoteStep) {
      applyAnswersForQuestion(patch.answers, stepKey(localStep));
      window.setTimeout(() => {
        if (generation !== applyingGeneration) return;
        // Only click Submit when the peer explicitly submitted the form.
        const allowSubmit =
          Boolean(patch.submitted) && localStep + 1 >= remoteStep;
        const advanced = clickOkButton(allowSubmit);
        if (!advanced) {
          // No OK control found — stop catching up instead of forcing Submit/Enter.
          lastAppliedVersion = Math.max(lastAppliedVersion, patch.version ?? 0);
          isApplyingRemoteState = false;
          log("catch-up stopped: no next control", localStep, "target", remoteStep);
          return;
        }
        localStep += 1;
        log("catch-up next ->", localStep, "target", remoteStep);
        window.setTimeout(() => alignToRemoteStep(patch, generation), 450);
      }, 180);
      return;
    }

    // localStep > remoteStep — go back
    window.setTimeout(() => {
      if (generation !== applyingGeneration) return;
      const moved = clickBackButton();
      if (moved) {
        localStep = Math.max(0, localStep - 1);
        log("catch-up prev ->", localStep, "target", remoteStep);
      } else {
        // Cannot find back control — snap step bookkeeping and apply answers.
        localStep = remoteStep;
        applyAnswersForQuestion(patch.answers, stepKey(localStep));
        lastAppliedVersion = Math.max(lastAppliedVersion, patch.version ?? 0);
        isApplyingRemoteState = false;
        return;
      }
      window.setTimeout(() => alignToRemoteStep(patch, generation), 450);
    }, 180);
  }

  function applyRemoteStateInner(patch: TypeformPatch) {
    if (!patch?.answers && patch.nav === "answer") return;

    applyingGeneration += 1;
    const generation = applyingGeneration;
    isApplyingRemoteState = true;
    allAnswers = { ...allAnswers, ...(patch.answers || {}) };

    alignToRemoteStep(patch, generation);
  }

  function applyRemoteState(patch: TypeformPatch) {
    if (!sessionStarted) {
      // Driver ignores remote patches until they click Start locally.
      if (role === "driver") return;
      if (!patch.started && !Boolean(stateMap.get("started"))) return;
      sessionStarted = true;
    }
    if (isOnWelcomeScreen()) {
      // Stay on welcome until the driver starts; follower auto-clicks Start then catches up.
      if (role === "follower" && sessionStarted) {
        advancePastWelcomeIfNeeded();
        window.setTimeout(() => applyRemoteStateInner(patch), 400);
      }
      return;
    }
    applyRemoteStateInner(patch);
  }

  function maybeMarkSessionStartedAfterWelcomeClick(): void {
    if (role !== "driver" || sessionStarted || !welcomeClickPending) return;
    if (!isOnWelcomeScreen()) {
      markSessionStarted();
    }
  }

  const debounce = (() => {
    let timer: number | undefined;
    return () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        maybeMarkSessionStartedAfterWelcomeClick();
        sendPatch(false);
      }, 150);
    };
  })();

  document.addEventListener(
    "click",
    (event) => {
      const target = event.target as Element;

      if (!sessionStarted) {
        if (role === "driver" && isOnWelcomeScreen()) {
          welcomeClickPending = true;
          if (isStartButton(target)) {
            window.setTimeout(() => markSessionStarted(), 0);
          }
        }
        return;
      }

      if (isApplyingRemoteState) return;

      if (isBackButton(target)) {
        publishPrev(localStep);
        return;
      }

      if (isOkButton(target)) {
        // Explicit Submit stays submitted; OK/Next must not mark the form submitted.
        publishNext(localStep, isSubmitButton(target));
      }
    },
    true
  );

  document.addEventListener(
    "keydown",
    (event) => {
      if (!canPublish()) return;
      if (isOnWelcomeScreen()) return;

      if (event.key === "Enter") {
        window.setTimeout(() => publishNext(localStep, false), 0);
        return;
      }

      // Typeform supports Up/Left-style go-back in some builds via Alt/Meta+Arrow, but
      // also exposed as dedicated previous control. ArrowUp often goes previous.
      if (event.key === "ArrowUp") {
        window.setTimeout(() => publishPrev(localStep), 0);
      }
    },
    true
  );

  new MutationObserver(debounce).observe(document.documentElement, {
    childList: true,
    attributes: true,
    subtree: true,
  });

  document.addEventListener(
    "input",
    () => {
      if (isApplyingInputText || isApplyingRemoteState) return;
      schedulePublishInputText();
      debounce();
    },
    true
  );
  document.addEventListener(
    "keyup",
    (event) => {
      if (isApplyingInputText || isApplyingRemoteState) return;
      const key = event.key;
      if (key === "Enter" || key === "ArrowUp" || key === "ArrowDown") return;
      schedulePublishInputText();
    },
    true
  );
  document.addEventListener(
    "blur",
    (event) => {
      if (isApplyingInputText || isApplyingRemoteState) return;
      const target = event.target;
      if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) {
        flushPublishInputText();
      }
    },
    true
  );
  document.addEventListener("change", debounce, true);
  document.addEventListener(
    "submit",
    (event) => {
      // Never auto-submit while applying remote sync.
      if (isApplyingRemoteState) {
        event.preventDefault();
        event.stopPropagation();
        log("blocked auto-submit during remote sync");
        return;
      }
      if (canPublish()) {
        publishNext(localStep, true);
      }
    },
    true
  );

  const originalFetch = window.fetch.bind(window);
  window.fetch = async (...args: Parameters<typeof fetch>) => {
    const response = await originalFetch(...args);
    debounce();
    return response;
  };

  const originalOpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function patchedOpen(this: XMLHttpRequest, ...args: any[]) {
    this.addEventListener("loadend", debounce);
    return (originalOpen as any).apply(this, args);
  };

  log("ready", { role, roomId, collabId, documentName, editorId, peerId });

  // Cursor presence add-on — awareness only; does not modify sync handlers above.
  initTypeformCursorPresence({
    provider,
    editorId,
    role,
    debug,
    getFieldKey,
    findFieldByKey,
    getCurrentStep: () => localStep,
    getSessionStarted: () => sessionStarted,
    isWelcomeScreen: isOnWelcomeScreen,
    isSyncing: () => isApplyingRemoteState || isApplyingInputText,
  });

  window.addEventListener("beforeunload", () => {
    provider.destroy();
    doc.destroy();
  });
})();
