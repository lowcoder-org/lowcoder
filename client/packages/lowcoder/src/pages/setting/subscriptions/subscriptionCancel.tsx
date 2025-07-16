import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import styled from "styled-components";
import { GreyTextColor } from "constants/style";
import { trans } from "i18n";
import { HeaderBack } from "../permission/styledComponents";
import history from "util/history";
import { SUBSCRIPTION_SETTING } from "constants/routesURL";


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


// Helper function to get query params
const useQuery = () => {
  return new URLSearchParams(useLocation().search);
};

export function SubscriptionCancel() {
  const query = useQuery();
  const session_id = query.get("session_id");

  useEffect(() => {
    history.replace(SUBSCRIPTION_SETTING);
  }, []);
  
  return (
    <Wrapper>
      <HeaderBack>
        <span onClick={() => history.push(SUBSCRIPTION_SETTING)}>
          {trans("settings.subscription")}
        </span>
      </HeaderBack>
      <div>
        <h1>Canceled</h1>
      </div>
    </Wrapper>
  );
}

export default SubscriptionCancel;
