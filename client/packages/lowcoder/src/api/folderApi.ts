import Api from "./api";
import { AxiosPromise } from "axios";
import {GenericApiPaginationResponse, GenericApiResponse} from "./apiResponses";
import {
  CreateFolderPayload,
  DeleteFolderPayload,
  FetchFolderElementsPaginationPayload,
  FetchFolderElementsPayload,
  MoveToFolderPayload,
  UpdateFolderPayload,
} from "../redux/reduxActions/folderActions";
import { ApplicationMeta, FolderMeta } from "../constants/applicationConstants";

export class FolderApi extends Api {
  static url = "/folders";

  static createFolder(request: CreateFolderPayload): AxiosPromise<GenericApiResponse<FolderMeta>> {
    return Api.post(FolderApi.url, request);
  }

  static updateFolder(request: UpdateFolderPayload): AxiosPromise<GenericApiResponse<FolderMeta>> {
    return Api.put(FolderApi.url, request);
  }

  static deleteFolder(request: DeleteFolderPayload): AxiosPromise<GenericApiResponse<void>> {
    return Api.delete(FolderApi.url + `/${request.folderId}`);
  }

  static moveToFolder(request: MoveToFolderPayload): AxiosPromise<GenericApiResponse<void>> {
    return Api.put(
      FolderApi.url + `/move/${request.sourceId}`,
      {},
      {
        targetFolderId: request.folderId,
      }
    );
  }

  static fetchFolderElements(
    request: FetchFolderElementsPayload
  ): AxiosPromise<GenericApiResponse<(ApplicationMeta | FolderMeta)[]>> {
    return Api.get(FolderApi.url + `/elements`, { id: request.folderId });
  }

  static fetchFolderElementsPagination(
      request: FetchFolderElementsPaginationPayload
  ): AxiosPromise<GenericApiPaginationResponse<(ApplicationMeta | FolderMeta)[]>> {
    return Api.get(FolderApi.url + `/elements`, { ...request });
  }
}
