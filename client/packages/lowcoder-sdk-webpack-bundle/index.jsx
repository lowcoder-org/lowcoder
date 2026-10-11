import { bootstrapAppAt } from "./src/index";

const instances = new WeakMap();
const api = window.LowcoderSDK = window.LowcoderSDK || {};

api.mount = async (target, options = {}) => {
  const node = typeof target === "string" ? document.querySelector(target) : target;
  if (!(node instanceof Element)) throw new Error("Provide an existing element to LowcoderSDK.mount.");
  const { appId, ...settings } = options;
  if (!appId) throw new Error("Provide an appId to LowcoderSDK.mount.");
  const previous = instances.get(node);
  const pending = (async () => {
    if (previous) (await previous.catch(() => undefined))?.destroy();
    return bootstrapAppAt(appId, node, settings);
  })();
  instances.set(node, pending);
  try { return await pending; }
  catch (error) { if (instances.get(node) === pending) instances.delete(node); throw error; }
};

api.unmount = async (target) => {
  const node = typeof target === "string" ? document.querySelector(target) : target;
  const pending = node && instances.get(node);
  if (!pending) return;
  (await pending)?.destroy();
  if (instances.get(node) === pending) instances.delete(node);
};

api.scan = async (root = document) => Promise.all(
  Array.from(root.querySelectorAll(".lowcoder-module-container")).map(async (container) => {
    const node = container.querySelector(".lowcoder-module-display");
    if (!node || instances.has(node)) return;
    const value = (name) => container.querySelector(`.${name}`)?.value;
    try {
      const instance = await api.mount(node, {
        appId: value("module-id"),
        moduleInputs: JSON.parse(value("module-input") || "{}"),
        baseUrl: value("locoder-backend-url") || "https://api-service.lowcoder.cloud",
        webUrl: value("locoder-frontend-url") || "https://app.lowcoder.cloud",
        orgId: value("locoder-org-id") || undefined,
      });
      instance.on("moduleOutputChange", (output) => {
        window.opChange?.(output);
        container.dispatchEvent(new CustomEvent("lowcoder:output", { detail: output }));
      });
      instance.on("moduleEventTriggered", (event) => {
        window.onModuleEventTriggered?.(event);
        container.dispatchEvent(new CustomEvent("lowcoder:event", { detail: event }));
      });
    } catch (error) {
      container.dispatchEvent(new CustomEvent("lowcoder:error", { detail: error }));
      console.error(error);
    }
  })
);
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => api.scan(), { once: true });
} else { api.scan(); }
