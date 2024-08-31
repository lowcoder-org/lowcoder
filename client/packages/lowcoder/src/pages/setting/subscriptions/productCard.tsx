import React from 'react';
import styled from 'styled-components';
import { GreyTextColor } from 'constants/style';
import { Card, Button } from 'antd';
import { SettingOutlined, CheckCircleOutlined, PlusSquareOutlined, LoadingOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { buildSubscriptionSettingsLink, buildSubscriptionInfoLink } from "constants/routesURL";
import history from "util/history";

const ProductCardContainer = styled(Card)`
  width: 300px;
  margin-bottom: 20px;
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
  image: string;
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
      loading={!checkoutLinkDataLoaded || loading}
      cover={<img alt={title} src={image} />}
      actions={[
        <Button type="default" block onClick={goToSubscriptionInformation} style={{width:"90%"}} icon={<InfoCircleOutlined />}>Info</Button>,
        activeSubscription ? (
          <Button type="default" block onClick={goToSubscriptionSettings} style={{width:"90%"}} icon={<SettingOutlined />}>More</Button>
        ) : (
        !activeSubscription && (
          checkoutLinkDataLoaded ? (
            <Button type="primary" block onClick={goToCheckout} style={{width:"90%", backgroundColor: "green"}}>
              Subscribe Now
            </Button>
          ) : (
            <LoadingOutlined key="wait" />
          )
        ))
      ]}
    >
      <ProductTitle>{title}</ProductTitle>
      <ProductDescription>{description}</ProductDescription>
      <PricingTypeDescription>{pricingType} {activeSubscription && <><span> | Subscribed: </span><CheckCircleOutlined key="check" style={{ color: 'green' }} /></>}</PricingTypeDescription>
    </ProductCardContainer>
  );
};
