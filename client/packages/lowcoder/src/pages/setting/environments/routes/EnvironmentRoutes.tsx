// client/packages/lowcoder/src/pages/setting/environments/routes/EnvironmentRoutes.tsx
import React from "react";
import { Switch, Route, useRouteMatch } from "react-router-dom";
import { SingleEnvironmentProvider } from "../context/SingleEnvironmentContext";
import { DeployModalProvider } from "../context/DeployModalContext";
import EnvironmentDetail from "../EnvironmentDetail";
import WorkspaceRoutes from "./WorkspaceRoutes";

/**
 * Routes that require a specific environment
 * Provides the SingleEnvironmentProvider for all child routes
 */
const EnvironmentRoutes: React.FC = () => {
  const { path } = useRouteMatch();
  
  return (
    <SingleEnvironmentProvider>
      <DeployModalProvider>
        <Switch>
          {/* Environment detail route */}
          <Route exact path={path}>
            <EnvironmentDetail />
          </Route>
          
          {/* All routes that need a specific workspace */}
          <Route path={`${path}/workspaces/:workspaceId`}>
            <WorkspaceRoutes />
          </Route>
        </Switch>
      </DeployModalProvider>
    </SingleEnvironmentProvider>
  );
};

export default EnvironmentRoutes;