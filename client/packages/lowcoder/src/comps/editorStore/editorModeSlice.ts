import type { StateCreator } from "zustand/vanilla";
import { getEditorModeStatus, saveEditorModeStatus } from "util/localStorageUtil";
import type { EditorModeStatus } from "pages/common/header";
import type { EditorStoreState } from "./types";

export type EditorModeSlice = {
  editorModeStatus: EditorModeStatus;
  setEditorModeStatus: (editorModeStatus: EditorModeStatus) => void;
};

export const createEditorModeSlice: StateCreator<
  EditorStoreState,
  [],
  [],
  EditorModeSlice
> = (set, get) => ({
  editorModeStatus: getEditorModeStatus(),
  // persistence lives here so callers can't forget to write it through
  setEditorModeStatus: (editorModeStatus) => {
    if (get().editorModeStatus === editorModeStatus) {
      return;
    }
    saveEditorModeStatus(editorModeStatus);
    set({ editorModeStatus });
  },
});
