import { call, put, takeLatest } from 'redux-saga/effects';
import { ReduxAction, ReduxActionTypes } from "constants/reduxActionConstants";
import { setEnterpriseLicense, fetchEnvironmentsSuccess, fetchEnvironmentsFailure } from "redux/reduxActions/enterpriseActions";
import { BrandingSettingResponse, EnterpriseLicenseResponse, FetchBrandingSettingPayload, getBranding, getEnterpriseLicense } from "api/enterpriseApi";
import { getEnvironmentsWithLicenseStatus } from "pages/setting/environments/services/environments.service";
import { Environment } from "pages/setting/environments/types/environment.types";

import { AxiosResponse } from 'axios';

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

function* fetchBrandingSettingSaga(action: ReduxAction<FetchBrandingSettingPayload>) {
  try {
    const response: BrandingSettingResponse = yield getBranding(action.payload.orgId);
    if (response && response.id) {
      if (action.payload.orgId) {
        yield put({
          type: ReduxActionTypes.SET_WORKSPACE_BRANDING_SETTING,
          payload: response,
        });
        return;
      }
      yield put({
        type: ReduxActionTypes.SET_GLOBAL_BRANDING_SETTING,
        payload: response,
      });
    }
  } catch (error) {
    console.error('Failed to fetch branding setting:', error);
    // fetch global branding if org's branding setting is not available
    if (Boolean(action.payload.orgId) && action.payload.fallbackToGlobal) {
      yield put({
        type: ReduxActionTypes.FETCH_BRANDING_SETTING,
        payload: {},
      })
    }
  }
}

export default function* enterpriseSagas() {
  yield takeLatest(ReduxActionTypes.FETCH_ENTERPRISE_LICENSE, fetchEnterpriseLicenseSaga);
  yield takeLatest(ReduxActionTypes.FETCH_BRANDING_SETTING, fetchBrandingSettingSaga);
  yield takeLatest(ReduxActionTypes.FETCH_ENVIRONMENTS, fetchEnvironmentsSaga);
}
