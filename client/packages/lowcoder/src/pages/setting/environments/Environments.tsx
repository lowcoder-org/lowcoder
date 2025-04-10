// environments/Environments.tsx
import React from "react";
import { Switch, Route, useRouteMatch } from "react-router-dom";
import EnvironmentsList from "./EnvironmentsList"; // Rename your current component
import EnvironmentDetail from "./EnvironmentDetail";
import WorkspaceDetail from "./WorkspaceDetail";
import { ENVIRONMENT_WORKSPACE_DETAIL } from "@lowcoder-ee/constants/routesURL";

import {
  ENVIRONMENT_SETTING,
  ENVIRONMENT_DETAIL,
} from "@lowcoder-ee/constants/routesURL";

const Environments: React.FC = () => {
  return (
    <Switch>
      <Route path={ENVIRONMENT_WORKSPACE_DETAIL}>
        <WorkspaceDetail />
      </Route>

      <Route path={ENVIRONMENT_DETAIL}>
        <EnvironmentDetail />
      </Route>
      <Route exact path={ENVIRONMENT_SETTING}>
        <EnvironmentsList />
      </Route>
    </Switch>
  );
};

export default Environments;
