import { createCheckoutLink } from "@lowcoder-ee/api/subscriptionApi";
import { StripeCustomer, SubscriptionProduct, InitSubscriptionProducts, LowcoderSearchCustomer, LowcoderNewCustomer, Subscription } from "@lowcoder-ee/constants/subscriptionConstants";
import { getDeploymentId } from "@lowcoder-ee/redux/selectors/configSelectors";
import { getFetchSubscriptionsFinished, getSubscriptions, getSubscriptionsError } from "@lowcoder-ee/redux/selectors/subscriptionSelectors";
import { getCurrentUser, getUser } from "@lowcoder-ee/redux/selectors/usersSelectors";
import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useOrgUserCount } from "../hooks";
import { useSimpleSubscriptionContext } from "./SimpleSubscriptionContext";

export interface SubscriptionContextType {
  products: SubscriptionProduct[];
  subscriptionProducts: any[],
  customer?: StripeCustomer;
  isCreatingCustomer: boolean;
  customerDataError: boolean;
  subscriptionDataError?: string;
  checkoutLinkDataError: boolean;
  subscriptionDataLoaded: boolean;
  checkoutLinkDataLoaded: boolean;
  subscriptionProductsLoading: boolean;
  subscriptions: Subscription[],
  admin: "admin" | "member",
}

const SubscriptionContext = createContext<SubscriptionContextType>({
  products: [],
  subscriptionProducts: [],
  customer: undefined,
  isCreatingCustomer: false,
  customerDataError: false,
  subscriptionDataError: undefined,
  checkoutLinkDataError: false,
  subscriptionDataLoaded: false,
  checkoutLinkDataLoaded: false,
  subscriptionProductsLoading: false,
  subscriptions: [],
  admin: "member",
});

export const SubscriptionContextProvider = (props: {
  children: ReactNode,
}) => {

  const {
    customer: existingCustomer,
    subscriptionProducts: existingProducts,
    productsLoaded,
    isCustomerInitializationComplete,
  } = useSimpleSubscriptionContext();

  const [customer, setCustomer] = useState<StripeCustomer | undefined>(existingCustomer);
  const [isCreatingCustomer, setIsCreatingCustomer] = useState<boolean>(false);  
  const [customerDataError, setCustomerDataError] = useState<boolean>(false);
  const [checkoutLinkDataLoaded, setCheckoutLinkDataLoaded] = useState<boolean>(false);
  const [checkoutLinkDataError, setCheckoutLinkDataError] = useState<boolean>(false);
  const [products, setProducts] = useState<SubscriptionProduct[]>(InitSubscriptionProducts);
  const [subscriptionProducts, setSubscriptionProducts] = useState<any[]>(existingProducts || []);
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

  const userCount = useOrgUserCount(orgID);

  const subscriptionSearchCustomer: LowcoderSearchCustomer = {
    hostId: deploymentId,
    orgId: orgID,
    userId: user.id,
  };

  useEffect(() => {
    // If products are already loaded in the outer context, reuse them
    if (productsLoaded) {
      if (!subscriptionProducts.length) {
        setSubscriptionProducts(existingProducts);
      }
      // Ensure no fetching happens in this case
      return;
    }
  }, [productsLoaded, existingProducts, subscriptionProducts, subscriptionProductsLoading]);

  useEffect(() => {
    setCustomer(existingCustomer);
  }, [existingCustomer]);

  useEffect(() => {
    let cancelled = false;
    setProducts(InitSubscriptionProducts);
    setCheckoutLinkDataError(false);
    const customerMatchesWorkspace = customer?.metadata?.lowcoder_hostId === deploymentId &&
      customer?.metadata?.lowcoder_orgId === orgID && customer?.metadata?.lowcoder_userId === user.id;
    if (!productsLoaded || !customer || !customerMatchesWorkspace || !subscriptionDataLoaded ||
        subscriptionDataError || userCount <= 0) return;

    const prepareCheckout = async () => {
      try {
        const updatedProducts = await Promise.all(InitSubscriptionProducts.map(async (product) => {
          const matchingSubscription = subscriptions.find((sub) =>
            sub.product === product.product && sub.status === "active" &&
            sub.hostId === deploymentId && sub.orgId === orgID
          );
          if (matchingSubscription) {
            return { ...product, activeSubscription: true, checkoutLinkDataLoaded: true,
              subscriptionId: matchingSubscription.id };
          }
          if (product.type === "org" && admin !== "admin") return product;
          const checkout = await createCheckoutLink(customer, product.accessLink,
            product.quantity_entity === "orgUser" ? userCount : 1);
          return { ...product, checkoutLink: checkout?.url || "", checkoutLinkDataLoaded: true };
        }));
        if (!cancelled) setProducts(updatedProducts);
      } catch (error) {
        if (!cancelled) setCheckoutLinkDataError(true);
      }
    };
    prepareCheckout();
    return () => { cancelled = true; };
  }, [productsLoaded, subscriptionDataLoaded, subscriptionDataError, subscriptions,
      customer, userCount, deploymentId, orgID, user.id, admin]);

  return (
    <SubscriptionContext.Provider value={{
      admin,
      customer,
      products,
      subscriptionProducts,
      isCreatingCustomer,
      customerDataError,
      subscriptions,
      subscriptionDataLoaded,
      subscriptionDataError,
      checkoutLinkDataLoaded,
      checkoutLinkDataError,
      subscriptionProductsLoading,
    }}>
      {props.children}
    </SubscriptionContext.Provider>
  )
}

export const useSubscriptionContext = () => useContext(SubscriptionContext);
