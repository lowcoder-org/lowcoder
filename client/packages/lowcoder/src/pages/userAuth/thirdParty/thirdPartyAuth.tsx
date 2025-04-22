import {
  OAuthLocationState,
  ThirdPartyAuthGoal,
  ThirdPartyConfigType,
} from "constants/authConstants";
import { WhiteLoading } from "lowcoder-design";
import history from "util/history";
import { LoginLogoStyle, LoginLabelStyle, StyledLoginButton, TermsAndPrivacyInfo } from "pages/userAuth/authComponents";
import { useSelector } from "react-redux";
import { getSystemConfigFetching, selectSystemConfig } from "redux/selectors/configSelectors";
import React, { useMemo, useState } from "react";
import { messageInstance } from "lowcoder-design/src/components/GlobalInstances";
import styled from "styled-components";
import { trans } from "i18n";
import { geneAuthStateAndSaveParam, getAuthUrl, getRedirectUrl } from "pages/userAuth/authUtils";
import { default as Divider } from "antd/es/divider";
import { default as Typography } from "antd/es/typography";
import { useRedirectUrl } from "util/hooks";
import { MultiIconDisplay } from "../../../comps/comps/multiIconDisplay";
import Spin from "antd/es/spin";
import { LoadingOutlined } from "@ant-design/icons";
import { getServerSettings } from "@lowcoder-ee/redux/selectors/applicationSelector";

const { Text } = Typography;

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
  disabled?: boolean;
}) {
  const { config, label } = props;
  const loginRedirectUrl = useRedirectUrl();
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
    <StyledLoginButton buttonType="normal" onClick={onLoginClick} disabled={props.disabled}>
      {config.icon && <MultiIconDisplay identifier={config.icon} width="20px" height="20px" style={{ marginRight: "20px", flexShrink: 0, color: "#000" }} />}
      {!config.icon && <LoginLogoStyle alt={config.name} src={config.logo} title={config.name} />}
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
  const systemConfigFetching = useSelector(getSystemConfigFetching);
  const systemConfig = useSelector(selectSystemConfig);
  const serverSettings = useSelector(getServerSettings);
  const isFormLoginEnabled = systemConfig?.form.enableLogin;
  const [disableButtons, setDisableButtons] = useState(false);

  const isEmailLoginEnabled = useMemo(() => {
    return isFormLoginEnabled && serverSettings.LOWCODER_EMAIL_AUTH_ENABLED === 'true';
  }, [isFormLoginEnabled, serverSettings]);

  const isEmailSignupEnabled = useMemo(() => {
    return serverSettings.LOWCODER_EMAIL_SIGNUP_ENABLED === 'true';
  }, [serverSettings]);
  
  if (systemConfigFetching) {
    return <Spin indicator={<LoadingOutlined style={{ fontSize: 15, marginTop: '16px' }} spin />} />;
  }

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
        disabled={disableButtons}
      />
    );
  });
  return (
    <ThirdPartyLoginButtonWrapper>
      { (
        (isEmailLoginEnabled && props.authGoal === 'login')
        || (isEmailLoginEnabled && isEmailSignupEnabled && props.authGoal === 'register')
      ) && Boolean(socialLoginButtons.length) && (
        <Divider plain>
          <Text type="secondary">or</Text>
        </Divider>
      )}
      {socialLoginButtons}
      {!isFormLoginEnabled && (
        <TermsAndPrivacyInfo onCheckChange={(e) => setDisableButtons(!e.target.checked)} />
      )}
    </ThirdPartyLoginButtonWrapper>
  );
}
