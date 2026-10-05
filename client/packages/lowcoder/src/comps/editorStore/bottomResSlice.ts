import type { StateCreator } from "zustand/vanilla";
import { BottomResTypeEnum } from "types/bottomRes";
import type { EditorStoreState } from "./types";

export type BottomResSlice = {
  selectedBottomResName: string;
  selectedBottomResType?: BottomResTypeEnum;
  showResultCompName: string | undefined;
  setSelectedBottomRes: (name: string, type?: BottomResTypeEnum) => void;
  setShowResultCompName: (showResultCompName: string | undefined) => void;
};

export const createBottomResSlice: StateCreator<
  EditorStoreState,
  [],
  [],
  BottomResSlice
> = (set) => ({
  selectedBottomResName: "",
  selectedBottomResType: undefined,
  showResultCompName: "",
  setSelectedBottomRes: (selectedBottomResName, selectedBottomResType) =>
    set((state) =>
      state.selectedBottomResName === selectedBottomResName &&
      state.selectedBottomResType === selectedBottomResType
        ? state
        : { selectedBottomResName, selectedBottomResType }
    ),
  setShowResultCompName: (showResultCompName) =>
    set((state) =>
      state.showResultCompName === showResultCompName ? state : { showResultCompName }
    ),
});
