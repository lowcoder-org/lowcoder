import type { StateCreator } from "zustand/vanilla";
import type { EditorStoreState } from "./types";

export type DeviceType = "desktop" | "tablet" | "mobile";
export type DeviceOrientation = "landscape" | "portrait";

export type DeviceSlice = {
  deviceType: DeviceType;
  deviceOrientation: DeviceOrientation;
  setDeviceType: (deviceType: DeviceType) => void;
  setDeviceOrientation: (deviceOrientation: DeviceOrientation) => void;
};

export const createDeviceSlice: StateCreator<
  EditorStoreState,
  [],
  [],
  DeviceSlice
> = (set) => ({
  deviceType: "desktop",
  deviceOrientation: "portrait",
  setDeviceType: (deviceType) =>
    set((state) => (state.deviceType === deviceType ? state : { deviceType })),
  setDeviceOrientation: (deviceOrientation) =>
    set((state) =>
      state.deviceOrientation === deviceOrientation ? state : { deviceOrientation }
    ),
});
