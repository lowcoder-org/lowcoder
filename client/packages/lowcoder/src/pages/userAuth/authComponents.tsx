import { CheckboxChangeEvent } from "antd/es/checkbox";
import React, { CSSProperties, useRef } from "react";
import { CheckBox, PackUpIcon, TacoButton } from "lowcoder-design";
import { Link } from "react-router-dom";
import styled from "styled-components";
import ReactHotkeys from "util/hotkeys";
import { StyledLink } from "pages/common/styledComponent";
import { trans } from "i18n";
import { favicon } from "assets/images";

const AuthCardContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  min-height: 100vh;
  height: 100%;
  background-size: 100% 100%;
`;

const AuthCard = styled.div`
  display: flex;
  flex-direction: column;
  width: 480px;
  background: #ffffff;
  box-shadow: 0 0 20px 20px rgba(246, 248, 250, 0.85);
  border-radius: 16px;
  padding: 28px 36px;
  margin-top: 40px;
  @media screen and (max-width: 640px) {
    margin: 32px 18px 18px 18px;
    width: calc(100vw - 36px);
    padding: 32px 24px;
  }
`;

const AuthCardHeading = styled.div<{ $type?: string }>`
  font-weight: 600;
  font-size: 28px;
  color: #222222;
  line-height: 28px;
  margin-top: 13vh;
  @media screen and (min-height: 700px) {
    margin-top: 107px;
  }
  @media screen and (max-height: 700px) {
    margin-top: 47px;
  }
  @media screen and (max-width: 640px) {
    font-size: 23px;
    line-height: 23px;
    ${(props) => props.$type === "large" && "margin-top: 32px"}
  }
`;

const AuthCardSubFooter = styled.div`
  font-size: 14px;
  color: #dddddd;
  line-height: 14px;
  margin-top: 40px;
  > a {
    margin-left: 4px;
    color: #dddddd;
    text-decoration: none;
  }
`

const AuthBottom = styled.div`
  display: flex;
  align-items: center;
  flex-wrap: wrap;

  > a {
    margin-right: auto;
    margin-left: auto;
    font-size: 1.3em;
    font-weight: 500;
  }

  > button {
    margin-right: 24px;
    margin-left: 24px;
    margin-bottom: 16px;
    outline: 0;
  }

  > button:first-child {
    // over 5 children, hide the button label
    &:nth-last-child(n + 5),
    &:nth-last-child(n + 5) ~ button {
      margin-right: 16px;
      .auth-label {
        display: none;
      }
    }
  }

  @media screen and (min-width: 640px) {
    > button:nth-child(7n + 1):nth-last-child(-n + 7) {
      &,
      ~ button {
        margin-bottom: 0;
      }
    }
  }

  @media screen and (max-width: 640px) {
    > button:nth-child(5n + 1):nth-last-child(-n + 5) {
      &,
      ~ button {
        margin-bottom: 0;
      }
    }

    > button {
      margin-right: 22px;

      .auth-label {
        display: none;
      }
    }

    img {
      width: 38px;
      height: 38px;
      margin-right: 0;
    }
  }
`;

const StyledConfirmButton = styled(TacoButton)`
  border-radius: 8px;
  height: 48px;
  font-size: 16px;
  line-height: 16px;
  margin-top: 8px;
  transition: unset;
`;

export const AuthContainer = (props: {
  children: any;
  heading?: string;
  subHeading?: string;
  type?: string
}) => {
  return (
    <AuthCardContainer>
      <AuthCardHeading
        $type={props.type}
      >
        {props.heading || ""}
      </AuthCardHeading>
      
      <AuthCard>{props.children}</AuthCard>
      { props.subHeading && (
        <AuthCardSubFooter>
          <img src={favicon} alt={"Lowcoder | " + trans("productDesc")} width="20px"/>
          <a href="https://lowcoder.cloud" target="_blank" rel="noreferrer">
            {props.subHeading}
          </a>
        </AuthCardSubFooter>
      )}
    </AuthCardContainer>
  );
};

export function AuthBottomView(props: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  return <AuthBottom ref={ref}>{props.children}</AuthBottom>;
}

export const ConfirmButton = (props: {
  onClick: () => void;
  disabled: boolean;
  children: React.ReactNode;
  style?: CSSProperties;
  loading?: boolean;
}) => {
  const ref = useRef<HTMLButtonElement>(null);
  return (
    <>
      <ReactHotkeys
        filter={() => true}
        keyName="enter"
        onKeyDown={(keyName) => {
          if (keyName === "enter" && !props.disabled && ref && ref.current) {
            ref.current.click();
          }
        }}
        global
      />
      <StyledConfirmButton ref={ref} buttonType="primary" {...props} />
    </>
  );
};

const TermsAndPrivacyContent = styled.div`
  display: flex;
  align-items: center;
  margin-top: 16px;

  font-size: 13px;
  color: #333333;
  line-height: 13px;
  @media screen and (max-width: 640px) {
    font-size: 14px;
    line-height: 1.2;
  }
`;

const TermsAndPrivacyLabel = styled.span`
  margin-left: 8px;
`;

export const TermsAndPrivacyInfo = (props: { onCheckChange: (e: CheckboxChangeEvent) => void }) => {
  const termsUrl = trans("docUrls.terms");
  const privacyUrl = trans("docUrls.privacy");
  if (!termsUrl || !privacyUrl) {
    return null;
  }
  return (
    <TermsAndPrivacyContent>
      <CheckBox data-testid="agree-terms-checkbox" defaultChecked onChange={(e) => props.onCheckChange(e)} />
      <TermsAndPrivacyLabel>
        {trans("userAuth.registerHint")}{`: `}
        <StyledLink href={termsUrl} target="_blank">
          {trans("userAuth.terms")}
        </StyledLink>
        {` & `}
        <StyledLink href={privacyUrl} target="_blank">
          {trans("userAuth.privacy")}
        </StyledLink>
      </TermsAndPrivacyLabel>
    </TermsAndPrivacyContent>
  );
};

export const LoginLogoStyle = styled.img`
  margin-right: 8px;
  width: 32px;
  height: 32px;
  position: absolute;
  left: 6px;
`;

export const LoginLabelStyle = styled.p`
  font-size: 16px;
  color: #333333;
  line-height: 16px;
  margin: 0px;
`;

export const StyledLoginButton = styled(TacoButton)`
  position: relative;
  height: 48px;
  border: 1px solid lightgray !important;
  border-radius: 8px;
  padding: 8px;
  white-space: nowrap;
  word-break: keep-all;
  outline: 0;

  &,
  &:focus {
    display: flex;
    align-items: center;
    justify-content: center;
    border: unset;
    background: unset;
    cursor: pointer;
  }

  &:hover {
    p {
      color: #4965f2;
    }
  }
`;

export const StyledRouteLink = styled(Link)`
  display: flex;
  align-items: center;
  margin-right: auto;
  margin-left: auto;
  font-size: 1.3em;
  font-weight: 500;
  color: #4965f2;
  line-height: 16px;

  &:hover {
    color: #315efb;
  }
`;

export const StyledRouteLinkLogin = styled(StyledRouteLink)`
  margin-bottom: 8px;
  @media screen and (max-width: 640px) {
    margin-bottom: 0;
  }
`;

export const LoginCardTitle = styled.header`
  font-weight: 500;
  font-size: 2em;
  color: #222222;
  line-height: 18px;
  margin-bottom: 36px;
  margin-top: 8px;
  margin-left: auto;
  margin-right: auto;
  @media screen and (max-width: 640px) {
    margin: 0 0 26px 0;
  }
`;

export const FormWrapperMobile = styled.div`
  @media screen and (max-width: 640px) {
    .form-input {
      margin-bottom: 26px;

      p {
        font-size: 16px;
        line-height: 16px;
      }

      input {
        height: 56px;
        border-radius: 9px;

        &.verify-input {
          height: 54px;
        }
      }

      span {
        line-height: 32px;
        font-size: 32px;
        transform: scaleX(0.5);
      }

      & > div:nth-of-type(1) {
        margin-bottom: 12px;
      }
    }

    .ant-btn-default {
      height: 56px;
      border-radius: 9px;
      margin-top: 0;
    }
  }
`;

const BackNavLink = styled.a`
  display: flex;
  align-items: center;
  font-weight: 500;
  font-size: 18px;
  color: #222222;
  line-height: 20px;
  margin: 6px 0 0 -4px;

  span {
    margin-left: 4px;
  }

  &:hover {
    color: #4965f2;

    svg g path {
      fill: #4965f2;
    }
  }
`;

const StyledPackUpIcon = styled(PackUpIcon)`
  transform: rotate(-90deg);
  width: 24px;
  height: 24px;
`;

export function AuthNavBack(props: { onBack: () => void; style?: CSSProperties }) {
  return (
    <BackNavLink type="button" onClick={props.onBack} style={props.style}>
      <StyledPackUpIcon />
      <span>{trans("back")}</span>
    </BackNavLink>
  );
}
