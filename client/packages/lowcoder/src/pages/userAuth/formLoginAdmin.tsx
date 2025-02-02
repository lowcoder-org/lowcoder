import { FormInput, PasswordInput } from "lowcoder-design";
import {
  ConfirmButton,
  FormWrapperMobile,
} from "pages/userAuth/authComponents";
import React, { useContext, useState } from "react";
import styled from "styled-components";
import UserApi from "api/userApi";
import { checkEmailValid, checkPhoneValid } from "util/stringUtils";
import { UserConnectionSource } from "@lowcoder-ee/constants/userConstants";
import { trans } from "i18n";
import { AuthContext, useAuthSubmit } from "pages/userAuth/authUtils";

export const AccountLoginWrapper = styled(FormWrapperMobile)`
  position: relative;
  display: flex;
  flex-direction: column;
  margin-bottom: 0px;

  .form-input.password-input {
    margin-bottom: 0px;
  }
`;

type FormLoginProps = {
  organizationId?: string;
}

export default function FormLogin(props: FormLoginProps) {
  const [account, setAccount] = useState("");
  const [password, setPassword] = useState("");
  const { fetchUserAfterAuthSuccess } = useContext(AuthContext);

  const { onSubmit, loading } = useAuthSubmit(
    () =>
      UserApi.formLogin({
        register: false,
        loginId: account,
        password: password,
        source: UserConnectionSource.email,
        orgId: props.organizationId,
      }),
    false,
    null,
    fetchUserAfterAuthSuccess,
  );

  return (
    <>
      <AccountLoginWrapper>
        <FormInput
          className="form-input"
          label={trans("userAuth.email")}
          onChange={(value, valid) => setAccount(valid ? value : "")}
          placeholder={trans("userAuth.inputEmail")}
          checkRule={{
            check: (value) => checkPhoneValid(value) || checkEmailValid(value),
            errorMsg: trans("userAuth.inputValidEmail"),
          }}
        />
        <PasswordInput
          className="form-input password-input"
          onChange={(value) => setPassword(value)}
          valueCheck={() => [true, ""]}
        />
        <ConfirmButton style={{marginTop: '32px'}} loading={loading} disabled={!account || !password} onClick={onSubmit}>
          {trans("userAuth.login")}
        </ConfirmButton>
      </AccountLoginWrapper>
    </>
  );
}
