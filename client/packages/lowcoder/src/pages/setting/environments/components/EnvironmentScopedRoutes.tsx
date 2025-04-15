import React from "react";
import { Switch, Route, useParams } from "react-router-dom";
import { EnvironmentProvider } from "../context/EnvironmentContext";

import EnvironmentDetail from "../EnvironmentDetail";
import WorkspaceDetail from "../WorkspaceDetail";
import { DeployModalProvider } from "../context/DeployModalContext";

import {
  ENVIRONMENT_DETAIL,
  ENVIRONMENT_WORKSPACE_DETAIL,
} from "@lowcoder-ee/constants/routesURL";

const EnvironmentScopedRoutes: React.FC = () => {
    const { environmentId } = useParams<{ environmentId: string }>();

  return (
    <EnvironmentProvider envId={environmentId}>

      <DeployModalProvider>
      <Switch>
        <Route exact path={ENVIRONMENT_DETAIL}>
          <EnvironmentDetail />
        </Route>

        <Route exact path={ENVIRONMENT_WORKSPACE_DETAIL}>
          <WorkspaceDetail />
        </Route>
      </Switch>
      </DeployModalProvider>
    </EnvironmentProvider>
  );
};

export default EnvironmentScopedRoutes;
