import { AppState } from "../reducers";

export const selectEnterpriseEditionStatus = (state: AppState) =>
    state.ui.enterprise?.eeActive ?? false;

export const selectRemainingAPICalls = (state: AppState) =>
    state.ui.enterprise?.remainingAPICalls ?? 0;

export const selectEnterpriseLicenses = (state: AppState) =>
    state.ui.enterprise?.eeLicenses ?? [];

export const selectIsLicenseActive = (state: AppState) => {
    const enterprise = state.ui.enterprise;
    return enterprise?.eeActive && enterprise?.remainingAPICalls > 0;
};
