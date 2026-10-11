import { default as AntdModal, ModalProps as AntdModalProps } from "antd/es/modal";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Resizable, ResizeHandle } from "react-resizable";
import { useResizeDetector } from "react-resize-detector";
import Handle from "./handler";

type ModalProps = {
  height?: number | string;
  resizeHandles?: ResizeHandle[];
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
} & AntdModalProps;

export function Modal(props: ModalProps) {
  const {
    resizeHandles,
    width: modalWidth,
    height: modalHeight,
    styles,
    children,
    ...otherProps
  } = props;

  const [width, setWidth] = useState<number>();
  const [height, setHeight] = useState<number>();

  // Memoize style object
  const modalStyles = useMemo(() => ({
    body: {
      height: height ?? modalHeight,
      ...styles?.body,
    }
  }), [height, modalHeight, styles?.body]);

  // Memoize event handlers
  const handleResizeStart = useCallback((event: React.SyntheticEvent, { node, size, handle }: { node: HTMLElement; size: { width: number; height: number }; handle: ResizeHandle }) => {
    props.onResizeStart?.(event, node, size, handle);
  }, [props.onResizeStart]);

  const handleResize = useCallback((event: React.SyntheticEvent, { node, size, handle }: { node: HTMLElement; size: { width: number; height: number }; handle: ResizeHandle }) => {
    setWidth(size.width);
    setHeight(size.height);
    props.onResize?.(event, node, size, handle);
  }, [props.onResize]);

  const handleResizeStop = useCallback((event: React.SyntheticEvent, { node, size, handle }: { node: HTMLElement; size: { width: number; height: number }; handle: ResizeHandle }) => {
    props.onResizeStop?.(event, node, size, handle);
  }, [props.onResizeStop]);

  useEffect(() => {
    setWidth(undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modalWidth]);

  useEffect(() => {
    setHeight(undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modalHeight]);

  const { width: detectWidth, height: detectHeight, ref } = useResizeDetector();

  // Memoize Resizable props
  const resizableProps = useMemo(() => ({
    width: width ?? detectWidth ?? 0,
    height: height ?? detectHeight ?? 0,
    resizeHandles,
    handle: Handle,
    onResizeStart: handleResizeStart,
    onResize: handleResize,
    onResizeStop: handleResizeStop
  }), [width, detectWidth, height, detectHeight, resizeHandles, handleResizeStart, handleResize, handleResizeStop]);

  return (
    <AntdModal
      width={width ?? modalWidth}
      styles={modalStyles}
      {...otherProps}
    >
      <Resizable {...resizableProps}>
        <div ref={ref} style={{ height: "100%" }}>
          {children}
        </div>
      </Resizable>
    </AntdModal>
  );
}
