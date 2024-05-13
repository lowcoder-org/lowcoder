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
import { useRedirectUrl } from "util/hooks";
import { checkEmailValid } from "util/stringUtils";
import styled from "styled-components";
import { requiresUnAuth } from "./authHOC";
import { useLocation } from "react-router-dom";
import { UserConnectionSource } from "@lowcoder-ee/constants/userConstants";
import { trans } from "i18n";
import { AuthContext, useAuthSubmit } from "pages/userAuth/authUtils";
import { useParams } from "react-router-dom";
import { Divider } from "antd";
import { validateResponse } from "api/apiUtils";

const StyledFormInput = styled(FormInput)`
  margin-bottom: 16px;
`;

const RegisterContent = styled(FormWrapperMobile)`
  display: flex;
  flex-direction: column;
  margin-bottom: 0px;
`;

function ForgotPassword() {
  const [account, setAccount] = useState("");
  const [loading, setLoading] = useState(false);
  const location = useLocation();

  const orgId = useParams<any>().orgId;

  const onSubmit = () => {
    setLoading(true);
    UserApi.forgotPassword(account)
      .then((resp) => {
        // TODO: need proper response from BE
        // if (validateResponse(resp)) {
        //   messageInstance.success(trans("userAuth.forgotPasswordSuccess"));
        // }
        if (resp.status === 200) {
          messageInstance.success(trans("userAuth.forgotPasswordSuccess"));
        }
      })
      .catch((e) => {
        messageInstance.error(trans("userAuth.forgotPasswordError"));
      })
      .finally(() => {
        setLoading(false);
      })
  }

  const forgotPasswordHeading = trans("userAuth.forgotPassword")
  const subHeading = trans("userAuth.poweredByLowcoder");

  return (
    <AuthContainer
      heading={forgotPasswordHeading}
      subHeading={subHeading}
      type="large"
    >
      <p style={{textAlign: 'center'}}>{trans("userAuth.forgotPasswordInfo")}</p>
      <RegisterContent>
        <StyledFormInput
          className="form-input"
          label={''}
          onChange={(value, valid) => setAccount(valid ? value : "")}
          placeholder={trans("userAuth.inputEmail")}
          checkRule={{
            check: checkEmailValid,
            errorMsg: trans("userAuth.inputValidEmail"),
          }}
        />
        <ConfirmButton
          disabled={!account}
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

export default requiresUnAuth(ForgotPassword);
