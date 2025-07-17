import { ADMIN_AUTH_URL, AUTH_LOGIN_URL, USER_AUTH_URL } from "constants/routesURL";
import { Redirect, Route, Switch, useLocation, useParams } from "react-router-dom";
import React, { useEffect, useMemo } from "react";
import { useSelector, useDispatch } from "react-redux";
import { selectSystemConfig } from "redux/selectors/configSelectors";
import { AuthContext, clearAuthSearchParams } from "pages/userAuth/authUtils";
import { AuthRoutes } from "@lowcoder-ee/constants/authConstants";
import { AuthLocationState } from "constants/authConstants";
import { ProductLoading } from "components/ProductLoading";
import { fetchConfigAction } from "redux/reduxActions/configActions";
import { fetchUserAction } from "redux/reduxActions/userActions";
import LoginAdmin from "./loginAdmin";
import _ from "lodash";
import {LoadingBarHideTrigger} from "@lowcoder-ee/util/hideLoading";
import { fetchBrandingSetting } from "@lowcoder-ee/redux/reduxActions/enterpriseActions";
export default function UserAuth() {
  const dispatch = useDispatch();
  const location = useLocation<AuthLocationState>();
  const systemConfig = useSelector(selectSystemConfig, _.isEqual);
  const orgId = useParams<any>().orgId;
  const inviteInfo = location.state?.inviteInfo;
  
  const organizationId = useMemo(() => {
    if(inviteInfo?.invitedOrganizationId) {
      return inviteInfo?.invitedOrganizationId;
    }
    return orgId;
  }, [ orgId, inviteInfo ])
  
  useEffect(() => {
    if(organizationId) {
      dispatch(fetchConfigAction(organizationId));
      dispatch(fetchBrandingSetting({orgId: organizationId, fallbackToGlobal: true}));
    } else {
      dispatch(fetchBrandingSetting({orgId: ''}));
    }
  }, [organizationId, dispatch])

  if (organizationId && !systemConfig) {
    return <ProductLoading hideHeader />;
  }

  const fetchUserAfterAuthSuccess = () => {
    dispatch(fetchUserAction());
    clearAuthSearchParams();
  }

  return (
    <AuthContext.Provider
      value={{
        systemConfig: systemConfig,
        inviteInfo: location.state?.inviteInfo,
        thirdPartyAuthError: location.state?.thirdPartyAuthError,
        fetchUserAfterAuthSuccess,
      }}
    >
      <LoadingBarHideTrigger />
      <Switch location={location}>
        <Redirect exact from={USER_AUTH_URL} to={AUTH_LOGIN_URL} />
        <Route exact path={ADMIN_AUTH_URL} component={LoginAdmin} />
        {AuthRoutes.map((route) => (
          <Route key={route.path} path={route.path} component={route.component} />
        ))}
      </Switch>
    </AuthContext.Provider>
  );
}
