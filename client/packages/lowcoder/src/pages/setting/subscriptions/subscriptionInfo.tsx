import { ArrowIcon } from "lowcoder-design";
import styled from "styled-components";
import { trans } from "i18n"; // Assuming this is how you get the user's language
import { useParams } from "react-router-dom";
import { HeaderBack } from "../permission/styledComponents";
import history from "util/history";
import { SUBSCRIPTION_SETTING } from "constants/routesURL";
import { getProduct } from '@lowcoder-ee/api/subscriptionApi';
import { useState, useEffect } from 'react';
import { Card, Tag, List } from 'antd';
import { CheckCircleOutlined } from '@ant-design/icons';
import { Level1SettingPageContent } from "../styled";
import { TacoMarkDown } from "lowcoder-design";
import ProductDescriptions, {Translations} from "./ProductDescriptions";
import { SubscriptionProductsEnum } from "@lowcoder-ee/constants/subscriptionConstants";
import { useSubscriptionContext } from "@lowcoder-ee/util/context/SubscriptionContext";

const { Meta } = Card;

const Wrapper = styled.div`
  padding: 32px 24px;
`;

const ContentWrapper = styled.div`
  display: flex;
  gap: 24px;
`;

const FullWidthCard = styled(Card)`
  flex-grow: 1;
  width: 65%;
`;

// Hook for loading product details
const useProduct = (productId: string) => {
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { subscriptionProducts } = useSubscriptionContext();

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

    const product = subscriptionProducts.find(p => p.id === `prod_${productId}`);
    if (Boolean(product)) {
      setLoading(false);
      setProduct(product);
    }
    else if (productId && !Boolean(product)) {
      fetchProduct();
    }
  }, [productId, subscriptionProducts]);

  return { product, loading, error };
};

// Hook for loading markdown content
const useMarkdown = (productId: string | null, userLanguage: string) => {
  const [markdownContent, setMarkdownContent] = useState<string>("");

  useEffect(() => {
    if (productId && userLanguage) {

      let descriptionContent : Translations | false;

      switch (productId) {
        case SubscriptionProductsEnum.SUPPORT: 
          descriptionContent = ProductDescriptions["SupportProduct"];
          break;
        case SubscriptionProductsEnum.MEDIAPACKAGE: 
          descriptionContent = ProductDescriptions["MediaPackageProduct"];
          break;
        default:
          descriptionContent = false;
          break;
      }

      if (descriptionContent) {
        setMarkdownContent(descriptionContent[userLanguage] || descriptionContent.en);
      } else {
        setMarkdownContent("");
      }
    }
  }, [productId, userLanguage]);

  return markdownContent;
};

export function SubscriptionInfo() {
  const { productId } = useParams<{ productId: string }>();
  const userLanguage = localStorage.getItem('lowcoder_uiLanguage');
  const { product, loading, error } = useProduct(productId);
  const markdownContent = useMarkdown(productId || null, userLanguage || "en");

  if (loading) {
    return <div style={{margin: "40px"}}>Loading...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  return (
    <Wrapper>
      <HeaderBack>
        <span onClick={() => history.push(SUBSCRIPTION_SETTING)}> {trans("settings.subscription")} </span>
        <ArrowIcon />
        <span>{product.name}</span>
      </HeaderBack>
      <Level1SettingPageContent>
        <ContentWrapper>
          <Card
            hoverable
            style={{ minWidth: "350px", width: "35%" }}
            cover={
              <img loading="lazy" alt={product.name} src={product.images[0]} style={{width: '100%', height: 'auto', background: '#f2f2f2'}} />
            }
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
              <List
                size="small"
                header={<h3>What you get:</h3>}
                bordered
                dataSource={product.marketing_features}
                renderItem={(item: { name: string }) => <List.Item>{item.name}</List.Item>}
                style={{ marginTop: 16 }}
              />
            </div>
          </Card>

          <FullWidthCard title="Product Documentation">
            <TacoMarkDown>{markdownContent}</TacoMarkDown>
          </FullWidthCard>
        </ContentWrapper>
      </Level1SettingPageContent>
    </Wrapper>
  );
}

export default SubscriptionInfo;
