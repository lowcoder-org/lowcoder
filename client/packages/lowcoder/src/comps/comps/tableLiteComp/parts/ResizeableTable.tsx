import React, { useCallback, useMemo, useState } from "react";
import { default as Table, TableProps, ColumnType } from "antd/es/table";
import ResizeableTitle from "./ResizeableTitle";
import TableCellView from "./TableCellView";
import { COL_MIN_WIDTH, CustomColumnType } from "../tableUtils";
import { TableColumnStyleType } from "comps/controls/styleControlConstants";
import { RowColorViewType, RowHeightViewType } from "../tableTypes";

export type ResizeableTableProps<RecordType> = Omit<TableProps<RecordType>, "components" | "columns"> & {
  columns: CustomColumnType<RecordType>[];
  viewModeResizable: boolean;
  rowColorFn: RowColorViewType;
  rowHeightFn: RowHeightViewType;
  columnsStyle: TableColumnStyleType;
  size?: string;
  rowAutoHeight?: boolean;
  customLoading?: boolean;
  onCellClick: (columnName: string, dataIndex: string) => void;
};

/**
 * A table with adjustable column width, width less than 0 means auto column width
 */
function ResizeableTableComp<RecordType extends object>(props: ResizeableTableProps<RecordType>) {
  const {
    columns,
    viewModeResizable,
    rowColorFn,
    rowHeightFn,
    columnsStyle,
    size,
    rowAutoHeight,
    customLoading,
    onCellClick,
    ...restProps
  } = props;
  const [resizeData, setResizeData] = useState({ index: -1, width: -1 });

  const handleResize = useCallback((width: number, index: number) => {
    setResizeData({ index, width });
  }, []);

  const handleResizeStop = useCallback(
    (width: number, index: number, onWidthResize?: (width: number) => void) => {
      setResizeData({ index: -1, width: -1 });
      if (onWidthResize) {
        onWidthResize(width);
      }
    },
    []
  );

  const createCellHandler = useCallback(
    (col: CustomColumnType<RecordType>) => {
      return (record: RecordType, index: number) => ({
        record,
        title: String(col.dataIndex),
        rowColorFn,
        rowHeightFn,
        cellColorFn: col.cellColorFn,
        rowIndex: index,
        columnsStyle,
        columnStyle: col.style,
        linkStyle: col.linkStyle,
        tableSize: size,
        autoHeight: rowAutoHeight,
        onClick: () => onCellClick(col.titleText, String(col.dataIndex)),
        loading: customLoading,
        customAlign: col.align,
      });
    },
    [rowColorFn, rowHeightFn, columnsStyle, size, rowAutoHeight, onCellClick, customLoading]
  );

  const createHeaderCellHandler = useCallback(
    (col: CustomColumnType<RecordType>, index: number, resizeWidth: number) => {
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
      });
    },
    [viewModeResizable, handleResize, handleResizeStop]
  );

  const memoizedColumns = useMemo(() => {
    return columns.map((col: CustomColumnType<RecordType>, index: number) => {
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
        },
      }}
      {...restProps}
      pagination={false}
      columns={memoizedColumns}
      scroll={{
        x: COL_MIN_WIDTH * columns.length,
      }}
    />
  );
}

const ResizeableTable = React.memo(ResizeableTableComp) as typeof ResizeableTableComp;
export default ResizeableTable; 