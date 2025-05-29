import Api from "api/api";
import axios, { AxiosInstance, AxiosPromise, AxiosRequestConfig } from "axios";
import { calculateFlowCode }  from "./apiUtils";

export interface SearchParams {
  query: string;
  asset: string;
  per_page: number;
  page: number;
  sort: string;
  formats?: string;
  price?: string;
}

export type ResponseType = {
  response: any;
};

const lcHeaders = {
  "Lowcoder-Token": calculateFlowCode(),
  "Content-Type": "application/json"
};

let axiosIns: AxiosInstance | null = null;

const getAxiosInstance = (clientSecret?: string) => {
  if (axiosIns && !clientSecret) {
    return axiosIns;
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  const apiRequestConfig: AxiosRequestConfig = {
    baseURL: "https://api-service.lowcoder.cloud/api/flow",
    headers,
  };

  axiosIns = axios.create(apiRequestConfig);
  return axiosIns;
}

class IconFlowApi extends Api {

  static async secureRequest(body: any, timeout: number = 6000): Promise<any> {
    let response;
    const axiosInstance = getAxiosInstance();

    // Create a cancel token and set timeout for cancellation
    const source = axios.CancelToken.source();
    const timeoutId = setTimeout(() => {
      source.cancel("Request timed out.");
    }, timeout);

    // Request configuration with cancel token
    const requestConfig: AxiosRequestConfig = {
      method: "POST",
      withCredentials: true,
      data: body,
      cancelToken: source.token, // Add cancel token
    };

    try {
      response = await axiosInstance.request(requestConfig);
    } catch (error) {
      if (axios.isCancel(error)) {
        // Retry once after timeout cancellation
        try {
          // Reset the cancel token and retry
          const retrySource = axios.CancelToken.source();
          const retryTimeoutId = setTimeout(() => {
            retrySource.cancel("Retry request timed out.");
          }, 20000);

          response = await axiosInstance.request({
            ...requestConfig,
            cancelToken: retrySource.token,
          });

          clearTimeout(retryTimeoutId);
        } catch (retryError) {
          console.warn("Error at Secure Flow Request. Retry failed:", retryError);
          throw retryError;
        }
      } else {
        console.warn("Error at Secure Flow Request:", error);
        throw error;
      }
    } finally {
      clearTimeout(timeoutId); // Clear the initial timeout
    }

    return response;
  }

}

export const searchAssets = async (searchParameters : SearchParams) => {
  const apiBody = {
    path: "webhook/scout/search-asset",
    data: searchParameters,
    method: "post",
    headers: lcHeaders
  };
  try {
    const result = await IconFlowApi.secureRequest(apiBody);
    return result?.data?.response?.items?.total > 0 ? result.data.response.items as any : null;
  } catch (error) {
    console.error("Error searching Design Assets:", error);
    throw error;
  }
};

export const getAssetLinks = async (uuid: string, params: Record<string, string>) => {
  const apiBody = {
    path: "webhook/scout/get-asset-links",
    data: {"uuid" : uuid, "params" : params},
    method: "post",
    headers: lcHeaders
  };
  try {
    const result = await IconFlowApi.secureRequest(apiBody);

    return result?.data?.response?.download?.url.length > 0 ? result.data.response.download as any : null;
  } catch (error) {
    console.error("Error searching Design Assets:", error);
    throw error;
  }
};


/*

static async search(params: SearchParams): Promise<any> {
    let response;
    try {
      response = await getAxiosInstance().request({
        url: '/v3/search',
        method: "GET",
        withCredentials: false,
        params: {
          ...params,
        },
      });
    } catch (error) {
      console.error(error);
    }
    return response?.data.response.items;
  }

  static async download(uuid: string, params: Record<string, string>): Promise<any> {
    const response = await getAxiosInstance(clientSecret).request({
      url: `/v3/items/${uuid}/api-download?format=${params.format}`,
      method: "POST",
      withCredentials: false,
    });
    return response?.data.response.download;
  }

*/ 

export default IconFlowApi;