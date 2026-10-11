import { BrandingConfig, BrandingSettingResponse, EnterpriseLicenseResponse } from "@lowcoder-ee/api/enterpriseApi";
import { createReducer } from "@lowcoder-ee/util/reducerUtils";
import { ReduxAction, ReduxActionTypes } from "constants/reduxActionConstants";
import { Environment } from "pages/setting/environments/types/environment.types";
export interface EnterpriseReduxState {
  enterprise: EnterpriseLicenseResponse,
  globalBranding?: BrandingConfig,
  workspaceBranding?: BrandingConfig,
  environments: Environment[],
  environmentsLoading: boolean,
  environmentsError: string | null,
}
  
const initialState: EnterpriseReduxState = {
  enterprise: {
    eeActive: false,
    remainingAPICalls: 0,
    eeLicenses: [],
  },
  environments: [],
  environmentsLoading: false,
  environmentsError: null,
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
  
  [ReduxActionTypes.FETCH_ENVIRONMENTS]: (
    state: EnterpriseReduxState
  ) => ({
    ...state,
    environmentsLoading: true,
  }),
  [ReduxActionTypes.FETCH_ENVIRONMENTS_SUCCESS]: (
    state: EnterpriseReduxState,
    action: ReduxAction<Environment[]>
  ) => ({
    ...state,
    environments: action.payload,
    environmentsLoading: false,
  }),
  [ReduxActionTypes.FETCH_ENVIRONMENTS_FAILURE]: (
    state: EnterpriseReduxState,
    action: ReduxAction<string>
  ) => ({
    ...state,
    environmentsLoading: false,
    environmentsError: action.payload,
  }),
});

export default enterpriseReducer;
