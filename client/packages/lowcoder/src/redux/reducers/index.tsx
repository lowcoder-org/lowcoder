import entityReducer from "./entitiyReducers";
import { PluginDataState } from "./entitiyReducers/pluginReducer";
import { DatasourceDataState } from "./entitiyReducers/datasourceReducer";
import uiReducer from "./uiReducers";
import { ApplicationReduxState } from "./uiReducers/applicationReducer";
import { OrgReduxState } from "./uiReducers/orgReducer";
import { UsersReduxState } from "./uiReducers/usersReducer";
import { ConfigState } from "./uiReducers/configReducer";
import { AppSnapshotState } from "./uiReducers/appSnapshotReducer";
import { CommonSettingsState } from "./uiReducers/commonSettingsReducer";
import { QueryLibraryState } from "./entitiyReducers/queryLibraryReducer";
import { FolderReduxState } from "./uiReducers/folderReducer";
import { combineReducers } from "redux";
import npmPluginReducer, { NPMPluginState } from "./npmPluginReducers";
import jsLibraryReducers, { JSLibraryState } from "./jsLibraryReducers";
import { SubscriptionsReduxState } from "./uiReducers/subscriptionReducer";
import { EnterpriseReduxState } from "./uiReducers/enterpriseReducer";

export interface AppState {
  ui: {
    users: UsersReduxState;
    org: OrgReduxState;
    application: ApplicationReduxState;
    folder: FolderReduxState;
    appSnapshot: AppSnapshotState;
    config: ConfigState;
    commonSettings: CommonSettingsState;
    subscriptions: SubscriptionsReduxState;
    enterprise: EnterpriseReduxState;
  };
  entities: {
    datasource: DatasourceDataState;
    plugins: PluginDataState;
    queryLibrary: QueryLibraryState;
  };
  npmPlugin: NPMPluginState;
  jsLibrary: JSLibraryState;
}

export const reducerObject = {
  ui: uiReducer,
  entities: entityReducer,
  npmPlugin: npmPluginReducer,
  jsLibrary: jsLibraryReducers,
};

export const appReducer = combineReducers(reducerObject);
