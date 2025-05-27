// client/packages/lowcoder/src/pages/setting/environments/Environments.tsx
import React from "react";
import { Switch, Route, useRouteMatch } from "react-router-dom";
import { EnvironmentProvider } from "./context/EnvironmentContext";
import EnvironmentRoutes from "./routes/EnvironmentRoutes";
import EnvironmentsList from "./EnvironmentsList";

/**
 * Top-level Environments component
 * Provides the EnvironmentProvider at the top level
 */
const EnvironmentsSettings: React.FC = () => {
  const { path } = useRouteMatch();
  
  return (
    <EnvironmentProvider>
      <Switch>
        {/* Environment list route */}
        <Route exact path={path}>
          <EnvironmentsList />
        </Route>
        
        {/* All routes that need a specific environment */}
        <Route path={`${path}/:envId`}>
          <EnvironmentRoutes />
        </Route>
      </Switch>
    </EnvironmentProvider>
  );
};

export default EnvironmentsSettings;