import React, { useContext, useState, useMemo, useEffect } from "react";
import {
  AuthContainer,
  ConfirmButton,
  FormWrapperMobile,
  LoginCardTitle,
  StyledRouteLinkLogin,
  TermsAndPrivacyInfo,
} from "pages/userAuth/authComponents";
import { FormInput, messageInstance, PasswordInput } from "lowcoder-design";
import { AUTH_LOGIN_URL, ORG_AUTH_LOGIN_URL } from "constants/routesURL";
import UserApi from "api/userApi";
import { useRedirectUrl } from "util/hooks";
import { checkEmailValid } from "util/stringUtils";
import styled from "styled-components";
import { requiresUnAuth } from "./authHOC";
import { useLocation } from "react-router-dom";
import { UserConnectionSource } from "@lowcoder-ee/constants/userConstants";
import { trans } from "i18n";
import { AuthContext, checkPassWithMsg, useAuthSubmit } from "pages/userAuth/authUtils";
import { ThirdPartyAuth } from "pages/userAuth/thirdParty/thirdPartyAuth";
import { useParams } from "react-router-dom";
import { Divider } from "antd";
import { OrgApi } from "@lowcoder-ee/api/orgApi";
import { validateResponse } from "@lowcoder-ee/api/apiUtils";
import history from "util/history";
import LoadingOutlined from "@ant-design/icons/LoadingOutlined";
import Spin from "antd/es/spin";
import { useDispatch, useSelector } from "react-redux";
import { getServerSettings } from "@lowcoder-ee/redux/selectors/applicationSelector";
import { useEnterpriseContext } from "@lowcoder-ee/util/context/EnterpriseContext";
import { fetchConfigAction } from "@lowcoder-ee/redux/reduxActions/configActions";
import { fetchOrgPaginationByEmail } from "@lowcoder-ee/util/pagination/axios";

const StyledFormInput = styled(FormInput)`
  margin-bottom: 16px;
`;

const StyledPasswordInput = styled(PasswordInput)`
  margin-bottom: 16px;
`;

const RegisterContent = styled(FormWrapperMobile)`
  display: flex;
  flex-direction: column;
  margin-bottom: 0px;
`;

function UserRegister() {
  const location = useLocation();
  const dispatch = useDispatch();
  const [submitBtnDisable, setSubmitBtnDisable] = useState(false);
  const [account, setAccount] = useState(() => {
    const { email } = (location.state || {}) as any;
    return email ?? '';
  });
  const [password, setPassword] = useState("");
  const [orgLoading, setOrgLoading] = useState(false);
  const [lastEmailChecked, setLastEmailChecked] = useState("");
  const [signupEnabled, setSignupEnabled] = useState<boolean>(true);
  const [signinEnabled, setSigninEnabled] = useState<boolean>(true);
  const [defaultOrgId, setDefaultOrgId] = useState<string|undefined>();
  const redirectUrl = useRedirectUrl();
  const serverSettings = useSelector(getServerSettings);
  const { systemConfig, inviteInfo, fetchUserAfterAuthSuccess } = useContext(AuthContext);
  const { isEnterpriseActive } = useEnterpriseContext();
  const invitationId = inviteInfo?.invitationId;
  const isFormLoginEnabled = systemConfig ? systemConfig?.form.enableLogin : true;
  const authId = systemConfig?.form.id;
  const orgId = useParams<any>().orgId;

  const organizationId = useMemo(() => {
    if(inviteInfo?.invitedOrganizationId) {
      return inviteInfo?.invitedOrganizationId;
    }
    if (orgId) {
      return orgId;
    }
    return defaultOrgId;
  }, [ inviteInfo, orgId, defaultOrgId ]);

  const isEmailLoginEnabled = useMemo(() => {
    return isFormLoginEnabled && signinEnabled;
  }, [isFormLoginEnabled, signinEnabled]);

  const isEnterpriseMode = useMemo(() => {
    return serverSettings?.LOWCODER_WORKSPACE_MODE === "ENTERPRISE" || serverSettings?.LOWCODER_WORKSPACE_MODE === "SINGLEWORKSPACE";
  }, [serverSettings]);

  useEffect(() => {
    const {
      LOWCODER_EMAIL_SIGNUP_ENABLED,
      LOWCODER_EMAIL_AUTH_ENABLED,
    } = serverSettings;

    setSignupEnabled(LOWCODER_EMAIL_SIGNUP_ENABLED === 'true');
    setSigninEnabled(LOWCODER_EMAIL_AUTH_ENABLED === 'true');
  }, [serverSettings]);

  const fetchOrgsByEmail = () => {
    fetchOrgPaginationByEmail({
      email: ' ',
      pageNum: 1,
      pageSize: 10,
    })
    .then((resp) => {
      if (resp.success) {
        const orgList = resp.data || [];
        if (orgList.length) {
          // in Enterprise mode, we will get org data in different format
          const selectedOrgId = orgList[0]?.id || orgList[0]?.orgId;
          setDefaultOrgId(selectedOrgId);
          dispatch(fetchConfigAction(selectedOrgId));
        }
      }
    })
  }

  useEffect(() => {
    if (isEnterpriseMode) {
      fetchOrgsByEmail();
    }
  }, [isEnterpriseMode]);

  useEffect(() => {
    const { LOWCODER_EMAIL_SIGNUP_ENABLED } = serverSettings;
    if(
      serverSettings.hasOwnProperty('LOWCODER_EMAIL_SIGNUP_ENABLED')
      && LOWCODER_EMAIL_SIGNUP_ENABLED === 'false'
    ) {
      history.push(
        AUTH_LOGIN_URL,
        {...location.state || {}, email: account},
      )
    };
  }, [serverSettings]);
  
  const afterLoginSuccess = () => {
    // used invitation link or organization login url then set cookie
    if (organizationId && !isEnterpriseMode) {
      localStorage.setItem("lowcoder_login_orgId", organizationId);
    }
    fetchUserAfterAuthSuccess?.();
  }

  const { loading, onSubmit } = useAuthSubmit(
    () =>
      UserApi.formLogin({
        register: true,
        loginId: account,
        password: password,
        invitationId,
        source: UserConnectionSource.email,
        orgId: organizationId,
        authId,
      }),
    false,
    redirectUrl,
    afterLoginSuccess,
  );

  const checkEmailExist = () => {
    if (!Boolean(account.length) || lastEmailChecked === account || isEnterpriseMode) return;

    setOrgLoading(true);
    OrgApi.fetchOrgsByEmail(account)
      .then((resp) => {
        if (validateResponse(resp)) {
          const orgList = resp.data.data;
          if (orgList.length) {
            messageInstance.error('Email is already registered');
            history.push(
              AUTH_LOGIN_URL,
              {...location.state || {}, email: account},
            )
          }
        }
      })
      .finally(() => {
        setLastEmailChecked(account)
        setOrgLoading(false);
      });
  }

  const registerHeading = trans("userAuth.register")
  const registerSubHeading = trans("userAuth.poweredByLowcoder");

  return (
    <Spin indicator={<LoadingOutlined style={{ fontSize: 30 }} />} spinning={orgLoading}>
      <AuthContainer
        heading={registerHeading}
        subHeading={registerSubHeading}
        type="large"
        isEE={isEnterpriseActive}
      >
        <RegisterContent>
          { isEmailLoginEnabled && (
            <>
              <StyledFormInput
                className="form-input"
                label={trans("userAuth.email")}
                defaultValue={account}
                onChange={(value, valid) => setAccount(valid ? value : "")}
                onBlur={checkEmailExist}
                placeholder={trans("userAuth.inputEmail")}
                checkRule={{
                  check: checkEmailValid,
                  errorMsg: trans("userAuth.inputValidEmail"),
                }}
              />
              <StyledPasswordInput
                className="form-input"
                passInputConf={{label:trans("password.label"), placeholder: trans("password.placeholder")}}
                confirmPassConf={{label:trans("password.conformLabel"), placeholder: trans("password.conformPlaceholder")}}
                valueCheck={checkPassWithMsg}
                onChange={(value, valid) => setPassword(valid ? value : "")}
                doubleCheck
              />
              <ConfirmButton
                disabled={!account || !password || submitBtnDisable}
                onClick={onSubmit}
                loading={loading}
              >
                {trans("userAuth.register")}
              </ConfirmButton>
              <TermsAndPrivacyInfo onCheckChange={(e) => setSubmitBtnDisable(!e.target.checked)} />
            </>
          )}
          {(organizationId || isEnterpriseMode) && (
            <ThirdPartyAuth
              invitationId={invitationId}
              invitedOrganizationId={organizationId}
              authGoal="register"
            />
          )}
        </RegisterContent>
        {isEmailLoginEnabled && (
          <>
            <Divider/>
            <StyledRouteLinkLogin to={{
              pathname: orgId
                ? ORG_AUTH_LOGIN_URL.replace(':orgId', orgId)
                : AUTH_LOGIN_URL,
              state: location.state
            }}>{trans("userAuth.userLogin")}
            </StyledRouteLinkLogin>
          </>
        )}
      </AuthContainer>
    </Spin>
  );
}

export default requiresUnAuth(UserRegister);
