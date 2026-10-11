import Api from "api/api";
import axios, { AxiosInstance, AxiosRequestConfig, CancelToken } from "axios";
import { calculateFlowCode }  from "./apiUtils";

export type ResponseType = {
  response: any;
};

export interface Ticket {
  key: string;
  id: string;
  created: string; // ISO date string
  priority: {
    name: string;
    number: string;
  };
  assignee: {
    email: string;
    avatar: string;
    active: boolean;
    timeZone: string;
  };
  status: {
    name: string;
  };
  updated: string; // ISO date string
  title: string;
  description: string;
  lowcoder_userId: string;
  lowcoder_orgId: string;
  lowcoder_host: string;
  lowcoder_subscription: string;
}

export type TicketList = Ticket[];

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

class SupportApi extends Api {

  static async secureRequest(body: any): Promise<any> {
    let response;
    const axiosInstance = getAxiosInstance();

    // Create a cancel token and set timeout for cancellation
    const source = axios.CancelToken.source();
    const timeoutId = setTimeout(() => {
      source.cancel("Request timed out.");
    }, 10000);

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
        console.warn("Request cancelled due to timeout:", error.message);
        // Retry once after timeout cancellation
        try {
          // Reset the cancel token and retry
          const retrySource = axios.CancelToken.source();
          const retryTimeoutId = setTimeout(() => {
            retrySource.cancel("Retry request timed out.");
          }, 15000);

          response = await axiosInstance.request({
            ...requestConfig,
            cancelToken: retrySource.token,
          });

          clearTimeout(retryTimeoutId);
        } catch (retryError) {
          console.error("Retry failed:", retryError);
          throw retryError;
        }
      } else {
        console.error("Error at Support Flow Request:", error);
        throw error;
      }
    } finally {
      clearTimeout(timeoutId); // Clear the initial timeout
    }

    return response;
  }

}

// API Functions

export const searchCustomerTickets = async (
  deploymentId : string,
  orgID : string,
  currentUserId : string
) => {

  const apiBody = {
    path: "webhook/support/get-issues",
    data: {"hostId" : deploymentId, "orgId" : orgID, "userId" : currentUserId},
    method: "post",
    headers: lcHeaders
  };
  try {
    const result = await SupportApi.secureRequest(apiBody);

    if (!result || !result.data) {
      return [];
    }

    const validEntries = result.data.filter((entry: any) => entry.success !== "false");

    return validEntries as TicketList;
  } catch (error) {
    console.error("Error searching Support Tickets: ", error);
    throw error;
  }
};

export const getTicket = async (ticketKey : string) => {

  const apiBody = {
    path: "webhook/support/get-issue",
    data: {"ticketKey" : ticketKey},
    method: "post",
    headers: lcHeaders
  };
  try {
    const result = await SupportApi.secureRequest(apiBody);
    return result?.data?.length === 1 ? result.data as any : null;
  } catch (error) {
    console.error("Error getting individual Support Ticket: ", error);
    throw error;
  }
};

export const createTicket = async (
  domain: string,
  deploymentId : string,
  orgID : string, 
  orgName : string,
  currentUserId : string, 
  subscriptionId : string, 
  summary: string, 
  description : string, 
  errors : string) => {

  const apiBody = {
    path: "webhook/support/create-ticket",
    data: {"domain" : domain, "hostId" : deploymentId, "orgId" : orgID, "orgName" : orgName, "userId" : currentUserId, "subscriptionId": subscriptionId, "summary" : summary, "description" : description, "errors" : errors},
    method: "post",
    headers: lcHeaders
  };
  try {
    const result = await SupportApi.secureRequest(apiBody);
    return result?.data?.length === 1 ? result.data as any : null;
  } catch (error) {
    console.error("Error getting individual Support Ticket: ", error);
    throw error;
  }
};

export const updateTicketDescription = async (ticketKey : string, newDescription : string) => {

  const apiBody = {
    path: "webhook/support/update-ticket-description",
    data: {"ticketKey" : ticketKey, "description" : newDescription},
    method: "post",
    headers: lcHeaders
  };
  try {
    const result = await SupportApi.secureRequest(apiBody);
    return result?.data?.length === 1 ? result.data as any : null;
  } catch (error) {
    console.error("Error getting individual Support Ticket: ", error);
    throw error;
  }
};

export const addComment = async (ticketKey : string, newComment : string) => {

  const apiBody = {
    path: "webhook/support/add-ticket-comment",
    data: {"ticketKey" : ticketKey, "comment" : newComment},
    method: "post",
    headers: lcHeaders
  };
  try {
    const result = await SupportApi.secureRequest(apiBody);
    return result?.data?.length === 1 ? result.data as any : null;
  } catch (error) {
    console.error("Error getting individual Support Ticket: ", error);
    throw error;
  }
};

export const uploadAttachment = async (ticketKey : string, attachmentFile : string, fileName : string, mimeType : string) => {

  const apiBody = {
    path: "webhook/support/add-ticket-attachment",
    data: {"ticketKey" : ticketKey, "attachment" : attachmentFile.split(',')[1], "fileName" : fileName, "mimeType" : mimeType},
    method: "post",
    headers: lcHeaders
  };
  try {
    const result = await SupportApi.secureRequest(apiBody);
    return result?.data?.length === 1 ? result.data as any : null;
  } catch (error) {
    console.error("Error getting individual Support Ticket: ", error);
    throw error;
  }
};



export default SupportApi;
