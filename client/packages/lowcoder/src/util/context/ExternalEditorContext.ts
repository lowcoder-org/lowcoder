import { AppTypeEnum } from "constants/applicationConstants";
import { createContext, CSSProperties } from "react";
import { EditorHistory } from "util/editoryHistory";

export interface ExternalEditorContextState {
  history?: EditorHistory;

  appType: AppTypeEnum;

  applicationId: string;

  /**
   * The outermost, actually READ-checked application id. Additive -- `applicationId`
   * keeps its existing meaning and uses unchanged. A module's own `Provider` overrides `applicationId` with its
   * own id (moduleComp.tsx), so a nested component (e.g. the chat controller) that needs the HOST app a viewer
   * was actually granted READ on -- not an embedded module's own id, which may not itself be directly
   * READ-checked -- reads this field instead. Unset at the top level (the host page itself, module or not); a
   * module propagates it from its own enclosing context so nested modules keep pointing at the same, outermost
   * host (see moduleComp.tsx). e.g. the chat controller, the npm component loader.
   */
  hostApplicationId?: string;

  /**
   * uneditable, hide the left/bottom/right panel
   */
  readOnly?: boolean;

  hideHeader?: boolean;

  /**
   * default: [20, 20]
   */
  rootContainerPadding?: [number, number];

  rootContainerExtraHeight?: string;

  /**
   * default: overlay
   */
  rootContainerOverflow?: CSSProperties["overflow"];

  /**
   * whether to open the AppSettings modal
   */
  showAppSettingModal?: boolean;

  /**
   * whether to open the ScriptsAndStyle modal
   */
  showScriptsAndStyleModal?: boolean;

  /**
   * whether to block editing if someone else is editing the app
   */
  blockEditing?: boolean;
  /**
   * passing this function to refresh app from header
   */
  fetchApplication?: () => void;

  exportPublicAppToJson?: () => void;

  changeExternalState?: (state: Partial<ExternalEditorContextState>) => void;
}

/**
 * The app id the viewer was actually READ-checked on: the outermost host app id when set, otherwise the context's
 * own `applicationId`. Used by the npm component loader (D-35) so a component embedded in a module resolves
 * registries through the host app's workspace, which the viewer was granted READ on, rather than the module's own
 * (possibly ungranted) id.
 */
export function readCheckedApplicationId(state: ExternalEditorContextState): string {
  return state.hostApplicationId ?? state.applicationId;
}

export const ExternalEditorContext = createContext<ExternalEditorContextState>({
  applicationId: "",
  appType: AppTypeEnum.Application,
  showAppSettingModal: false,
  showScriptsAndStyleModal: false,
  changeExternalState: () => {},
});
