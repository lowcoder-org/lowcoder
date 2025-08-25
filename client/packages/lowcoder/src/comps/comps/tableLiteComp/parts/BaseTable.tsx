import React, {
    useCallback,
    useMemo,
    useState,
    useRef,
  } from "react";
  import { default as Table, TableProps, ColumnType } from "antd/es/table";
  import ResizeableTitle from "./ResizeableTitle";
  import TableCellView from "./TableCellView";
  import { COL_MIN_WIDTH, CustomColumnType } from "../tableUtils";
  import { TableColumnStyleType } from "comps/controls/styleControlConstants";
  import { RowColorViewType, RowHeightViewType } from "../tableTypes";
  import styled from "styled-components";
  
  
  const StyledTableWrapper = styled.div`
    /* Hide AntD's virtual horizontal scrollbar overlay */
    .ant-table-tbody-virtual-scrollbar-horizontal {
      display: none !important;
      height: 0 !important;
    }
    /* Make the virtual scrollbar container inert (avoids dead click zone) */
    .ant-table-tbody-virtual-scrollbar {
      pointer-events: none !important;
    }
  
    /* (Optional) Some builds also render a sticky helper track – hide it too */
    .ant-table-sticky-scroll,
    .ant-table-sticky-scroll-bar {
      display: none !important;
      height: 0 !important;
    }
  `;
  export interface BaseTableProps<RecordType> extends Omit<TableProps<RecordType>, "components" | "columns"> {
    columns: CustomColumnType<RecordType>[];
    viewModeResizable: boolean;
    rowColorFn: RowColorViewType;
    rowHeightFn: RowHeightViewType;
    columnsStyle: TableColumnStyleType;
    rowAutoHeight?: boolean;
    customLoading?: boolean;
    onCellClick: (columnName: string, dataIndex: string) => void;
    
    // NEW: Accept explicit configuration from parent
    scroll?: { x?: number | string; y?: number };
    virtual?: boolean;
  }
  
  /**
   * A table with adjustable column width, width less than 0 means auto column width
   */
  function BaseTableComp<RecordType extends object>(
    props: BaseTableProps<RecordType>
  ) {
    const {
      columns,
      viewModeResizable,
      rowColorFn,
      rowHeightFn,
      columnsStyle,
      rowAutoHeight,
      customLoading,
      onCellClick,
      scroll,
      virtual,
      dataSource,
      ...restProps
    } = props;
  
    const [resizeData, setResizeData] = useState({ index: -1, width: -1 });
    const tableRef = useRef<HTMLDivElement>(null);
  
  
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
          autoHeight: rowAutoHeight,
          onClick: () => onCellClick(col.titleText, String(col.dataIndex)),
          loading: customLoading,
          customAlign: col.align,
        });
      },
      [
        rowColorFn,
        rowHeightFn,
        columnsStyle,
        rowAutoHeight,
        onCellClick,
        customLoading,
      ]
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
          onResizeStop: (
            e: React.SyntheticEvent,
            { size }: { size: { width: number } }
          ) => {
            handleResizeStop(size.width, index, col.onWidthResize);
          },
        });
      },
      [viewModeResizable, handleResize, handleResizeStop]
    );
  
    // AntD Table ignores `minWidth` prop on columns.
    // We enforce a *real* minimum by giving auto columns a concrete width = COL_MIN_WIDTH
    const memoizedColumns = useMemo(() => {
      return columns.map((col: CustomColumnType<RecordType>, index: number) => {
        const {
          width,
          style,
          linkStyle,
          cellColorFn,
          onWidthResize,
          ...restCol
        } = col;
        const resizeWidth =
          (resizeData.index === index ? resizeData.width : col.width) ?? 0;
  
        const column: ColumnType<RecordType> = {
          ...restCol,
          // If no explicit width, use COL_MIN_WIDTH as a *real* floor
          width:
            typeof resizeWidth === "number" && resizeWidth > 0
              ? resizeWidth
              : COL_MIN_WIDTH,
          onCell: (record: RecordType, rowIndex?: number) =>
            createCellHandler(col)(record, rowIndex ?? 0),
          onHeaderCell: () =>
            createHeaderCellHandler(col, index, Number(resizeWidth))(),
        };
        return column;
      });
    }, [columns, resizeData, createCellHandler, createHeaderCellHandler]);
  
  
    return (
      <StyledTableWrapper ref={tableRef}>
        <Table<RecordType>
          components={{
            header: {
              cell: ResizeableTitle,
            },
            body: {
              cell: TableCellView,
            },
          }}
          {...(restProps as any)}
          dataSource={dataSource}
          pagination={false}
          columns={memoizedColumns}
          virtual={virtual || false}
          scroll={scroll || { x: 'max-content' }}
        />
      </StyledTableWrapper>
    );
  }
  
  const BaseTable = React.memo(BaseTableComp) as typeof BaseTableComp;
  export default BaseTable;