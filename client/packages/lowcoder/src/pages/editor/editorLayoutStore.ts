import { create } from "zustand";
import type { PanelStatus } from "pages/common/header";
import {
  DefaultPanelStatus,
  getPanelStatus,
  getPanelStyle,
  savePanelStatus,
  savePanelStyle,
  type PanelStyle,
} from "util/localStorageUtil";

// Standalone editor panel store keeps layout available outside EditorStoreProvider.
export type EditorLayoutState = {
  panelStatus: PanelStatus;
  prePanelStatus: PanelStatus;
  panelStyle: PanelStyle;

  /** Toggle one panel, or all of them at once when called with no argument. */
  togglePanel: (panel?: keyof PanelStatus) => void;
  setPanel: (panel: keyof PanelStatus, open: boolean) => void;
  /** Open every panel without persisting - used by the new-user guide. */
  resetPanelStatus: () => void;

  setBottomHeight: (h: number) => void;
  setCodeEditorSize: (size: { w: number; h: number }) => void;
  setScriptsAndStylesSize: (size: { w: number; h: number }) => void;
};

export const useEditorLayoutStore = create<EditorLayoutState>((set, get) => ({
  panelStatus: getPanelStatus(),
  prePanelStatus: DefaultPanelStatus,
  panelStyle: getPanelStyle(),

  togglePanel: (panel) => {
    const { panelStatus, prePanelStatus } = get();
    let nextStatus: PanelStatus;
    let nextPreStatus = prePanelStatus;

    if (panel) {
      nextStatus = { ...panelStatus, [panel]: !panelStatus[panel] };
    } else if (Object.values(panelStatus).some((value) => value)) {
      // collapsing everything - remember the current layout so we can restore it
      nextPreStatus = panelStatus;
      nextStatus = { left: false, bottom: false, right: false };
    } else {
      nextStatus = prePanelStatus;
    }

    savePanelStatus(nextStatus);
    set({ panelStatus: nextStatus, prePanelStatus: nextPreStatus });
  },

  setPanel: (panel, open) => {
    const { panelStatus } = get();
    if (panelStatus[panel] === open) {
      return;
    }
    const nextStatus = { ...panelStatus, [panel]: open };
    savePanelStatus(nextStatus);
    set({ panelStatus: nextStatus });
  },

  // Start the guide from defaults without overwriting the saved layout.
  resetPanelStatus: () => set({ panelStatus: DefaultPanelStatus }),

  setBottomHeight: (h) => {
    const { panelStyle } = get();
    if (panelStyle.bottom.h === h) {
      return;
    }
    const nextStyle = { ...panelStyle, bottom: { h } };
    savePanelStyle(nextStyle);
    set({ panelStyle: nextStyle });
  },

  setCodeEditorSize: ({ w, h }) => {
    const { panelStyle } = get();
    if (panelStyle.codeEditor.w === w && panelStyle.codeEditor.h === h) {
      return;
    }
    const nextStyle = { ...panelStyle, codeEditor: { w, h } };
    savePanelStyle(nextStyle);
    set({ panelStyle: nextStyle });
  },

  setScriptsAndStylesSize: ({ w, h }) => {
    const { panelStyle } = get();
    if (panelStyle.scriptsAndStyles.w === w && panelStyle.scriptsAndStyles.h === h) {
      return;
    }
    const nextStyle = { ...panelStyle, scriptsAndStyles: { w, h } };
    savePanelStyle(nextStyle);
    set({ panelStyle: nextStyle });
  },
}));
