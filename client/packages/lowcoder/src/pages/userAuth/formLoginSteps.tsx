import { FormInput, messageInstance, PasswordInput } from "lowcoder-design";
import {
  AuthBottomView,
  ConfirmButton,
  StyledRouteLink,
} from "pages/userAuth/authComponents";
import React, { useContext, useEffect, useState } from "react";
import styled from "styled-components";
import UserApi from "api/userApi";
import { useRedirectUrl } from "util/hooks";
import { checkEmailValid, checkPhoneValid } from "util/stringUtils";
import { UserConnectionSource } from "@lowcoder-ee/constants/userConstants";
import { trans } from "i18n";
import { AuthContext, useAuthSubmit } from "pages/userAuth/authUtils";
import { ThirdPartyAuth } from "pages/userAuth/thirdParty/thirdPartyAuth";
import { AUTH_FORGOT_PASSWORD_URL, AUTH_REGISTER_URL } from "constants/routesURL";
import { Link, useLocation, useParams } from "react-router-dom";
import { Divider } from "antd";
import Flex from "antd/es/flex";
import { validateResponse } from "@lowcoder-ee/api/apiUtils";
import OrgApi from "@lowcoder-ee/api/orgApi";
import { AccountLoginWrapper } from "./formLoginAdmin";
import { default as Button } from "antd/es/button";
import LeftOutlined from "@ant-design/icons/LeftOutlined";
import { fetchConfigAction } from "@lowcoder-ee/redux/reduxActions/configActions";
import { useDispatch, useSelector } from "react-redux";
import history from "util/history";
import { getServerSettings } from "@lowcoder-ee/redux/selectors/applicationSelector";
import {fetchOrgPaginationByEmail} from "@lowcoder-ee/util/pagination/axios";
import PaginationComp from "@lowcoder-ee/util/pagination/Pagination";

const StyledCard = styled.div<{$selected: boolean}>`
  display: flex;
  justify-content: center;
  flex-direction: column;
  min-height: 56px;
  margin-bottom: -1px;
  padding: 0 24px;
  color: rgba(0, 0, 0, 0.88);
  font-size: 16px;
  background: transparent;
  border: 1px solid #f0f0f0;
  border-radius: 8px;
  cursor: pointer;
  margin-bottom: 16px;
  // box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.03), 0 1px 6px -1px rgba(0, 0, 0, 0.02);
  ${props => props.$selected && `background: #e6f4ff;`}

  &:hover {
    box-shadow: 0 1px 2px -2px rgba(0, 0, 0, 0.16), 0 3px 6px 0 rgba(0, 0, 0, 0.12), 0 5px 12px 4px rgba(0, 0, 0, 0.09);
  }
`;

type OrgItem = {
  orgId: string;
  orgName: string;
}

enum CurrentStepEnum {
  EMAIL = "EMAIL",
  WORKSPACES = "WORKSPACES",
  AUTH_PROVIDERS = "AUTH_PROVIDERS",
}

const StepHeader = (props : {
  title: string,
}) => (
  <Flex justify="center" style={{marginBottom: '22px'}}>
    <h3 style={{margin: 0, padding: '2px 0 0 8px'}}>{props.title}</h3>
  </Flex>
)

const StepBackButton = (props : {
  onClick: () => void,
}) => (
  <Button
    type="link"
    icon={<LeftOutlined style={{fontSize: '12px'}} />}
    style={{
      position: 'absolute',
      padding: 0,
    }}
    onClick={props.onClick}
  >
    Back
  </Button>
)

type FormLoginProps = {
  organizationId?: string;
}

interface ElementsState {
  elements: any;
  total: number;
}

export default function FormLoginSteps(props: FormLoginProps) {
  const dispatch = useDispatch();
  const location = useLocation(); 
  const [account, setAccount] = useState(() => {
    const { email } = (location.state || {}) as any;
    return email ?? '';
  });
  const [password, setPassword] = useState("");
  const redirectUrl = useRedirectUrl();
  const { systemConfig, inviteInfo, fetchUserAfterAuthSuccess } = useContext(AuthContext);
  const invitationId = inviteInfo?.invitationId;
  const authId = systemConfig?.form.id;
  const isFormLoginEnabled = systemConfig?.form.enableLogin;
  const [orgLoading, setOrgLoading] = useState(false);
  const [orgList, setOrgList] = useState<OrgItem[]>([]);
  const [currentStep, setCurrentStep] = useState<CurrentStepEnum>(CurrentStepEnum.EMAIL);
  const [organizationId, setOrganizationId] = useState<string|undefined>(props.organizationId);
  const [skipWorkspaceStep, setSkipWorkspaceStep] = useState<boolean>(false);
  const [signupEnabled, setSignupEnabled] = useState<boolean>(true);
  const serverSettings = useSelector(getServerSettings);
  const [elements, setElements] = useState<ElementsState>({ elements: [], total: 0 });
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    if (account)
    fetchOrgPaginationByEmail({
      email: account,
      pageNum: currentPage,
      pageSize: pageSize
    }).then( result => {
      setElements({elements: result.data || [], total: result.total || 1})
      setOrgList(result.data)
    }
    )
  }, [pageSize, currentPage])

  useEffect(() => {
    const { LOWCODER_EMAIL_SIGNUP_ENABLED } = serverSettings;
    if (!LOWCODER_EMAIL_SIGNUP_ENABLED) {
      return setSignupEnabled(true);
    }
    setSignupEnabled(LOWCODER_EMAIL_SIGNUP_ENABLED === 'true');
  }, [serverSettings]);

  const { onSubmit, loading } = useAuthSubmit(
    () =>
      UserApi.formLogin({
        register: false,
        loginId: account,
        password: password,
        invitationId: invitationId,
        source: UserConnectionSource.email,
        orgId: organizationId,
        authId,
      }),
    false,
    redirectUrl,
    fetchUserAfterAuthSuccess,
  );

  const fetchOrgsByEmail = () => {
    // if user is invited or using org's login url then avoid fetching workspaces
    // and skip workspace selection step
    if (Boolean(organizationId)) {
      setSkipWorkspaceStep(true);
      dispatch(fetchConfigAction(organizationId));
      setCurrentStep(CurrentStepEnum.AUTH_PROVIDERS);
      return;
    }

    setOrgLoading(true);
    fetchOrgPaginationByEmail({
      email: account,
      pageNum: currentPage,
      pageSize: pageSize
    })
      .then((resp) => {
        if (resp.success) {
          setElements({elements: resp.data || [], total: resp.total || 1})
          setOrgList(resp.data);
          if (!resp.data.length) {
            history.push(
              AUTH_REGISTER_URL,
              {...location.state || {}, email: account},
            )
            return;
          }
          if (resp.data.length === 1) {
            setOrganizationId(resp.data[0].orgId);
            dispatch(fetchConfigAction(resp.data[0].orgId));
            setCurrentStep(CurrentStepEnum.AUTH_PROVIDERS);
            return;
          }
          setCurrentStep(CurrentStepEnum.WORKSPACES);
        } else {
          throw new Error('Error while fetching organizations');
        }
      })
      .catch((e) => {
        messageInstance.error(e.message);
      })
      .finally(() => {
        setOrgLoading(false);
      });
  }

  if(currentStep === CurrentStepEnum.EMAIL) {
    return (
      <>
        <AccountLoginWrapper>
          <StepHeader title={trans("userAuth.inputEmail")} />
          <FormInput
            className="form-input"
            label={''}
            defaultValue={account}
            onChange={(value, valid) => setAccount(valid ? value : "")}
            placeholder={trans("userAuth.inputEmail")}
            checkRule={{
              check: (value) => checkPhoneValid(value) || checkEmailValid(value),
              errorMsg: trans("userAuth.inputValidEmail"),
            }}
          />
          <ConfirmButton loading={orgLoading} disabled={!account} onClick={fetchOrgsByEmail}>
            {trans("userAuth.continue")}
          </ConfirmButton>
        </AccountLoginWrapper>
        {signupEnabled && (
          <>
            <Divider/>
            <AuthBottomView>
              <StyledRouteLink to={{
                pathname: AUTH_REGISTER_URL,
                state: location.state
              }}>
                {trans("userAuth.register")}
              </StyledRouteLink>
            </AuthBottomView>
          </>
        )}
      </>
    )
  }

  if (currentStep === CurrentStepEnum.WORKSPACES) {
    return (
      <>
        <AccountLoginWrapper>
          <StepBackButton onClick={() => setCurrentStep(CurrentStepEnum.EMAIL)} />
          <StepHeader title={trans("userAuth.selectWorkspace")} />
          {orgList.map(org => (
            <StyledCard
              key={org.orgId}
              $selected={organizationId === org.orgId}
              onClick={() => {
                setOrganizationId(org.orgId);
                dispatch(fetchConfigAction(org.orgId));
                setCurrentStep(CurrentStepEnum.AUTH_PROVIDERS);
              }}
            >
              {org.orgName}
            </StyledCard>
          ))}
          {elements.total > 10 ?
              <PaginationComp
                  currentPage={currentPage}
                  pageSize={pageSize}
                  setPageSize={setPageSize}
                  setCurrentPage={setCurrentPage}
                  total={elements.total}
              /> : <></>}
        </AccountLoginWrapper>
      </>
    )
  }

  return (
    <>
      <AccountLoginWrapper>
        <StepBackButton onClick={() => {
          if (skipWorkspaceStep) return setCurrentStep(CurrentStepEnum.EMAIL);
          setCurrentStep(CurrentStepEnum.WORKSPACES)
        }} />
        <StepHeader
          title={
            isFormLoginEnabled ? trans("userAuth.enterPassword") : trans("userAuth.selectAuthProvider")
          }
        />
        {isFormLoginEnabled && (
          <>
            <PasswordInput
              className="form-input password-input"
              passInputConf={{
                label: ' ',
              }}
              onChange={(value) => setPassword(value)}
              valueCheck={() => [true, ""]}
            />
            <Flex justify="end" style={{margin: '10px 0'}}>
              <Link to={{
                pathname: AUTH_FORGOT_PASSWORD_URL,
                state: {...location.state || {}, email: account}
                }}
              >
                {`${trans("userAuth.forgotPassword")}?`}
              </Link>
            </Flex>
            <ConfirmButton loading={loading} disabled={!account || !password} onClick={onSubmit}>
              {trans("userAuth.login")}
            </ConfirmButton>
          </>
        )}
        {organizationId && (
          <ThirdPartyAuth
            invitationId={invitationId}
            invitedOrganizationId={organizationId}
            authGoal="login"
          />
        )}
      </AccountLoginWrapper>
      {isFormLoginEnabled && signupEnabled && (
        <>
          <Divider/>
          <AuthBottomView>
            <StyledRouteLink to={{
              pathname: AUTH_REGISTER_URL,
              state: {...location.state || {}, email: account}
            }}>
              {trans("userAuth.register")}
            </StyledRouteLink>
          </AuthBottomView>
        </>
      )}
    </>
  );
}
