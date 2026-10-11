import Api from "api/api";
import { AxiosPromise } from "axios";
import { GenericApiResponse } from "./apiResponses";

export interface GetInviteRequest {
  orgId: string;
}

export interface InviteRequest {
  invitationId: string;
}

export type InviteInfo = {
  inviteCode: string;
  createUserName: string;
  invitedOrganizationName: string;
  invitedOrganizationId: string;
};

class InviteApi extends Api {
  static getInviteURL = "/invitation";
  static acceptInviteURL = (invitationId: string) => `/invitation/${invitationId}/invite`;
  static sendInvitationURL = `${this.getInviteURL}/email/invite`;

  // generate invitation
  static getInvite(request: GetInviteRequest): AxiosPromise<GenericApiResponse<InviteInfo>> {
    return Api.post(InviteApi.getInviteURL, undefined, request);
  }

  // get invitation info
  static getInviteInfo(request: InviteRequest): AxiosPromise<GenericApiResponse<InviteInfo>> {
    return Api.get(InviteApi.getInviteURL + "/" + request.invitationId);
  }

  // accept invitation
  static acceptInvite(request: InviteRequest): AxiosPromise<GenericApiResponse<InviteInfo>> {
    // the same api as getInviteInfo, method is by post
    return Api.get(InviteApi.acceptInviteURL(request.invitationId));
  }

  // send invitations
  static sendInvitations(request: {emails: string[], orgId: string}): AxiosPromise<GenericApiResponse<any>> {
    return Api.post(InviteApi.sendInvitationURL, request);
  }
}

export default InviteApi;
