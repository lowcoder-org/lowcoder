import Api from "api/api";
import axios, { AxiosInstance, AxiosPromise, AxiosRequestConfig } from "axios";
import { GenericApiResponse } from "./apiResponses";

export interface SearchParams {
  query: string;
  product_type: string;
  asset: string;
  per_page: number;
  page: 1;
  sort: string;
  formats: string;
}

export type ResponseType = {
  response: any;
};

const apiUrl = "https://api.iconscout.com";
const clientID = "";
const clientSecret = "";
const currentPage = 1;
const currentQuery = '';
const currentData = [];

let axiosIns: AxiosInstance | null = null;

const getAxiosInstance = (clientSecret?: string) => {
  if (axiosIns && !clientSecret) {
    return axiosIns;
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "Client-ID": clientID,
  }
  if (clientSecret) {
    headers['Client-Secret'] = clientSecret;
  }
  const apiRequestConfig: AxiosRequestConfig = {
    baseURL: `${apiUrl}`,
    headers,
    withCredentials: true,
  };

  axiosIns = axios.create(apiRequestConfig);
  return axiosIns;
}

class IconscoutApi extends Api {
  static async search(params: SearchParams): Promise<any> {
    let response;
    try {
      response = await getAxiosInstance().request({
        url: '/v3/search',
        method: "GET",
        withCredentials: false,
        params: {
          ...params,
          'formats[]': params.formats,
        },
      });
    } catch (error) {
      console.error(error);
    }
    return response?.data.response.items;
  }

  static async download(uuid: string, params: Record<string, string>): Promise<any> {
    const response = await getAxiosInstance(clientSecret).request({
      url: `/v3/items/${uuid}/api-download`,
      method: "POST",
      withCredentials: false,
      params,
    });
    return response?.data.response.download;
  }

  static async downloadJSON(url: string): Promise<any> {
    const response = await axios.get(url)
    return response?.data;
  }
}

export default IconscoutApi;
