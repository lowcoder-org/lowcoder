import { default as Table, TableProps, ColumnType } from "antd/es/table";
import React, { useCallback, useMemo, useRef, useState } from "react";
import { Resizable } from "react-resizable";
import styled from "styled-components";
import _ from "lodash";
import { useUserViewMode } from "util/hooks";
import { ReactRef, ResizeHandleAxis } from "layout/gridLayoutPropTypes";
import { COL_MIN_WIDTH, RecordType, CustomColumnType } from "./tableUtils";
import { RowColorViewType, RowHeightViewType } from "./tableTypes";
import { TableColumnStyleType, TableColumnLinkStyleType, TableRowStyleType } from "comps/controls/styleControlConstants";
import { CellColorViewType } from "./column/tableColumnComp";
import { TableCellView } from "./TableCell";
import { TableRowView } from "./TableRow";

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

const ResizeableTitle = React.forwardRef<HTMLTableHeaderCellElement, any>((props, ref) => {
  const { onResize, onResizeStop, width, viewModeResizable, ...restProps } = props;
  const [childWidth, setChildWidth] = useState(0);
  const resizeRef = useRef<HTMLTableHeaderCellElement>(null);
  const isUserViewMode = useUserViewMode();

  const updateChildWidth = useCallback(() => {
    if (resizeRef.current) {
      const width = resizeRef.current.getBoundingClientRect().width;
      setChildWidth(width);
    }
  }, []);

  React.useEffect(() => {
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

  React.useImperativeHandle(ref, () => resizeRef.current!, []);

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
});

type CustomTableProps<RecordType> = Omit<TableProps<RecordType>, "components" | "columns"> & {
  columns: CustomColumnType<RecordType>[];
  viewModeResizable: boolean;
  visibleResizables: boolean;
  rowColorFn: RowColorViewType;
  rowHeightFn: RowHeightViewType;
  columnsStyle: TableColumnStyleType;
  rowStyle: TableRowStyleType;
  size?: string;
  rowAutoHeight?: boolean;
  customLoading?: boolean;
  onCellClick: (columnName: string, dataIndex: string) => void;
  virtual?: boolean;
  scroll?: {
    x?: number | string;
    y?: number | string;
  };
};

function ResizeableTableComp<RecordType extends object>(props: CustomTableProps<RecordType>) {
  const {
    columns,
    viewModeResizable,
    visibleResizables,
    rowColorFn,
    rowHeightFn,
    columnsStyle,
    rowStyle,
    size,
    rowAutoHeight,
    customLoading,
    onCellClick,
    ...restProps
  } = props;
  const [resizeData, setResizeData] = useState({ index: -1, width: -1 });

  // Memoize resize handlers
  const handleResize = useCallback((width: number, index: number) => {
    setResizeData({ index, width });
  }, []);

  const handleResizeStop = useCallback((width: number, index: number, onWidthResize?: (width: number) => void) => {
    setResizeData({ index: -1, width: -1 });
    if (onWidthResize) {
      onWidthResize(width);
    }
  }, []);

  // Memoize cell handlers
  const createCellHandler = useCallback((col: CustomColumnType<RecordType>) => {
    return (record: RecordType, index: number) => ({
      record,
      title: String(col.dataIndex),
      rowColorFn,
      rowHeightFn,
      cellColorFn: col.cellColorFn,
      rowIndex: index,
      columnsStyle,
      columnStyle: col.style,
      rowStyle: rowStyle,
      linkStyle: col.linkStyle,
      tableSize: size,
      autoHeight: rowAutoHeight,
      onClick: () => onCellClick(col.titleText, String(col.dataIndex)),
      loading: customLoading,
      customAlign: col.align,
      className: col.columnClassName,
      'data-testid': col.columnDataTestId,
    });
  }, [rowColorFn, rowHeightFn, columnsStyle, size, rowAutoHeight, onCellClick, customLoading]);

  // Memoize header cell handlers
  const createHeaderCellHandler = useCallback((col: CustomColumnType<RecordType>, index: number, resizeWidth: number) => {
    return () => ({
      width: resizeWidth,
      title: col.titleText,
      viewModeResizable,
      onResize: (width: React.SyntheticEvent) => {
        if (width) {
          handleResize(Number(width), index);
        }
      },
      onResizeStop: (e: React.SyntheticEvent, { size }: { size: { width: number } }) => {
        handleResizeStop(size.width, index, col.onWidthResize);
      },
      className: col.columnClassName,
      'data-testid': col.columnDataTestId,
    });
  }, [viewModeResizable, handleResize, handleResizeStop]);

  // Memoize columns to prevent unnecessary re-renders
  const memoizedColumns = useMemo(() => {
    return columns.map((col, index) => {
      const { width, style, linkStyle, cellColorFn, onWidthResize, ...restCol } = col;
      const resizeWidth = (resizeData.index === index ? resizeData.width : col.width) ?? 0;

      const column: ColumnType<RecordType> = {
        ...restCol,
        width: typeof resizeWidth === "number" && resizeWidth > 0 ? resizeWidth : undefined,
        minWidth: typeof resizeWidth === "number" && resizeWidth > 0 ? undefined : COL_MIN_WIDTH,
        onCell: (record: RecordType, index?: number) => createCellHandler(col)(record, index ?? 0),
        onHeaderCell: () => createHeaderCellHandler(col, index, Number(resizeWidth))(),
      };
      return column;
    });
  }, [columns, resizeData, createCellHandler, createHeaderCellHandler]);

  return (
    <Table<RecordType>
      components={{
        header: {
          cell: ResizeableTitle,
        },
        body: {
          cell: TableCellView,
          row: TableRowView,
        },
      }}
      {...restProps}
      pagination={false}
      columns={memoizedColumns}
    />
  );
}
ResizeableTableComp.whyDidYouRender = true;

export const ResizeableTable = React.memo(ResizeableTableComp) as typeof ResizeableTableComp;
export type { CustomTableProps };
