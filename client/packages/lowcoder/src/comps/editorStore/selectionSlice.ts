import type { StateCreator } from "zustand/vanilla";
import type { EditorStoreState, SelectSourceType } from "./types";
import { areSetsEqual } from "./types";

export type SelectionSlice = {
  selectedCompNames: Set<string>;
  selectSource?: SelectSourceType;
  showPropertyPane: boolean;
  setSelectedCompNames: (
    selectedCompNames: Set<string>,
    selectSource?: SelectSourceType
  ) => void;
  setShowPropertyPane: (showPropertyPane: boolean) => void;
};

export const createSelectionSlice: StateCreator<
  EditorStoreState,
  [],
  [],
  SelectionSlice
> = (set) => ({
  selectedCompNames: new Set(),
  selectSource: undefined,
  showPropertyPane: false,
  setSelectedCompNames: (selectedCompNames, selectSource) =>
    set((state) => {
      if (selectedCompNames.size === 0 && state.selectedCompNames.size === 0) {
        return state;
      }

      const showPropertyPane = selectedCompNames.size > 0;
      if (
        areSetsEqual(state.selectedCompNames, selectedCompNames) &&
        state.selectSource === selectSource &&
        state.showPropertyPane === showPropertyPane
      ) {
        return state;
      }

      return {
        selectedCompNames: new Set(selectedCompNames),
        selectSource,
        showPropertyPane,
      };
    }),
  setShowPropertyPane: (showPropertyPane) =>
    set((state) =>
      state.showPropertyPane === showPropertyPane ? state : { showPropertyPane }
    ),
});
