import React, { useEffect } from "react";
import { Switch, Route, useParams } from "react-router-dom";
import { useEnvironmentContext } from "../context/EnvironmentContext";
import EnvironmentDetail from "../EnvironmentDetail";
import WorkspaceDetail from "../WorkspaceDetail";
import { DeployModalProvider } from "../context/DeployModalContext";

import {
  ENVIRONMENT_DETAIL,
  ENVIRONMENT_WORKSPACE_DETAIL,
} from "@lowcoder-ee/constants/routesURL";

/**
 * Component for routes scoped to a specific environment
 * Uses the environment ID from the URL parameters to fetch the specific environment
 */
const EnvironmentScopedRoutes: React.FC = () => {
  const { environmentId } = useParams<{ environmentId: string }>();
  const { refreshEnvironment } = useEnvironmentContext();
  
  // When the environmentId changes, fetch the specific environment
  useEffect(() => {
    if (environmentId) {
      refreshEnvironment(environmentId);
    }
  }, [environmentId, refreshEnvironment]);

  return (
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
  );
};

export default EnvironmentScopedRoutes;