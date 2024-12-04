import Api from "api/api";
import { AxiosPromise } from "axios";
import { ApiResponse } from "api/apiResponses";
import { AppSnapshotList } from "constants/applicationConstants";
import { CreateSnapshotPayload } from "redux/reduxActions/appSnapshotActions";
import { PaginationParam } from "constants/apiConstants";
import { JSONValue } from "util/jsonTypes";

export interface AppSnapshotsResp extends ApiResponse {
  data: AppSnapshotList;
}

export interface AppSnapshotDslInfo {
  applicationsDsl: JSONValue;
  moduleDSL: Record<string, JSONValue>;
}

export interface AppSnapshotDslResp extends ApiResponse {
  data: AppSnapshotDslInfo;
}

class AppSnapshotApi extends Api {
  static createSnapshotURL = "/application/history-snapshots";
  static snapshotsURL = (appId: string) => `/application/history-snapshots/${appId}`;
  static archiveSnapshotsURL = (appId: string) => `/application/history-snapshots/archive/${appId}`;
  static snapshotDslURL = (appId: string, snapshotId: string) =>
    `/application/history-snapshots/${appId}/${snapshotId}`;
  static archiveSnapshotDslURL = (appId: string, snapshotId: string) =>
    `/application/history-snapshots/archive/${appId}/${snapshotId}`;
  static createSnapshot(request: CreateSnapshotPayload): AxiosPromise<ApiResponse> {
    return Api.post(AppSnapshotApi.createSnapshotURL, request);
  }

  static getSnapshots(
    appId: string,
    pagination: PaginationParam,
    archived?: boolean,
  ): AxiosPromise<AppSnapshotsResp> {
    if (archived) {
      return Api.get(AppSnapshotApi.archiveSnapshotsURL(appId), pagination);
    }
    return Api.get(AppSnapshotApi.snapshotsURL(appId), pagination);
  }

  static getSnapshotDsl(
    appId: string,
    snapshotId: string,
    archived?: boolean,
  ): AxiosPromise<AppSnapshotDslResp> {
    if (archived) {
      return Api.get(AppSnapshotApi.archiveSnapshotDslURL(appId, snapshotId));
    }
    return Api.get(AppSnapshotApi.snapshotDslURL(appId, snapshotId));
  }
}

export default AppSnapshotApi;
