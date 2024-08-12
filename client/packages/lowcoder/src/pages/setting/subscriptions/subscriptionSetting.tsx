import { getUser, getCurrentUser } from "redux/selectors/usersSelectors";
import React, { useEffect, useState } from 'react';
import { useSelector } from "react-redux";
import styled from "styled-components";
import { GreyTextColor } from "constants/style";
import { trans } from "i18n";
import { Level1SettingPageContent, Level1SettingPageTitle } from "../styled";
import { Flex } from 'antd';
import { ProductCard } from "./productCard";
import SubscriptionApi, { LowcoderCustomer, StripeCustomer } from "@lowcoder-ee/api/subscriptionApi";

const SubscriptionSettingContent = styled.div`
  max-width: 840px;

  .section-title {
    font-size: 14px;
    font-weight: 500;
    margin-bottom: 8px;
  }

  .section-content {
    margin-bottom: 28px;
  }

  .section-option {
    color: ${GreyTextColor};
    margin-bottom: 14px;
    font-size: 13px;
  }
`;

const lcHeaders = {
  "Lowcoder-Token": "96a99c7b-3758-4c48-b4b1-a8cbf59e7d6c",
  "Content-Type": "application/json"
};

interface Pricing {
  type: string;
  amount: string;
}

interface Product {
  title: string;
  description: string;
  image: string;
  pricingType: string;
  pricing: Pricing[];
  activeSubscription: boolean;
  accessLink: string;
  subscriptionId: string;
  checkoutLink: string;
  checkoutLinkDataLoaded?: boolean;
  type?: string;
  quantity_entity?: string;
}

interface SubscriptionItem {
  id: string;
  object: string;
  plan: {
    id: string;
    product: string;
  };
  quantity: number;
}

export function SubscriptionSetting() {
  const [customer, setCustomer] = useState<StripeCustomer | null>(null);
  const [customerDataError, setCustomerDataError] = useState<boolean>(false);
  const [subscriptions, setSubscriptions] = useState<SubscriptionItem[]>([]);
  const [subscriptionDataLoaded, setSubscriptionDataLoaded] = useState<boolean>(false);
  const [subscriptionDataError, setSubscriptionDataError] = useState<boolean>(false);
  const [checkoutLinkDataLoaded, setCheckoutLinkDataLoaded] = useState<boolean>(false);
  const [checkoutLinkDataError, setCheckoutLinkDataError] = useState<boolean>(false);

  const [products, setProducts] = useState<Product[]>([
    {
      title: "Support Subscription",
      description: "Support Ticket System and SLAs to guarantee response time and your project success.",
      image: "https://gw.alipayobjects.com/zos/rmsportal/JiqGstEfoWAOHiTxclqi.png",
      pricingType: "Monthly, per User",
      pricing: [
        { type: "User", amount: "$3.49 (user, month)" },
        { type: "> 10 Users", amount: "$2.49 (user, month)" },
        { type: "> 100 Users", amount: "$1.49 (user, month)" }
      ],
      activeSubscription: false,
      accessLink: "1PhH38DDlQgecLSfSukEgIeV",
      subscriptionId: "",
      checkoutLink: "",
      checkoutLinkDataLoaded: false,
      type: "org",
      quantity_entity: "orgUser",
    },
    {
      title: "Premium Media Subscription",
      description: "Access to all features.",
      image: "https://gw.alipayobjects.com/zos/rmsportal/JiqGstEfoWAOHiTxclqi.png",
      pricingType: "Monthly, per User",
      pricing: [
        { type: "Volume Price", amount: "$20/month" },
        { type: "Single Price", amount: "$25/month" }
      ],
      activeSubscription: false,
      accessLink: "1Pf65wDDlQgecLSf6OFlbsD5",
      checkoutLink: "",
      checkoutLinkDataLoaded: false,
      subscriptionId: "",
      type: "user",
      quantity_entity: "singleItem",
    }
  ]);

  const user = useSelector(getUser);
  const currentUser = useSelector(getCurrentUser);
  const userId = user.id;
  const orgID = user.currentOrgId;
  const domain = window.location.protocol + "//" + window.location.hostname + (window.location.port ? ':' + window.location.port : '');
  const admin = user.orgDev;

  const subscriptionCustomer: LowcoderCustomer = {
    hostname: domain,
    email: currentUser.email,
    orgId: orgID,
    userId: userId,
    userName: user.username,
    type: "org",
    companyName: "Example Company",
  };

  const createCustomer = async (subscriptionCustomer: LowcoderCustomer) => {
    const apiBody = {
      path: "webhook/secure/create-customer",
      data: subscriptionCustomer,
      method: "post",
      headers: lcHeaders
    };
    try {
      const result = await SubscriptionApi.secureRequest(apiBody);
      if (result) {
        setCustomer(result.data as StripeCustomer); 
      }
    } catch (error) {
      setCustomerDataError(true);
    }
  };

  const searchCustomer = async (subscriptionCustomer: LowcoderCustomer) => {
    const apiBody = {
      path: "webhook/secure/search-customer",
      data: subscriptionCustomer,
      method: "post",
      headers: lcHeaders
    };
    try {
      const result = await SubscriptionApi.secureRequest(apiBody);
      if (result) {
        if (result.data.data.length === 1) {
          setCustomer(result.data.data[0] as StripeCustomer);
        } else {
          if (result.data.data.length === 0) {
            createCustomer(subscriptionCustomer);
          } else {
            setCustomerDataError(true);
          }
        }
      }
    } catch (error) {
      setCustomerDataError(true);
    }
  };

  const searchSubscriptions = async (subscriptionCustomer: StripeCustomer) => {
    const apiBody = {
      path: "webhook/secure/search-subscriptions",
      data: { "customerId": subscriptionCustomer.id },
      method: "post",
      headers: lcHeaders
    };
    try {
      const result = await SubscriptionApi.secureRequest(apiBody);
      if (result) {
        const subscriptionItems = result.data.data.map((item: any) => ({
          id: item.id,
          object: item.object,
          plan: item.plan,
          quantity: item.quantity,
        }));
        setSubscriptions(subscriptionItems);
        setSubscriptionDataLoaded(true);
      }
    } catch (error) {
      setSubscriptionDataError(true);
    }
  };

  const createCheckoutLink = async (subscriptionCustomer: StripeCustomer, priceId: string, quantity: number, discount?: number) => {
    const apiBody = {
      path: "webhook/secure/create-checkout-link",
      data: { "customerId": subscriptionCustomer.id, "priceId": priceId, "quantity": quantity, "discount": discount, baseUrl: domain },
      method: "post",
      headers: lcHeaders
    };
    try {
      const result = await SubscriptionApi.secureRequest(apiBody);
      if (result) {
        return { id: result.data.id, url: result.data.url };
      }
    } catch (error) {
      setCheckoutLinkDataError(true);
      return null;
    }
  };

  const prepareCheckout = async () => {
    if (customer) {
      const updatedProducts = await Promise.all(products.map(async (product) => {
        // Check if the product has an active subscription
        const matchingSubscription = subscriptions.find(sub => sub.plan.id === ("price_" + product.accessLink));
  
        if (matchingSubscription) {
          // If there's a matching subscription, mark it as active
          return { 
            ...product, 
            activeSubscription: true, 
            checkoutLinkDataLoaded: true,
            subscriptionId: matchingSubscription.id.substring(4)
          };
        } else {
          // If no subscription, attempt to create a checkout link
          const checkoutLink = await createCheckoutLink(customer, product.accessLink, 1);
          return { 
            ...product, 
            activeSubscription: false, 
            checkoutLink: checkoutLink ? checkoutLink.url : "", 
            checkoutLinkDataLoaded: true // Mark the data as loaded even if the link creation failed
          };
        }
      }));
  
      setProducts(updatedProducts); // Update the products state with the new data
    }
  };
  
  

  useEffect(() => {
    // requesting the Customer search as soon as the component mounts
    searchCustomer(subscriptionCustomer);
  }, []);

  // request Subscriptions of a Customer when customer is set
  useEffect(() => {
    if (customer != null) {
      searchSubscriptions(customer);
    }
  }, [customer]);

  useEffect(() => {
    // Request Checkout Links for the products when the Subscription Data is loaded
    if (subscriptionDataLoaded) {
      prepareCheckout();
    }
  }, [subscriptionDataLoaded]);

  return (
    <Level1SettingPageContent>
      <Level1SettingPageTitle>
        {trans("settings.subscription")}
      </Level1SettingPageTitle>
      {customer != null ? (
        <SubscriptionSettingContent>
          {customer && <h3>Your Customer Number: {customer?.id.substring(4)}</h3>}
          <Flex wrap='wrap' gap="large">
            {products.map((product, index) => (
              <ProductCard
                key={index}
                title={product.title}
                description={product.description}
                image={product.image}
                pricingType={product.pricingType}
                pricing={product.pricing}
                activeSubscription={product.activeSubscription}
                checkoutLink={product.checkoutLink}
                checkoutLinkDataLoaded={product.checkoutLinkDataLoaded}
                subscriptionId={product.subscriptionId}
              />
            ))}
          </Flex>
        </SubscriptionSettingContent>
      ) : (
        <div>Loading...</div>
      )}
      {customerDataError && 
        <h3>There was an error retrieving your customer data.</h3>
      }
      {subscriptionDataError && 
        <h3>There was an error retrieving your subscription data.</h3>
      }
      {checkoutLinkDataError && 
        <h3>There was an error generating checkout links.</h3>
      }
    </Level1SettingPageContent>
  );
}
