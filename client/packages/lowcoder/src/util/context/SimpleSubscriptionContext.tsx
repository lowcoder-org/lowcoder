import { createCustomer, getProducts, searchCustomer } from "@lowcoder-ee/api/subscriptionApi";
import { StripeCustomer, SubscriptionProduct, InitSubscriptionProducts, LowcoderSearchCustomer, LowcoderNewCustomer, Subscription } from "@lowcoder-ee/constants/subscriptionConstants";
import { getDeploymentId } from "@lowcoder-ee/redux/selectors/configSelectors";
import { getFetchSubscriptionsFinished, getSubscriptions, getSubscriptionsError } from "@lowcoder-ee/redux/selectors/subscriptionSelectors";
import { getCurrentUser, getUser } from "@lowcoder-ee/redux/selectors/usersSelectors";
import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { useSelector } from "react-redux";

export interface SubscriptionContextType {
  products: SubscriptionProduct[];
  productsLoaded: boolean;
  subscriptionProducts: any[],
  customer?: StripeCustomer;
  isCreatingCustomer: boolean;
  isCustomerInitializationComplete: boolean,
  customerDataError: boolean;
  subscriptionDataError?: string;
  checkoutLinkDataError: boolean;
  subscriptionDataLoaded: boolean;
  checkoutLinkDataLoaded: boolean;
  subscriptionProductsLoading: boolean;
  subscriptions: Subscription[],
  admin: "admin" | "member",
}

const SimpleSubscriptionContext = createContext<SubscriptionContextType>({
  products: [],
  productsLoaded: false,
  subscriptionProducts: [],
  customer: undefined,
  isCreatingCustomer: false,
  isCustomerInitializationComplete: false, // Add this flag
  customerDataError: false,
  subscriptionDataError: undefined,
  checkoutLinkDataError: false,
  subscriptionDataLoaded: false,
  checkoutLinkDataLoaded: false,
  subscriptionProductsLoading: false,
  subscriptions: [],
  admin: "member",
});

export const SimpleSubscriptionContextProvider = (props: {
  children: ReactNode,
}) => {
  const [customer, setCustomer] = useState<StripeCustomer>();
  const [isCreatingCustomer, setIsCreatingCustomer] = useState<boolean>(false);  // Track customer creation
  const [customerDataError, setCustomerDataError] = useState<boolean>(false);
  const [checkoutLinkDataLoaded, setCheckoutLinkDataLoaded] = useState<boolean>(false);
  const [checkoutLinkDataError, setCheckoutLinkDataError] = useState<boolean>(false);
  const [products, setProducts] = useState<SubscriptionProduct[]>(InitSubscriptionProducts);
  const [productsLoaded, setProductsLoaded] = useState<boolean>(false);
  const [subscriptionProducts, setSubscriptionProducts] = useState<any[]>([]);
  const [subscriptionProductsLoading, setSubscriptionProductsLoading] = useState<boolean>(false);

  const user = useSelector(getUser);
  const currentUser = useSelector(getCurrentUser);
  const deploymentId = useSelector(getDeploymentId);
  const subscriptions = useSelector(getSubscriptions);
  const subscriptionDataLoaded = useSelector(getFetchSubscriptionsFinished);
  const subscriptionDataError = useSelector(getSubscriptionsError);

  const currentOrg = user.orgs.find(org => org.id === user.currentOrgId);
  const orgID = user.currentOrgId;
  const domain = window.location.protocol + "//" + window.location.hostname + (window.location.port ? ':' + window.location.port : '');
  const admin = user.orgRoleMap.get(orgID) === "admin" ? "admin" : "member";

  const subscriptionSearchCustomer: LowcoderSearchCustomer = {
    hostId: deploymentId,
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
    const fetchProducts = async () => {
      try {
        const productData = await getProducts();
        setSubscriptionProducts(productData);
      } catch (err) {
        console.error("Failed to fetch products:", err);
      } finally {
        setProductsLoaded(true);
        setSubscriptionProductsLoading(false);
      }
    };
  
    if (!productsLoaded && !subscriptionProductsLoading) {
      console.log("Outer context: Fetching products...");
      setSubscriptionProductsLoading(true);
      fetchProducts();
    }
  }, [productsLoaded, subscriptionProductsLoading]);

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

    if (Boolean(deploymentId) && !customer) {
      initializeCustomer();
    }
  }, [deploymentId]);

  const isCustomerInitializationComplete = !isCreatingCustomer && Boolean(customer);

  return (
    <SimpleSubscriptionContext.Provider value={{
      admin,
      customer,
      products,
      productsLoaded,
      subscriptionProducts,
      isCreatingCustomer,
      isCustomerInitializationComplete,
      customerDataError,
      subscriptions,
      subscriptionDataLoaded,
      subscriptionDataError,
      checkoutLinkDataLoaded,
      checkoutLinkDataError,
      subscriptionProductsLoading,
    }}>
      {props.children}
    </SimpleSubscriptionContext.Provider>
  )
}

export const useSimpleSubscriptionContext = () => useContext(SimpleSubscriptionContext);
