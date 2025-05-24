import { AUDIT_LOG_DASHBOARD, AUDIT_LOG_DETAIL } from "@lowcoder-ee/constants/routesURL";
import { Route, Switch } from "react-router-dom";
import { AuditLogDashboard } from "./dashboard";
import { AuditLogDetail } from "./detail";

export const AuditLog = () => {
  return (
    <Switch>
      <Route path={AUDIT_LOG_DASHBOARD} component={AuditLogDashboard} exact />
      <Route path={AUDIT_LOG_DETAIL} component={AuditLogDetail} exact />
    </Switch>
  );
};
