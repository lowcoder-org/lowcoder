import React, { useContext, useRef, useState } from "react";
import styled from "styled-components";
import Draggable from "react-draggable";
import { Resizable } from "react-resizable";
import { default as AntdModal } from "antd/es/modal";
import { Tabs } from "components/Tabs";
import { CloseIcon } from "lowcoder-design";
import Handle from "layout/handler";
import { useEditorLayoutStore } from "pages/editor/editorLayoutStore";
import { ExternalEditorContext } from "util/context/ExternalEditorContext";
import { trans } from "i18n";
import { RecordConstructorToComp } from "lowcoder-core";
import { TabKey } from "./types";
import { JavaScriptTabPane, CSSTabPane } from "./tabPanes";
import { ScriptComp, CSSComp, GlobalCSSComp } from "./components";

type ChildrenInstance = RecordConstructorToComp<{
  libs: any;
  script: typeof ScriptComp;
  css: typeof CSSComp;
  globalCSS: typeof GlobalCSSComp;
}>;

const MIN_WIDTH = 480;
const MIN_HEIGHT = 400;

const ModalWrapper = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  background: #ffffff;
  box-shadow: 0 0 10px 0 rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  pointer-events: auto;
`;

const HeaderWrapper = styled.div`
  display: flex;
  align-items: center;
  cursor: move;
  padding: 16px;
  font-weight: 500;
  font-size: 16px;
  color: #222222;
`;

const CloseButton = styled.div`
  margin-left: auto;
  display: flex;
  cursor: pointer;
  color: #8b8fa3;

  :hover svg g line {
    color: #222222;
  }
`;

const BodyWrapper = styled.div`
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  padding: 0 16px 16px;

  /* antd already makes the tabs a flex column with a growing content holder */
  .ant-tabs {
    flex: 1;
    min-height: 0;
  }

  .ant-tabs-content,
  .ant-tabs-tabpane {
    height: 100%;
  }
`;

export function PreloadConfigModal(props: ChildrenInstance) {
  const [activeKey, setActiveKey] = useState(TabKey.JavaScript);
  const { showScriptsAndStyleModal, changeExternalState } = useContext(ExternalEditorContext);

  const draggableRef = useRef<HTMLDivElement>(null);
  const savedSize = useEditorLayoutStore((state) => state.panelStyle.scriptsAndStyles);
  const saveSize = useEditorLayoutStore((state) => state.setScriptsAndStylesSize);
  // local state drives the live resize, only the committed size goes to the store
  const [size, setSize] = useState(savedSize);

  const tabItems = [
    {
      key: TabKey.JavaScript,
      label: 'JavaScript',
      children: <JavaScriptTabPane comp={props.script} />
    },
    {
      key: TabKey.CSS,
      label: 'CSS',
      children: <CSSTabPane comp={props.css} />
    },
    {
      key: TabKey.GLOBAL_CSS,
      label: 'Global CSS',
      children: <CSSTabPane comp={props.globalCSS} isGlobal />
    },
  ];

  const onCancel = () => changeExternalState?.({ showScriptsAndStyleModal: false });

  return (
    <AntdModal
      mask={activeKey !== TabKey.CSS}
      open={showScriptsAndStyleModal}
      destroyOnHidden
      onCancel={onCancel}
      footer={null}
      width={size.w}
      modalRender={() => (
        <Draggable handle=".handle" nodeRef={draggableRef}>
          <Resizable
            width={size.w}
            height={size.h}
            onResize={(e, data) => setSize({ w: data.size.width, h: data.size.height })}
            onResizeStop={() => saveSize(size)}
            handle={Handle}
            resizeHandles={["s", "n", "w", "e", "sw", "nw", "se", "ne"]}
            minConstraints={[MIN_WIDTH, MIN_HEIGHT]}
          >
            <ModalWrapper ref={draggableRef} style={{ width: size.w, height: size.h }}>
              <HeaderWrapper className="handle">
                {trans("preLoad.scriptsAndStyles")}
                <CloseButton onClick={onCancel}>
                  <CloseIcon />
                </CloseButton>
              </HeaderWrapper>
              <BodyWrapper>
                <Tabs
                  onChange={(k) => setActiveKey(k as TabKey)}
                  activeKey={activeKey}
                  items={tabItems}
                />
              </BodyWrapper>
            </ModalWrapper>
          </Resizable>
        </Draggable>
      )}
    />
  );
}
