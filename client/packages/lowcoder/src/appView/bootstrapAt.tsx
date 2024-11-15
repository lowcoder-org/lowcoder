import type { AppViewInstanceOptions } from "./AppViewInstance";
import { createRoot } from "react-dom/client";
import {viewMode} from "@lowcoder-ee/util/editor";

export async function bootstrapAppAt<I>(
  appId: string,
  node: Element | null,
  options: AppViewInstanceOptions<I> = {}
) {
  let loadComps: any;
  if(viewMode() !== "view") loadComps = await import("bootstrap/admin");
  else loadComps = await import("bootstrap/view");
  await loadComps();
  if (!node) {
    console.error("node must be not null.");
    return;
  }

  const { AppViewInstance } = await import("./AppViewInstance");
  return new AppViewInstance(appId, node, createRoot(node), options);
}
