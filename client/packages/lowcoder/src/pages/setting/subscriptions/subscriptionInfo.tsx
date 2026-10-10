import { ArrowIcon } from "lowcoder-design";
import styled from "styled-components";
import { trans } from "i18n"; // Assuming this is how you get the user's language
import { useParams } from "react-router-dom";
import { HeaderBack } from "../permission/styledComponents";
import history from "util/history";
import { SUBSCRIPTION_SETTING, buildSubscriptionSettingsLink } from "constants/routesURL";
import { getProduct } from '@lowcoder-ee/api/subscriptionApi';
import { useState, useEffect } from 'react';
import { Card, Tag, List, Button } from 'antd';
import { CheckCircleOutlined } from '@ant-design/icons';
import { Level1SettingPageContent } from "../styled";
import { TacoMarkDown } from "lowcoder-design";
import ProductDescriptions, {Translations} from "./ProductDescriptions";
import { SubscriptionProductsEnum } from "@lowcoder-ee/constants/subscriptionConstants";
import { useSubscriptionContext } from "@lowcoder-ee/util/context/SubscriptionContext";

import { SubscriptionStory } from "./SubscriptionStory";

const { Meta } = Card;

const Wrapper = styled.div`
  padding: 24px;
  max-width: 1400px;
  margin: 0 auto;
  @media (max-width: 600px) { padding: 16px; }
`;

const ContentWrapper = styled.div`
  display: flex;
  gap: 24px;
  align-items: flex-start;
  @media (max-width: 900px) { flex-direction: column; > * { width: 100% !important; min-width: 0 !important; } }
`;

const FullWidthCard = styled(Card)`
  flex-grow: 1;
  width: 65%;
  min-width: 0;
  img { max-width: 100%; height: auto; border-radius: 10px; }
`;

// Hook for loading product details
const useProduct = (productId: string) => {
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { subscriptionProducts } = useSubscriptionContext();

  useEffect(() => {
    let cancelled = false;
    setError(null);
    setLoading(true);
    const cached = subscriptionProducts.find(p => p.id === `prod_${productId}`);
    if (cached) {
      setProduct(cached);
      setLoading(false);
    } else {
      getProduct(productId).then(data => {
        if (!cancelled) setProduct(data);
      }).catch(() => {
        if (!cancelled) setError("Product details could not be loaded. Please return to Subscriptions and try again.");
      }).finally(() => { if (!cancelled) setLoading(false); });
    }
    return () => { cancelled = true; };
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
        case SubscriptionProductsEnum.AIROBOT:
          descriptionContent = ProductDescriptions["AIRobotProduct"];
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
  const { products, admin, subscriptionDataError } = useSubscriptionContext();
  const offering = products.find(item => item.product === productId);
  const isAI = productId === SubscriptionProductsEnum.AIROBOT;
  const hasStory = isAI || productId === SubscriptionProductsEnum.SUPPORT;
  const action = offering?.activeSubscription
    ? <Button size="large" onClick={() => history.push(buildSubscriptionSettingsLink(offering.subscriptionId, productId))}>Manage subscription</Button>
    : admin !== "admin"
      ? <span>Ask your workspace admin to activate {isAI ? "AI Robot" : "Support"}.</span>
      : <Button type="primary" size="large" href={offering?.checkoutLink || undefined}
          target="_blank" rel="noopener noreferrer" disabled={!offering?.checkoutLink || Boolean(subscriptionDataError)}>
          {isAI ? "Start building with AI Robot" : "Give your team Lowcoder Support"}
        </Button>;

  if (loading && !hasStory) {
    return <div style={{margin: "40px"}}>Loading...</div>;
  }

  if ((error || !product) && !hasStory) {
    return <Wrapper><p>{error || "Product unavailable."}</p><Button onClick={() => history.push(SUBSCRIPTION_SETTING)}>Back to subscriptions</Button></Wrapper>;
  }

  return (
    <Wrapper>
      <HeaderBack>
        <span onClick={() => history.push(SUBSCRIPTION_SETTING)}> {trans("settings.subscription")} </span>
        <ArrowIcon />
        <span>{product?.name || (isAI ? "AI Robot" : "Lowcoder Support & SLA")}</span>
      </HeaderBack>
      {hasStory && <SubscriptionStory ai={isAI} action={<>{action}
        {admin === "admin" && !offering?.activeSubscription && !offering?.checkoutLink && <p>Checkout is not ready yet. <a href={SUBSCRIPTION_SETTING}>Check subscription settings</a>.</p>}
      </>} />}
      <Level1SettingPageContent>
        <ContentWrapper>
          {!hasStory && <Card
            hoverable
            style={{ minWidth: "350px", width: "35%" }}
            cover={product.images?.[0] ?
              <img loading="lazy" alt={product.name} src={product.images[0]} style={{width: '100%', height: 'auto', background: '#f2f2f2'}} /> : undefined
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
          </Card>}

          <FullWidthCard style={hasStory ? { width: "100%" } : undefined} title={hasStory ? "What’s included, setup and pricing" : "Product Documentation"}>
            <TacoMarkDown>{markdownContent}</TacoMarkDown>
          </FullWidthCard>
        </ContentWrapper>
      </Level1SettingPageContent>
    </Wrapper>
  );
}

export default SubscriptionInfo;
