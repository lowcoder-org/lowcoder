import styled from "styled-components";
import { GreyTextColor } from "constants/style";
import { trans } from "i18n";
import { Level1SettingPageContent, Level1SettingPageTitle } from "../styled";
import { Flex, Card, Button, message } from 'antd';
import { ProductCard } from "./productCard";
import { getCustomerPortalSession }  from '@lowcoder-ee/api/subscriptionApi';
import { useSubscriptionContext } from "@lowcoder-ee/util/context/SubscriptionContext";

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

const CardWrapper = styled(Card)`
  width: 100%;
  margin-bottom: 24px;
`;

const ManageSubscriptionButton = styled(Button)`
  margin-top: 24px;
`;

export function SubscriptionSetting() {
  const {
    admin,
    customer,
    products,
    subscriptionProducts,
    isCreatingCustomer,
    customerDataError,
    subscriptionDataError,
    checkoutLinkDataError,
    subscriptionProductsLoading,
  } = useSubscriptionContext();

  const customerId = customer?.id; // Get the customer ID from subscription details

  // Handle Customer Portal Session Redirect
  const handleCustomerPortalRedirect = async () => {
    try {
      if (!customerId) {
        message.error("Customer ID not available for the subscription.");
        return;
      }

      // Get the Customer Portal session URL
      const portalSession = await getCustomerPortalSession(customerId);
      if (portalSession && portalSession.url) {
        // Redirect to the Stripe Customer Portal
        window.open(portalSession.url, '_blank', 'noopener,noreferrer');
      } else {
        message.error("Failed to generate customer portal session link.");
      }
    } catch (error) {
      console.error("Error redirecting to customer portal:", error);
      message.error("An error occurred while redirecting to the customer portal.");
    }
  };

  return (
    <Level1SettingPageContent>
      <Level1SettingPageTitle>
        {trans("settings.subscription")}
      </Level1SettingPageTitle>
      {customer != null ? (
        <SubscriptionSettingContent>
          {customer && <h3>Your Customer Number: {customer?.id.substring(4)} {admin && "| you are Subscriptions-Admin of this Workspace"}</h3>}
          <Flex wrap='wrap' gap="large" style={{marginTop: "40px", width : "100%"}}>
            {products
            .filter((product) => {
              if (product.type === "org") { 
                return admin === "admin";
              }
              return true;
            })
            .map((product, index) => {
              const productData = subscriptionProducts?.find((p: { id: string; }) => p.id === ("prod_" + product?.product));
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
                  loading={subscriptionProductsLoading}
                  subscriptionId={product.subscriptionId}
                  productId={product.product}
                />
              );
            } )}
          </Flex>
          {/* Manage Subscription Button */}
          <CardWrapper title={trans("subscription.manageSubscription")}>
            <ManageSubscriptionButton type="primary" onClick={handleCustomerPortalRedirect}>
              {trans("subscription.manageSubscription")}
            </ManageSubscriptionButton>
          </CardWrapper>
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
