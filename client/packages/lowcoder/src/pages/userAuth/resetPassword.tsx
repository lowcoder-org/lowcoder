import React, { useContext, useState, useMemo } from "react";
import {
  AuthContainer,
  ConfirmButton,
  FormWrapperMobile,
  StyledRouteLinkLogin,
} from "pages/userAuth/authComponents";
import { FormInput, PasswordInput, messageInstance } from "lowcoder-design";
import { AUTH_LOGIN_URL, ORG_AUTH_LOGIN_URL } from "constants/routesURL";
import UserApi from "api/userApi";
import { checkEmailValid } from "util/stringUtils";
import styled from "styled-components";
import { requiresUnAuth } from "./authHOC";
import { useLocation } from "react-router-dom";
import { trans } from "i18n";
import { checkPassWithMsg } from "pages/userAuth/authUtils";
import { useParams } from "react-router-dom";
import { Divider } from "antd";
import { validateResponse } from "api/apiUtils";

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

function ResetPassword() {
  const [submitBtnDisable, setSubmitBtnDisable] = useState(false);
  const [loading, setLoading] = useState(false);
  const [account, setAccount] = useState("");
  const [password, setPassword] = useState("");
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  
  const orgId = useParams<any>().orgId;
  const token = queryParams.get('token') ?? '';

  const onSubmit = () => {
    setLoading(true);
    UserApi.resetLostPassword({
      token,
      userEmail: account,
      newPassword: password,
    })
      .then((resp) => {
        // TODO: need proper response from BE
        // if (validateResponse(resp)) {
        //   messageInstance.success(trans("userAuth.resetLostPasswordSuccess"));
        // }
        if (resp.status === 200) {
          messageInstance.success(trans("userAuth.resetLostPasswordSuccess"));
        }
      })
      .catch((e) => {
        messageInstance.error(trans("userAuth.forgotPasswordError"));
      })
      .finally(() => {
        setLoading(false);
      })
  }

  const registerHeading = trans("userAuth.resetPassword")
  const registerSubHeading = trans("userAuth.poweredByLowcoder");

  return (
    <AuthContainer
      heading={registerHeading}
      subHeading={registerSubHeading}
      type="large"
    >
      <RegisterContent>
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
          {trans("button.submit")}
        </ConfirmButton>
      </RegisterContent>
      <Divider/>
      <StyledRouteLinkLogin to={{
        pathname: orgId
          ? ORG_AUTH_LOGIN_URL.replace(':orgId', orgId)
          : AUTH_LOGIN_URL,
        state: location.state
      }}>{trans("userAuth.userLogin")}
      </StyledRouteLinkLogin>
    </AuthContainer>
  );
}

export default requiresUnAuth(ResetPassword);