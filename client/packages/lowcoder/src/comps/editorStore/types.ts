import type { StoreApi } from "zustand/vanilla";
import type { SelectionSlice } from "./selectionSlice";
import type { InteractionSlice } from "./interactionSlice";
import type { EditorModeSlice } from "./editorModeSlice";
import type { BottomResSlice } from "./bottomResSlice";
import type { DeviceSlice } from "./deviceSlice";

export type SelectSourceType =
  | "editor"
  | "leftPanel"
  | "addComp"
  | "rightPanel"
  | "alignComp"
  | "layoutComp"
  | "nestComp"
  | "deleteComp"
  | "moveComp"
  | "renameComp"
  | "resizeComp";

export type EditorStoreState = SelectionSlice &
  InteractionSlice &
  EditorModeSlice &
  BottomResSlice &
  DeviceSlice;

export type EditorStoreApi = StoreApi<EditorStoreState>;

export function areSetsEqual(left: Set<string>, right: Set<string>) {
  return left.size === right.size && Array.from(left).every((name) => right.has(name));
}
