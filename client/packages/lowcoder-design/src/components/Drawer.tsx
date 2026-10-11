import { default as AntdDrawer, DrawerProps as AntdDrawerProps } from "antd/es/drawer";
import Handle from "./Modal/handler";
import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { Resizable, ResizeHandle } from "react-resizable";
import { useResizeDetector } from "react-resize-detector";
import styled from "styled-components";

const StyledDrawer = styled(AntdDrawer)`
  & .ant-drawer-content-wrapper {
    transition: transform 0.3s cubic-bezier(0.7, 0.3, 0.1, 1) !important;
    will-change: transform;
    transform: translate3d(0, 0, 0);
  }

  & .ant-drawer-content {
    transition: none !important;
  }

  & .ant-drawer-mask {
    transition: opacity 0.3s cubic-bezier(0.7, 0.3, 0.1, 1) !important;
    will-change: opacity;
  }

  & .ant-drawer-header {
    transition: none !important;
  }

  & .ant-drawer-body {
    transition: none !important;
  }
`;

type Placement = "top" | "bottom" | "left" | "right";
function getResizeHandle(placement?: Placement): ResizeHandle {
  switch (placement) {
    case "top":
      return "s";
    case "bottom":
      return "n";
    case "left":
      return "e";
  }
  return "w";
}

type DrawerProps = {
  resizable?: boolean;
  onResizeStart?: (
    e: React.SyntheticEvent,
    node: HTMLElement,
    size: { width: number; height: number },
    handle: ResizeHandle
  ) => void;
  onResize?: (
    e: React.SyntheticEvent,
    node: HTMLElement,
    size: { width: number; height: number },
    handle: ResizeHandle
  ) => void;
  onResizeStop?: (
    e: React.SyntheticEvent,
    node: HTMLElement,
    size: { width: number; height: number },
    handle: ResizeHandle
  ) => void;
} & AntdDrawerProps;

export function Drawer(props: DrawerProps) {
  const { resizable, width: drawerWidth, height: drawerHeight, children, ...otherProps } = props;
  const placement = useMemo(() => props.placement ?? "right", [props.placement]);
  const resizeHandles = useMemo(
    () => (resizable ? [getResizeHandle(placement)] : []),
    [placement, resizable]
  );
  const isTopBom = useMemo(() => ["top", "bottom"].includes(placement), [placement]);
  const [width, setWidth] = useState<number>();
  const [height, setHeight] = useState<number>();
  const mountedRef = useRef(true);

  // Combined effect for width and height cleanup
  useEffect(() => {
    if (drawerWidth !== undefined) {
      setWidth(undefined);
    }
    if (drawerHeight !== undefined) {
      setHeight(undefined);
    }
  }, [drawerWidth, drawerHeight]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const { width: detectWidth, height: detectHeight, ref } = useResizeDetector({
    onResize: () => {
      // Only update if component is still mounted
      if (!mountedRef.current) return;
    }
  });

  const handleResizeStart = useCallback(
    (event: React.SyntheticEvent, { node, size, handle }: { node: HTMLElement; size: { width: number; height: number }; handle: ResizeHandle }) => {
      props.onResizeStart?.(event, node, size, handle);
    },
    [props.onResizeStart]
  );

  const handleResize = useCallback(
    (event: React.SyntheticEvent, { node, size, handle }: { node: HTMLElement; size: { width: number; height: number }; handle: ResizeHandle }) => {
      if (!mountedRef.current) return;
      isTopBom ? setHeight(size.height) : setWidth(size.width);
      props.onResize?.(event, node, size, handle);
    },
    [isTopBom, props.onResize]
  );

  const handleResizeStop = useCallback(
    (event: React.SyntheticEvent, { node, size, handle }: { node: HTMLElement; size: { width: number; height: number }; handle: ResizeHandle }) => {
      props.onResizeStop?.(event, node, size, handle);
    },
    [props.onResizeStop]
  );

  return (
    <StyledDrawer width={width ?? drawerWidth} height={height ?? drawerHeight} {...otherProps}>
      <Resizable
        width={width ?? detectWidth ?? 0}
        height={height ?? detectHeight ?? 0}
        resizeHandles={resizeHandles}
        handle={Handle}
        onResizeStart={handleResizeStart}
        onResize={handleResize}
        onResizeStop={handleResizeStop}
      >
        <div ref={ref} style={{ height: "100%" }}>
          {children}
        </div>
      </Resizable>
    </StyledDrawer>
  );
}
