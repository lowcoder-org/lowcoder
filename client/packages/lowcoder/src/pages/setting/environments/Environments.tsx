// client/packages/lowcoder/src/pages/setting/environments/Environments.tsx
import React from "react";
import { Switch, Route, useRouteMatch } from "react-router-dom";
import EnvironmentRoutes from "./routes/EnvironmentRoutes";
import EnvironmentsList from "./EnvironmentsList";

/**
 * Top-level Environments component
 * No longer needs the EnvironmentProvider since we use Redux
 */
const EnvironmentsSettings: React.FC = () => {
  const { path } = useRouteMatch();
  
  return (
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
  );
};

export default EnvironmentsSettings;