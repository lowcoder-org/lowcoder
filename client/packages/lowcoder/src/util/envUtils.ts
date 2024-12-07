import { SystemConfig } from "constants/configConstants";
import { useSelector } from "react-redux";
import { selectSystemConfig } from "redux/selectors/configSelectors";

export function localEnv(): boolean {
  return REACT_APP_ENV === "local";
}

export function developEnv(): boolean {
  return REACT_APP_ENV === "development" || localEnv();
}

// Create a global variable to hold the EE state
let eeActiveState = false;

// Function to dynamically update the EE state
export function setEEActiveState(isActive: boolean) {
  eeActiveState = isActive;
}

export function isEE(): boolean {
  return eeActiveState;
}

// Is hosted as Enterprise Edition?
export function isEEEnvironment(): boolean {
  return REACT_APP_EDITION === "enterprise";
}

export function isSaasMode(config?: SystemConfig) {
  return config?.workspaceMode === "SAAS" || config?.workspaceMode === "MULTIWORSPACE";
}

export function isEnterpriseMode(config?: SystemConfig) {
  return config?.workspaceMode === "ENTERPRISE" || config?.workspaceMode === "SINGLEWORKSPACE";
}

export function isSelfDomain(config?: SystemConfig) {
  return config?.selfDomain;
}