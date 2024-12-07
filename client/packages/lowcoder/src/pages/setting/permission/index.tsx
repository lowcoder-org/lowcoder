import React, {useState} from "react";
import { Route, Switch } from "react-router-dom";
import PermissionList from "./permissionList";
import PermissionDetail from "./permissionDetail";
import { PERMISSION_SETTING, PERMISSION_SETTING_DETAIL, SETTING_URL } from "constants/routesURL";

export default function PermissionRoutes() {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  return (
    <Switch>
      <Route path={[SETTING_URL, PERMISSION_SETTING]} exact render={(props) => <PermissionList currentPage={currentPage} pageSize={pageSize} setCurrentPage={setCurrentPage} setPageSize={setPageSize} />} />
      <Route path={PERMISSION_SETTING_DETAIL} render={(props) => <PermissionDetail currentPageProp={currentPage} pageSizeProp={pageSize}  />} />
    </Switch>
  );
}