import Api from "api/api";
import axios, { AxiosInstance, AxiosRequestConfig, CancelToken } from "axios";
import { calculateFlowCode }  from "./apiUtils";

export type ResponseType = {
  response: any;
};

// Axios Configuration
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
};

class NewsApi extends Api {
  
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
          }, 10000);

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

// API Functions

// secure/get-youtube-videos
// secure/get-github-releases

export const getReleases = async () => {
  const apiBody = {
    path: "webhook/secure/get-github-releases",
    data: {},
    method: "post",
    headers: lcHeaders
  };
  try {
    const result = await NewsApi.secureRequest(apiBody);
    return result?.data[0]?.github?.length > 0 ? result.data[0].github as any[] : [];
  } catch (error) {
    console.error("Error getting news:", error);
    throw error;
  }
};

export const getYoutubeVideos = async () => {
  const apiBody = {
    path: "webhook/secure/get-youtube-videos",
    data: {},
    method: "post",
    headers: lcHeaders
  };
  try {
    const result = await NewsApi.secureRequest(apiBody);
    return result?.data[0]?.youtube?.length > 0 ? result.data[0].youtube as any[] : [];
  } catch (error) {
    console.error("Error getting news:", error);
    throw error;
  }
};

export const getHubspotContent = async () => {
  const apiBody = {
    path: "webhook/secure/get-hubspot-content",
    data: {},
    method: "post",
    headers: lcHeaders
  };
  try {
    const result = await NewsApi.secureRequest(apiBody);
    return result?.data[0]?.results?.length > 0 ? result.data[0].results as any[] : [];
  } catch (error) {
    console.error("Error getting news:", error);
    throw error;
  }
};

export default NewsApi;
