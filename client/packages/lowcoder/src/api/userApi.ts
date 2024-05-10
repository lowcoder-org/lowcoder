import Api from "api/api";
import { AxiosPromise } from "axios";
import { OrgAndRole } from "constants/orgConstants";
import { BaseUserInfo, CurrentUser } from "constants/userConstants";
import { MarkUserStatusPayload, UpdateUserPayload } from "redux/reduxActions/userActions";
import { ApiResponse, GenericApiResponse } from "./apiResponses";

export interface CommonLoginParam {
  invitationId?: string;
  authId?: string;
  source?: string;
  orgId?: string;
}

export interface CommonBindParam {
  reLoginOnBindFail?: boolean;
  authId?: string;
  source?: string;
}

export interface ThirdPartyAuthRequest {
  state?: string;
  code: string;
  redirectUrl: string;
}

interface FormLoginRequest extends CommonLoginParam {
  loginId: string;
  password: string;
  register: boolean;
  authId?: string;
  orgId?: string;
}

export interface GetUserResponse extends ApiResponse {
  data: {
    orgAndRoles: OrgAndRole[];
  } & BaseUserInfo;
}

export interface ApiKeyPayload {
  name: string;
  description?: string;
}

export interface ResetLostPasswordPayload {
  token: string;
  userEmail: string;
  newPassword: string;
}

export interface FetchApiKeysResponse extends ApiResponse {
  data: {
    id: string;
    name: string;
    description: string;
    token: string;
  }
}

export type GetCurrentUserResponse = GenericApiResponse<CurrentUser>;

class UserApi extends Api {
  static thirdPartyLoginURL = "/auth/tp/login";
  static thirdPartyBindURL = "/auth/tp/bind";
  static usersURL = "/v1/users";
  static sendVerifyCodeURL = "/auth/otp/send";
  static logoutURL = "/auth/logout";
  static userURL = "/v1/users/me";
  static currentUserURL = "/users/currentUser";
  static rawCurrentUserURL = "/users/rawCurrentUser";
  static emailBindURL = "/auth/email/bind";
  static passwordURL = "/v1/users/password";
  static formLoginURL = "/auth/form/login";
  static markUserStatusURL = "/users/mark-status";
  static userDetailURL = (id: string) => `/users/userDetail/${id}`;
  static resetPasswordURL = `/users/reset-password`;
  static forgotPasswordURL = `/users/lost-password`;
  static resetLostPasswordURL = `/users/reset-lost-password`;
  static fetchApiKeysURL = `/auth/api-keys`;
  static createApiKeyURL = `/auth/api-key`;
  static deleteApiKeyURL = (id: string) => `/auth/api-key/${id}`;

  static thirdPartyLogin(
    request: ThirdPartyAuthRequest & CommonLoginParam
  ): AxiosPromise<ApiResponse> {
    return Api.post(UserApi.thirdPartyLoginURL, undefined, request);
  }

  static bindThirdParty(
    request: ThirdPartyAuthRequest & CommonBindParam
  ): AxiosPromise<ApiResponse> {
    return Api.post(UserApi.thirdPartyBindURL, undefined, request);
  }

  static formLogin(request: FormLoginRequest): AxiosPromise<ApiResponse> {
    const { invitationId, ...reqBody } = request;
    const queryParam = invitationId ? { invitationId: invitationId } : undefined;
    return Api.post(UserApi.formLoginURL, reqBody, queryParam);
  }

  static bindEmail(request: { email: string; authId?: string }): AxiosPromise<ApiResponse> {
    return Api.post(UserApi.emailBindURL, undefined, request);
  }

  static setPassword(request: { password: string }): AxiosPromise<ApiResponse> {
    return Api.post(UserApi.passwordURL, undefined, request);
  }

  static updatePassword(request: {
    oldPassword: string;
    newPassword: string;
  }): AxiosPromise<ApiResponse> {
    return Api.put(UserApi.passwordURL, request);
  }

  static getUser(): AxiosPromise<GetUserResponse> {
    return Api.get(UserApi.userURL);
  }

  static getCurrentUser(): AxiosPromise<GetCurrentUserResponse> {
    return Api.get(UserApi.currentUserURL);
  }

  static getRawCurrentUser(): AxiosPromise<GetCurrentUserResponse> {
    return Api.get(UserApi.rawCurrentUserURL);
  }

  static userLogout(): AxiosPromise<ApiResponse> {
    return Api.post(UserApi.logoutURL);
  }

  static updateUser(request: UpdateUserPayload): AxiosPromise<ApiResponse> {
    return Api.put(UserApi.usersURL, request);
  }

  static markUserStatus(request: MarkUserStatusPayload): AxiosPromise<ApiResponse> {
    return Api.put(UserApi.markUserStatusURL, request);
  }

  static getUserDetail(userId: string): AxiosPromise<ApiResponse> {
    return Api.get(UserApi.userDetailURL(userId));
  }

  static resetPassword(userId: string): AxiosPromise<ApiResponse> {
    return Api.post(UserApi.resetPasswordURL, { userId: userId });
  }

  static forgotPassword(userEmail: string): AxiosPromise<ApiResponse> {
    return Api.post(UserApi.forgotPasswordURL, { userEmail });
  }

  static resetLostPassword(request: ResetLostPasswordPayload): AxiosPromise<ApiResponse> {
    // console.log(request);
    return Api.post(UserApi.resetLostPasswordURL, request);
  }

  static createApiKey({
    name,
    description = ''
  }: ApiKeyPayload): AxiosPromise<ApiResponse> {
    return Api.post(UserApi.createApiKeyURL, {
      name,
      description
    });
  }

  static fetchApiKeys(): AxiosPromise<ApiResponse> {
    return Api.get(UserApi.fetchApiKeysURL);
  }

  static deleteApiKey(apiKeyId: string): AxiosPromise<ApiResponse> {
    return Api.delete(UserApi.deleteApiKeyURL(apiKeyId));
  }
}

export default UserApi;
