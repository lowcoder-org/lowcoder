import Api from "api/api";
import { AxiosPromise } from "axios";
import {
  CreateApplicationPayload,
  DeleteApplicationPayload,
  DeleteAppPermissionPayload,
  FetchAppInfoPayload,
  HomeDataPayload,
  PublishApplicationPayload,
  RecycleApplicationPayload,
  RestoreApplicationPayload,
  SetAppEditingStatePayload,
  UpdateAppPermissionPayload,
} from "redux/reduxActions/applicationActions";
import {ApiResponse, GenericApiResponse} from "./apiResponses";
import { JSONObject, JSONValue } from "util/jsonTypes";
import {
  ApplicationDetail,
  ApplicationMeta,
  ApplicationRoleType,
  AppPermissionInfo,
  AppTypeEnum,
  FolderMeta,
} from "constants/applicationConstants";
import { CommonSettingResponseData } from "./commonSettingApi";
import { ResourceType } from "@lowcoder-ee/constants/queryConstants";
import {fetchAppRequestType, GenericApiPaginationResponse} from "@lowcoder-ee/util/pagination/type";

export interface HomeOrgMeta {
  id: string;
  name: string;
  commonSettings: CommonSettingResponseData;
  createdBy: string;
}

export interface HomeData {
  homeApplicationViews: ApplicationMeta[];
  folderInfoViews: FolderMeta[];
  organization: HomeOrgMeta;
}

export type HomeDataResponse = GenericApiResponse<HomeData>;

type CreateApplicationRequest = {
  orgId: string;
  name: string;
  applicationType: AppTypeEnum;
  editingApplicationDSL: EditingApplicationDSL;
  folderId?: string;
};

export interface Query {
  id: string;
  name: string;
  datasourceId: string;
  datasourceType: ResourceType;
  queryConfig: JSONObject;
}

export interface EditingApplicationDSL {
  uiData: JSONValue;
  queries: Query[];
}

export interface AppPermissionResponse extends ApiResponse {
  data: AppPermissionInfo;
}

export interface ApplicationResp extends ApiResponse {
  data: ApplicationDetail;
}

interface GrantAppPermissionReq {
  applicationId: string;
  role: ApplicationRoleType;
  userIds: string[];
  groupIds: string[];
}

class ApplicationApi extends Api {
  static newURLPrefix = "/applications";
  static fetchHomeDataURL = "/applications/home";
  static createApplicationURL = "/applications";
  static fetchAllMarketplaceAppsURL = "/applications/marketplace-apps";
  static deleteApplicationURL = (applicationId: string) => `/applications/${applicationId}`;
  static getAppPublishInfoURL = (applicationId: string) => `/applications/${applicationId}/view`;
  static getAppEditingInfoURL = (applicationId: string) => `/applications/${applicationId}`;
  static updateApplicationURL = (applicationId: string) => `/applications/${applicationId}`;
  static getApplicationPermissionURL = (applicationId: string) =>
    `/applications/${applicationId}/permissions`;
  static grantAppPermissionURL = (applicationId: string) =>
    `/applications/${applicationId}/permissions`;
  static publishApplicationURL = (applicationId: string) =>
    `/applications/${applicationId}/publish`;
  static updateAppPermissionURL = (applicationId: string, permissionId: string) =>
    `/applications/${applicationId}/permissions/${permissionId}`;
  static createFromTemplateURL = `/applications/createFromTemplate`;
  static publicToAllURL = (applicationId: string) => `/applications/${applicationId}/public-to-all`;
  static publicToMarketplaceURL = (applicationId: string) => `/applications/${applicationId}/public-to-marketplace`;
  static getMarketplaceAppURL = (applicationId: string) => `/applications/${applicationId}/view_marketplace`;
  static setAppEditingStateURL = (applicationId: string) => `/applications/editState/${applicationId}`;
  static getAvailableGroupsMembersURL = (applicationId: string) => `/applications/${applicationId}/groups-members/available`;
  static serverSettingsURL = () => `/serverSettings`;

  static fetchHomeData(request: HomeDataPayload): AxiosPromise<HomeDataResponse> {
    return Api.get(ApplicationApi.fetchHomeDataURL, request);
  }

  static fetchAllApplications(request: HomeDataPayload): AxiosPromise<ApplicationMeta[]> {
    return Api.get(ApplicationApi.newURLPrefix + "/list", { ...request, withContainerSize: false });
  }

  static fetchAllApplicationsPagination(request: fetchAppRequestType): AxiosPromise<GenericApiPaginationResponse<ApplicationMeta[]>> {
    return Api.get(ApplicationApi.newURLPrefix + "/list", { ...request, withContainerSize: false, applicationStatus: "RECYCLED" });
  }

  static fetchAllModules(request: HomeDataPayload): AxiosPromise<ApplicationMeta[]> {
    return Api.get(ApplicationApi.newURLPrefix + "/list", {
      applicationType: AppTypeEnum.Module,
      applicationStatus: "NORMAL",
      withContainerSize: true,
      ...request,
    });
  }

  static fetchRecycleList(): AxiosPromise<GenericApiResponse<ApplicationMeta[]>> {
    return Api.get(ApplicationApi.newURLPrefix + "/recycle/list");
  }

  static createApplication(request: CreateApplicationPayload): AxiosPromise<ApplicationResp> {
    return Api.post(ApplicationApi.createApplicationURL, {
      orgId: request.orgId,
      name: request.applicationName,
      applicationType: request.applicationType,
      editingApplicationDSL: request.dsl || {},
      folderId: request.folderId,
    });
  }

  static createApplicationWithDSL(
    request: CreateApplicationRequest
  ): AxiosPromise<ApplicationResp> {
    return Api.post(ApplicationApi.createApplicationURL, request);
  }

  static recycleApplication(
    request: RecycleApplicationPayload
  ): AxiosPromise<GenericApiResponse<Boolean>> {
    return Api.put(ApplicationApi.newURLPrefix + `/recycle/${request.applicationId}`);
  }

  static restoreApplication(
    request: RestoreApplicationPayload
  ): AxiosPromise<GenericApiResponse<Boolean>> {
    return Api.put(ApplicationApi.newURLPrefix + `/restore/${request.applicationId}`);
  }

  static deleteApplication(
    request: DeleteApplicationPayload
  ): AxiosPromise<GenericApiResponse<Boolean>> {
    return Api.delete(ApplicationApi.deleteApplicationURL(request.applicationId));
  }

  static updateApplication(request: {
    applicationId: string;
    name?: string;
    publishedApplicationDSL?: object;
    editingApplicationDSL?: object;
  }): AxiosPromise<ApplicationResp> {
    const { applicationId, ...rest } = request;
    return Api.put(ApplicationApi.updateApplicationURL(applicationId), rest);
  }

  static publishApplication(request: PublishApplicationPayload): AxiosPromise<ApiResponse> {
    return Api.post(ApplicationApi.publishApplicationURL(request.applicationId));
  }

  static getApplicationDetail(request: FetchAppInfoPayload): AxiosPromise<ApplicationResp> {
    const { type, applicationId } = request;
    const url =
      type === "published"
        ? ApplicationApi.getAppPublishInfoURL(applicationId)
        : type === "view_marketplace"
          ? ApplicationApi.getMarketplaceAppURL(applicationId)
          : ApplicationApi.getAppEditingInfoURL(applicationId);
    return Api.get(url);
  }

  static getApplicationPermissions(applicationId: string): AxiosPromise<AppPermissionResponse> {
    return Api.get(ApplicationApi.getApplicationPermissionURL(applicationId));
  }

  static grantAppPermission(request: GrantAppPermissionReq): AxiosPromise<AppPermissionResponse> {
    const { applicationId, ...requestParam } = request;
    return Api.put(ApplicationApi.grantAppPermissionURL(applicationId), requestParam);
  }

  static updateAppPermission(
    request: UpdateAppPermissionPayload
  ): AxiosPromise<AppPermissionResponse> {
    const { applicationId, permissionId, ...requestParam } = request;
    return Api.put(
      ApplicationApi.updateAppPermissionURL(applicationId, permissionId),
      requestParam
    );
  }

  static deleteAppPermission(
    request: DeleteAppPermissionPayload
  ): AxiosPromise<AppPermissionResponse> {
    const { applicationId, permissionId } = request;
    return Api.delete(ApplicationApi.updateAppPermissionURL(applicationId, permissionId));
  }

  static createFromTemplate(templateId: string): AxiosPromise<ApplicationResp> {
    return Api.post(ApplicationApi.createFromTemplateURL, null, {
      templateId: templateId,
    });
  }

  static getAvailableGroupsMembers(applicationId: string, search: string): AxiosPromise<any> {
    return Api.get(ApplicationApi.getAvailableGroupsMembersURL(applicationId), {search})
  }

  /**
   * set app as public
   */
  static publicToAll(appId: string, publicToAll: boolean) {
    return Api.put(ApplicationApi.publicToAllURL(appId), {
      publicToAll: publicToAll,
    });
  }

  static publicToMarketplace(appId: string, publicToMarketplace: boolean) {
    return Api.put(ApplicationApi.publicToMarketplaceURL(appId), {
      publicToMarketplace,
    });
  }

  static fetchAllMarketplaceApps() {
    return Api.get(ApplicationApi.fetchAllMarketplaceAppsURL);
  }

  static getMarketplaceApp(appId: string) {
    return Api.get(ApplicationApi.getMarketplaceAppURL(appId));
  }

  static setAppEditingState(request: SetAppEditingStatePayload): AxiosPromise<ApplicationResp> {
    const { applicationId, editingFinished } = request;
    return Api.put(ApplicationApi.setAppEditingStateURL(applicationId), {
      editingFinished,
    });
  }

  static fetchServerSettings(): AxiosPromise<any> {
    return Api.get(ApplicationApi.serverSettingsURL());
  }
}

export default ApplicationApi;
