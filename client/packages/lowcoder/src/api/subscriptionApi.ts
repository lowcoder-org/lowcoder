import Api from "api/api";
import axios, { AxiosInstance, AxiosRequestConfig, CancelToken } from "axios";
import { useDispatch, useSelector } from "react-redux";
import { useEffect, useState} from "react";
import { calculateFlowCode }  from "./apiUtils";
import { fetchGroupsAction, fetchOrgUsersAction } from "redux/reduxActions/orgActions";
import { getOrgUsers } from "redux/selectors/orgSelectors";
import { AppState } from "@lowcoder-ee/redux/reducers";
import type {
  LowcoderNewCustomer,
  LowcoderSearchCustomer,
  StripeCustomer,
} from "@lowcoder-ee/constants/subscriptionConstants";

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

class SubscriptionApi extends Api {
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

export const searchCustomer = async (subscriptionCustomer: LowcoderSearchCustomer) => {
  const apiBody = {
    path: "webhook/secure/search-customer",
    data: subscriptionCustomer,
    method: "post",
    headers: lcHeaders
  };
  try {
    const result = await SubscriptionApi.secureRequest(apiBody);
    return result?.data?.data?.length === 1 ? result.data.data[0] as StripeCustomer : null;
  } catch (error) {
    console.error("Error searching customer:", error);
    throw error;
  }
};

export const searchSubscriptions = async (customerId: string) => {
  const apiBody = {
    path: "webhook/secure/search-subscriptions",
    data: { customerId },
    method: "post",
    headers: lcHeaders
  };
  try {
    const result = await SubscriptionApi.secureRequest(apiBody);
    return result?.data?.data ?? [];
  } catch (error) {
    console.error("Error searching subscriptions:", error);
    throw error;
  }
};

export const searchCustomersSubscriptions = async (Customer: LowcoderSearchCustomer) => {
  const apiBody = {
    path: "webhook/secure/search-customersubscriptions",
    data: Customer,
    method: "post",
    headers: lcHeaders
  };

  try {
    const result = await SubscriptionApi.secureRequest(apiBody);

    if (!result || !result.data) {
      return [];
    }

    // Filter out entries with `"success": "false"`
    const validEntries = result.data.filter((entry: any) => entry.success !== "false");

    // Flatten the data arrays and filter out duplicates by `id`
    const uniqueSubscriptions = Object.values(
      validEntries.reduce((acc: Record<string, any>, entry: any) => {
        entry.data.forEach((subscription: any) => {
          if (!acc[subscription.id]) {
            acc[subscription.id] = subscription;
          }
        });
        return acc;
      }, {})
    );

    return uniqueSubscriptions;
  } catch (error) {
    console.error("Error searching customer:", error);
    throw error;
  }
};

export const createCustomer = async (subscriptionCustomer: LowcoderNewCustomer) => {
  const apiBody = {
    path: "webhook/secure/create-customer",
    data: subscriptionCustomer,
    method: "post",
    headers: lcHeaders
  };
  try {
    const result = await SubscriptionApi.secureRequest(apiBody, 15000);
    return result?.data as StripeCustomer;
  } catch (error) {
    console.error("Error creating customer:", error);
    throw error;
  }
};

export const getProduct = async (productId : string) => {
  const apiBody = {
    path: "webhook/secure/get-product",
    method: "post",
    data: {"productId" : productId},
    headers: lcHeaders
  };
  try {
    const result = await SubscriptionApi.secureRequest(apiBody);
    return result?.data as any;
  } catch (error) {
    console.error("Error fetching product:", error);
    throw error;
  }
};

export const getProducts = async () => {
  const apiBody = {
    path: "webhook/secure/get-products",
    method: "post",
    data: {},
    headers: lcHeaders
  };
  try {
    const result = await SubscriptionApi.secureRequest(apiBody);
    return result?.data?.data as any[];
  } catch (error) {
    console.error("Error fetching product:", error);
    throw error;
  }
};

export const createCheckoutLink = async (customer: StripeCustomer, priceId: string, quantity: number, discount?: number) => {
  const domain = window.location.protocol + "//" + window.location.hostname + (window.location.port ? ':' + window.location.port : '');
  
  const apiBody = {
    path: "webhook/secure/create-checkout-link",
    data: { 
      "customerId": customer.id, 
      "priceId": priceId, 
      "quantity": quantity, 
      "discount": discount, 
      baseUrl: domain 
    },
    method: "post",
    headers: lcHeaders
  };
  try {
    const result = await SubscriptionApi.secureRequest(apiBody);
    return result?.data ? { id: result.data.id, url: result.data.url } : null;
  } catch (error) {
    console.error("Error creating checkout link:", error);
    throw error;
  }
};

// Function to get subscription details from Stripe
export const getSubscriptionDetails = async (subscriptionId: string) => {
  const apiBody = {
    path: "webhook/secure/get-subscription-details",
    method: "post",
    data: { "subscriptionId": subscriptionId },
    headers: lcHeaders,
  };
  try {
    const result = await SubscriptionApi.secureRequest(apiBody);
    return result?.data;
  } catch (error) {
    console.error("Error fetching subscription details:", error);
    throw error;
  }
};

// Function to get invoice documents from Stripe
export const getInvoices = async (subscriptionId: string) => { 
  const apiBody = {
    path: "webhook/secure/get-subscription-invoices",
    method: "post",
    data: { "subscriptionId": subscriptionId },
    headers: lcHeaders,
  };
  try {
    const result = await SubscriptionApi.secureRequest(apiBody);
    return result?.data?.data ?? [];
  } catch (error) {
    console.error("Error fetching invoices:", error);
    throw error;
  }
};

// Function to get a customer Portal Session from Stripe
export const getCustomerPortalSession = async (customerId: string) => { 
  const apiBody = {
    path: "webhook/secure/create-customer-portal-session",
    method: "post",
    data: { "customerId": customerId },
    headers: lcHeaders,
  };
  try {
    const result = await SubscriptionApi.secureRequest(apiBody);
    return result?.data;
  } catch (error) {
    console.error("Error fetching invoices:", error);
    throw error;
  }
};

export default SubscriptionApi;
