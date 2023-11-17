import Api from "./api";
import { AxiosPromise } from "axios";
import { ApiResponse } from "./apiResponses";
import { ConfigResponseData } from "constants/configConstants";

export interface ConfigResponse extends ApiResponse {
  data: ConfigResponseData;
}

class ConfigApi extends Api {
  static configURL = "/configs";

  static fetchConfig(orgId?: string): AxiosPromise<ConfigResponse> {
    let authConfigURL = ConfigApi.configURL;
    if(orgId?.length) {
      authConfigURL += `?orgId=${orgId}`;
    }
    return Api.get(authConfigURL);
  }
}

export default ConfigApi;
