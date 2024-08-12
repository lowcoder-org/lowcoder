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

export interface LowcoderCustomer {
  hostname: string;
  email: string;
  orgId: string;
  userId: string;
  userName: string;
  type: string;
  companyName: string;
  address?: CustomerAddress;
}

interface LowcoderMetadata {
  lowcoder_host: string;
  lowcoder_orgId: string;
  lowcoder_type: string;
  lowcoder_userId: string;
}

export interface StripeCustomer {
  id: string;
  object: string;
  address?: object | null;
  balance: number;
  created: number;
  currency: string | null;
  default_source: string | null;
  delinquent: boolean;
  description: string | null;
  discount: string | null;
  email: string;
  invoice_prefix: string;
  invoice_settings: object | null;
  livemode: boolean;
  metadata: LowcoderMetadata;
  name: string;
  phone: string | null;
  preferred_locales: string[];
  shipping: string | null;
  tax_exempt: string;
  test_clock: string | null;
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
