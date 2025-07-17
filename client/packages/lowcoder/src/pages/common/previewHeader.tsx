import { default as Skeleton } from "antd/es/skeleton";
import Header from "components/layout/Header";
import { SHARE_TITLE } from "constants/apiConstants";
import { ALL_APPLICATIONS_URL, APPLICATION_VIEW_URL, AUTH_LOGIN_URL } from "constants/routesURL";
import { User } from "constants/userConstants";
import { EllipsisTextCss, isDarkColor, TacoButton, TextEditIcon } from "lowcoder-design";
import { useSelector } from "react-redux";
import { currentApplication, getTemplateId, isPublicApplication } from "redux/selectors/applicationSelector";
import { getUser, isFetchingUser } from "redux/selectors/usersSelectors";
import styled from "styled-components";
import history from "util/history";
import { useApplicationId } from "util/hooks";
import { canEditApp, canManageApp } from "util/permissionUtils";
import ProfileDropdown from "./profileDropdown";
import { trans } from "i18n";
import { Logo } from "@lowcoder-ee/assets/images";
import { AppPermissionDialog } from "../../components/PermissionDialog/AppPermissionDialog";
import { useContext, useMemo, useState } from "react";
import { getBrandingConfig } from "../../redux/selectors/configSelectors";
import { HeaderStartDropdown } from "./headerStartDropdown";
import { useParams } from "react-router";
import { AppPathParams } from "constants/applicationConstants";
import React from "react";
import Segmented from "antd/es/segmented";
import MobileOutlined from "@ant-design/icons/MobileOutlined";
import TabletOutlined from "@ant-design/icons/TabletOutlined";
import DesktopOutlined from "@ant-design/icons/DesktopOutlined";
import { DeviceOrientation, DeviceType, EditorContext } from "@lowcoder-ee/comps/editorState";
import { getBrandingSetting } from "@lowcoder-ee/redux/selectors/enterpriseSelectors";
import { buildMaterialPreviewURL } from "@lowcoder-ee/util/materialUtils";

const HeaderFont = styled.div<{ $bgColor: string }>`
  font-weight: 500;
  font-size: 14px;
  color: ${(props) => (isDarkColor(props.$bgColor) ? "#ffffff" : "#000000")};
  font-style: normal;
  line-height: 24px;
  margin-right: 8px;
  margin-left: 20px;
  max-width: 264px;
  ${EllipsisTextCss};
`;

const StyledLink = styled.a`
  display: flex;
  align-items: center;
`;

const LogoIcon = styled(Logo)`
  height: 28px;
  width: 28px;
`;

const LoginBtn = styled(TacoButton)`
  min-width: 60px;
  padding: 0;
  height: 28px;
  margin-right: 4px;
`;

const CloneBtn = styled(TacoButton)`
  min-width: 60px;
  height: 28px;
`;

const PreviewBtn = styled(TacoButton)`
  &&& {
    color: #ffffff;
    background: #8b8fa34c;
    border: none;
    height: 28px;
    margin-right: 8px;
    min-width: 60px;
    padding: 0;
    cursor: pointer;
  
    &:hover {
      background: #666666;
      color: #ffffff;
      border: none;
    }
  
    &:focus {
      background: #666666;
      color: #ffffff;
      border: none;
    }
  }
`;

const EditIcon = styled(TextEditIcon)`
  margin-right: 4px;

  g g {
    fill: #ffffff;
  }
`;

const EditBtn = styled(TacoButton)`
  min-width: 60px;
  height: 28px;
  margin-right: 24px;
  padding: 0;
`;

const Wrapper = styled.div`
  display: inherit;
  @media screen and (max-width: 500px) {
    > div:nth-of-type(1),
    > button {
      display: none;
    }
  }
`;

const BrandLogo = styled.img`
  height: 28px;
`

export function HeaderProfile(props: { user: User }) {
  const { user } = props;
  const fetchingUser = useSelector(isFetchingUser);
  const templateId = useSelector(getTemplateId);
  const isPublicApp = useSelector(isPublicApplication);

  if (fetchingUser) {
    return <Skeleton.Avatar shape="circle" size={28} />;
  }
  return (
    <div>
      {user.isAnonymous ? (
        !templateId ? (
          <LoginBtn buttonType="primary" onClick={() => {
            if (isPublicApp) {
              window.top?.open('https://app.lowcoder.cloud/user/auth/login');
            } else {
              history.push(AUTH_LOGIN_URL)
            }
          }}>
            {trans("userAuth.login")}
          </LoginBtn>
        ) : null
      ) : (
        <ProfileDropdown user={user} profileSide={28} fontSize={12} />
      )}
    </div>
  );
}

const PreviewHeaderComp = () => {
  const params = useParams<AppPathParams>();
  const editorState = useContext(EditorContext);
  const user = useSelector(getUser);
  const application = useSelector(currentApplication);
  const isPublicApp = useSelector(isPublicApplication);
  const applicationId = useApplicationId();
  const templateId = useSelector(getTemplateId);
  const brandingSettings = useSelector(getBrandingSetting);
  const [permissionDialogVisible, setPermissionDialogVisible] = useState(false);
  const isViewMarketplaceMode = params.viewMode === 'view_marketplace' || isPublicApp;

  const headerStart = (
    <>
      <StyledLink onClick={() => !isPublicApp && history.push(ALL_APPLICATIONS_URL)}>
        {/* <LogoIcon branding={true} /> */}
        { brandingSettings?.config_set?.logo
          ? (
            Boolean(brandingSettings?.orgId)
            ? <BrandLogo src={buildMaterialPreviewURL(brandingSettings?.config_set?.logo)} />
            : <BrandLogo src={brandingSettings?.config_set?.logo} />
          ) : <LogoIcon branding={true} />
        }
      </StyledLink>
      {isViewMarketplaceMode && (
        <HeaderStartDropdown
          setEdit={() => { }}
          isViewMarketplaceMode={isViewMarketplaceMode}
        />
      )}
      {!isViewMarketplaceMode && (
        <HeaderFont $bgColor={brandingSettings?.config_set?.appHeaderColor ?? "#2c2c2c"}>
          {application && application.name}
        </HeaderFont>
      )}
    </>
  );

  const headerEnd = (
    <Wrapper>
      {canManageApp(user, application) && !isPublicApp && (
        <AppPermissionDialog
          applicationId={applicationId}
          visible={permissionDialogVisible}
          onVisibleChange={(visible) => !visible && setPermissionDialogVisible(false)}
        />
      )}
      {canManageApp(user, application) && !isPublicApp && (
        <PreviewBtn onClick={() => setPermissionDialogVisible(true)}>{SHARE_TITLE}</PreviewBtn>
      )}
      {canEditApp(user, application) && !isPublicApp && (
        <EditBtn
          buttonType={"primary"}
          onClick={() =>
            // redirection to app by JS will cause the problem that queries don't execute on initialization
            // so just open a new window.
            window.open(APPLICATION_VIEW_URL(applicationId, "edit"))
          }
        >
          <EditIcon />
          {trans("edit")}
        </EditBtn>
      )}
      {!!templateId && (
        <CloneBtn
          style={{ marginRight: !user.isAnonymous ? "24px" : "" }}
          buttonType="primary"
          onClick={() => {
            window.open(trans("template.cloneUrl") + templateId);
          }}
        >
          {trans("header.clone")}
        </CloneBtn>
      )}
      <HeaderProfile user={user} />
    </Wrapper>
  );

  const headerMiddle = useMemo(() => {
    if (isPublicApp) return null;

    return (
      <>
        {/* Devices */}
        <Segmented<DeviceType>
          options={[
            { value: 'mobile', icon: <MobileOutlined /> },
            { value: 'tablet', icon: <TabletOutlined /> },
            { value: 'desktop', icon: <DesktopOutlined /> },
          ]}
          value={editorState.deviceType}
          onChange={(value) => {
            editorState.setDeviceType(value);
          }}
        />

        {/* Orientation */}
        {editorState.deviceType !== 'desktop' && (
          <Segmented<DeviceOrientation>
            options={[
              { value: 'portrait', label: "Portrait" },
              { value: 'landscape', label: "Landscape" },
            ]}
            value={editorState.deviceOrientation}
            onChange={(value) => {
              editorState.setDeviceOrientation(value);
            }}
          />
        )}
      </>
    );
  }, [
    isPublicApp,
    editorState.deviceType,
    editorState.deviceOrientation,
  ]);

  return (
    <Header
      headerStart={headerStart}
      headerMiddle={headerMiddle}
      headerEnd={headerEnd}
      style={{ backgroundColor: brandingSettings?.config_set?.appHeaderColor }}
    />
  );
};

export const PreviewHeader = React.memo(PreviewHeaderComp);
