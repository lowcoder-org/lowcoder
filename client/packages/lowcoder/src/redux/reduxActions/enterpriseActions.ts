import { ReduxActionTypes } from "constants/reduxActionConstants";

export const fetchEnterpriseLicense = () => ({
    type: ReduxActionTypes.FETCH_ENTERPRISE_LICENSE,
  });

interface EnterpriseLicenseResponse {
    eeActive: boolean;
    remainingAPICalls: number;
    eeLicenses: Array<{
        uuid: string;
        issuedTo: string;
        apiCallsLimit: number;
    }>;
}

export const setEnterpriseLicense = (licenseData: EnterpriseLicenseResponse) => ({
    type: ReduxActionTypes.SET_ENTERPRISE_LICENSE,
    payload: licenseData,
});