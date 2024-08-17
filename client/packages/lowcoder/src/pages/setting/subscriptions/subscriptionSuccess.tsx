import { useParams } from "react-router-dom";
import styled from "styled-components";
import { GreyTextColor } from "constants/style";
import { trans } from "i18n";
import { Level1SettingPageContent, Level1SettingPageTitle } from "../styled";
import { Flex } from 'antd';
import { ProductCard } from "./productCard";

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

export function SubscriptionSuccess() {
  const { subscriptionId } = useParams<{ subscriptionId: string }>();
  
  return (
    <Level1SettingPageContent>
      <Level1SettingPageTitle>
        {trans("settings.subscription")}  | SUCCESS
      </Level1SettingPageTitle>
      
    </Level1SettingPageContent>
  );
}
