// productCard.tsx
import React from 'react';
import styled from 'styled-components';
import { GreyTextColor } from 'constants/style';
import { Card } from 'antd';
import { SettingOutlined, CheckCircleOutlined, PlusSquareOutlined } from '@ant-design/icons';
import { buildSubscriptionId } from "constants/routesURL";
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

const PricingTable = styled.div`
  font-size: 14px;
  color: ${GreyTextColor};
  margin-top: 10px;
`;

const PriceItem = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
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
  pricing: Pricing[];
  activeSubscription: boolean;
  accessLink: string;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  title,
  description,
  image,
  pricingType,
  pricing,
  activeSubscription,
  accessLink
}) => {

  const handleClick = () => {
    history.push(buildSubscriptionId(accessLink));
  };

  return (
    <ProductCardContainer
      hoverable
      cover={<img alt={title} src={image} />}
      actions={[
        <SettingOutlined key="setting" onClick={handleClick} />,
        activeSubscription ? (
          <CheckCircleOutlined key="check" style={{ color: 'green' }} />
        ) : (
          <PlusSquareOutlined key="add" style={{ color: 'blue' }} />
        )
      ]}
    >
      <ProductTitle>{title}</ProductTitle>
      <ProductDescription>{description}</ProductDescription>
      <PricingTypeDescription>{pricingType}</PricingTypeDescription>
      <PricingTable>
        {pricing.map((price, index) => (
          <PriceItem key={index}>
            <span>{price.type}</span>
            <span>{price.amount}</span>
          </PriceItem>
        ))}
      </PricingTable>
    </ProductCardContainer>
  );
};
