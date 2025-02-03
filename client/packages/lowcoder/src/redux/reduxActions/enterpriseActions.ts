import { EnterpriseLicenseResponse, FetchBrandingSettingPayload } from "@lowcoder-ee/api/enterpriseApi";
import { ReduxActionTypes } from "constants/reduxActionConstants";

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
