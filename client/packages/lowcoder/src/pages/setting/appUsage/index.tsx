import { APP_USAGE_DASHBOARD, APP_USAGE_DETAIL } from "@lowcoder-ee/constants/routesURL";
import { Route, Switch } from "react-router-dom";
import { AppUsageDashboard } from "./dashboard";
import { AppUsageDetail } from "./detail";

export const AppUsage = () => {
  return (
    <Switch>
      <Route path={APP_USAGE_DASHBOARD} component={AppUsageDashboard} exact />
      <Route path={APP_USAGE_DETAIL} component={AppUsageDetail} exact />
    </Switch>
  );
};
