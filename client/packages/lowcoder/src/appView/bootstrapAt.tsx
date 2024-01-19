import { loadComps } from "comps";
import { AppViewInstance, AppViewInstanceOptions } from "./AppViewInstance";
import { createRoot } from "react-dom/client";

loadComps();

export async function bootstrapAppAt<I>(
  appId: string,
  node: Element | null,
  options: AppViewInstanceOptions<I> = {}
) {
  if (!node) {
    console.error("node must be not null.");
    return;
  }
  return new AppViewInstance(appId, node, createRoot(node), options);
}
