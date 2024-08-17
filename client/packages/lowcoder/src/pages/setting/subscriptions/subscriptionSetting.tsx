import styled from "styled-components";
import { GreyTextColor } from "constants/style";
import { trans } from "i18n";
import { Level1SettingPageContent, Level1SettingPageTitle } from "../styled";
import { Flex } from 'antd';
import { ProductCard } from "./productCard";
import { InitializeSubscription } from "@lowcoder-ee/api/subscriptionApi";

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

export function SubscriptionSetting() {
  const {
    customer,
    isCreatingCustomer,
    customerDataError,
    products,
    subscriptionDataError,
    checkoutLinkDataError,
  } = InitializeSubscription();

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
      {isCreatingCustomer && <div><br/>Creating your customer account, please wait...</div>}
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
