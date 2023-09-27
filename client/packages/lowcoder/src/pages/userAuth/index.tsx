import { AUTH_LOGIN_URL, USER_AUTH_URL } from "constants/routesURL";
import { Redirect, Route, Switch, useLocation, useParams } from "react-router-dom";
import React, { useEffect, useMemo } from "react";
import { useSelector, useDispatch } from "react-redux";
import { selectSystemConfig } from "redux/selectors/configSelectors";
import { AuthContext } from "pages/userAuth/authUtils";
import { AuthRoutes } from "@lowcoder-ee/constants/authConstants";
import { AuthLocationState } from "constants/authConstants";
import { ProductLoading } from "components/ProductLoading";
import { fetchConfigAction } from "redux/reduxActions/configActions";
import _ from "lodash";

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
    }
  }, [organizationId, dispatch])

  if (organizationId && !systemConfig) {
    return <ProductLoading hideHeader />;
  }

  return (
    <AuthContext.Provider
      value={{
        systemConfig: systemConfig,
        inviteInfo: location.state?.inviteInfo,
        thirdPartyAuthError: location.state?.thirdPartyAuthError,
      }}
    >
      <Switch location={location}>
        <Redirect exact from={USER_AUTH_URL} to={AUTH_LOGIN_URL} />
        {AuthRoutes.map((route) => (
          <Route key={route.path} path={route.path} component={route.component} />
        ))}
      </Switch>
    </AuthContext.Provider>
  );
}
