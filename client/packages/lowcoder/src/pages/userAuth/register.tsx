import React, { useContext, useState } from "react";
import {
  AuthContainer,
  ConfirmButton,
  FormWrapperMobile,
  LoginCardTitle,
  StyledRouteLinkLogin,
  TermsAndPrivacyInfo,
} from "pages/userAuth/authComponents";
import { FormInput, PasswordInput } from "lowcoder-design";
import { AUTH_LOGIN_URL } from "constants/routesURL";
import UserApi from "api/userApi";
import { useRedirectUrl } from "util/hooks";
import { checkEmailValid } from "util/stringUtils";
import styled from "styled-components";
import { requiresUnAuth } from "./authHOC";
import { useLocation } from "react-router-dom";
import { UserConnectionSource } from "@lowcoder-ee/constants/userConstants";
import { trans } from "i18n";
import { AuthContext, checkPassWithMsg, useAuthSubmit } from "pages/userAuth/authUtils";
import { Divider } from "antd";
import { ThirdPartyAuth } from "pages/userAuth/thirdParty/thirdPartyAuth";

const StyledFormInput = styled(FormInput)`
  margin-bottom: 16px;
`;

const StyledPasswordInput = styled(PasswordInput)`
  margin-bottom: 16px;
`;

const RegisterContent = styled(FormWrapperMobile)`
  display: flex;
  flex-direction: column;
  margin-bottom: 106px;
`;

function UserRegister() {
  const [submitBtnDisable, setSubmitBtnDisable] = useState(false);
  const [account, setAccount] = useState("");
  const [password, setPassword] = useState("");
  const redirectUrl = useRedirectUrl();
  const location = useLocation();
  const { systemConfig, inviteInfo } = useContext(AuthContext);
  const invitationId = inviteInfo?.invitationId;
  const invitedOrganizationId = inviteInfo?.invitedOrganizationId;
  const authId = systemConfig.form.id;
  const { loading, onSubmit } = useAuthSubmit(
    () =>
      UserApi.formLogin({
        register: true,
        loginId: account,
        password: password,
        invitationId,
        source: UserConnectionSource.email,
        authId,
      }),
    false,
    redirectUrl
  );
  if (!systemConfig || !systemConfig.form.enableRegister) {
    return null;
  }

  return (
    <AuthContainer title={trans("userAuth.register")} type="large">
      <RegisterContent>
        <LoginCardTitle>{trans("userAuth.registerByEmail")}</LoginCardTitle>
        <StyledFormInput
          className="form-input"
          label={trans("userAuth.email")}
          onChange={(value, valid) => setAccount(valid ? value : "")}
          placeholder={trans("userAuth.inputEmail")}
          checkRule={{
            check: checkEmailValid,
            errorMsg: trans("userAuth.inputValidEmail"),
          }}
        />
        <StyledPasswordInput
          className="form-input"
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
        {Boolean(invitationId) && (
          <>
            <Divider />
            <ThirdPartyAuth
              invitationId={invitationId}
              invitedOrganizationId={invitedOrganizationId}
              authGoal="register"
            />
          </>
        )}
      </RegisterContent>
      <StyledRouteLinkLogin to={{ pathname: AUTH_LOGIN_URL, state: location.state }}>
        {trans("userAuth.userLogin")}
      </StyledRouteLinkLogin>
    </AuthContainer>
  );
}

export default requiresUnAuth(UserRegister);
