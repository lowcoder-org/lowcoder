import React, { lazy, useCallback, useEffect, useRef } from "react";
import {
  Body,
  EditorContainer,
  Height100Div,
} from "pages/common/styledComponent";
import { useEditorLayoutStore } from "pages/editor/editorLayoutStore";

import styled from "styled-components";
import { default as Skeleton } from "antd/es/skeleton";
import { default as Spin } from "antd/es/spin";
import { useTemplateViewMode, useUserViewMode } from "util/hooks";
import { ProductLoading } from "components/ProductLoading";
import { default as LoadingOutlined } from "@ant-design/icons/LoadingOutlined";
import { useUnmount } from "react-use";

const BottomSkeleton = lazy(() => import("pages/editor/bottom/BottomContent").then(module => ({default: module.BottomSkeleton})));
const RightPanel = lazy(() => import('pages/editor/right/RightPanel'));
const LeftPanel = lazy(() => import("pages/common/styledComponent").then(module =>({default: module.LeftPanel})));
const MiddlePanel = lazy(() => import("pages/common/styledComponent").then(module =>({default: module.MiddlePanel})));

const StyledSkeleton = styled(Skeleton)`
  padding: 16px;
`;

const StyledSpin = styled(Spin)`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background-color: #f5f5f6;
  height: 100%;
`;

const SiderStyled = styled.div`
  height: calc(100vh - 48px);
  width: 40px;
  background-color: #373945;
`

const LoadingOutlinedMemo = React.memo(LoadingOutlined);

export const EditorLoadingSpin = React.memo((props: { height?: string | number }) => {
  const { height = "100vh" } = props;
  return (
    <div style={{ height: height }}>
      <StyledSpin size="large" indicator={<LoadingOutlinedMemo spin />}/>
    </div>
  );
});

export default function EditorSkeletonView() {
  const mountedRef = useRef(true);
  // no provider here - the skeleton renders while the app is still loading
  const panelStatus = useEditorLayoutStore((state) => state.panelStatus);
  const bottomHeight = useEditorLayoutStore((state) => state.panelStyle.bottom.h);
  const isUserViewMode = useUserViewMode();
  const isTemplate = useTemplateViewMode();

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const handleNoop = useCallback(() => {
    if (!mountedRef.current) return;
    // No-op handler
  }, []);

  useUnmount(() => {
    mountedRef.current = false;
  });

  if (isUserViewMode) {
    return <ProductLoading hideHeader={isTemplate} />;
  }

  return (
    <>
      <Height100Div>
        <Body>
          <SiderStyled />
          {panelStatus.left && (
            <LeftPanel
              collisionStatus={false}
              toggleCollisionStatus={handleNoop}
            >
              <StyledSkeleton active paragraph={{ rows: 10 }} />
            </LeftPanel>
          )}
          <MiddlePanel>
            <EditorContainer>
              <EditorLoadingSpin />
            </EditorContainer>
            {panelStatus.bottom && (
              <div style={{ height: bottomHeight + "px" }}>
                <BottomSkeleton />
              </div>
            )}
          </MiddlePanel>
          {panelStatus.right && (
            <RightPanel
              showPropertyPane={false}
              onCompDrag={handleNoop}
              onTabChange={handleNoop}
            />
          )}
        </Body>
      </Height100Div>
    </>
  );
}
