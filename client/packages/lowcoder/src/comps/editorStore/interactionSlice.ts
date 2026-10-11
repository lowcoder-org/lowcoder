import type { StateCreator } from "zustand/vanilla";
import type { EditorStoreState } from "./types";

export type InteractionSlice = {
  isDragging: boolean;
  draggingCompType: string;
  forceShowGrid: boolean;
  disableInteract: boolean;
  setDragging: (dragging: boolean) => void;
  setDraggingCompType: (draggingCompType: string) => void;
  setForceShowGrid: (forceShowGrid: boolean) => void;
  setDisableInteract: (disableInteract: boolean) => void;
  showGridLines: () => boolean;
};

export const createInteractionSlice: StateCreator<
  EditorStoreState,
  [],
  [],
  InteractionSlice
> = (set, get) => ({
  isDragging: false,
  draggingCompType: "button",
  forceShowGrid: false,
  disableInteract: false,
  setDragging: (dragging) =>
    set((state) => (state.isDragging === dragging ? state : { isDragging: dragging })),
  setDraggingCompType: (draggingCompType) =>
    set({ draggingCompType, isDragging: true }),
  setForceShowGrid: (forceShowGrid) =>
    set((state) =>
      state.forceShowGrid === forceShowGrid ? state : { forceShowGrid }
    ),
  setDisableInteract: (disableInteract) =>
    set((state) =>
      state.disableInteract === disableInteract ? state : { disableInteract }
    ),
  showGridLines: () => get().isDragging || get().forceShowGrid,
});
