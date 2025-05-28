import { EnterpriseLicenseResponse, FetchBrandingSettingPayload } from "@lowcoder-ee/api/enterpriseApi";
import { ReduxActionTypes } from "constants/reduxActionConstants";
import { Environment } from "pages/setting/environments/types/environment.types";

export const fetchEnterpriseLicense = () => ({
  type: ReduxActionTypes.FETCH_ENTERPRISE_LICENSE,
});

export const setEnterpriseLicense = (licenseData: EnterpriseLicenseResponse) => ({
  type: ReduxActionTypes.SET_ENTERPRISE_LICENSE,
  payload: licenseData,
});

export const fetchBrandingSetting = (payload: FetchBrandingSettingPayload) => {
  return {
    type: ReduxActionTypes.FETCH_BRANDING_SETTING,
    payload,
  };
};

export const fetchEnvironments = () => ({
  type: ReduxActionTypes.FETCH_ENVIRONMENTS,
});

export const fetchEnvironmentsSuccess = (environments: Environment[]) => ({
  type: ReduxActionTypes.FETCH_ENVIRONMENTS_SUCCESS,
  payload: environments,
});

export const fetchEnvironmentsFailure = (error: string) => ({
  type: ReduxActionTypes.FETCH_ENVIRONMENTS_FAILURE,
  payload: error,
});

