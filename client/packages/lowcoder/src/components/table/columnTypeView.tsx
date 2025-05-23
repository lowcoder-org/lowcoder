import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import styled from "styled-components";

const overflowStyles = `
  div {
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    word-break: keep-all;
  }
  span {
    display: inline-block;
    white-space: nowrap;
    text-overflow: ellipsis;
    word-break: keep-all;
  }
`;

const ColumnTypeViewWrapper = styled.div<{
  $textOverflow?: boolean
}>`
  position: relative;
  ${props => props.$textOverflow === false && overflowStyles}
`;

const ColumnTypeHoverView = styled.div<{
  $adjustLeft?: number;
  $adjustTop?: number;
  $adjustWidth?: number;
  $adjustHeight?: number;
  $minWidth?: number;
  $padding: string;
  $visible: boolean;
}>`
  position: absolute;
  height: ${(props) => (props.$adjustHeight ? `${props.$adjustHeight}px` : "max-content")};
  width: ${(props) => (props.$adjustWidth ? `${props.$adjustWidth}px` : "max-content")};
  visibility: ${(props) => (props.$visible ? "visible" : "hidden")};
  min-width: ${(props) => (props.$minWidth ? `${props.$minWidth}px` : "unset")};
  max-height: 150px;
  max-width: 300px;
  overflow: auto;
  background: #fafafa;
  z-index: 3;
  padding: ${(props) => props.$padding};
  top: ${(props) => `${props.$adjustTop || 0}px`};
  left: ${(props) => `${props.$adjustLeft || 0}px`};

  &::-webkit-scrollbar {
    width: 16px;
  }

  &::-webkit-scrollbar-thumb {
    border: 5px solid transparent;
    background-clip: content-box;
    border-radius: 9999px;
    background-color: rgba(139, 143, 163, 0.2);
    min-height: 30px;
  }

  &::-webkit-scrollbar-thumb:hover {
    background-color: rgba(139, 143, 163, 0.5);
  }
`;

function childIsOverflow(nodes: HTMLCollection): boolean {
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    const overflow = node.clientHeight < node.scrollHeight || node.clientWidth < node.scrollWidth;
    if (overflow) {
      return true;
    }
    return childIsOverflow(node.children);
  }
  return false;
}

function ColumnTypeView(props: {
  children: React.ReactNode,
  textOverflow?: boolean,
}) {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const hoverViewRef = useRef<HTMLDivElement | null>(null);
  const [isHover, setIsHover] = useState(false);
  const [hasOverflow, setHasOverflow] = useState(false);
  const [adjustedPosition, setAdjustedPosition] = useState<{
    left?: number;
    top?: number;
    done: boolean;
    height?: number;
    width?: number;
  }>({ done: false });
  
  // Use refs for cleanup
  const timeoutRef = useRef<NodeJS.Timeout>();
  const mountedRef = useRef(true);
  const parentElementRef = useRef<HTMLElement | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (parentElementRef.current) {
        parentElementRef.current.style.zIndex = "";
      }
      wrapperRef.current = null;
      hoverViewRef.current = null;
      parentElementRef.current = null;
    };
  }, []);

  // Memoize event handlers
  const delayMouseEnter = useCallback(() => {
    if (!mountedRef.current) return;
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      if (mountedRef.current) {
        setIsHover(true);
      }
    }, 300);
  }, []);

  const handleMouseLeave = useCallback(() => {
    if (!mountedRef.current) return;
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsHover(false);
  }, []);

  const handleMouseEnter = useCallback(() => {
    if (!mountedRef.current) return;
    setIsHover(true);
  }, []);

  // Check for overflow
  useEffect(() => {
    if (!mountedRef.current) return;
    
    const wrapperEle = wrapperRef.current;
    if (!isHover || !wrapperEle) {
      return;
    }
    
    const overflow =
      wrapperEle.clientHeight < wrapperEle.scrollHeight ||
      wrapperEle.clientWidth < wrapperEle.scrollWidth;
      
    if (overflow || childIsOverflow(wrapperEle.children)) {
      if (!hasOverflow) {
        setHasOverflow(true);
      }
    } else if (hasOverflow) {
      setHasOverflow(false);
    }
  }, [isHover, hasOverflow]);

  // Adjust position
  useEffect(() => {
    if (!mountedRef.current) return;
    
    const wrapperEle = wrapperRef.current;
    const hoverEle = hoverViewRef.current;
    
    if (!isHover || !hasOverflow) {
      if (parentElementRef.current) {
        parentElementRef.current.style.zIndex = "";
      }
      setAdjustedPosition({ done: false });
      return;
    }

    // Get the position of the outer table
    const tableEle = wrapperEle?.closest(".ant-table-content") as HTMLDivElement;
    if (!hoverEle || !tableEle || !wrapperEle) {
      return;
    }

    // Store parent element reference for cleanup
    if (wrapperEle.parentElement) {
      parentElementRef.current = wrapperEle.parentElement;
      parentElementRef.current.style.zIndex = "999";
    }

    // Calculate dimensions
    const width = Math.min(
      hoverEle.getBoundingClientRect().width,
      tableEle.getBoundingClientRect().width
    );
    const height = Math.min(
      hoverEle.getBoundingClientRect().height,
      tableEle.getBoundingClientRect().height
    );

    // Calculate position adjustments
    const leftOverflow = tableEle.getBoundingClientRect().x - hoverEle.getBoundingClientRect().x;
    const rightOverflow =
      tableEle.getBoundingClientRect().x +
      tableEle.offsetWidth -
      (hoverEle.getBoundingClientRect().x + width);
      
    let left;
    if (leftOverflow > 0) {
      left = leftOverflow;
    } else if (rightOverflow < 0) {
      // minus one, to avoid flashing scrollbars
      left = rightOverflow;
    }

    const bottomOverflow =
      tableEle.getBoundingClientRect().y +
      tableEle.offsetHeight -
      (hoverEle.getBoundingClientRect().y + height);

    setAdjustedPosition({
      left,
      top: bottomOverflow < 0 ? bottomOverflow : undefined,
      height,
      width,
      done: true,
    });
  }, [isHover, hasOverflow]);

  // Memoize children to prevent unnecessary re-renders
  const memoizedChildren = useMemo(() => props.children, [props.children]);

  return (
    <>
      <ColumnTypeViewWrapper
        ref={wrapperRef}
        $textOverflow={props.textOverflow}
        onMouseEnter={delayMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {memoizedChildren}
      </ColumnTypeViewWrapper>
      {isHover && hasOverflow && wrapperRef.current && !props.textOverflow && (
        <ColumnTypeHoverView
          ref={hoverViewRef}
          $visible={adjustedPosition.done}
          $minWidth={wrapperRef.current.offsetParent?.clientWidth}
          $adjustWidth={adjustedPosition.width}
          $adjustHeight={adjustedPosition.height}
          $adjustLeft={adjustedPosition.left}
          $adjustTop={adjustedPosition.top}
          $padding={`${wrapperRef.current.offsetTop}px ${wrapperRef.current.offsetLeft}px`}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          {memoizedChildren}
        </ColumnTypeHoverView>
      )}
    </>
  );
}

export default React.memo(ColumnTypeView);