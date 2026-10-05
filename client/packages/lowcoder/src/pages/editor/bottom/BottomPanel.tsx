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
import { connect } from "react-redux";
import { Layers } from "constants/Layers";
import Flex from "antd/es/flex";
import type { MenuProps } from 'antd/es/menu';
import { DatabaseOutlined } from "@ant-design/icons";
import Menu from "antd/es/menu/menu";
import Select from "antd/es/select";
import { AIGenerate, DocLink } from "lowcoder-design";
import { ChatPanel } from "@lowcoder-ee/comps/comps/chatComp/components/ChatPanel";
import { EditorContext } from "comps/editorState";
import { trans } from "i18n";

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

const ChatHeader = styled.div`
  flex: 0 0 35px;
  padding: 0 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid #e1e3eb;
  background: #fafafa;
`;
const ChatTitle = styled.h3`
  margin: 0;
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 14px;
  font-weight: 500;
  color: #222222;
`;

const QuerySelectorWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const QueryLabel = styled.span`
  font-size: 12px;
  color: #8b8fa3;
  white-space: nowrap;
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

  const [currentOption, setCurrentOption] = useState("data");
  const [selectedQuery, setSelectedQuery] = useState<string>(() => getSelectedAIQueryName());

  const editorState = useContext(EditorContext);

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

  const items: MenuItem[] = [
    { key: 'data', icon: <DatabaseOutlined />, label: 'Data Queries' },
    { key: 'ai', icon: <AIGenerate />, label: 'Lowcoder AI' },
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
              <Flex style={{height: '100%'}} vertical>
                <ChatHeader>
                  <ChatTitle>
                    Lowcoder Automator
                    <DocLink
                      href={trans("docUrls.githubAutomator")}
                      title={trans("comp.menuViewDocsTooltip")}
                    >
                      {trans("comp.menuViewDocs")}
                    </DocLink>
                  </ChatTitle>
                  <QuerySelectorWrapper>
                    <QueryLabel>Query:</QueryLabel>
                    <Select
                      showSearch
                      allowClear
                      placeholder="Select a query"
                      value={selectedQuery || undefined}
                      onChange={(value) => {
                        const nextQuery = value || "";
                        setSelectedQuery(nextQuery);
                        saveSelectedAIQueryName(nextQuery);
                      }}
                      options={queryOptions}
                      style={{ width: 200 }}
                      size="small"
                    />
                  </QuerySelectorWrapper>
                </ChatHeader>
                <ChatPanel
                  tableName="LC_AI"
                  chatQuery={selectedQuery}
                />
              </Flex>
            )}
          </PanelContent>
        </PanelBody>
      </StyledResizableBox>
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
