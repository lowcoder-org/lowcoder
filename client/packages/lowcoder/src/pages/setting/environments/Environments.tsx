import React from "react";
import { Switch, Route } from "react-router-dom";
import { EnvironmentProvider } from "./context/EnvironmentContext";
import EnvironmentsList from "./EnvironmentsList";
import EnvironmentScopedRoutes from "./components/EnvironmentScopedRoutes";

import {
  ENVIRONMENT_SETTING,
  ENVIRONMENT_DETAIL
} from "@lowcoder-ee/constants/routesURL";

/**
 * Top-level Environments component that wraps all environment-related routes
 * with the EnvironmentProvider for shared state management
 */
const Environments: React.FC = () => {
  return (
    <EnvironmentProvider>
      <Switch>
        {/* Route that shows the list of environments */}
        <Route exact path={ENVIRONMENT_SETTING}>
          <EnvironmentsList />
        </Route>

        {/* All other routes under /environments/:envId */}
        <Route path={ENVIRONMENT_DETAIL}>
          <EnvironmentScopedRoutes />
        </Route>
      </Switch>
    </EnvironmentProvider>
  );
};

export default Environments;