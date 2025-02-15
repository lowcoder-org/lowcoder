import { ReduxAction, ReduxActionTypes } from "constants/reduxActionConstants";
import { AppSnapshotContext, AppSnapshotList } from "constants/applicationConstants";
import { JSONValue } from "util/jsonTypes";
import { PaginationParam } from "constants/apiConstants";
import { AppSnapshotDslInfo } from "api/appSnapshotApi";

export const setShowAppSnapshot = (show: boolean) => {
  return {
    type: ReduxActionTypes.SET_SHOW_APP_SNAPSHOT,
    payload: { show: show },
  };
};

export const setSelectSnapshotId = (snapshotId: string, archived?: boolean) => {
  return {
    type: ReduxActionTypes.SET_SELECT_SNAPSHOT_ID,
    payload: { snapshotId: snapshotId, archived: archived },
  };
};

export type CreateSnapshotPayload = {
  applicationId: string;
  dsl: JSONValue;
  context: AppSnapshotContext;
};

export const createSnapshotAction = (payload: CreateSnapshotPayload) => {
  return {
    type: ReduxActionTypes.CREATE_APP_SNAPSHOT,
    payload: payload,
  };
};

export type FetchSnapshotsPayload = {
  applicationId: string;
  archived: boolean;
  onSuccess?: (snapshots: AppSnapshotList) => void;
} & PaginationParam;

export const fetchSnapshotsAction = (payload: FetchSnapshotsPayload) => {
  return {
    type: ReduxActionTypes.FETCH_APP_SNAPSHOTS,
    payload: payload,
  };
};

export type FetchSnapshotDslPayload = {
  applicationId: string;
  snapshotId: string;
  archived?: boolean;
  onSuccess: (res: AppSnapshotDslInfo) => void;
};

export const fetchSnapshotDslAction = (
  appId: string,
  snapshotId: string,
  archived: boolean,
  onSuccess: (res: AppSnapshotDslInfo) => void
): ReduxAction<FetchSnapshotDslPayload> => {
  return {
    type: ReduxActionTypes.FETCH_APP_SNAPSHOT_DSL,
    payload: {
      applicationId: appId,
      snapshotId: snapshotId,
      archived: archived,
      onSuccess: onSuccess,
    },
  };
};

export type RecoverSnapshotPayload = {
  applicationId: string;
  snapshotId: string;
  snapshotCreateTime: number;
  isArchivedSnapshot?: boolean;
};

export const recoverSnapshotAction = (
  appId: string,
  snapshotId: string,
  snapshotCreateTime: number,
  isArchivedSnapshot?: boolean,
): ReduxAction<RecoverSnapshotPayload> => {
  return {
    type: ReduxActionTypes.RECOVER_APP_SNAPSHOT,
    payload: {
      applicationId: appId,
      snapshotId: snapshotId,
      snapshotCreateTime: snapshotCreateTime,
      isArchivedSnapshot, 
    },
  };
};
