import styled from "styled-components";
import { GreyTextColor } from "constants/style";
import { trans } from "i18n";
import { Level1SettingPageContent, Level1SettingPageTitle } from "../styled";
import { Flex } from 'antd';
import { ProductCard } from "./productCard";
import { InitializeSubscription } from "@lowcoder-ee/api/subscriptionApi";
import { getProducts }  from '@lowcoder-ee/api/subscriptionApi';
import { useState, useEffect } from 'react';

const SubscriptionSettingContent = styled.div`

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


export function SubscriptionSetting() {
  const {
    customer,
    isCreatingCustomer,
    customerDataError,
    products,
    subscriptionDataError,
    checkoutLinkDataError,
    admin,
  } = InitializeSubscription();

  const [subscriptionProducts, setSubscriptionProducts] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const productData = await getProducts();
        setSubscriptionProducts(productData);
        console.log("productData", productData);
      } catch (err) {
        setError("Failed to fetch product.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  return (
    <Level1SettingPageContent>
      <Level1SettingPageTitle>
        {trans("settings.subscription")}
      </Level1SettingPageTitle>
      {customer != null ? (
        <SubscriptionSettingContent>
          {customer && <h3>Your Customer Number: {customer?.id.substring(4)} {admin && "| you are Subscriptions-Admin of this Workspace"}</h3>}
          <Flex wrap='wrap' gap="large" style={{marginTop: "40px"}}>
            {products
            .filter((product) => {
              if (product.type === "org") { 
                return admin === "admin";
              }
              return true;
            })
            .map((product, index) => {
              const productData = subscriptionProducts?.data.find((p: { id: string; }) => p.id === ("prod_" + product?.product));
              const imageUrl = productData && productData.images.length > 0 ? productData.images[0] : null;
              return (
                <ProductCard
                  key={index}
                  title={productData?.name}
                  description={productData?.description}
                  image={imageUrl}
                  pricingType={product.pricingType}
                  activeSubscription={product.activeSubscription}
                  checkoutLink={product.checkoutLink}
                  checkoutLinkDataLoaded={product.checkoutLinkDataLoaded}
                  loading={loading}
                  subscriptionId={product.subscriptionId}
                  productId={product.product}
                />
              );
            } )}
          </Flex>
        </SubscriptionSettingContent>
      ) : (
        <div>Loading...</div>
      )}
      {isCreatingCustomer && <div><br/>Checking your customer account, please wait...</div>}
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
