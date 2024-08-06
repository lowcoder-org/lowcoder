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
  address: CustomerAddress;
}

export type ResponseType = {
  response: any;
};

const apiUrl = "https://flow.lowcoder.cloud/webhook/secure";
const authHeader = "96a99c7b-3758-4c48-b4b1-a8cbf59e7d6c";

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
    "Lowcoder-Token": authHeader,
  }

  const apiRequestConfig: AxiosRequestConfig = {
    baseURL: `${apiUrl}`,
    headers,
  };

  axiosIns = axios.create(apiRequestConfig);
  return axiosIns;
}

class SubscriptionApi extends Api {
  
  static async createCustomer(body: Customer): Promise<any> {
    console.log("createCustomerCall", body);

    let response;
    try {
      response = await getAxiosInstance().request({
        url: '/create-customer',
        method: "POST",
        withCredentials: true,
        data: body,
      });
    } catch (error) {
      console.error("Error creating customer:", error);
      throw error;
    }
    return response;
  }

}

export default SubscriptionApi;