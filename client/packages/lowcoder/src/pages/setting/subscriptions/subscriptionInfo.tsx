import { ArrowIcon } from "lowcoder-design";
import styled from "styled-components";
import { trans } from "i18n";
import { useParams } from "react-router-dom";
import { HeaderBack } from "../permission/styledComponents";
import history from "util/history";
import { SUBSCRIPTION_SETTING } from "constants/routesURL";
import { getProduct }  from '@lowcoder-ee/api/subscriptionApi';
import { useState, useEffect } from 'react';
import { Card, Tag, List, Button } from 'antd';
import { CheckCircleOutlined } from '@ant-design/icons';
import { Level1SettingPageContent, Level1SettingPageTitle } from "../styled";

const { Meta } = Card;

const Wrapper = styled.div`
  padding: 32px 24px;
`;

export function SubscriptionInfo() {

  const { productId } = useParams<{ productId: string }>();
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const productData = await getProduct(productId);
        setProduct(productData);
      } catch (err) {
        setError("Failed to fetch product.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (productId) {
      fetchProduct();
    }
  }, [productId]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  const pricingTable = productId == "QW8L3WPMiNjQjI" && [
    { type: "Admin & Editor", amount: "€2.90 per user, per month" },
    { type: "> 10 Users", amount: "€1.90 per user, per month" },
    { type: "> 100 Users", amount: "€0.90 per user, per month" },
    { type: "> 500 Users", amount: "€0.49 per user, per month" },
    { type: "> 1.000 Users", amount: "€0.29 per user, per month" },
    { type: "> 10.000 Users", amount: "€0.19 per user, per month" },
  ] || productId == "QW8MpIBHxieKXd" && [
    { type: "User", amount: "$29.00 per month" }
  ] || [];

  return (
    <Wrapper>
      <HeaderBack>
        <span onClick={() => history.push(SUBSCRIPTION_SETTING)}> {trans("settings.subscription")} </span>
        <ArrowIcon />
        <span>{product.name}</span>
      </HeaderBack>
      <Level1SettingPageContent>
        <Card
          hoverable
          style={{ width: 400 }}
          cover={<img alt={product.name} src={product.images[0]} />}
          actions={[]}
        >
          <Meta
            title={product.name}
            description={product.description}
          />
          <div style={{ marginTop: 16 }}>
            <Tag icon={<CheckCircleOutlined />} color="green">
              {product.type.toUpperCase()}
            </Tag>
            {product.active && (
              <Tag icon={<CheckCircleOutlined />} color="blue">
                Active
              </Tag>
            )}
            <List
              size="small"
              header={<h3>What you get:</h3>}
              bordered
              dataSource={product.marketing_features}
              renderItem={(item: { name: string }) => <List.Item>{item.name}</List.Item>}
              style={{ marginTop: 16 }}
            />
            <List
              size="small"
              header={<h3>Pricing:</h3>}
              bordered
              dataSource={pricingTable}
              renderItem={(item: { type: string, amount: string }) => (
                <List.Item>
                  <strong>{item.type}:</strong> {item.amount}
                </List.Item>
              )}
              style={{ marginTop: 16 }}
            />
          </div>
        </Card>
      </Level1SettingPageContent>
    </Wrapper>
  );
}

export default SubscriptionInfo;
