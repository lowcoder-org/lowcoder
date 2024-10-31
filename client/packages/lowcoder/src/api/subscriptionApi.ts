import Api from "api/api";
import axios, { AxiosInstance, AxiosRequestConfig } from "axios";
import { useDispatch, useSelector } from "react-redux";
import { getUser, getCurrentUser } from "redux/selectors/usersSelectors";
import { useEffect, useState} from "react";
import { calculateFlowCode }  from "./apiUtils";
import { getDeploymentId } from "@lowcoder-ee/redux/selectors/configSelectors";
import { fetchOrgUsersAction } from "redux/reduxActions/orgActions";
import { getOrgUsers } from "redux/selectors/orgSelectors";
import { AppState } from "@lowcoder-ee/redux/reducers";
import { SubscriptionProducts } from "@lowcoder-ee/constants/subscriptionConstants";
import { getFetchSubscriptionsFinished, getSubscriptions, getSubscriptionsError } from "@lowcoder-ee/redux/selectors/subscriptionSelectors";

// Interfaces
export interface CustomerAddress {
  line1: string;
  line2: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
}

export interface LowcoderNewCustomer {
  hostname: string;
  hostId: string;
  email: string;
  orgId: string;
  userId: string;
  userName: string;
  type: string;
  companyName: string;
  address?: CustomerAddress;
}

export interface LowcoderSearchCustomer {
  hostname: string;
  hostId: string;
  email: string;
  orgId: string;
  userId: string;
}

interface LowcoderMetadata {
  lowcoder_host: string;
  lowcoder_hostId: string;
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

export interface Pricing {
  type: string;
  amount: string;
}

export interface Product {
  title?: string;
  description?: string;
  image?: string;
  pricingType: string;
  product: string;
  activeSubscription: boolean;
  accessLink: string;
  subscriptionId: string;
  checkoutLink: string;
  checkoutLinkDataLoaded?: boolean;
  type?: string;
  quantity_entity?: string;
}

export interface SubscriptionItem {
  id: string;
  object: string;
  plan: {
    id: string;
    product: string;
  };
  quantity: number;
}

export interface Subscription {
  id: string;
  collection_method: string;
  current_period_end: number;
  current_period_start: number;
  product: string;
  currency: string;
  interval: string;
  tiers_mode: string;
  status: string;
  start_date: number;
  quantity: number;
  billing_scheme: string;
  price: string;
}

export interface SubscriptionsData {
  subscriptions: Subscription[];
  subscriptionDataLoaded: boolean;
  subscriptionDataError: boolean;
  loading: boolean;
}

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

    if (result?.data?.data?.length > 0) {
      return result?.data?.data;
    }
    else if (result.data.success == "false" && result.data.reason == "customerNotFound") {
      return [];
    }
    else if (result.data.success == "false" && result.data.reason == "userSubscriptionNotFound") {
      return [];
    }
    else if (result.data.success == "false" && result.data.reason == "orgSubscriptionNotFound") {
      return [];
    }
    return [];
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
    const result = await SubscriptionApi.secureRequest(apiBody);
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
    return result?.data as any;
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

// Hooks

export const useOrgUserCount = (orgId: string) => {
  const dispatch = useDispatch();
  const orgUsers = useSelector((state: AppState) => getOrgUsers(state)); // Use selector to get orgUsers from state
  const [userCount, setUserCount] = useState<number>(0);

  useEffect(() => {
    // Dispatch action to fetch organization users
    if (orgId) {
      dispatch(fetchOrgUsersAction(orgId));
    }
  }, [dispatch, orgId]);

  useEffect(() => {
    // Update user count when orgUsers state changes
    if (orgUsers && orgUsers.length > 0) {
      setUserCount(orgUsers.length);
    }
  }, [orgUsers]);

  return userCount;
};

export const InitializeSubscription = () => {
  const [customer, setCustomer] = useState<StripeCustomer | null>(null);
  const [isCreatingCustomer, setIsCreatingCustomer] = useState<boolean>(false);  // Track customer creation
  const [customerDataError, setCustomerDataError] = useState<boolean>(false);
  const [checkoutLinkDataLoaded, setCheckoutLinkDataLoaded] = useState<boolean>(false);
  const [checkoutLinkDataError, setCheckoutLinkDataError] = useState<boolean>(false);
  const [products, setProducts] = useState<Product[]>(SubscriptionProducts);

  const user = useSelector(getUser);
  const currentUser = useSelector(getCurrentUser);
  const deploymentId = useSelector(getDeploymentId);
  const subscriptions = useSelector(getSubscriptions);
  const subscriptionDataLoaded = useSelector(getFetchSubscriptionsFinished);
  const subscriptionDataError = useSelector(getSubscriptionsError)
  const currentOrg = user.orgs.find(org => org.id === user.currentOrgId);
  const orgID = user.currentOrgId;
  const domain = window.location.protocol + "//" + window.location.hostname + (window.location.port ? ':' + window.location.port : '');
  const admin = user.orgRoleMap.get(orgID) === "admin" ? "admin" : "member";
  const dispatch = useDispatch();

  const userCount = useOrgUserCount(orgID);

  const subscriptionSearchCustomer: LowcoderSearchCustomer = {
    hostname: domain,
    hostId: deploymentId,
    email: currentUser.email,
    orgId: orgID,
    userId: user.id,
  };

  const subscriptionNewCustomer: LowcoderNewCustomer = {
    hostname: domain,
    hostId: deploymentId,
    email: currentUser.email,
    orgId: orgID,
    userId: user.id,
    userName: user.username,
    type: admin,
    companyName: currentOrg?.name || "Unknown",
  };

  useEffect(() => {
    const initializeCustomer = async () => {
      try {
        setIsCreatingCustomer(true);
        const existingCustomer = await searchCustomer(subscriptionSearchCustomer);
        if (existingCustomer != null) {
          setCustomer(existingCustomer);
        } else {
          const newCustomer = await createCustomer(subscriptionNewCustomer);
          setCustomer(newCustomer);
        }
      } catch (error) {
        setCustomerDataError(true);
      } finally {
        setIsCreatingCustomer(false);
      }
    };

    if (Boolean(deploymentId)) {
      initializeCustomer();
    }
  }, [deploymentId]);

  useEffect(() => {
    const prepareCheckout = async () => {
      if (subscriptionDataLoaded && userCount > 0) { // Ensure user count is available
        try {
          console.log("Total Users in Organization:", userCount);

          const updatedProducts = await Promise.all(
            products.map(async (product) => {
              const matchingSubscription = subscriptions.find(
                (sub) => sub.price === product.accessLink
              );

              if (matchingSubscription) {
                return {
                  ...product,
                  activeSubscription: true,
                  checkoutLinkDataLoaded: true,
                  subscriptionId: matchingSubscription.id,
                };
              } else {
                // Use the user count to set the quantity for checkout link
                const checkoutLink = await createCheckoutLink(customer!, product.accessLink, userCount);
                return {
                  ...product,
                  activeSubscription: false,
                  checkoutLink: checkoutLink ? checkoutLink.url : "",
                  checkoutLinkDataLoaded: true,
                };
              }
            })
          );
          setProducts(updatedProducts);
          setCheckoutLinkDataError(true);
        } catch (error) {
          setCheckoutLinkDataError(true);
        }
      }
    };

    prepareCheckout();
  }, [subscriptionDataLoaded, customer, userCount]);

  return {
    customer,
    isCreatingCustomer,
    customerDataError,
    subscriptions,
    subscriptionDataLoaded,
    subscriptionDataError,
    checkoutLinkDataLoaded,
    checkoutLinkDataError,
    products,
    admin,
  };
};

export default SubscriptionApi;
