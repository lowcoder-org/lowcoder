import React, { useCallback, useEffect, useRef, useState } from "react";
import _ from "lodash";
import { Resizable } from "react-resizable";
import styled from "styled-components";
import { useUserViewMode } from "util/hooks";
import { ReactRef, ResizeHandleAxis } from "layout/gridLayoutPropTypes";

const TitleResizeHandle = styled.span`
  position: absolute;
  top: 0;
  right: -5px;
  width: 10px;
  height: 100%;
  cursor: col-resize;
  z-index: 1;
`;

const TableTh = styled.th<{ width?: number }>`
  overflow: hidden;

  > div {
    overflow: hidden;
    white-space: pre;
    text-overflow: ellipsis;
  }

  ${(props) => props.width && `width: ${props.width}px`};
`;

const ResizeableTitle = (props: any) => {
  const { onResize, onResizeStop, width, viewModeResizable, ...restProps } = props;
  const [childWidth, setChildWidth] = useState(0);
  const resizeRef = useRef<HTMLDivElement>(null);
  const isUserViewMode = useUserViewMode();

  const updateChildWidth = useCallback(() => {
    if (resizeRef.current) {
      const width = resizeRef.current.getBoundingClientRect().width;
      setChildWidth(width);
    }
  }, []);

  useEffect(() => {
    updateChildWidth();
    const resizeObserver = new ResizeObserver(() => {
      updateChildWidth();
    });

    if (resizeRef.current) {
      resizeObserver.observe(resizeRef.current);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, [updateChildWidth]);

  const isNotDataColumn = _.isNil(restProps.title);
  if ((isUserViewMode && !restProps.viewModeResizable) || isNotDataColumn) {
    return <TableTh ref={resizeRef} {...restProps} width={width} />;
  }

  return (
    <Resizable
      width={width > 0 ? width : childWidth}
      height={0}
      onResize={(e: React.SyntheticEvent, { size }: { size: { width: number } }) => {
        e.stopPropagation();
        onResize(size.width);
      }}
      onResizeStart={(e: React.SyntheticEvent) => {
        updateChildWidth();
        e.stopPropagation();
        e.preventDefault();
      }}
      onResizeStop={onResizeStop}
      draggableOpts={{ enableUserSelectHack: false }}
      handle={(axis: ResizeHandleAxis, ref: ReactRef<HTMLDivElement>) => (
        <TitleResizeHandle
          ref={ref}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
        />
      )}
    >
      <TableTh ref={resizeRef} {...restProps} title="" />
    </Resizable>
  );
};

export default ResizeableTitle; 