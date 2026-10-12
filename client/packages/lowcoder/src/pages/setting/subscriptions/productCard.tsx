import React from 'react';
import styled from 'styled-components';
import { GreyTextColor } from 'constants/style';
import { Card, Button } from 'antd';
import { RobotOutlined, SettingOutlined, CheckCircleOutlined, LoadingOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { buildSubscriptionSettingsLink, buildSubscriptionInfoLink } from "constants/routesURL";
import history from "util/history";
import { SubscriptionProductsEnum } from "constants/subscriptionConstants";
import { trans } from "i18n";

const ProductCardContainer = styled(Card)`
  width: 100%;
  min-width: 0;
  display: flex;
  flex-direction: column;
  .ant-card-body { flex: 1; }
  .ant-card-cover img, .product-placeholder {
    width: 100%;
    aspect-ratio: 1;
    object-fit: cover;
    background: #f2f2f2;
  }
  .product-placeholder { display: grid; place-items: center; }
  .ant-card-actions {
    display: flex;
    flex-wrap: wrap;
    > li { flex: 1 1 125px; }
    .ant-btn { height: auto; min-height: 32px; white-space: normal; }
    .ant-btn > span { min-width: 0; overflow-wrap: anywhere; }
  }
`;

const ProductTitle = styled.h3`
  font-size: 18px;
  font-weight: bold;
  margin-bottom: 10px;
`;

const ProductDescription = styled.p`
  font-size: 14px;
  color: ${GreyTextColor};
  margin-bottom: 15px;
`;

const PricingTypeDescription = styled.p`
  font-size: 14px;
  margin-bottom: 15px;
`;

interface Pricing {
  type: string;
  amount: string;
}

interface ProductCardProps {
  title: string;
  description: string;
  image?: string | null;
  pricingType: string;
  activeSubscription: boolean;
  checkoutLink: string;
  checkoutLinkDataLoaded?: boolean;
  loading?: boolean;
  subscriptionId: string;
  productId: string;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  title,
  description,
  image,
  pricingType,
  activeSubscription,
  checkoutLink,
  checkoutLinkDataLoaded,
  loading,
  subscriptionId,
  productId,
}) => {

  const isAI = productId === SubscriptionProductsEnum.AIROBOT;
  const isSupport = productId === SubscriptionProductsEnum.SUPPORT;
  const storyDescription = isAI
    ? trans("automator.subscription.cardDescription")
    : isSupport ? trans("automator.subscription.supportCardDescription") : description;

  const goToCheckout = () => {
    if (checkoutLink) {
      window.open(checkoutLink, '_blank');
    }
  };

  const goToSubscriptionSettings = () => {
    history.push(buildSubscriptionSettingsLink(subscriptionId, productId));
  };

  const goToSubscriptionInformation = () => {
    history.push(buildSubscriptionInfoLink(productId));
  };

  return (
    <ProductCardContainer
      hoverable
      loading={loading}
      cover={
        image ? <img loading="lazy" alt={title} src={image} /> : <div className="product-placeholder"><RobotOutlined style={{ fontSize: 96, color: "#ff6f3c" }} /></div>
      }
      actions={[
        <Button type="default" block onClick={goToSubscriptionInformation} style={{width:"90%"}} icon={<InfoCircleOutlined />}>{trans("automator.subscription.explore")}</Button>,
        activeSubscription ? (
          <Button type="default" block onClick={goToSubscriptionSettings} style={{width:"90%"}} icon={<SettingOutlined />}>{trans("automator.subscription.manage")}</Button>
        ) : (
        !activeSubscription && (
          checkoutLinkDataLoaded && checkoutLink ? (
            <Button type="primary" block onClick={goToCheckout} style={{width:"90%", backgroundColor: "#ff6f3c"}}>
              {trans("iconScout.buySubscriptionButton")}
            </Button>
          ) : (
            <LoadingOutlined key="wait" />
          )
        ))
      ]}
    >
      <ProductTitle>{title}</ProductTitle>
      <ProductDescription>{storyDescription}</ProductDescription>
      <PricingTypeDescription>{isAI || isSupport ? trans("automator.subscription.seatPricing") : pricingType} {activeSubscription && <><span> {trans("automator.subscription.subscribed")} </span><CheckCircleOutlined key="check" style={{ color: 'green' }} /></>}</PricingTypeDescription>
    </ProductCardContainer>
  );
};
