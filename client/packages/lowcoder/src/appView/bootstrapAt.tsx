import { loadComps } from "comps";
import type { AppViewInstanceOptions } from "./AppViewInstance";
import { createRoot } from "react-dom/client";

export async function bootstrapAppAt<I>(
  appId: string,
  node: Element | null,
  options: AppViewInstanceOptions<I> = {}
) {
  if (!node) {
    console.error("node must be not null.");
    return;
  }

  loadComps();

  const { AppViewInstance } = await import("./AppViewInstance");
  return new AppViewInstance(appId, node, createRoot(node), options);
}
