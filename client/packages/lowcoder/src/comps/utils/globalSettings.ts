import type { CommonSettingResponseData } from "api/commonSettingApi";

interface GlobalSettings {
  orgCommonSettings?: CommonSettingResponseData;
  isViewMode?: boolean;
  applicationId?: string;
}

let globalSettings: GlobalSettings = {};

export function clearGlobalSettings() {
  globalSettings = {};
}

export function setGlobalSettings(patch: GlobalSettings) {
  Object.assign(globalSettings, patch);
}

export function getGlobalSettings() {
  return globalSettings;
}


export function isEditMode(): boolean {
  // Edit mode is when we're not in view mode
  return globalSettings.isViewMode !== true;
}
