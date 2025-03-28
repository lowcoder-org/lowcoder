// index.ts - Main entry point for the Environments module
import { Route, Switch } from "react-router";
import { 
  ENVIRONMENT_SETTING, 
  ENVIRONMENT_DETAIL,
  ENVIRONMENT_WORKSPACE_DETAIL
} from "constants/routesURL";
import { EnvironmentList } from "./environmentList";
import EnvironmentSettingContent from "./environmentSettingContent";
import EnvironmentWorkspaceDetail from "./environmentWorkspaceDetail";

export const Environments = () => {
  return (
    <Switch>
      <Route path={ENVIRONMENT_SETTING} component={EnvironmentList} exact />
      <Route path={ENVIRONMENT_DETAIL} component={EnvironmentSettingContent} exact />
      <Route path={ENVIRONMENT_WORKSPACE_DETAIL} component={EnvironmentWorkspaceDetail} exact />
    </Switch>
  );
};