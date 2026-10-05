import { createStore } from "zustand/vanilla";
import type { EditorStoreApi, EditorStoreState } from "./types";
import { createSelectionSlice } from "./selectionSlice";
import { createInteractionSlice } from "./interactionSlice";
import { createEditorModeSlice } from "./editorModeSlice";
import { createBottomResSlice } from "./bottomResSlice";
import { createDeviceSlice } from "./deviceSlice";

export function createEditorStore(): EditorStoreApi {
  return createStore<EditorStoreState>((...a) => ({
    ...createSelectionSlice(...a),
    ...createInteractionSlice(...a),
    ...createEditorModeSlice(...a),
    ...createBottomResSlice(...a),
    ...createDeviceSlice(...a),
  }));
}
