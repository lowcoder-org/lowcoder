import React, {
  useCallback,
  useMemo,
  useState,
  useRef,
  useEffect,
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

export type ResizeableTableProps<RecordType> = Omit<
  TableProps<RecordType>,
  "components" | "columns"
> & {
  columns: CustomColumnType<RecordType>[];
  viewModeResizable: boolean;
  rowColorFn: RowColorViewType;
  rowHeightFn: RowHeightViewType;
  columnsStyle: TableColumnStyleType;
  size?: string;
  rowAutoHeight?: boolean;
  customLoading?: boolean;
  onCellClick: (columnName: string, dataIndex: string) => void;
  // Virtualization props
  containerHeight?: number;
  isFixedHeight?: boolean;
};

/**
 * A table with adjustable column width, width less than 0 means auto column width
 */
function ResizeableTableComp<RecordType extends object>(
  props: ResizeableTableProps<RecordType>
) {
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
    containerHeight,
    isFixedHeight,
    dataSource,
    ...restProps
  } = props;

  const [resizeData, setResizeData] = useState({ index: -1, width: -1 });
  const tableRef = useRef<HTMLDivElement>(null);
  const [measuredHeights, setMeasuredHeights] = useState<{
    header: number;
    summary: number;
  }>({ header: 0, summary: 0 });

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
    [
      rowColorFn,
      rowHeightFn,
      columnsStyle,
      size,
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

  // Measure header & summary heights so we can derive the body viewport height for vertical scrolling
  useEffect(() => {
    if (!isFixedHeight || !tableRef.current) return;
    const tableEl = tableRef.current;

    const measure = () => {
      const headerH =
        (tableEl.querySelector(".ant-table-header") as HTMLElement)
          ?.clientHeight ?? 0;
      const summaryH =
        (tableEl.querySelector(".ant-table-summary") as HTMLElement)
          ?.clientHeight ?? 0;
      setMeasuredHeights({ header: headerH, summary: summaryH });
    };

    measure();
    const resizeObserver = new ResizeObserver(measure);
    resizeObserver.observe(tableEl);

    return () => resizeObserver.disconnect();
  }, [isFixedHeight, dataSource?.length, columns.length]);

  // Sum widths (including resized values) to keep horizontal scroll baseline accurate
  function getTotalTableWidth(
    cols: CustomColumnType<RecordType>[],
    rData: { index: number; width: number }
  ) {
    return cols.reduce((sum, col, i) => {
      const liveWidth =
        (rData.index === i ? rData.width : (col.width as number | undefined)) ??
        undefined;
      const w =
        typeof liveWidth === "number" && liveWidth > 0
          ? liveWidth
          : COL_MIN_WIDTH;
      return sum + w;
    }, 0);
  }

  const scrollAndVirtualizationSettings = useMemo(() => {
    const totalWidth = getTotalTableWidth(memoizedColumns as any, resizeData);
    const scrollSettings: { x?: number; y?: number } = { x: totalWidth };

    // For fixed height mode, set vertical scroll height (body viewport height)
    if (isFixedHeight && containerHeight && containerHeight > 0) {
      const availableHeight = Math.max(
        containerHeight - measuredHeights.header - measuredHeights.summary,
        200
      );
      scrollSettings.y = availableHeight;
    }

    // Enable virtualization for fixed height mode with 50+ rows
    const shouldUseVirtualization = Boolean(
      isFixedHeight &&
        containerHeight &&
        dataSource?.length &&
        dataSource.length >= 50
    );

    return {
      virtual: shouldUseVirtualization,
      scroll: scrollSettings,
    };
  }, [
    isFixedHeight,
    containerHeight,
    dataSource?.length,
    measuredHeights,
    memoizedColumns,
    resizeData,
  ]);

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
        virtual={scrollAndVirtualizationSettings.virtual}
        scroll={scrollAndVirtualizationSettings.scroll}
      />
    </StyledTableWrapper>
  );
}

const ResizeableTable = React.memo(
  ResizeableTableComp
) as typeof ResizeableTableComp;
export default ResizeableTable;
