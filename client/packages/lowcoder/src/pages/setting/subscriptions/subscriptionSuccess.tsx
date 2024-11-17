import { useLocation } from "react-router-dom";
import styled from "styled-components";
import { GreyTextColor } from "constants/style";
import { trans } from "i18n";
import { HeaderBack } from "../permission/styledComponents";
import history from "util/history";
import { SUBSCRIPTION_SETTING } from "constants/routesURL";
import { Flex, Typography, Card } from 'antd';
import { ArrowIcon } from "lowcoder-design";

const { Title, Paragraph } = Typography;

const SubscriptionSuccessContent = styled.div`
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

const Wrapper = styled.div`
  padding: 32px 24px;
`;

const SuccessCard = styled(Card)`
  max-width: 100%;
  margin-top: 40px;
  text-align: left;
`;

const ImageWrapper = styled.div`
  margin: 40px 0;
  img {
    width: 100%;
    height: auto;
  }
`;

// Helper function to get query params
const useQuery = () => {
  return new URLSearchParams(useLocation().search);
};

export function SubscriptionSuccess() {
  const query = useQuery();
  const session_id = query.get("session_id");
  
  return (
    <Wrapper>
      <HeaderBack>
        <span onClick={() => history.push(SUBSCRIPTION_SETTING)}>
          {trans("settings.subscription")}
        </span>
        <ArrowIcon />
        <span>{trans("subscription.success")}</span>
      </HeaderBack>
      {/* Success Content */}
      <SuccessCard bordered>
        <SubscriptionSuccessContent>
          <Title level={2}>{trans("subscription.successTitle")}</Title>
          <Paragraph style={{whiteSpace: 'pre-line'}}>{trans("subscription.successThankYou")}</Paragraph>
          
          {/* Success Image */}
          <ImageWrapper>
            <img loading="lazy" src="https://raw.githubusercontent.com/lowcoder-org/lowcoder-media-assets/refs/heads/main/images/Lowcoder%20Team.jpg" alt={trans("subscription.successImageAlt")} />
          </ImageWrapper>

          <Paragraph>{trans("subscription.successLowcoderTeam")}</Paragraph>
        </SubscriptionSuccessContent>
      </SuccessCard>
    </Wrapper>
  );
}

export default SubscriptionSuccess;
