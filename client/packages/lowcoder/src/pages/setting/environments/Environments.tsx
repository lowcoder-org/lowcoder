import React from "react";
import { Switch, Route } from "react-router-dom";
import EnvironmentsList from "./EnvironmentsList";
import EnvironmentScopedRoutes from "./components/EnvironmentScopedRoutes";

import {
  ENVIRONMENT_SETTING,
  ENVIRONMENT_DETAIL
} from "@lowcoder-ee/constants/routesURL";

const Environments: React.FC = () => {
  return (
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
  );
};

export default Environments;
