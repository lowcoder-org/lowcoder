export const FETCH_ENTERPRISE_LICENSE = 'FETCH_ENTERPRISE_LICENSE';
export const SET_ENTERPRISE_LICENSE = 'SET_ENTERPRISE_LICENSE';

export const fetchEnterpriseLicense = () => ({ type: FETCH_ENTERPRISE_LICENSE });

export const setEnterpriseLicense = (licenseData: any) => ({
    type: SET_ENTERPRISE_LICENSE,
    payload: licenseData,
});
