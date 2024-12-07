import { ReduxActionTypes } from "constants/reduxActionConstants";

export const fetchEnterpriseLicense = () => ({
    type: ReduxActionTypes.FETCH_ENTERPRISE_LICENSE,
  });

export const setEnterpriseLicense = (licenseData: any) => ({
    type: ReduxActionTypes.SET_ENTERPRISE_LICENSE,
    payload: licenseData,
});