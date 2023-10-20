import { useLocation } from "react-router-dom";
import { AuthSessionStoreParams } from "constants/authConstants";
import { messageInstance } from "lowcoder-design";

import { AUTH_LOGIN_URL, AUTH_REGISTER_URL, BASE_URL } from "constants/routesURL";
import history from "util/history";
import PageSkeleton from "components/PageSkeleton";
import { trans } from "i18n";
import { useEffect, useState } from "react";
import { getAuthenticator } from "@lowcoder-ee/pages/userAuth/thirdParty/authenticator";
import { AuthRedirectUrlParams } from "pages/userAuth/thirdParty/authenticator";
import { loadAuthParams } from "pages/userAuth/authUtils";

function getUrlParams(queryParams: URLSearchParams): AuthRedirectUrlParams {
  const ticket = queryParams.get("ticket");
  const state = queryParams.get("state");
  const code = queryParams.get("code") || queryParams.get("authCode");
  return {
    code: code,
    state: state,
    ticket: ticket,
  };
}

function validateParam(authParams: AuthSessionStoreParams, urlParam: AuthRedirectUrlParams) {
  let valid = false;
  if (authParams.authType === "CAS") {
    valid = !!urlParam.ticket;
  } else if (authParams.authType === "JWT") {
    valid = true;
  } else {
    valid = !!urlParam.code && !!urlParam.state && urlParam.state === authParams.state;
  }
  if (valid) {
    return true;
  } else {
    messageInstance.error(trans("userAuth.invalidThirdPartyParam"));
    let redirectUrl = BASE_URL;
    if(authParams.authGoal === "login") {
      redirectUrl = AUTH_LOGIN_URL;
    } else if(authParams.authGoal === "register") {
      redirectUrl = AUTH_REGISTER_URL;
    }
    history.push(redirectUrl, {
      thirdPartyAuthError: true,
    });
    return false;
  }
}

export function AuthRedirect() {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const urlParam = getUrlParams(queryParams);
  const [authParams, setAuthParam] = useState<AuthSessionStoreParams>();
  useEffect(() => {
    const localAuthParams = loadAuthParams();
    if (!localAuthParams) {
      history.push(AUTH_LOGIN_URL);
    } else {
      setAuthParam(localAuthParams);
    }
  }, []);
  if (authParams && validateParam(authParams, urlParam)) {
    getAuthenticator(authParams, urlParam).doAuth();
  }
  return <PageSkeleton hideSideBar />;
}
