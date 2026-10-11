import { loadComps } from "comps";
import type { AppViewInstanceOptions } from "./AppViewInstance";
import { createRoot } from "react-dom/client";

export async function bootstrapAppAt<I>(
  appId: string,
  node: Element | null,
  options: AppViewInstanceOptions<I> = {}
) {
  if (!node) {
    throw new Error("bootstrapAppAt requires an existing DOM element.");
  }

  loadComps();

  const { AppViewInstance } = await import("./AppViewInstance");
  const instance = new AppViewInstance(appId, node, createRoot(node), options);
  try {
    await instance.ready;
    return instance;
  } catch (error) {
    instance.destroy();
    throw error;
  }
}
