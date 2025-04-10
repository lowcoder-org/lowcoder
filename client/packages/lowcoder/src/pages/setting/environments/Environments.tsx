// environments/Environments.tsx
import React from "react";
import { Switch, Route, useRouteMatch } from "react-router-dom";
import EnvironmentsList from "./EnvironmentsList"; // Rename your current component

import { ENVIRONMENT_SETTING } from "@lowcoder-ee/constants/routesURL";

const Environments: React.FC = () => {
  return (
    <Switch>
      <Route exact path={ENVIRONMENT_SETTING}>
        <EnvironmentsList />
      </Route>
    </Switch>
  );
};

export default Environments;
