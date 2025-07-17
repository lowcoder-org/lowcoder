import { Layers } from "constants/Layers";
import React, { ReactNode, useCallback, useRef, useEffect } from "react";

export type CheckSelectFn = (
  item?: HTMLDivElement | null,
  afterCheck?: (checkResult: boolean) => void
) => boolean;

export interface SectionProps {
  onMouseUp: () => void;
  onMouseDown: () => void;
  onMouseMove: (checkSelectFunc: CheckSelectFn) => void;
  children: ReactNode;
}

interface Point {
  x: number;
  y: number;
}

export interface Rect {
  left: number;
  top: number;
  width: number;
  height: number;
}

interface SectionState {
  mouseDown: boolean;
  selectionBox?: Rect;
  startPoint?: Point;
  appendMode: boolean;
}

const createInitialState = (): SectionState => ({
  mouseDown: false,
  appendMode: false,
  selectionBox: undefined,
  startPoint: undefined,
});

export const DragSelector = React.memo((props: SectionProps) => {
  const selectAreaRef = useRef<HTMLDivElement>(null);
  const stateRef = useRef<SectionState>(createInitialState());
  const mountedRef = useRef(true);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      // Clean up any remaining event listeners
      window.document.removeEventListener("mousemove", handleMouseMove);
      window.document.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  const rectIntersect = useCallback((
    selectionBox: Rect | undefined,
    item: HTMLElement | null | undefined
  ): boolean => {
    if (!selectionBox || !item || !selectAreaRef.current) return false;

    const containerRect = selectAreaRef.current.getBoundingClientRect();
    const itemBox = {
      top: item.getBoundingClientRect().top - containerRect.top,
      left: item.getBoundingClientRect().left - containerRect.left,
      width: item.getBoundingClientRect().width,
      height: item.getBoundingClientRect().height,
    };

    return (
      selectionBox.left <= itemBox.left + itemBox.width &&
      selectionBox.left + selectionBox.width >= itemBox.left &&
      selectionBox.top <= itemBox.top + itemBox.height &&
      selectionBox.top + selectionBox.height >= itemBox.top
    );
  }, []);

  const calculateSelectionBox = useCallback((startPoint: Point | undefined, endPoint: Point) => {
    if (!stateRef.current.mouseDown || !startPoint || !endPoint) return undefined;

    return {
      left: Math.min(startPoint.x, endPoint.x),
      top: Math.min(startPoint.y, endPoint.y),
      width: Math.abs(startPoint.x - endPoint.x),
      height: Math.abs(startPoint.y - endPoint.y),
    };
  }, []);

  const childrenViewCheckFunc = useCallback((
    item?: HTMLDivElement | null,
    afterCheck?: (checkResult: boolean) => void
  ) => {
    const result = rectIntersect(stateRef.current.selectionBox, item);
    if (afterCheck) {
      afterCheck(result);
    }
    return result;
  }, [rectIntersect]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!mountedRef.current || !stateRef.current.mouseDown) return;

    const endPoint = {
      x: e.pageX - (selectAreaRef.current?.getBoundingClientRect().left ?? 0),
      y: e.pageY - (selectAreaRef.current?.getBoundingClientRect().top ?? 0),
    };

    stateRef.current = {
      ...stateRef.current,
      selectionBox: calculateSelectionBox(stateRef.current.startPoint, endPoint),
    };

    // Clean up selection properly
    const selection = window.getSelection();
    if (selection) {
      selection.removeAllRanges();
    }

    props.onMouseMove(childrenViewCheckFunc);
  }, [props.onMouseMove, calculateSelectionBox, childrenViewCheckFunc]);

  const handleMouseUp = useCallback(() => {
    window.document.removeEventListener("mousemove", handleMouseMove);
    window.document.removeEventListener("mouseup", handleMouseUp);
    props.onMouseUp();
    stateRef.current = createInitialState();
  }, [handleMouseMove, props.onMouseUp]);

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (e.button === 2 || e.nativeEvent.which === 2) return;

    const startPoint = {
      x: e.pageX - (selectAreaRef.current?.getBoundingClientRect().left ?? 0),
      y: e.pageY - (selectAreaRef.current?.getBoundingClientRect().top ?? 0),
    };

    stateRef.current = {
      mouseDown: true,
      startPoint,
      selectionBox: undefined,
      appendMode: false,
    };

    window.document.addEventListener("mousemove", handleMouseMove);
    window.document.addEventListener("mouseup", handleMouseUp);
    props.onMouseDown();
  }, [handleMouseMove, handleMouseUp, props.onMouseDown]);

  const renderSelectionBox = useCallback(() => {
    if (!stateRef.current.mouseDown || !stateRef.current.startPoint || !stateRef.current.selectionBox || !selectAreaRef.current) {
      return null;
    }

    return (
      <div
        style={{
          background: "rgba(51, 119, 255, 0.1)",
          position: "absolute",
          zIndex: Layers.dragSelectBox,
          left: stateRef.current.selectionBox.left,
          top: stateRef.current.selectionBox.top,
          height: stateRef.current.selectionBox.height,
          width: stateRef.current.selectionBox.width,
        }}
      />
    );
  }, []);

  return (
    <div
      ref={selectAreaRef}
      onMouseDown={handleMouseDown}
      style={{ position: "relative" }}
    >
      {props.children}
      {renderSelectionBox()}
    </div>
  );
});
