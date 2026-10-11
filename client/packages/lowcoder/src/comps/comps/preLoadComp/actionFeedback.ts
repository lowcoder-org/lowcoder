import { message } from "antd";
import type { ActionExecuteParams } from "./types";

/** Report handled failures to the batch runner as well as to the user. */
export function reportActionError(params: ActionExecuteParams, text: string) {
  params.onError?.(text);
  message.error(text);
}
