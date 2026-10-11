import { createReducer } from "util/reducerUtils";
import { SystemConfig } from "constants/configConstants";
import {
  ReduxAction,
  ReduxActionErrorTypes,
  ReduxActionTypes,
} from "constants/reduxActionConstants";
import { ExternalEditorContextState } from "util/context/ExternalEditorContext";

const initialState: ConfigState = {
  fetchingConfig: false,
  editorExternalState: {},
  deploymentId: '',
};

const configReducer = createReducer(initialState, {
  [ReduxActionTypes.FETCH_SYS_CONFIG_INIT]: (state: ConfigState): ConfigState => ({
    ...state,
    fetchingConfig: true,
  }),
  [ReduxActionTypes.FETCH_SYS_CONFIG_SUCCESS]: (
    state: ConfigState,
    action: ReduxAction<SystemConfig>
  ): ConfigState => {
    return {
      ...state,
      systemConfig: action.payload,
      fetchingConfig: false,
    };
  },
  [ReduxActionErrorTypes.FETCH_SYS_CONFIG_ERROR]: (state: ConfigState): ConfigState => ({
    ...state,
    fetchingConfig: false,
  }),
  [ReduxActionTypes.SET_EDITOR_EXTERNAL_STATE]: (
    state: ConfigState,
    action: ReduxAction<Partial<ExternalEditorContextState>>
  ): ConfigState => {
    return {
      ...state,
      editorExternalState: action.payload,
    };
  },
  [ReduxActionTypes.FETCH_DEPLOYMENT_ID_SUCCESS]: (
    state: ConfigState,
    action: ReduxAction<string>
  ): ConfigState => {
    return {
      ...state,
      deploymentId: action.payload,
    };
  },
});

export interface ConfigState {
  fetchingConfig: boolean;
  systemConfig?: SystemConfig;
  editorExternalState: Partial<ExternalEditorContextState>;
  deploymentId: string;
}

export default configReducer;
