import { AppState } from "../reducers";


export const selectEnterpriseEditionStatus = (state: AppState) =>
  state.ui.enterprise?.enterprise?.eeActive ?? false;

export const selectRemainingAPICalls = (state: AppState) =>
  state.ui.enterprise?.enterprise?.remainingAPICalls ?? 0;

export const selectEnterpriseLicenses = (state: AppState) =>
  state.ui.enterprise?.enterprise?.eeLicenses ?? [];

export const selectIsLicenseActive = (state: AppState) => {
  const enterprise = state.ui.enterprise;
  return enterprise?.enterprise?.eeActive && enterprise?.enterprise?.remainingAPICalls > 0;
};

export const getBrandingSetting = (state: AppState) => {
  return state.ui.enterprise?.workspaceBranding || state.ui.enterprise?.globalBranding;
}

export const getGlobalBrandingSetting = (state: AppState) => {
  return state.ui.enterprise?.globalBranding;
}

export const getWorkspaceBrandingSetting = (state: AppState) => {
  return state.ui.enterprise?.workspaceBranding;
}
// Environment selectors
export const selectEnvironments = (state: AppState) => 
  state.ui.enterprise?.environments ?? [];

export const selectEnvironmentsLoading = (state: AppState) =>
  state.ui.enterprise?.environmentsLoading ?? false;

export const selectEnvironmentsError = (state: AppState) =>
  state.ui.enterprise?.environmentsError ?? null;

export const selectUnlicensedEnvironments = (state: AppState) => {
  const environments = state.ui.enterprise?.environments ?? [];
  return environments.filter(env => env.isLicensed === false);
};

export const selectLicensedEnvironments = (state: AppState) => {
  const environments = state.ui.enterprise?.environments ?? [];
  return environments.filter(env => env.isLicensed !== false); 
};

export const selectMasterEnvironment = (state: AppState) => {
  const environments = state.ui.enterprise?.environments ?? [];
  return environments.find(env => env.isMaster) ?? null;
};

export const selectHasMasterEnvironment = (state: AppState) => {
  const environments = state.ui.enterprise?.environments ?? [];
  return environments.some(env => env.isMaster);
};

