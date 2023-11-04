import { AbstractAuthenticator } from "./abstractAuthenticator";
import { AxiosPromise } from "axios";
import UserApi, { CommonLoginParam, ThirdPartyAuthRequest } from "api/userApi";
import { ApiResponse } from "api/apiResponses";

export class OAuthAuthenticator extends AbstractAuthenticator {
  bind() {
    const { authParams, urlParam, redirectUrl } = this;
    const reLoginOnBindFail = authParams.authGoal !== "innerBind";
    return UserApi.bindThirdParty({
      state: urlParam.state!,
      code: urlParam.code!,
      source: authParams.sourceType,
      authId: authParams.authId,
      redirectUrl: redirectUrl,
      reLoginOnBindFail: reLoginOnBindFail,
    });
  }

  login(): AxiosPromise<ApiResponse> {
    const { urlParam, authParams, redirectUrl } = this;
    const params: ThirdPartyAuthRequest & CommonLoginParam = {
      state: urlParam.state!,
      code: urlParam.code!,
      source: authParams.sourceType,
      authId: authParams.authId,
      redirectUrl: redirectUrl,
    }
    if(authParams.invitedOrganizationId) {
      params.orgId = authParams.invitedOrganizationId;
    }
    return UserApi.thirdPartyLogin(params);
  }
}
