import styled from "styled-components";
import { Layers } from "constants/Layers";
import { HelpIcon, LeftHelpIcon, HelpGithubIcon, HelpDiscordIcon } from "lowcoder-design";
import { VideoIcon, ChatIcon, DocIcon, TutorialIcon, ShortcutIcon } from "assets/icons";
import TutorialVideoPic from "assets/images/tutorialVideoThumbnail.png";
import { default as Dropdown } from "antd/es/dropdown";
import { default as Popover } from "antd/es/popover";
import { default as Tooltip } from "antd/es/tooltip";
import {
  customerService,
  showCustomerServicePanel,
  showHelpDropdown,
} from "@lowcoder-ee/pages/common/customerService";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { createApplication } from "redux/reduxActions/applicationActions";
import history from "util/history";
import { buildAppRouteWithState } from "constants/routesURL";
import { getUser } from "redux/selectors/usersSelectors";
import { DropdownMenu } from "lowcoder-design";
import VideoDialog from "pages/common/videoDialog";
import { PlatformApi } from "api/platformApi";
import { CommonTipsOverlay } from "lowcoder-design";
import { markUserStatus } from "redux/reduxActions/userActions";
import { AppTypeEnum } from "constants/applicationConstants";
import { ShortcutListPopup } from "./shortcutListPopup";
import { QuestionIcon, UpgradeIcon } from "lowcoder-design";
import { trans } from "i18n";
import { localEnv } from "util/envUtils";
import { isPublicApplication } from "@lowcoder-ee/redux/selectors/applicationSelector";
import { getBrandingSetting } from "@lowcoder-ee/redux/selectors/enterpriseSelectors";

const StyledMenu = styled(DropdownMenu)<{ $edit: boolean | string }>`
  ${(props) =>
    props.$edit &&
    ` min-width: 203px;
      position: absolute;
      bottom: -30px;
      left: 42px;
    `}
  .taco-version, .taco-version-edit {
    margin: 8px -8px -8px;
    padding: 0 16px;
    height: 35px;
    line-height: 35px;
    border-top: 1px solid #f0f0f0;

    .taco-version-text {
      margin-right: 6px;
    }

    &.ant-dropdown-menu-item:hover {
      background-color: transparent;
      border-radius: 0;
    }

    .ant-dropdown-menu-title-content {
      font-size: 13px;
      cursor: default;
      color: #8b8fa3;
    }
  }
  .taco-version-edit {
    height: 53px;
  }
`;

const HelpWrapper = styled.div`
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: ${Layers.helpIcon};
`;

const HelpDiv = styled.div`
  background: #222222;
  box-shadow: 0 0 10px 0 rgba(0, 0, 0, 0.2);
  border-radius: 50%;
  height: 40px;
  width: 40px;
  cursor: pointer;

  &:hover {
    background: #315efb;
  }

  & > svg {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
  }
`;

const ItemWrapper = styled.div`
  font-size: 13px;
  color: #333333;
  line-height: 15px;
  height: 17px;

  display: flex;
  align-items: center;
  gap: 6px;
`;

const WatchVideoItemWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;

  div {
    height: 13px;
  }

  img {
    height: 100px;
    width: 160px;
    border-radius: 4px;
    box-shadow: 0 0 5px 2px rgb(195, 206, 217, 0.25);
  }
`;

const VersionDiv = styled.div`
  display: flex;

  & svg g path {
    fill: #b8b9bf !important;
  }
`;

const VersionDivEdit = styled.div`
  > span {
    display: block;
    margin-top: 6px;
  }
`;

const SpanStyled = styled.span<{ $selected?: boolean }>`
  display: block;
  width: 26px;
  height: 26px;
  cursor: pointer;
  svg {
    height: 26px;
    width: 26px;
    padding: 5px;

    &:hover,
    &:active {
      background: #8b8fa37f;
      border-radius: 4px;
    }
    ${(props) =>
      props.$selected &&
      `
        background: #8b8fa37f;
        border-radius: 4px;
      `}
  }
`;

const WatchVideoItem = () => {
  return (
    <WatchVideoItemWrapper>
      <ItemWrapper>
        <VideoIcon />
        <span>{trans("help.videoText")}</span>
      </ItemWrapper>
      <img src={TutorialVideoPic} alt="" />
    </WatchVideoItemWrapper>
  );
};

type HelpDropdownProps = {
  showShortcutList?: boolean;
  setShowShortcutList?: (v: boolean) => void;
  isEdit?: boolean;
};

const docHomeUrl = trans("docUrls.docHome");
const changeLogDocUrl = trans("docUrls.changeLog");
const introVideoUrl = trans("docUrls.introVideo");
const issueUrl = trans("lowcoderUrl.createIssue");
const discordUrl = trans("lowcoderUrl.discord");

function HelpDropdownComp(props: HelpDropdownProps) {
  const [showHelp, setShowHelp] = useState(true);
  const [version, setVersion] = useState("");
  const dispatch = useDispatch();
  const user = useSelector(getUser);
  const [videoVisible, setVideoVisible] = useState(false);
  const [toolTipContent, setToolTipContent] = useState<React.ReactNode>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const isPublicApp = useSelector(isPublicApplication);
  const brandingSettings = useSelector(getBrandingSetting);

  const showDocLink = useMemo(() => {
    if (!Boolean(brandingSettings)) return Boolean(docHomeUrl);
    return brandingSettings?.config_set?.showDocumentation;
  }, [brandingSettings?.config_set?.showDocumentation]);

  const showSubmitIssueLink = useMemo(() => {
    if (!Boolean(brandingSettings)) return Boolean(issueUrl);
    return brandingSettings?.config_set?.submitIssue;
  }, [brandingSettings?.config_set?.submitIssue]);

  const showWhatsNewLink = useMemo(() => {
    if (!Boolean(brandingSettings)) return Boolean(changeLogDocUrl);
    return brandingSettings?.config_set?.whatsNew;
  }, [brandingSettings?.config_set?.whatsNew]);

  const closeTooltip = () => {
    // turn of tooltip
    setToolTipContent(null);
    // mark displayed
    dispatch(markUserStatus("olderUserNonDevPopup", true));
  };

  useEffect(() => {
    if (
      !user.userStatus.olderUserNonDevPopup &&
      !user.orgDev &&
      // registered before 2022-07-29 19:00:00
      user.createdTimeMs < 1659092400000
    ) {
      setToolTipContent(
        <CommonTipsOverlay
          onClose={closeTooltip}
          onOk={closeTooltip}
          okBtnText={trans("help.onBtnText")}
          title={trans("help.permissionDenyTitle")}
          content={trans("help.permissionDenyContent")}
        />
      );
    }
  }, [user]);

  useEffect(() => {
    if (localEnv()) {
      setVersion("[LOCAL]");
      return;
    }
    PlatformApi.version().then((res) => {
      if (typeof res.data === "string") {
        setVersion(res.data.trim());
      }
    });
  }, []);

  const onMenuClick = useCallback(
    (e: any) => {
      switch (e.key) {
        case "tutorialVideo":
          setVideoVisible(true);
          return;
        case "customerService":
          showCustomerServicePanel();
          !props.isEdit && setShowHelp(false);
          return;
        case "editorTutorial":
          if (isPublicApp) return;
          dispatch(
            createApplication({
              applicationName: trans("help.appName"),
              applicationType: AppTypeEnum.Application,
              orgId: user.currentOrgId,
              onSuccess: (app) => {
                history.push(buildAppRouteWithState(app.applicationInfoView.applicationId, true));
                setTimeout(() => history.go(0));
              },
            })
          );
          return;
        case "docs":
          if (brandingSettings?.config_set?.documentationLink) {
            return window.open(brandingSettings?.config_set?.documentationLink);
          }
          window.open(docHomeUrl);
          return;
        case "issue":
          window.open(issueUrl);
          return;
        case "discord":
          window.open(discordUrl);
          return;
        case "shortcutList":
          props.setShowShortcutList?.(true);
          return;
        case "changeLog":
          if (brandingSettings?.config_set?.whatsNewLink) {
            return window.open(brandingSettings?.config_set?.whatsNewLink);
          }
          window.open(changeLogDocUrl);
          return;
      }
    },
    [dispatch, setVideoVisible, setShowHelp, user]
  );

  const overlayMenus = (
    <StyledMenu
      $edit={props.isEdit || false}
      onClick={(params) => {
        if (params.key !== "version") {
          setShowDropdown(false);
        }
        onMenuClick(params);
      }}
      items={[
        introVideoUrl
          ? {
              key: "tutorialVideo",
              label: <WatchVideoItem />,
            }
          : null,
        customerService
          ? {
              key: "customerService",
              label: (
                <ItemWrapper>
                  {customerService(() => setShowHelp(true))}
                  <ChatIcon />
                  <span>{trans("help.chat")}</span>
                </ItemWrapper>
              ),
            }
          : null,
        showDocLink ? {
          key: "docs",
          label: (
            <ItemWrapper>
              <DocIcon />
              <span>{trans("help.docs")}</span>
            </ItemWrapper>
          ),
        } : null,
        showSubmitIssueLink
          ? {
              key: "issue",
              label: (
                <ItemWrapper>
                  <HelpGithubIcon />
                  <span>{trans("help.submitIssue")}</span>
                </ItemWrapper>
              ),
            }
          : null,
        discordUrl
          ? {
              key: "discord",
              label: (
                <ItemWrapper>
                  <HelpDiscordIcon />
                  <span>{trans("help.chat")}</span>
                </ItemWrapper>
              ),
            }
          : null,
        {
          key: "editorTutorial",
          label: (
            <ItemWrapper>
              <TutorialIcon />
              <span>{trans("help.editorTutorial")}</span>
            </ItemWrapper>
          ),
        },
        props.setShowShortcutList
          ? {
              key: "shortcutList",
              label: (
                <ItemWrapper>
                  <ShortcutIcon />
                  <span>{trans("shortcut.shortcutList")}</span>
                </ItemWrapper>
              ),
            }
          : null,
          showWhatsNewLink
          ? {
              key: "changeLog",
              label: (
                <ItemWrapper>
                  <UpgradeIcon />
                  <span>{trans("help.update")}</span>
                </ItemWrapper>
              ),
            }
          : null,
        {
          key: "version",
          className: !props.isEdit ? "taco-version" : "taco-version-edit",
          label: props.isEdit ? (
            <VersionDivEdit>
              <div>
                {trans("help.versionWithColon")}
                {version}-{REACT_APP_COMMIT_ID}
              </div>
              {REACT_APP_BUILD_ID && <span>Build: {REACT_APP_BUILD_ID}</span>}
            </VersionDivEdit>
          ) : (
            <VersionDiv>
              <span className="taco-version-text">
                {trans("help.version")} {version}
              </span>
              <Tooltip
                title={
                  <>
                    <div>
                      {trans("help.versionWithColon")}
                      {version}-{REACT_APP_COMMIT_ID}
                    </div>
                    {REACT_APP_BUILD_ID && <span>Build: {REACT_APP_BUILD_ID}</span>}
                  </>
                }
                placement="topLeft"
              >
                <QuestionIcon style={{ cursor: "pointer" }} />
              </Tooltip>
            </VersionDiv>
          ),
        },
      ]}
    />
  );

  if (!showHelp || !showHelpDropdown(props.isEdit || false)) {
    return null;
  }

  return (<>
    {introVideoUrl && (
      <VideoDialog
        visible={videoVisible}
        setVisible={(v) => setVideoVisible(v)}
        videoSrc={introVideoUrl}
      />
    )}
    <HelpWrapper>
      {toolTipContent && (
        <Popover
          content={toolTipContent}
          open={true}
          align={{
            points: ["br", "cc"],
            offset: [-16, 24],
          }}
          placement="left"
        >
          <span />
        </Popover>
      )}
      {props.showShortcutList && props.setShowShortcutList && (
        <ShortcutListPopup setShowShortcutList={props.setShowShortcutList} />
      )}
      <Dropdown
        popupRender={() => overlayMenus}
        placement="topRight"
        trigger={["click"]}
        open={showDropdown}
        onOpenChange={(open: boolean) => setShowDropdown(open)}
      >
        {props.isEdit ? (
          <SpanStyled $selected={showDropdown}>
            <LeftHelpIcon />
          </SpanStyled>
        ) : (
          <HelpDiv>
            <HelpIcon />
          </HelpDiv>
        )}
      </Dropdown>
    </HelpWrapper>
  </>);
}

export const HelpDropdown = React.memo(HelpDropdownComp);
