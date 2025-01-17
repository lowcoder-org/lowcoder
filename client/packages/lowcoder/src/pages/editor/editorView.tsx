import { default as Divider } from "antd/es/divider";
import { default as Menu } from "antd/es/menu";
import { default as Sider} from "antd/es/layout/Sider";
import { PreloadComp } from "comps/comps/preLoadComp";
import UIComp from "comps/comps/uiComp";
import { EditorContext } from "comps/editorState";
import { AppPathParams, AppUILayoutType } from "constants/applicationConstants";
import { Layers } from "constants/Layers";
import { TopHeaderHeight } from "constants/style";
import { trans } from "i18n";
import { draggingUtils } from "layout";
import {
  LeftPreloadIcon,
  LeftSettingIcon,
  LeftStateIcon,
  LeftLayersIcon,
  LeftColorPaletteIcon,
  LeftJSSettingIcon,
  ScrollBar,
} from "lowcoder-design";
import { useTemplateViewMode } from "util/hooks";
import {
  type PanelStatus,
  type TogglePanel,
  type EditorModeStatus,
  type ToggleEditorModeStatus
} from "pages/common/header";
import {
  editorContentClassName,
  UserGuideLocationState,
} from "pages/tutorials/tutorialsConstant";
import React, {
  Suspense,
  lazy,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useState,
} from "react";
import { Helmet } from "react-helmet";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useParams } from "react-router-dom";
import { setEditorExternalStateAction } from "redux/reduxActions/configActions";
import { currentApplication, isPublicApplication } from "redux/selectors/applicationSelector";
import { showAppSnapshotSelector } from "redux/selectors/appSnapshotSelector";
import styled from "styled-components";
import { ExternalEditorContext } from "util/context/ExternalEditorContext";
import {
  DefaultPanelStatus,
  getPanelStatus,
  savePanelStatus,
  getEditorModeStatus,
  saveEditorModeStatus,
} from "util/localStorageUtil";
import { isAggregationApp } from "util/appUtils";
import EditorSkeletonView from "./editorSkeletonView";
import { getBrandingSettings, getCommonSettings } from "@lowcoder-ee/redux/selectors/commonSettingSelectors";
import { isEqual, noop } from "lodash";
import { AppSettingContext, AppSettingType } from "@lowcoder-ee/comps/utils/appSettingContext";
// import { BottomSkeleton } from "./bottom/BottomContent";

const Header = lazy(
    () => import("pages/common/header")
        .then(module => ({default: module.default}))
);

const BottomSkeleton = lazy(
    () => import("pages/editor/bottom/BottomContent")
        .then(module => ({default: module.BottomSkeleton}))
);

const LeftContent = lazy(
  () => import('./LeftContent')
    .then(module => ({default: module.LeftContent}))
);
const LeftLayersContent = lazy(
  () => import('./LeftLayersContent')
    .then(module => ({default: module.LeftLayersContent}))
);
const RightPanel = lazy(() => import('pages/editor/right/RightPanel'));
const EditorTutorials = lazy(() => import('pages/tutorials/editorTutorials'));
const Bottom = lazy(() => import('./bottom/BottomPanel'));
const CustomShortcutWrapper = lazy(
  () => import('pages/editor/editorHotKeys')
    .then(module => ({default: module.CustomShortcutWrapper}))
);
const EditorGlobalHotKeys = lazy(
  () => import('pages/editor/editorHotKeys')
    .then(module => ({default: module.EditorGlobalHotKeys}))
);
const EditorHotKeys = lazy(
  () => import('pages/editor/editorHotKeys')
    .then(module => ({default: module.EditorHotKeys}))
);
const Body = lazy(
  () => import('pages/common/styledComponent')
    .then(module => ({default: module.Body}))
);
const EditorContainer = lazy(
  () => import('pages/common/styledComponent')
    .then(module => ({default: module.EditorContainer}))
);
const EditorContainerWithViewMode = lazy(
  () => import('pages/common/styledComponent')
    .then(module => ({default: module.EditorContainerWithViewMode}))
);
const Height100Div = lazy(
  () => import('pages/common/styledComponent')
    .then(module => ({default: module.Height100Div}))
);
const LeftPanel = lazy(
  () => import('pages/common/styledComponent')
    .then(module => ({default: module.LeftPanel}))
);
const MiddlePanel = lazy(
  () => import('pages/common/styledComponent')
    .then(module => ({default: module.MiddlePanel}))
);
const HelpDropdown = lazy(
  () => import('pages/common/help')
    .then(module => ({default: module.HelpDropdown}))
);
const PreviewHeader = lazy(
  () => import('pages/common/previewHeader')
    .then(module => ({default: module.PreviewHeader}))
);

const HookCompContainer = styled.div`
  pointer-events: none;
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  width: 100%;
  contain: paint;
  z-index: ${Layers.hooksCompContainer};
`;

const ViewBody = styled.div<{ $hideBodyHeader?: boolean; $height?: number }>`
  height: ${(props) => `calc(${
    props.$height ? props.$height + "px" : "100vh"
  } - env(safe-area-inset-bottom) -
      ${props.$hideBodyHeader ? "0px" : TopHeaderHeight}
  )`};
`;

const SiderWrapper = styled.div<{
  $bgColor?: string;
  $fontColor?: string;
  $activeBgColor?: string;
  $activeFontColor?: string;
}>`
  .ant-menu {
    background-color: ${props => props.$bgColor ? props.$bgColor : '#393b47'};
    height: calc(100vh - 48px);

    .ant-menu-item {
      padding: 0 7px !important;
      width: 40px;
      height: 26px;
      margin: 12px 0 0 0;

      svg {
        height: 26px;
        width: 26px;
        padding: 5px;
      }

      &.ant-menu-item-selected,
      &:hover,
      &:active {
        background-color: ${props => props.$bgColor ? props.$bgColor : '#393b47'};
        svg {
          background: ${props => props.$activeBgColor ? props.$activeBgColor : '#8b8fa37f'};
          color: ${props => props.$activeFontColor ? props.$activeFontColor : '#ffffffa6'};
          border-radius: 4px;
        }
      }
    }
  }

  z-index: ${Layers.leftToolbar};
`;
const HelpDiv = styled.div`
  > div {
    left: 6px;
    right: auto;
    height: 28px;
    bottom: 36px;

    > div.shortcutList {
      left: 42px;
      bottom: 2px;
    }
  }
`;

const LayoutMenuDiv = styled.div`
  > div {
    left: 6px;
    right: auto;
    height: 28px;
    top: 15px;
  }
`;

const SettingsDiv = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;

  .ant-divider {
    margin: 16px 0;
    border-color: #e1e3eb;
  }
`;
const TitleDiv = styled.div`
  font-weight: 500;
  font-size: 14px;
  color: #8b8fa3;
  line-height: 14px;
  margin: 16px;
`;
const PreloadDiv = styled.div`
  margin: 16px 8px;
  height: 33px;
  display: flex;
  align-items: center;
  padding: 0 8px 0 7px;
  color: #333;
  cursor: pointer;

  svg {
    margin-right: 8px;

    path {
      fill: #222222;
    }
  }

  &:hover,
  &:active {
    background: #f2f7fc;
    border-radius: 4px;

    svg path {
      fill: #315efb;
    }
  }
`;

export const EditorWrapper = styled.div`
  overflow: auto;
  position: relative;
  flex: 1 1 0;
`;

interface EditorViewProps {
  uiComp: InstanceType<typeof UIComp>;
  preloadComp: InstanceType<typeof PreloadComp>;
}

enum SiderKey {
  State = "state",
  Setting = "setting",
  Layout = "layout",
  Canvas = "canvas",
  JS = "js",
}

const standardSiderItems = [
  {
    key: SiderKey.State,
    icon: <LeftStateIcon />,
  },
  {
    key: SiderKey.Setting,
    icon: <LeftSettingIcon />,
  },
  {
    key: SiderKey.Canvas,
    icon: <LeftColorPaletteIcon />,
  },
  {
    key: SiderKey.JS,
    icon: <LeftJSSettingIcon />,
  },
  {
    key: SiderKey.Layout,
    icon: <LeftLayersIcon />,
  },
];

const aggregationSiderItems = [
  {
    key: SiderKey.State,
    icon: <LeftStateIcon />,
  },
  {
    key: SiderKey.Setting,
    icon: <LeftSettingIcon />,
  }
];

function EditorView(props: EditorViewProps) {
  const { uiComp } = props;
  const params = useParams<AppPathParams>();
  const editorState = useContext(EditorContext);
  const { readOnly, hideHeader } = useContext(ExternalEditorContext);
  const application = useSelector(currentApplication);
  const isPublicApp = useSelector(isPublicApplication);
  const commonSettings = useSelector(getCommonSettings);
  const locationState = useLocation<UserGuideLocationState>().state;
  const showNewUserGuide = locationState?.showNewUserGuide;
  const showAppSnapshot = useSelector(showAppSnapshotSelector);
  const brandingSettings = useSelector(getBrandingSettings);
  const [showShortcutList, setShowShortcutList] = useState(false);
  const toggleShortcutList = useCallback(
    () => setShowShortcutList(!showShortcutList),
    [showShortcutList]
  );
  const [menuKey, setMenuKey] = useState<string>(SiderKey.State);
  const [height, setHeight] = useState<number>();
  const dispatch = useDispatch();

  const [panelStatus, setPanelStatus] = useState(() => {
    return showNewUserGuide ? DefaultPanelStatus : getPanelStatus();
  });

  const [prePanelStatus, setPrePanelStatus] =
    useState<PanelStatus>(DefaultPanelStatus);

  const isViewMode = params.viewMode === 'view';

  const appSettingsComp = editorState.getAppSettingsComp();
  const { showHeaderInPublic } = appSettingsComp.getView();

  const togglePanel: TogglePanel = useCallback(
    (key) => {
      let newPanelStatus;
      if (key) {
        newPanelStatus = Object.assign({}, panelStatus);
        newPanelStatus[key] = !panelStatus[key];
      } else {
        if (Object.values(panelStatus).some((value) => value)) {
          setPrePanelStatus(panelStatus);
          newPanelStatus = { left: false, bottom: false, right: false };
        } else {
          newPanelStatus = prePanelStatus;
        }
      }
      setPanelStatus(newPanelStatus);
      savePanelStatus(newPanelStatus);
    },
    [panelStatus, prePanelStatus]
  );

  // added by Falk Wolsky to support a Layout and Logic Mode in Lowcoder
  const [editorModeStatus, setEditorModeStatus] = useState(() => {
    return getEditorModeStatus();
  });

  const toggleEditorModeStatus: ToggleEditorModeStatus = useCallback(
    (value) => {
      setEditorModeStatus(value ? value : ("both" as EditorModeStatus));
      saveEditorModeStatus(value ? value : ("both" as EditorModeStatus));
    },
    [editorModeStatus]
  );

  const onCompDrag = useCallback(
    (dragCompKey: string) => {
      editorState.setDraggingCompType(dragCompKey);
    },
    [editorState]
  );
  const setShowPropertyPane = useCallback(
    (tabKey: string) => {
      editorState.setShowPropertyPane(tabKey === "property");
    },
    [editorState]
  );

  const hookCompViews = useMemo(() => {
    return Object.keys(editorState.getHooksComp().children).map((key) => (
      // use appId as key, remount hook comp when app change. fix hookStateComp empty value
      <div key={key + "-" + application?.applicationId}>
        {editorState.getHooksComp().children[key].getView()}
      </div>
    ));
  }, [editorState]);

  useLayoutEffect(() => {
    function updateSize() {
      setHeight(window.innerHeight);
    }

    const eventType =
      "orientationchange" in window ? "orientationchange" : "resize";
    window.addEventListener(eventType, updateSize);
    updateSize();
    return () => window.removeEventListener(eventType, updateSize);
  }, []);

  const hideBodyHeader = useTemplateViewMode() || (isViewMode && (!showHeaderInPublic || !commonSettings.showHeaderInPublicApps));

  const uiCompView = useMemo(() => {
    if (showAppSnapshot) {
      return (
        <ViewBody $hideBodyHeader={hideBodyHeader} $height={height}>
          <EditorContainer>{uiComp.getView()}</EditorContainer>
        </ViewBody>
      );
    }
    
    return uiComp.getView();
  }, [
    showAppSnapshot,
    hideBodyHeader,
    height,
    uiComp,
  ]);

  // we check if we are on the public cloud
  const isLowCoderDomain = window.location.hostname === 'app.lowcoder.cloud';
  const isLocalhost = window.location.hostname === 'localhost';
  if (readOnly && hideHeader) {
    return (
      <CustomShortcutWrapper>
        {uiComp.getView()}
        <div style={{ zIndex: Layers.hooksCompContainer }}>{hookCompViews}</div>
      </CustomShortcutWrapper>
    );
  }

  if (readOnly && !showAppSnapshot) {
    return (
      <CustomShortcutWrapper>
        <Helmet>
        {application && <title>{appSettingsComp?.children?.title?.getView?.() || application?.name}</title>}
          {isLowCoderDomain || isLocalhost && [
            // Adding Support for iframely to be able to embedd apps as iframes
            application?.name ? ([
              <meta key="iframely:title" property="iframely:title" content={application.name} />,
              <meta key="iframely:description" property="iframely:description" content={application.description} />,
            ]) : ([
              <meta key="iframely:title" property="iframely:title" content="Lowcoder 3" />,
              <meta key="iframely:description" property="iframely:description" content="Lowcoder | rapid App & VideoMeeting builder for everyone." />,
            ]),
            <link rel="iframely" type="text/html" href={window.location.href} media="(aspect-ratio: 1280/720)"/>,
            <link key="preconnect-googleapis" rel="preconnect" href="https://fonts.googleapis.com" />,
            <link key="preconnect-gstatic" rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />,
            <link key="font-ubuntu" href="https://fonts.googleapis.com/css2?family=Ubuntu:ital,wght@0,300;0,400;0,700;1,400&display=swap" rel="stylesheet" />,
            // adding Clearbit Support for Analytics
            <script key="clearbit-script" src="https://tag.clearbitscripts.com/v1/pk_dfbc0aeefb28dc63475b67134facf127/tags.js" referrerPolicy="strict-origin-when-cross-origin" type="text/javascript"></script>,
            <script async defer src="//js-eu1.hs-scripts.com/144574215.js" type="text/javascript" id="hs-script-loader"></script>
          ]}
        </Helmet>
        <Suspense fallback={<EditorSkeletonView />}>
          {!hideBodyHeader && <PreviewHeader />}
          <EditorContainerWithViewMode>
            <ViewBody $hideBodyHeader={hideBodyHeader} $height={height}>
              {uiComp.getView()}
            </ViewBody>
            <div style={{ zIndex: Layers.hooksCompContainer }}>
              {hookCompViews}
            </div>
          </EditorContainerWithViewMode>
        </Suspense>
      </CustomShortcutWrapper>
    );
  }
  
  // history mode, display with the right panel, a little trick
  const showRight = panelStatus.right || showAppSnapshot;

  const clickMenu = (params: { key: string }) => {
    let left = true;
    if (panelStatus.left && params.key === menuKey) {
      left = false;
    }
    setPanelStatus({ ...panelStatus, left });
    savePanelStatus({ ...panelStatus, left });
    setMenuKey(params.key);
  };

  return (
    <>
    <Helmet>
      {application && <title>{appSettingsComp?.children?.title?.getView?.() || application?.name}</title>}
      {isLowCoderDomain || isLocalhost && [
        // Adding Support for iframely to be able to embedd apps as iframes
        application?.name ? ([
          <meta key="iframely:title" property="iframely:title" content={application.name} />,
          <meta key="iframely:description" property="iframely:description" content={application.description} />,
        ]) : ([
          <meta key="iframely:title" property="iframely:title" content="Lowcoder 3" />,
          <meta key="iframely:description" property="iframely:description" content="Lowcoder | rapid App & VideoMeeting builder for everyone." />,
        ]),
        <link key="iframely" rel="iframely" type="text/html" href={window.location.href} media="(aspect-ratio: 1280/720)" />,
        <link key="preconnect-googleapis" rel="preconnect" href="https://fonts.googleapis.com" />,
        <link key="preconnect-gstatic" rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />,
        <link key="font-ubuntu" href="https://fonts.googleapis.com/css2?family=Ubuntu:ital,wght@0,300;0,400;0,700;1,400&display=swap" rel="stylesheet" />,
        // adding Clearbit Support for Analytics
        <script key="clearbit-script" src="https://tag.clearbitscripts.com/v1/pk_dfbc0aeefb28dc63475b67134facf127/tags.js" referrerPolicy="strict-origin-when-cross-origin" type="text/javascript"></script>
      ]}
    </Helmet>
    <Height100Div
      onDragEnd={(e) => {
        // log.debug("layout: onDragEnd. Height100Div");
        editorState.setDragging(false);
        draggingUtils.clearData();
      } }
    >
        {isPublicApp
          ? <PreviewHeader />
          : (
            <Header
              togglePanel={togglePanel}
              panelStatus={panelStatus}
              toggleEditorModeStatus={toggleEditorModeStatus}
              editorModeStatus={editorModeStatus}
            />
          )
        }

        {showNewUserGuide && <EditorTutorials />}
        <EditorGlobalHotKeys
          disabled={readOnly}
          togglePanel={togglePanel}
          panelStatus={panelStatus}
          toggleShortcutList={toggleShortcutList}
        >
          <Body>
            <SiderWrapper
              $bgColor={brandingSettings?.editorSidebarColor}
              $fontColor={brandingSettings?.editorSidebarFontColor}
              $activeBgColor={brandingSettings?.editorSidebarActiveBgColor}
              $activeFontColor={brandingSettings?.editorSidebarActiveFontColor}
            >
              <Sider width={40}>
                <Menu
                  theme="dark"
                  mode="inline"
                  defaultSelectedKeys={[SiderKey.State]}
                  selectedKeys={panelStatus.left ? [menuKey] : [""]}
                  items={application &&
                    !isAggregationApp(
                      AppUILayoutType[application.applicationType]
                    ) ? standardSiderItems : aggregationSiderItems}
                  disabled={showAppSnapshot}
                  onClick={(params) => clickMenu(params)}
                >
                </Menu>

                {!showAppSnapshot && (
                  <HelpDiv>
                    <HelpDropdown
                      showShortcutList={showShortcutList}
                      setShowShortcutList={setShowShortcutList}
                      isEdit={true} />
                  </HelpDiv>
                )}
              </Sider>
            </SiderWrapper>
            <Suspense fallback={null}>
              {panelStatus.left && editorModeStatus !== "layout" && (
                <LeftPanel>
                  {menuKey === SiderKey.State && <LeftContent uiComp={uiComp} />}
                  <AppSettingContext.Provider value={{settingType: menuKey as AppSettingType}}>
                    <>
                      {menuKey === SiderKey.Setting && (
                        <SettingsDiv>
                          <ScrollBar>
                            {application &&
                              !isAggregationApp(
                                AppUILayoutType[application.applicationType]
                              ) && (
                                <>
                                  {appSettingsComp.getPropertyView()}
                                </>
                              )}
                          </ScrollBar>
                        </SettingsDiv>
                      )}
                      {menuKey === SiderKey.Canvas && (
                        <SettingsDiv>
                          <ScrollBar>
                            {application &&
                              !isAggregationApp(
                                AppUILayoutType[application.applicationType]
                              ) && (
                                <>
                                  {appSettingsComp.getPropertyView()}
                                </>
                              )}
                          </ScrollBar>
                        </SettingsDiv>
                      )}
                    </>
                  </AppSettingContext.Provider>
                  {menuKey === SiderKey.JS && (
                    <>
                      <TitleDiv>{trans("leftPanel.toolbarTitle")}</TitleDiv>
                      {props.preloadComp.getPropertyView()}
                      <PreloadDiv
                        onClick={() => dispatch(
                          setEditorExternalStateAction({
                            showScriptsAndStyleModal: true,
                          })
                        )}
                      >
                        <LeftPreloadIcon />
                        {trans("leftPanel.toolbarPreload")}
                      </PreloadDiv>
                      
                      {props.preloadComp.getJSLibraryPropertyView()}
                    </>
                  )}
                  {menuKey === SiderKey.Layout && (
                    <LeftLayersContent uiComp={uiComp} />
                  )}
                </LeftPanel>
              )}
            </Suspense>
            <MiddlePanel>
              <EditorWrapper className={editorContentClassName}>
                <EditorHotKeys disabled={readOnly}>
                  <EditorContainerWithViewMode>
                    {uiCompView}
                    <HookCompContainer>{hookCompViews}</HookCompContainer>
                  </EditorContainerWithViewMode>
                </EditorHotKeys>
              </EditorWrapper>
              <Suspense fallback={<BottomSkeleton />}>
                {panelStatus.bottom && editorModeStatus !== "layout" && <Bottom />}
              </Suspense>
            </MiddlePanel>
            <Suspense fallback={null}>
              {showRight && (
                <RightPanel
                  uiComp={uiComp}
                  onCompDrag={onCompDrag}
                  showPropertyPane={editorState.showPropertyPane}
                  onTabChange={setShowPropertyPane} />
              )}
            </Suspense>
          </Body>
        </EditorGlobalHotKeys>
      </Height100Div></>
  );
}

export default React.memo(EditorView, (prevProps, newProps) => {
  return isEqual(prevProps, newProps);
});

