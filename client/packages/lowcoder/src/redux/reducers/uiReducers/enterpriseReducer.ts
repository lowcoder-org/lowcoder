import { BrandingConfig, BrandingSettingResponse, EnterpriseLicenseResponse } from "@lowcoder-ee/api/enterpriseApi";
import { createReducer } from "@lowcoder-ee/util/reducerUtils";
import { ReduxAction, ReduxActionTypes } from "constants/reduxActionConstants";

export interface EnterpriseReduxState {
  enterprise: EnterpriseLicenseResponse,
  globalBranding?: BrandingConfig,
  workspaceBranding?: BrandingConfig,
}
  
const initialState: EnterpriseReduxState = {
  enterprise: {
    eeActive: false,
    remainingAPICalls: 0,
    eeLicenses: [],
  }
};

const enterpriseReducer = createReducer(initialState, {
  [ReduxActionTypes.SET_ENTERPRISE_LICENSE]: (
    state: EnterpriseReduxState,
    action: ReduxAction<EnterpriseLicenseResponse>
  ) => ({
    ...state,
    enterprise: action.payload,
  }),
  [ReduxActionTypes.SET_GLOBAL_BRANDING_SETTING]: (
    state: EnterpriseReduxState,
    action: ReduxAction<BrandingSettingResponse>
  ) => ({
    ...state,
    globalBranding: action.payload,
  }),
  [ReduxActionTypes.SET_WORKSPACE_BRANDING_SETTING]: (
    state: EnterpriseReduxState,
    action: ReduxAction<BrandingSettingResponse>
  ) => ({
    ...state,
    workspaceBranding: action.payload,
  }),
});

export default enterpriseReducer;
