import {
  AuthSearchParams,
  OAuthLocationState,
  ThirdPartyAuthGoal,
  ThirdPartyConfigType,
} from "constants/authConstants";
import { CommonGrayLabel, WhiteLoading } from "lowcoder-design";
import { useLocation } from "react-router-dom";
import history from "util/history";
import { LoginLogoStyle, LoginLabelStyle, StyledLoginButton } from "pages/userAuth/authComponents";
import { useSelector } from "react-redux";
import { selectSystemConfig } from "redux/selectors/configSelectors";
import React from "react";
import { messageInstance } from "lowcoder-design";
import styled from "styled-components";
import { trans } from "i18n";
import { geneAuthStateAndSaveParam, getAuthUrl, getRedirectUrl } from "pages/userAuth/authUtils";
import { Divider } from "antd";

const ThirdPartyLoginButtonWrapper = styled.div`
  button{
    width: 100%;

    &:not(:last-child) {
      margin-bottom: 16px;
    }
  }
`;

function ThirdPartyLoginButton(props: {
  config: ThirdPartyConfigType;
  invitationId?: string;
  invitedOrganizationId?: string;
  autoJump?: boolean;
  authGoal: ThirdPartyAuthGoal;
  label: string;
}) {
  const { config, label } = props;
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const loginRedirectUrl = queryParams.get(AuthSearchParams.redirectUrl);
  const redirectUrl = getRedirectUrl(config.authType);
  const onLoginClick = () => {
    const state = geneAuthStateAndSaveParam(
      props.authGoal,
      config,
      loginRedirectUrl,
      props.invitationId,
      props.invitedOrganizationId,
    );
    if (config.authType === "LDAP") {
      history.push({
        pathname: config.url,
        search: loginRedirectUrl ? `?redirectUrl=${loginRedirectUrl}` : "",
        state: {
          autoJump: props.autoJump,
        },
      });
    } else if (config.routeLink) {
      if (!config?.clientId) {
        messageInstance.error(trans("userAuth.invalidThirdPartyParam"));
        return;
      }
      const routeState: OAuthLocationState = {
        sourceType: config.sourceType,
        appId: config.clientId,
        redirectUri: redirectUrl,
        state: state,
        agentId: config.agentId,
        authGoal: props.authGoal,
        autoJump: props.autoJump,
      };
      history.push({
        pathname: config.url,
        state: routeState,
      });
    } else {
      window.location.href = getAuthUrl(config, redirectUrl, state);
    }
  };

  if (props.autoJump) {
    onLoginClick();
    return <WhiteLoading size={18} />;
  }

  const buttonLabel = props.authGoal === 'register'
    ? `Sign up with ${label}`
    : `Sign in with ${label}`;

  return (
    <StyledLoginButton buttonType="normal" onClick={onLoginClick}>
      <LoginLogoStyle alt={config.name} src={config.logo} title={config.name} />
      <LoginLabelStyle className="auth-label">
        { buttonLabel }
      </LoginLabelStyle>
    </StyledLoginButton>
  );
}

export function ThirdPartyAuth(props: {
  invitationId?: string;
  invitedOrganizationId?: string;
  autoJumpSource?: string;
  authGoal: ThirdPartyAuthGoal;
  labelFormatter?: (name: string) => string;
}) {
  const systemConfig = useSelector(selectSystemConfig);
  if (!systemConfig) {
    return null;
  }
  const configs = systemConfig.authConfigs;
  // auto redirect when only one login method
  const socialLoginButtons = configs.map((config) => {
    if (props.autoJumpSource && config.sourceType !== props.autoJumpSource) {
      return null;
    }
    return (
      <ThirdPartyLoginButton
        authGoal={props.authGoal}
        autoJump={config.sourceType === props.autoJumpSource}
        key={config.name}
        config={config}
        invitationId={props.invitationId}
        invitedOrganizationId={props.invitedOrganizationId}
        label={props.labelFormatter ? props.labelFormatter(config.name) : config.name}
      />
    );
  });
  return (
    <ThirdPartyLoginButtonWrapper>
      { Boolean(socialLoginButtons.length) && <Divider /> }
      {socialLoginButtons}
    </ThirdPartyLoginButtonWrapper>
  );
}
