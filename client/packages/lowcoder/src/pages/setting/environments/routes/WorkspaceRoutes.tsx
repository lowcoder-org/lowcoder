// client/packages/lowcoder/src/pages/setting/environments/routes/WorkspaceRoutes.tsx
import React from "react";
import { Switch, Route, useRouteMatch } from "react-router-dom";
import { WorkspaceProvider } from "../context/WorkspaceContext";
import WorkspaceDetail from "../WorkspaceDetail";

/**
 * Routes that require a specific workspace
 * Provides the WorkspaceProvider for all child routes
 */
const WorkspaceRoutes: React.FC = () => {
  const { path } = useRouteMatch();
  
  return (
    <WorkspaceProvider>
      <Switch>
        {/* Workspace detail route */}
        <Route exact path={path}>
          <WorkspaceDetail />
        </Route>
        
        {/* You can add more workspace-specific routes here */}
      </Switch>
    </WorkspaceProvider>
  );
};

export default WorkspaceRoutes;