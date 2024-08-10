import Api from "api/api";
import axios, { AxiosInstance, AxiosRequestConfig } from "axios";

export interface CustomerAddress {
  line1: string;
  line2: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
}

export interface Customer {
  hostname: string;
  email: string;
  orgId: string;
  userId: string;
  userName: string;
  type: string;
  companyName: string;
  address?: CustomerAddress;
}

export type ResponseType = {
  response: any;
};

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
  }

  const apiRequestConfig: AxiosRequestConfig = {
    baseURL: "http://localhost:8080/api/flow",
    headers,
  };

  axiosIns = axios.create(apiRequestConfig);
  return axiosIns;
}

class SubscriptionApi extends Api {

  static async secureRequest(body: any): Promise<any> {
    let response;
    try {
      response = await getAxiosInstance().request({
        method: "POST",
        withCredentials: true,
        data: body,
      });
    } catch (error) {
      console.error("Error at Secure Flow Request:", error);
      // throw error;
    }
    return response;
  }

}

export default SubscriptionApi;
