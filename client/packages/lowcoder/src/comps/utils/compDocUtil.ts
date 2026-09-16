import { UICompType } from "comps/uiCompRegistry";
import { trans } from "i18n";

export function getComponentDocUrl(compType: UICompType) {
  if (!compType) {
    return "";
  }
  switch (compType) {
    case "module":
      return trans("docUrls.module");
    case "chat":
      return trans("docUrls.githubAiChat");
    case "chatBox":
      return trans("docUrls.githubChatBox");
    case "chatController":
      return trans("docUrls.githubChatController");
    default:
      return trans("docUrls.components", { compType });
  }
}
export function getComponentPlaygroundUrl(compType: UICompType) {
  if (!compType) {
    return "";
  }
  switch (compType) {
    case "module":
      return trans("docUrls.module");
    default:
      return trans("playground.url", { compType });
  }
}
