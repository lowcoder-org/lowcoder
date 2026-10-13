import { call, put, takeLatest } from 'redux-saga/effects';
import type { Action } from 'redux';
import { ReduxAction, ReduxActionTypes } from "constants/reduxActionConstants";
import { setEnterpriseLicense, fetchEnvironmentsSuccess, fetchEnvironmentsFailure } from "redux/reduxActions/enterpriseActions";
import { BrandingSettingResponse, EnterpriseLicenseResponse, FetchBrandingSettingPayload, getBranding, getEnterpriseLicense } from "api/enterpriseApi";
import { getEnvironmentsWithLicenseStatus } from "pages/setting/environments/services/environments.service";
import { Environment } from "pages/setting/environments/types/environment.types";


function* fetchEnterpriseLicenseSaga(): Generator<any, void, EnterpriseLicenseResponse> {
  try {
    // Type the result from the API call
    const data: EnterpriseLicenseResponse = yield call(getEnterpriseLicense);
    yield put(setEnterpriseLicense(data));
  } catch (error) {
    console.error('Failed to fetch enterprise license:', error);
  }
}

function* fetchEnvironmentsSaga(): Generator<any, void, Environment[]> {
  try {
    const environments: Environment[] = yield call(getEnvironmentsWithLicenseStatus);
    yield put(fetchEnvironmentsSuccess(environments));
  } catch (error) {
    console.error('Failed to fetch environments:', error);
    yield put(fetchEnvironmentsFailure(error as string));
  }
}

export function* fetchBrandingSettingSaga(action: ReduxAction<FetchBrandingSettingPayload>): Generator<any, void, BrandingSettingResponse> {
  const { orgId, fallbackToGlobal = true } = action.payload;
  const type = orgId ? ReduxActionTypes.SET_WORKSPACE_BRANDING_SETTING : ReduxActionTypes.SET_GLOBAL_BRANDING_SETTING;
  let response: BrandingSettingResponse | undefined;
  try {
    response = yield call(getBranding, orgId);
  } catch (error) {
    console.error('Failed to fetch branding setting:', error);
  }
  // Empty/reset configurations must clear the previous workspace's brand.
  const hasBranding = response?.id && Object.keys(response.config_set || {}).length > 0;
  yield put({ type, payload: hasBranding ? { ...response, ...(orgId ? { orgId } : {}) } : undefined });
  if (orgId && !hasBranding && fallbackToGlobal) {
    yield put({ type: ReduxActionTypes.FETCH_BRANDING_SETTING, payload: {} });
  }
}

export default function* enterpriseSagas() {
  yield takeLatest(ReduxActionTypes.FETCH_ENTERPRISE_LICENSE, fetchEnterpriseLicenseSaga);
  // A global fallback request must not cancel a workspace branding request.
  yield takeLatest((action: Action): action is ReduxAction<FetchBrandingSettingPayload> =>
    action.type === ReduxActionTypes.FETCH_BRANDING_SETTING && !(action as ReduxAction<FetchBrandingSettingPayload>).payload.orgId, fetchBrandingSettingSaga);
  yield takeLatest((action: Action): action is ReduxAction<FetchBrandingSettingPayload> =>
    action.type === ReduxActionTypes.FETCH_BRANDING_SETTING && Boolean((action as ReduxAction<FetchBrandingSettingPayload>).payload.orgId), fetchBrandingSettingSaga);
  yield takeLatest(ReduxActionTypes.FETCH_ENVIRONMENTS, fetchEnvironmentsSaga);
}
