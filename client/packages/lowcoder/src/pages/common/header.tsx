import { default as Dropdown } from "antd/es/dropdown";
import { default as Skeleton } from "antd/es/skeleton";
import { default as Radio, RadioChangeEvent } from "antd/es/radio";
import { default as Statistic} from "antd/es/statistic";
import { default as Flex} from "antd/es/flex";
import { default as Popover } from "antd/es/popover";
import { default as Typography } from "antd/es/typography";
import LayoutHeader from "components/layout/Header";
import { SHARE_TITLE } from "constants/apiConstants";
import { AppTypeEnum } from "constants/applicationConstants";
import {
  ALL_APPLICATIONS_URL,
  AUTH_LOGIN_URL,
  preview,
} from "constants/routesURL";
import { CurrentUser, User } from "constants/userConstants";
import {
  CommonTextLabel,
  CustomModal,
  DropdownMenu,
  EditText,
  Layout,
  Left,
  Middle,
  ModuleIcon,
  PackUpIcon,
  RefreshIcon,
  Right,
  TacoButton,
} from "lowcoder-design";
import { trans } from "i18n";
import dayjs from "dayjs";
import { useContext, useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  publishApplication,
  updateAppMetaAction,
} from "redux/reduxActions/applicationActions";
import {
  recoverSnapshotAction,
  setShowAppSnapshot,
} from "redux/reduxActions/appSnapshotActions";
import { currentApplication, isPublicApplication } from "redux/selectors/applicationSelector";
import {
  getSelectedAppSnapshot,
  showAppSnapshotSelector,
} from "redux/selectors/appSnapshotSelector";
import { getUser, isFetchingUser } from "redux/selectors/usersSelectors";
import styled, { css } from "styled-components";
import { ExternalEditorContext } from "util/context/ExternalEditorContext";
import history from "util/history";
import { useApplicationId } from "util/hooks";
import { canManageApp } from "util/permissionUtils";
import ProfileDropdown from "./profileDropdown";
import { Logo, LogoHome, LogoWithName } from "@lowcoder-ee/assets/images";
import { HeaderStartDropdown } from "./headerStartDropdown";
import { AppPermissionDialog } from "../../components/PermissionDialog/AppPermissionDialog";
import { getBrandingConfig } from "../../redux/selectors/configSelectors";
import { messageInstance } from "lowcoder-design/src/components/GlobalInstances";
import { EditorContext } from "../../comps/editorState";
import Tooltip from "antd/es/tooltip";
import { LockOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import Avatar from 'antd/es/avatar';
import UserApi from "@lowcoder-ee/api/userApi";
import { validateResponse } from "@lowcoder-ee/api/apiUtils";
import ProfileImage from "./profileImage";
import { getBrandingSettings } from "@lowcoder-ee/redux/selectors/commonSettingSelectors";
import { buildMaterialPreviewURL } from "@lowcoder-ee/util/materialUtils";

const { Countdown } = Statistic;
const { Text } = Typography;

const StyledLink = styled.a`
  display: flex;
  align-items: center;
  margin-right: 12px;
`;

const LogoIcon = styled(Logo)`
  min-width: 24px;
  max-width: 24px;
`;

const IconCss = css<{ $show?: boolean }>`
  &:hover {
    background-color: #8b8fa34c;
  }

  & g g {
    stroke: ${(props) => (props.$show ? "#dddddd" : "#dddddd65")};
  }

  &:hover g g {
    stroke: #ffffff;
  }

  cursor: pointer;
`;
const LayoutIcon = styled(Layout)`
  ${IconCss}
`;
const LeftIcon = styled(Left)`
  ${IconCss}
`;
const MiddleIcon = styled(Middle)<{ $show: boolean }>`
  ${IconCss}
  & g line {
    stroke: ${(props) => (props.$show ? "#dddddd" : "#dddddd65")};
  }

  &:hover g line {
    stroke: #ffffff;
  }

  & g rect {
    stroke: ${(props) => (props.$show ? "#dddddd" : "#dddddd65")};
  }

  &:hover g rect {
    stroke: #ffffff;
  }
`;

const RightIcon = styled(Right)`
  ${IconCss}
`;
const IconRadius = styled.div<{ disabled?: boolean }>`
  width: 28px;
  height: 28px;
  border-radius: 4px;
  overflow: hidden;

  ${(props) =>
    props.disabled &&
    `
    svg {
       pointer-events: none;
       g g {
         stroke: #dddddd30;
       }
    }
    cursor: not-allowed;  
  `}
`;

const PreviewBtn = styled(TacoButton)`
  padding: 4px 12px;
  height: 28px;
  background: #4965f2;
  border-radius: 4px 0 0 4px;
`;

const SnapshotBtnWrapper = styled.div`
  margin-left: 14px;
  display: flex;
  gap: 8px;
`;

const RecoverSnapshotBtn = styled(TacoButton)`
  padding: 4px 7px;
  height: 28px;

  &:disabled,
  &:disabled:hover {
    background: #4965f2;
    border: 1px solid #4965f2;
    color: #ffffff;
    opacity: 0.35;
  }
`;

const LoginBtn = styled(TacoButton)`
  padding: 4px 7px;
  height: 28px;
  margin-right: 4px;
`;
const GrayBtn = styled(TacoButton)`
  &&& {
    color: #ffffff;
    background: #8b8fa34c;
    border: none;
    height: 28px;
    padding: 4px 13px;
    margin-right: 8px;
    cursor: pointer;
    --antd-wave-shadow-color: #8b8fa34c;

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
    
    &[disabled] {
      cursor: not-allowed;
    }
  }
`;

const attrs = () => ({
  tabIndex: 0,
});

const ViewOnlyLabel = styled.span`
  font-size: 12px;
  color: #b8b9bf;
  line-height: 12px;
  margin-left: -22px;
`;

const PackUpIconStyled = styled(PackUpIcon)`
  transform: rotate(180deg);
  margin-left: 4px;
  min-width: 18px;

  path {
    fill: #ffffff;
  }
`;

const PackUpBtn = styled(TacoButton)`
  padding: 0;
  width: 28px;
  height: 28px;
  border-radius: 0 4px 4px 0;
  margin-right: 24px;
  margin-left: 1px;

  svg {
    transform: rotate(180deg);
    width: 18px;

    path {
      fill: #ffffff;
    }
  }

  &.ant-dropdown-open {
    background-color: #3a51c2;
    border-color: #3a51c2;
  }
`;

const DropdownStyled = styled(Dropdown)`
  &.ant-dropdown-open {
    background-color: #8b8fa34c;
  }
`;

const Wrapper = styled.div`
  .taco-edit-text-wrapper {
    width: fit-content;
    max-width: 288px;
  }

  input {
    width: 288px;
    border-radius: 4px;
  }
`;

const Prefix = styled.div`
  display: inline-flex;
  align-items: center;
  margin-right: 4px;

  &.module svg {
    visibility: visible;
  }
`;

const EditingNoticeWrapper = styled.div`
  display: flex;
  align-items: center;
  background-color: #ffe6e6; /* Light red background for warning */
  padding: 2px 8px;
  border-radius: 5px;
  margin-right: 8px;
`;

const EditingHintText = styled.span`
  margin-left: 8px;
  font-size: 12px;
  color: #ff4d4f; /* Red color to indicate warning */
`;

const WarningIcon = styled(ExclamationCircleOutlined)`
  margin-left: 8px;
  font-size: 16px;
  color: #ff4d4f; /* Red color for the icon */
`;

const StyledCountdown = styled(Countdown)`
  .ant-statistic-content {
    color: #ff4d4f;
    margin-top: 2px;
    text-align: center;
  }
`;

const StyledRefreshIcon = styled(RefreshIcon)`
  width: 16px !important;
  height: 16px !important;
  margin-right: -3px !important;
  > g > g {
    stroke: white;
  }
`;

// Add the lock icon logic for disabled options
const DropdownMenuStyled = styled(DropdownMenu)`
  .ant-dropdown-menu-item:hover {
    background: ${(props) =>
      props.disabled ? 'inherit' : '#edf4fa'};
    cursor: ${(props) =>
      props.disabled ? 'not-allowed' : 'pointer'};
  }
`;

const BrandLogo = styled.img`
  height: 28px;
`

function HeaderProfile(props: { user: User }) {
  const { user } = props;
  const fetchingUser = useSelector(isFetchingUser);
  if (fetchingUser) {
    return <Skeleton.Avatar shape="circle" size={28} />;
  }
  return (
    <div>
      {user.isAnonymous ? (
        <LoginBtn
          buttonType="primary"
          onClick={() => history.push(AUTH_LOGIN_URL)}
        >
          {trans("userAuth.login")}
        </LoginBtn>
      ) : (
        <ProfileDropdown user={user} profileSide={28} fontSize={12} />
      )}
    </div>
  );
}

const setCountdown = () => dayjs().add(3, 'minutes').toISOString();

export type PanelStatus = { left: boolean; bottom: boolean; right: boolean };
export type TogglePanel = (panel?: keyof PanelStatus) => void;

export type EditorModeStatus = "layout" | "logic" | "both";
export type ToggleEditorModeStatus = (
  editorModeStatus?: EditorModeStatus
) => void;

type HeaderProps = {
  panelStatus: PanelStatus;
  togglePanel: TogglePanel;
  editorModeStatus: EditorModeStatus;
  toggleEditorModeStatus: ToggleEditorModeStatus;
};

// header in editor page
export default function Header(props: HeaderProps) {
  const editorState = useContext(EditorContext);
  const { blockEditing, fetchApplication } = useContext(ExternalEditorContext);
  const { togglePanel } = props;
  const { toggleEditorModeStatus } = props;
  const { left, bottom, right } = props.panelStatus;
  const user = useSelector(getUser);
  const application = useSelector(currentApplication);
  const isPublicApp = useSelector(isPublicApplication);
  const applicationId = useApplicationId();
  const dispatch = useDispatch();
  const showAppSnapshot = useSelector(showAppSnapshotSelector);
  const {selectedSnapshot, isArchivedSnapshot} = useSelector(getSelectedAppSnapshot);
  const brandingSettings = useSelector(getBrandingSettings);
  const { appType } = useContext(ExternalEditorContext);
  const [editName, setEditName] = useState(false);
  const [editing, setEditing] = useState(false);
  const [permissionDialogVisible, setPermissionDialogVisible] = useState(false);
  const [editingUser, setEditingUser] = useState<CurrentUser>();
  const [enableCheckEditingStatus, setEnableCheckEditingStatus] = useState<boolean>(false);
  const editingCountdown = useRef(setCountdown());

  const isModule = appType === AppTypeEnum.Module;

  useEffect(() => {
    if(blockEditing && application && Boolean(application?.editingUserId)) {
      UserApi.getUserDetail(application.editingUserId!)
        .then(resp => {
          if (validateResponse(resp)) {

            console.log('editing user', resp.data.data);
            setEditingUser(resp.data.data);
          }
        });
    }
  }, [blockEditing]);

  const editorModeOptions = [
    {
      label: trans("header.editorMode_layout"),
      tooltip: trans("header.editorMode_layout_tooltip"),
      key: "editorModeSelector_layout",
      value: "layout",
    },
    {
      label: trans("header.editorMode_logic"),
      tooltip: trans("header.editorMode_logic_tooltip"),
      key: "editorModeSelector_logic",
      value: "logic",
    },
    {
      label: trans("header.editorMode_both"),
      key: "editorModeSelector_both",
      value: "both",
    },
  ];

  const onEditorStateValueChange = ({
    target: { value },
  }: RadioChangeEvent) => {
    toggleEditorModeStatus(value);
    editorState.setEditorModeStatus(value);
  };


  const headerStart = (
    <>
      <StyledLink onClick={() => history.push(ALL_APPLICATIONS_URL)}>
        {/* {REACT_APP_LOWCODER_SHOW_BRAND === 'true' ? REACT_APP_LOWCODER_CUSTOM_LOGO_SQUARE !== "" ? <img src={REACT_APP_LOWCODER_CUSTOM_LOGO_SQUARE } height={24} width={24} alt="logo" /> :<LogoIcon /> :  <LogoHome />} */}
        { brandingSettings?.squareLogo
          ? <BrandLogo src={buildMaterialPreviewURL(brandingSettings?.squareLogo)} />
          : <LogoHome />
        }
      </StyledLink>
      {editName ? (
        <Wrapper>
          <EditText
            prefixIcon={isModule && <ModuleIcon />}
            disabled={showAppSnapshot}
            style={showAppSnapshot ? { maxWidth: "fit-content" } : {}}
            text={application?.name ?? ""}
            editing={editing}
            onFinish={(value) => {
              if (!value.trim()) {
                messageInstance.warning(trans("header.nameCheckMessage"));
                return;
              }
              dispatch(
                updateAppMetaAction({
                  applicationId: applicationId,
                  name: value,
                })
              );
              setEditName(false);
            }}
          />
        </Wrapper>
      ) : (
        <HeaderStartDropdown
          setEdit={() => {
            setEditName(true);
            setEditing(true);
          }}
        />
      )}
      {showAppSnapshot && (
        <ViewOnlyLabel>{trans("header.viewOnly")}</ViewOnlyLabel>
      )}
    </>
  );

  const headerMiddle = (
    <>
      <Radio.Group
        onChange={onEditorStateValueChange}
        value={props.editorModeStatus}
        optionType="button"
        buttonStyle="solid"
        size="small"
      >
        {editorModeOptions.map((option) => (
          <Tooltip key={option.key} title={option.tooltip}>
            <Radio.Button key={option.key} value={option.value}>
              {option.label}
            </Radio.Button>
          </Tooltip>
        ))}
      </Radio.Group>
      <IconRadius>
        <LeftIcon onClick={() => togglePanel("left")} $show={left} />
      </IconRadius>
      <IconRadius>
        <MiddleIcon onClick={() => togglePanel("bottom")} $show={bottom} />
      </IconRadius>
      <IconRadius disabled={showAppSnapshot}>
        <RightIcon onClick={() => togglePanel("right")} $show={right} />
      </IconRadius>
      {showAppSnapshot && (
        <SnapshotBtnWrapper>
          <RecoverSnapshotBtn
            disabled={!selectedSnapshot}
            buttonType="primary"
            onClick={() => {
              if (!application || !selectedSnapshot) return;
              CustomModal.confirm({
                title: trans("header.recoverAppSnapshotTitle"),
                content: trans("header.recoverAppSnapshotContent", {
                  time: dayjs(selectedSnapshot.createTime).format(
                    "YYYY-MM-DD HH:mm"
                  ),
                }),
                onConfirm: () => {
                  dispatch(
                    recoverSnapshotAction(
                      application.applicationId,
                      selectedSnapshot.snapshotId,
                      selectedSnapshot.createTime,
                      isArchivedSnapshot,
                    )
                  );
                },
              });
            }}
          >
            {trans("header.recoverAppSnapshotMessage")}
          </RecoverSnapshotBtn>
          <GrayBtn onClick={() => dispatch(setShowAppSnapshot(false))}>
            {trans("header.returnEdit")}
          </GrayBtn>
        </SnapshotBtnWrapper>
      )}
    </>
  );

  const headerEnd = useMemo(() => {
    return showAppSnapshot ? (
      <HeaderProfile user={user} />
    ) : (
      <>
        {/* Display a hint about who is editing the app */}
        {blockEditing && Boolean(applicationId) && (
          <>
          <Popover
            style={{ width: 200 }}
            content={() => {
              return (
                <Flex vertical gap={10} align="center" style={{maxWidth : "250px"}}>
                  <Text style={{textAlign : "center"}}> 
                    {trans("header.AppEditingBlockedHint")}
                  </Text>
                  <StyledCountdown
                    title={trans("header.AppEditingBlocked")}
                    value={editingCountdown.current}
                    onFinish={() => {
                      setEnableCheckEditingStatus(true)
                    }}
                  />
                  <Tooltip
                    title={trans("header.AppEditingBlockedMessage")}
                    placement="bottom"
                  >
                    <TacoButton
                      style={{width: '100%'}}
                      buttonType="primary"
                      disabled={blockEditing && !enableCheckEditingStatus}
                      onClick={() => {
                        fetchApplication?.();
                        setEnableCheckEditingStatus(false);
                        editingCountdown.current = setCountdown();
                      }}
                    >
                      <StyledRefreshIcon />
                      <span>{trans("header.AppEditingBlockedCheckStatus")}</span>
                    </TacoButton>
                  </Tooltip>
                </Flex>
              )
            }}
            trigger="hover"
          >
            <EditingNoticeWrapper>
              <ProfileImage source={user.avatarUrl} userName={user.username} side={24} />
              <EditingHintText>
                {`${editingUser?.email || trans("header.AppEditingBlockedSomeone")}` + " " + trans("header.AppEditingBlockedMessageSnipped")}
              </EditingHintText>
              <WarningIcon />
            </EditingNoticeWrapper>
          </Popover>
          </>
        )}

        {Boolean(applicationId) && !isPublicApp && (
          <AppPermissionDialog
            applicationId={applicationId}
            visible={permissionDialogVisible}
            onVisibleChange={(visible) =>
              !visible && setPermissionDialogVisible(false)
            }
          />
        )}
        {canManageApp(user, application) && (
          <GrayBtn onClick={() => setPermissionDialogVisible(true)} disabled={blockEditing}>
            {SHARE_TITLE}
          </GrayBtn>
        )}
  
        <PreviewBtn buttonType="primary" onClick={() => preview(applicationId)}>
          {trans("header.preview")}
        </PreviewBtn>
  
        <Dropdown
          className="cypress-header-dropdown"
          placement="bottomRight"
          trigger={["click"]}
          dropdownRender={() => (
            <DropdownMenuStyled
              style={{ minWidth: "110px", borderRadius: "4px" }}
              onClick={(e) => {
                if (blockEditing) return; // Prevent clicks if the app is being edited by someone else
                if (e.key === "deploy") {
                  dispatch(publishApplication({ applicationId }));
                } else if (e.key === "snapshot") {
                  dispatch(setShowAppSnapshot(true));
                }
              }}
              items={[
                {
                  key: "deploy",
                  label: (
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      {blockEditing && <LockOutlined style={{ marginRight: '8px' }} />}
                      <CommonTextLabel style= {{color: blockEditing ? "#ccc" : "#222"}}>
                        {trans("header.deploy")}
                      </CommonTextLabel>
                    </div>
                  ),
                  disabled: blockEditing,
                },
                {
                  key: "snapshot",
                  label: (
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      {blockEditing && <LockOutlined style={{ marginRight: '8px' }} />}
                      <CommonTextLabel style= {{color: blockEditing ? "#ccc" : "#222"}}>
                        {trans("header.snapshot")}
                      </CommonTextLabel>
                    </div>
                  ),
                  disabled: blockEditing,
                },
              ]}
            />
          )}
        >
          <PackUpBtn buttonType="primary" disabled={blockEditing}>
            <PackUpIcon />
          </PackUpBtn>
        </Dropdown>
  
        <HeaderProfile user={user} />
      </>
    );
  }, [
    user,
    showAppSnapshot,
    applicationId,
    permissionDialogVisible,
    blockEditing, // Include the state in the dependency array
    enableCheckEditingStatus,
    editingUser?.name,
  ]);

  return (
    <LayoutHeader
      headerStart={headerStart}
      headerMiddle={headerMiddle}
      headerEnd={headerEnd}
      style={{
        backgroundColor: brandingSettings?.appHeaderColor
      }}
    />
  );
}

// header in manager page
export function AppHeader() {
  const user = useSelector(getUser);
  const brandingSettings = useSelector(getBrandingSettings);

  const headerStart = (
    <StyledLink onClick={() => history.push(ALL_APPLICATIONS_URL)}>
      {/* {REACT_APP_LOWCODER_SHOW_BRAND === 'true' ?  REACT_APP_LOWCODER_CUSTOM_LOGO !== "" ? <img src={REACT_APP_LOWCODER_CUSTOM_LOGO}  height={28} alt="logo" /> :<LogoWithName branding={!user.orgDev} /> : <LogoHome />} */}
      { brandingSettings?.squareLogo
        ? <BrandLogo src={buildMaterialPreviewURL(brandingSettings?.squareLogo)} />
        : <LogoHome />
      }
    </StyledLink>
  );
  const headerEnd = <HeaderProfile user={user} />;
  return (
    <LayoutHeader
      headerStart={headerStart}
      headerEnd={headerEnd}
      style={{
        backgroundColor: brandingSettings?.appHeaderColor
      }}
    />
  );
}
