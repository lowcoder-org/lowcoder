import { BottomContent } from "pages/editor/bottom/BottomContent";
import { ResizableBox, ResizeCallbackData } from "react-resizable";
import styled from "styled-components";
import * as React from "react";
import { useContext, useEffect, useMemo, useState } from "react";
import {
  getSelectedAIQueryName,
  saveSelectedAIQueryName,
} from "util/localStorageUtil";
import { useEditorLayoutStore } from "pages/editor/editorLayoutStore";
import { BottomResultPanel } from "../../../components/resultPanel/BottomResultPanel";
import { AppState } from "../../../redux/reducers";
import { getUser } from "../../../redux/selectors/usersSelectors";
import { connect, useSelector } from "react-redux";
import { getAiRobotAccess, getFetchSubscriptionsFinished, getSubscriptionsError } from "redux/selectors/subscriptionSelectors";
import { SUBSCRIPTION_SETTING, buildSubscriptionInfoLink } from "constants/routesURL";
import Button from "antd/es/button";
import { Layers } from "constants/Layers";
import Flex from "antd/es/flex";
import type { MenuProps } from 'antd/es/menu';
import { DatabaseOutlined } from "@ant-design/icons";
import Menu from "antd/es/menu/menu";
import { Sparkles } from "lucide-react";
import { ChatPanel } from "@lowcoder-ee/comps/comps/chatComp/components/ChatPanel";
import { EditorContext } from "comps/editorState";
import { trans } from "i18n";

import { SubscriptionProductsEnum } from "constants/subscriptionConstants";
import { AutomatorTheme, automatorColor } from "components/automator/AutomatorTheme";
import { AutomatorHeader } from "components/automator/AutomatorHeader";
import { AutomatorLanguageGuide } from "components/automator/AutomatorLanguageGuide";
import { AutomatorWelcome } from "components/automator/AutomatorWelcome";
import { AutomatorSetup } from "components/automator/GuidedModelSetup";
import { useLocation } from "react-router-dom";

type MenuItem = Required<MenuProps>['items'][number];

const StyledResizableBox = styled(ResizableBox)`
  position: relative;
  box-shadow: 0 0 10px 0 rgba(0, 0, 0, 0.1);
  border-top: 1px solid #e1e3eb;
  z-index: ${Layers.bottomPanel};

  .react-resizable-handle {
    position: absolute;
    border-top: transparent solid 3px;
    width: 100%;
    padding: 0 3px 3px 0;
    top: 0;
    cursor: row-resize;
  }
`;

const StyledMenu = styled(Menu)`
  flex: 0 0 40px;
  width: 40px;
  padding: 6px 0;

  .ant-menu-item {
    height: 30px;
    line-height: 30px;
  }
`;

const AutomatorMenuIcon = styled(Sparkles)`color: ${automatorColor.accent};`;

const AutomatorWorkspace = styled.div`
  container: automator-panel / inline-size;
  display: flex; flex-direction: column; height: 100%; min-height: 0; overflow: hidden;
`;

const PanelBody = styled.div`
  display: flex;
  height: 100%;
  min-width: 0;
`;

const PanelContent = styled.div`
  flex: 1 1 0;
  min-width: 0;
  height: 100%;
`;

const preventDefault = (e: any) => {
  e.preventDefault();
};

// prevent the editor window slide when resize
const addListener = () => {
  window.addEventListener("mousedown", preventDefault);
};

const removeListener = () => {
  window.removeEventListener("mousedown", preventDefault);
};

function Bottom(props: any) {
  const bottomHeight = useEditorLayoutStore((state) => state.panelStyle.bottom.h);
  const setBottomHeight = useEditorLayoutStore((state) => state.setBottomHeight);
  const clientHeight = document.documentElement.clientHeight;
  const resizeStop = (e: React.SyntheticEvent, data: ResizeCallbackData) => {
    setBottomHeight(data.size.height);
    removeListener();
  };

  const location = useLocation();
  const [setupOpen, setSetupOpen] = useState(false);
  const [previousHeight, setPreviousHeight] = useState<number>();
  const [languageOpen, setLanguageOpen] = useState(false);
  const [currentOption, setCurrentOption] = useState("data");
  const [selectedQuery, setSelectedQuery] = useState<string>(() => getSelectedAIQueryName());
  useEffect(() => { setSetupOpen(false); setLanguageOpen(false); setSelectedQuery(getSelectedAIQueryName()); }, [props.orgId, location.pathname]);

  const editorState = useContext(EditorContext);
  const aiRobotAccess = useSelector(getAiRobotAccess);
  const subscriptionsLoaded = useSelector(getFetchSubscriptionsFinished);
  const subscriptionError = useSelector(getSubscriptionsError);

  useEffect(() => {
    if (currentOption === "ai") {
      setSelectedQuery(getSelectedAIQueryName());
    }
  }, [currentOption]);

  const queryOptions = useMemo(() => {
    if (!editorState) return [];
    return editorState.queryCompInfoList().map((info) => ({
      label: info.name,
      value: info.name,
    }));
  }, [editorState]);

  const queryAvailable = queryOptions.some(option => option.value === selectedQuery);
  const selectQuery = (name: string) => {
    setSelectedQuery(name);
    saveSelectedAIQueryName(name);
  };

  const items: MenuItem[] = [
    { key: 'data', icon: <DatabaseOutlined />, label: trans('automator.panel.dataQueries') },
    { key: 'ai', icon: <span><AutomatorTheme><AutomatorMenuIcon size={16} /></AutomatorTheme></span>, label: trans('automator.panel.lowcoderAI') },
  ];

  return (
    <>
      <BottomResultPanel bottom={bottomHeight} />
      <StyledResizableBox
        width={Infinity}
        height={bottomHeight}
        resizeHandles={["n"]}
        minConstraints={[680, 285]}
        maxConstraints={[Infinity, clientHeight - 48 - 40]}
        onResizeStart={addListener}
        onResizeStop={resizeStop}
      >
        <PanelBody>
          <StyledMenu
            defaultSelectedKeys={[currentOption]}
            mode="inline"
            inlineCollapsed={true}
            items={items}
            onSelect={({key}) => {
              setCurrentOption(key);
            }}
          />
          <PanelContent>
            {currentOption === "data" ? (
              <BottomContent />
            ) : (
              <AutomatorTheme><AutomatorWorkspace>
                <AutomatorHeader hasAccess={aiRobotAccess} queryName={queryAvailable ? selectedQuery : undefined}
                  queryOptions={queryOptions} onSelect={selectQuery} onSetup={() => setSetupOpen(true)} onLanguage={() => setLanguageOpen(true)}
                  expanded={previousHeight !== undefined} onExpand={() => {
                    if (previousHeight !== undefined) { setBottomHeight(previousHeight); setPreviousHeight(undefined); }
                    else { setPreviousHeight(bottomHeight); setBottomHeight(Math.max(285, clientHeight - 104)); }
                  }} />
                {aiRobotAccess ? (
                  queryAvailable
                    ? <ChatPanel key={`${props.orgId}:${location.pathname}`} tableName="LC_AI" chatQuery={selectedQuery} />
                    : <AutomatorWelcome onLanguage={() => setLanguageOpen(true)} subscribed onSetup={() => setSetupOpen(true)} previewUrl={buildSubscriptionInfoLink(SubscriptionProductsEnum.AIROBOT)} />
                ) : !subscriptionsLoaded || subscriptionError ? (
                  <Flex vertical align="center" justify="center" gap={12} style={{ flex: 1, padding: 24 }}>
                    <strong>{subscriptionError ? trans('automator.panel.accessError') : trans('automator.panel.checkingAccess')}</strong>
                    {subscriptionError && <><span>{trans('automator.panel.retryAccess')}</span>
                      <Button href={SUBSCRIPTION_SETTING} target="_blank" rel="noopener noreferrer">{trans('automator.panel.subscriptionSettings')}</Button></>}
                  </Flex>
                ) : <AutomatorWelcome onLanguage={() => setLanguageOpen(true)} subscribed={false} onSetup={() => setSetupOpen(true)} previewUrl={buildSubscriptionInfoLink(SubscriptionProductsEnum.AIROBOT)} />}
              </AutomatorWorkspace></AutomatorTheme>
            )}
          </PanelContent>
        </PanelBody>
      </StyledResizableBox>
      {languageOpen && <AutomatorTheme><AutomatorLanguageGuide onClose={() => setLanguageOpen(false)} /></AutomatorTheme>}
      {/* Subscription refreshes on window focus. Preserve the form while access is checked. */}
      {setupOpen && <AutomatorTheme><AutomatorSetup key={`${props.orgId}:${location.pathname}`}
        accessStatus={aiRobotAccess ? "ready" : !subscriptionsLoaded ? "checking" : "unavailable"}
        onClose={() => setSetupOpen(false)} onSelect={selectQuery} /></AutomatorTheme>}
    </>
  );
}

const mapStateToProps = (state: AppState) => {
  return {
    orgId: getUser(state).currentOrgId,
    datasourceInfos: state.entities.datasource.data,
  };
};

export default connect(mapStateToProps, null)(Bottom);
