import { createCheckoutLink, createCustomer, getProducts, searchCustomer } from "@lowcoder-ee/api/subscriptionApi";
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
    const initializeCustomer = async () => {
      if (existingCustomer) {
        setCustomer(existingCustomer);
        return;
      }

      /* try {
        setIsCreatingCustomer(true);
        const subscriptionSearchCustomer: LowcoderSearchCustomer = {
          hostId: deploymentId,
          orgId: orgID,
          userId: user.id,
        };
        const existingCustomer = await searchCustomer(subscriptionSearchCustomer);
        if (existingCustomer) {
          setCustomer(existingCustomer);
        } else {
          const newCustomer = await createCustomer(subscriptionNewCustomer);
          setCustomer(newCustomer);
        }
      } catch (error) {
        setCustomerDataError(true);
      } finally {
        setIsCreatingCustomer(false);
      } */
    };

    if (!customer && isCustomerInitializationComplete) {
      initializeCustomer();
    }
  }, [customer, existingCustomer, isCustomerInitializationComplete, deploymentId]);

  useEffect(() => {
    const prepareCheckout = async () => {
      if (subscriptionDataLoaded && userCount > 0) { // Ensure user count is available
        try {
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
                const checkoutLink = await createCheckoutLink(customer!, product.accessLink, product.quantity_entity == "orgUser" ? userCount : 1);
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
          setCheckoutLinkDataError(false);
        } catch (error) {
          setCheckoutLinkDataError(true);
        }
      }
    };

    if (productsLoaded && customer) {
      prepareCheckout();
    }
  }, [subscriptionDataLoaded, customer, userCount]);

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
