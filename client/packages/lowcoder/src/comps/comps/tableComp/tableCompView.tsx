import { default as Table, TableProps } from "antd/es/table";
import { TableCellContext, TableRowContext } from "comps/comps/tableComp/tableContext";
import { TableToolbar } from "comps/comps/tableComp/tableToolbarComp";
import { RowColorViewType, RowHeightViewType, TableEventOptionValues } from "comps/comps/tableComp/tableTypes";
import {
  COL_MIN_WIDTH,
  COLUMN_CHILDREN_KEY,
  ColumnsAggrData,
  columnsToAntdFormat,
  CustomColumnType,
  OB_ROW_ORI_INDEX,
  onTableChange,
  RecordType,
  supportChildrenTree,
} from "comps/comps/tableComp/tableUtils";
import {
  handleToHoverRow,
  handleToSelectedRow,
  TableColumnLinkStyleType,
  TableColumnStyleType,
  TableHeaderStyleType,
  TableRowStyleType,
  TableStyleType,
  ThemeDetail,
  TableToolbarStyleType,
} from "comps/controls/styleControlConstants";
import { CompNameContext, EditorContext } from "comps/editorState";
import { BackgroundColorContext } from "comps/utils/backgroundColorContext";
import { PrimaryColor } from "constants/style";
import { trans } from "i18n";
import _ from "lodash";
import { darkenColor, isDarkColor, ScrollBar } from "lowcoder-design";
import React, { Children, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { Resizable } from "react-resizable";
import styled, { css } from "styled-components";
import { useUserViewMode } from "util/hooks";
import { TableImplComp } from "./tableComp";
import { useResizeDetector } from "react-resize-detector";
import { SlotConfigContext } from "comps/controls/slotControl";
import { EmptyContent } from "pages/common/styledComponent";
import { messageInstance } from "lowcoder-design/src/components/GlobalInstances";
import { ReactRef, ResizeHandleAxis } from "layout/gridLayoutPropTypes";
import { CellColorViewType } from "./column/tableColumnComp";
import { defaultTheme } from "@lowcoder-ee/constants/themeConstants";
import { childrenToProps } from "@lowcoder-ee/comps/generators/multi";
import { getVerticalMargin } from "@lowcoder-ee/util/cssUtil";
import { TableSummary } from "./tableSummaryComp";
import Skeleton from "antd/es/skeleton";
import { SkeletonButtonProps } from "antd/es/skeleton/Button";
import { ThemeContext } from "@lowcoder-ee/comps/utils/themeContext";

export const EMPTY_ROW_KEY = 'empty_row';

function genLinerGradient(color: string) {
  return `linear-gradient(${color}, ${color})`;
}

const getStyle = (
  style: TableStyleType,
  rowStyle: TableRowStyleType,
  headerStyle: TableHeaderStyleType,
  toolbarStyle: TableToolbarStyleType,
) => {
  const background = genLinerGradient(style.background);
  const selectedRowBackground = genLinerGradient(rowStyle.selectedRowBackground);
  const hoverRowBackground = genLinerGradient(rowStyle.hoverRowBackground);
  const alternateBackground = genLinerGradient(rowStyle.alternateBackground);

  return css`
    .ant-table-body {
      background: ${genLinerGradient(style.background)};
    }
    .ant-table-tbody {
      > tr:nth-of-type(2n + 1) {
        &,
        > td {
          background: ${genLinerGradient(rowStyle.background)};
          // border-bottom:${rowStyle.borderWidth} ${rowStyle.borderStyle} ${rowStyle.border} !important;
          // border-right:${rowStyle.borderWidth} ${rowStyle.borderStyle} ${rowStyle.border} !important;
        }
      }

      > tr:nth-of-type(2n) {
        &,
        > td {
          background: ${alternateBackground};
          // border-bottom:${rowStyle.borderWidth} ${rowStyle.borderStyle} ${rowStyle.border} !important;
          // border-right:${rowStyle.borderWidth} ${rowStyle.borderStyle} ${rowStyle.border} !important;
        }
      }

      // selected row
      > tr:nth-of-type(2n + 1).ant-table-row-selected {
        > td {
          background: ${selectedRowBackground}, ${rowStyle.background} !important;
        }

        > td.ant-table-cell-row-hover,
        &:hover > td {
          background: ${hoverRowBackground}, ${selectedRowBackground}, ${rowStyle.background} !important;
        }
      }

      > tr:nth-of-type(2n).ant-table-row-selected {
        > td {
          background: ${selectedRowBackground}, ${alternateBackground} !important;
        }

        > td.ant-table-cell-row-hover,
        &:hover > td {
          background: ${hoverRowBackground}, ${selectedRowBackground}, ${alternateBackground} !important;
        }
      }

      // hover row
      > tr:nth-of-type(2n + 1) > td.ant-table-cell-row-hover {
        &,
        > div:nth-of-type(2) {
          background: ${hoverRowBackground}, ${rowStyle.background} !important;
        }
      }

      > tr:nth-of-type(2n) > td.ant-table-cell-row-hover {
        &,
        > div:nth-of-type(2) {
          background: ${hoverRowBackground}, ${alternateBackground} !important;
        }
      }

      > tr.ant-table-expanded-row > td {
        background: ${background};
      }
    }
  `;
};

const TitleResizeHandle = styled.span`
  position: absolute;
  top: 0;
  right: -5px;
  width: 10px;
  height: 100%;
  cursor: col-resize;
  z-index: 1;
`;

const BackgroundWrapper = styled.div<{
  $style: TableStyleType;
  $tableAutoHeight: boolean;
  $showHorizontalScrollbar: boolean;
  $showVerticalScrollbar: boolean;
  $fixedToolbar: boolean;
}>`
  display: flex;
  flex-direction: column;
  background: ${(props) => props.$style.background} !important;
  border-radius: ${(props) => props.$style.radius} !important;
  padding: ${(props) => props.$style.padding} !important;
  margin: ${(props) => props.$style.margin} !important;
  border-style: ${(props) => props.$style.borderStyle} !important;
  border-width: ${(props) => `${props.$style.borderWidth} !important`};
  border-color: ${(props) => `${props.$style.border} !important`};
  height: calc(100% - ${(props) => getVerticalMargin(props.$style.margin.split(' '))});
  overflow: hidden;

  > div.table-scrollbar-wrapper {
    overflow: auto;
    ${(props) => props.$fixedToolbar && `height: auto`};

    ${(props) => (props.$showHorizontalScrollbar || props.$showVerticalScrollbar) && `
      .simplebar-content-wrapper {
        overflow: auto !important;
      }  
    `}

    ${(props) => !props.$showHorizontalScrollbar && `
      div.simplebar-horizontal {
        visibility: hidden !important;
      }  
    `}
    ${(props) => !props.$showVerticalScrollbar && `
      div.simplebar-vertical {
        visibility: hidden !important;
      }  
    `}
  }
`;

// TODO: find a way to limit the calc function for max-height only to first Margin value
const TableWrapper = styled.div<{
  $style: TableStyleType;
  $headerStyle: TableHeaderStyleType;
  $toolbarStyle: TableToolbarStyleType;
  $rowStyle: TableRowStyleType;
  $toolbarPosition: "above" | "below" | "close";
  $fixedHeader: boolean;
  $fixedToolbar: boolean;
  $visibleResizables: boolean;
  $showHRowGridBorder?: boolean;
}>`
  .ant-table-wrapper {
    border-top: unset;
    border-color: inherit;
  }

  .ant-table-row-expand-icon {
    color: ${PrimaryColor};
  }

  .ant-table .ant-table-cell-with-append .ant-table-row-expand-icon {
    margin: 0;
    top: 18px;
    left: 4px;
  }

  .ant-table.ant-table-small .ant-table-cell-with-append .ant-table-row-expand-icon {
    top: 10px;
  }

  .ant-table.ant-table-middle .ant-table-cell-with-append .ant-table-row-expand-icon {
    top: 14px;
    margin-right:5px;
  }

  .ant-table {
    background: ${(props) =>props.$style.background};
    .ant-table-container {
      border-left: unset;
      border-top: none !important;
      border-inline-start: none !important;

      &::after {
        box-shadow: none !important;
      }

      .ant-table-content {
        overflow: unset !important
      }

      // A table expand row contains table
      .ant-table-tbody .ant-table-wrapper:only-child .ant-table {
        margin: 0;
      }

      table {
        border-top: unset;

        > .ant-table-thead {
          ${(props) =>
            props.$fixedHeader && `
              position: sticky;
              position: -webkit-sticky;
              // top: ${props.$fixedToolbar ? '47px' : '0'};
              top: 0;
              z-index: 99;
            `
          }
          > tr > th {
            background-color: ${(props) => props.$headerStyle.headerBackground};
           
            border-color: ${(props) => props.$headerStyle.border};
            border-width: ${(props) => props.$headerStyle.borderWidth};
            color: ${(props) => props.$headerStyle.headerText};
            // border-inline-end: ${(props) => `${props.$headerStyle.borderWidth} solid ${props.$headerStyle.border}`} !important;
            

            > div {
              margin: ${(props) => props.$headerStyle.margin};

              &, .ant-table-column-title > div {
                font-size: ${(props) => props.$headerStyle.textSize};
                font-weight: ${(props) => props.$headerStyle.textWeight};
                font-family: ${(props) => props.$headerStyle.fontFamily};
                font-style: ${(props) => props.$headerStyle.fontStyle};
                color:${(props) => props.$headerStyle.text}
              }
            }

            &:last-child {
              border-inline-end: none !important;
            }
            &.ant-table-column-has-sorters:hover {
              background-color: ${(props) => darkenColor(props.$headerStyle.headerBackground, 0.05)};
            }
  
            > .ant-table-column-sorters > .ant-table-column-sorter {
              color: ${(props) => props.$headerStyle.headerText === defaultTheme.textDark ? "#bfbfbf" : props.$headerStyle.headerText};
            }

            &::before {
              background-color: ${(props) => props.$headerStyle.border};
              width: ${(props) => (props.$visibleResizables ? "1px" : "0px")} !important;
            }
          }
        }

        > thead > tr > th,
        > tbody > tr > td {
          border-color: ${(props) => props.$headerStyle.border};
          ${(props) => !props.$showHRowGridBorder && `border-bottom: 0px;`}
        }

        td {
          padding: 0px 0px;
          // ${(props) => props.$showHRowGridBorder ?'border-bottom: 1px solid #D7D9E0 !important;': `border-bottom: 0px;`}
        }

        thead > tr:first-child {
          th:last-child {
            border-right: unset;
          }
        }

        tbody > tr > td:last-child {
          border-right: unset !important;
        }

        .ant-empty-img-simple-g {
          fill: #fff;
        }

        > thead > tr:first-child {
          th:first-child {
            border-top-left-radius: 0px;
          }

          th:last-child {
            border-top-right-radius: 0px;
          }
        }
      }

      .ant-table-expanded-row-fixed:after {
        border-right: unset !important;
      }
    }
  }
  
  ${(props) =>
    props.$style && getStyle(props.$style, props.$rowStyle, props.$headerStyle, props.$toolbarStyle)}
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

const TableTd = styled.td<{
  $background: string;
  $style: TableColumnStyleType & { rowHeight?: string };
  $defaultThemeDetail: ThemeDetail;
  $linkStyle?: TableColumnLinkStyleType;
  $isEditing: boolean;
  $tableSize?: string;
  $autoHeight?: boolean;
}>`
  .ant-table-row-expand-icon,
  .ant-table-row-indent {
    display: ${(props) => (props.$isEditing ? "none" : "initial")};
  }
  &.ant-table-row-expand-icon-cell {
    background: ${(props) => props.$background};
    border-color: ${(props) => props.$style.border};
  }
  background: ${(props) => props.$background} !important;
  border-color: ${(props) => props.$style.border} !important;
  border-radius: ${(props) => props.$style.radius};
  padding: 0 !important;

  > div:not(.editing-border, .editing-wrapper),
  .editing-wrapper .ant-input,
  .editing-wrapper .ant-input-number,
  .editing-wrapper .ant-picker {
    margin: ${(props) => props.$isEditing ? '0px' : props.$style.margin};
    color: ${(props) => props.$style.text};
    font-weight: ${(props) => props.$style.textWeight};
    font-family: ${(props) => props.$style.fontFamily};
    overflow: hidden; 
    ${(props) => props.$tableSize === 'small' && `
      padding: 1px 8px;
      font-size: ${props.$defaultThemeDetail.textSize == props.$style.textSize ? '14px !important' : props.$style.textSize + ' !important'};
      font-style:${props.$style.fontStyle} !important;
      min-height: ${props.$style.rowHeight || '14px'};
      line-height: 20px;
      ${!props.$autoHeight && `
        overflow-y: auto;
        max-height: ${props.$style.rowHeight || '28px'};
      `};
    `};
    ${(props) => props.$tableSize === 'middle' && `
      padding: 8px 8px;
      font-size: ${props.$defaultThemeDetail.textSize == props.$style.textSize ? '16px !important' : props.$style.textSize + ' !important'};
      font-style:${props.$style.fontStyle} !important;
      min-height: ${props.$style.rowHeight || '24px'};
      line-height: 24px;
      ${!props.$autoHeight && `
        overflow-y: auto;
        max-height: ${props.$style.rowHeight || '48px'};
      `};
    `};
    ${(props) => props.$tableSize === 'large' && `
      padding: 16px 16px;
      font-size: ${props.$defaultThemeDetail.textSize == props.$style.textSize ? '18px !important' : props.$style.textSize + ' !important'};
      font-style:${props.$style.fontStyle} !important;
      min-height: ${props.$style.rowHeight || '48px'};
      ${!props.$autoHeight && `
        overflow-y: auto;
        max-height: ${props.$style.rowHeight || '96px'};
      `};
    `};
    
    > .ant-badge > .ant-badge-status-text,
    > div > .markdown-body {
      color: ${(props) => props.$style.text};
    }

    > div > svg g {
      stroke: ${(props) => props.$style.text};
    }

    // dark link|links color
    > a,
    > div  a {
      color: ${(props) => props.$linkStyle?.text};

      &:hover {
        color: ${(props) => props.$linkStyle?.hoverText};
      }

      &:active {
        color: ${(props) => props.$linkStyle?.activeText}};
      }
    }
  }
`;

const TableTdLoading = styled(Skeleton.Button)<SkeletonButtonProps & {
  $tableSize?: string;
}>`
  width: 90% !important;
  display: table !important;

  .ant-skeleton-button {
    min-width: auto !important;
    display: block !important;
    ${(props) => props.$tableSize === 'small' && `
      height: 20px !important;
    `}
    ${(props) => props.$tableSize === 'middle' && `
      height: 24px !important;
    `}
    ${(props) => props.$tableSize === 'large' && `
      height: 28px !important;
    `}
  }
`;

const ResizeableTitle = (props: any) => {
  const { onResize, onResizeStop, width, viewModeResizable, ...restProps } = props;
  const [widthChild, setWidthChild] = useState(0);
  const elementRef = useRef(null);
  const isUserViewMode = useUserViewMode();

  const setChildWidth = () => {
    if (width && width > 0) {
      // There is width, no need for childWidth
      return;
    }
    setWidthChild((elementRef.current as any).getBoundingClientRect().width);
  };

  useEffect(() => {
    if (!elementRef.current) {
      return;
    }
    setChildWidth();
  }, []);

  // the multi select column and expand column should not be resizable
  const isNotDataColumn = _.isNil(restProps.title);
  if ((isUserViewMode && !viewModeResizable) || isNotDataColumn) {
    return <TableTh ref={elementRef} {...restProps} width={width} />;
  }

  return (
    <Resizable
      width={width > 0 ? width : widthChild}
      height={0}
      onResize={(e: React.SyntheticEvent, { size }: { size: { width: number } }) =>
        onResize(size.width)
      }
      onResizeStart={(e) => {
        setChildWidth();
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
      <TableTh ref={elementRef} {...restProps} title="" />
    </Resizable>
  );
};

type CustomTableProps<RecordType> = Omit<TableProps<RecordType>, "components" | "columns"> & {
  columns: CustomColumnType<RecordType>[];
  viewModeResizable: boolean;
  visibleResizables: boolean;
  rowColorFn: RowColorViewType;
  rowHeightFn: RowHeightViewType;
  columnsStyle: TableColumnStyleType;
  size?: string;
  rowAutoHeight?: boolean;
  customLoading?: boolean;
  onCellClick: (columnName: string, dataIndex: string) => void;
};

function TableCellView(props: {
  record: RecordType;
  title: string;
  rowColorFn: RowColorViewType;
  rowHeightFn: RowHeightViewType;
  cellColorFn: CellColorViewType;
  rowIndex: number;
  children: any;
  columnsStyle: TableColumnStyleType;
  columnStyle: TableColumnStyleType;
  linkStyle: TableColumnLinkStyleType;
  tableSize?: string;
  autoHeight?: boolean;
  loading?: boolean;
}) {
  const {
    record,
    title,
    rowIndex,
    rowColorFn,
    rowHeightFn,
    cellColorFn,
    children,
    columnsStyle,
    columnStyle,
    linkStyle,
    tableSize,
    autoHeight,
    loading,
    ...restProps
  } = props;

  const [editing, setEditing] = useState(false);
  const rowContext = useContext(TableRowContext);
  let tdView;
  if (!record) {
    tdView = <td {...restProps}>{children}</td>;
  } else {
    const rowColor = rowColorFn({
      currentRow: record,
      currentIndex: rowIndex,
      currentOriginalIndex: record[OB_ROW_ORI_INDEX],
      columnTitle: title,
    });
    const rowHeight = rowHeightFn({
      currentRow: record,
      currentIndex: rowIndex,
      currentOriginalIndex: record[OB_ROW_ORI_INDEX],
      columnTitle: title,
    });
    const cellColor = cellColorFn({
      currentCell: record[title],
      currentRow: record,
    });

    const style = {
      background: cellColor || rowColor || columnStyle.background || columnsStyle.background,
      margin: columnStyle.margin || columnsStyle.margin,
      text: columnStyle.text || columnsStyle.text,
      border: columnStyle.border || columnsStyle.border,
      radius: columnStyle.radius || columnsStyle.radius,
      // borderWidth: columnStyle.borderWidth || columnsStyle.borderWidth,
      textSize: columnStyle.textSize || columnsStyle.textSize,
      textWeight: columnsStyle.textWeight || columnStyle.textWeight,
      fontFamily: columnsStyle.fontFamily || columnStyle.fontFamily,
      fontStyle: columnsStyle.fontStyle || columnStyle.fontStyle,
      rowHeight: rowHeight,
    }
    let { background } = style;
    if (rowContext.selected) {
      background = genLinerGradient(handleToSelectedRow(background)) + "," + background;
    }
    if (rowContext.hover) {
      background = genLinerGradient(handleToHoverRow(background)) + "," + background;
    }
    tdView = (
      <TableTd
        {...restProps}
        $background={background}
        $style={style}
        $defaultThemeDetail={defaultTheme}
        $linkStyle={linkStyle}
        $isEditing={editing}
        $tableSize={tableSize}
        $autoHeight={autoHeight}
      >
        {loading
          ? <TableTdLoading block active $tableSize={tableSize} />
          : children
        }
      </TableTd>
    );
  }

  return (
    <TableCellContext.Provider value={{ isEditing: editing, setIsEditing: setEditing }}>
      {tdView}
    </TableCellContext.Provider>
  );
}

function TableRowView(props: any) {
  const [hover, setHover] = useState(false);
  const [selected, setSelected] = useState(false);
  return (
    <TableRowContext.Provider value={{ hover: hover, selected: selected }}>
      <tr
        {...props}
        tabIndex={-1}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        onFocus={() => setSelected(true)}
        onBlur={() => setSelected(false)}
      ></tr>
    </TableRowContext.Provider>
  );
}

/**
 * A table with adjustable column width, width less than 0 means auto column width
 */
function ResizeableTable<RecordType extends object>(props: CustomTableProps<RecordType>) {
  const [resizeData, setResizeData] = useState({
    index: -1,
    width: -1,
  });
  let allColumnFixed = true;
  const { customLoading } = props;

  const columns = props.columns.map((col, index) => {
    const { width, style, linkStyle, cellColorFn, ...restCol } = col;
    const resizeWidth = (resizeData.index === index ? resizeData.width : col.width) ?? 0;
    let colWidth: number | string = "auto";
    let minWidth: number | string = COL_MIN_WIDTH;
    if (typeof resizeWidth === "number" && resizeWidth > 0) {
      minWidth = "unset";
      colWidth = resizeWidth;
    } else {
      allColumnFixed = false;
    }
    return {
      ...restCol,
      RC_TABLE_INTERNAL_COL_DEFINE: {
        style: {
          minWidth: minWidth,
          width: colWidth,
        },
      },
      onCell: (record: RecordType, rowIndex: any) => ({
        record,
        title: String(col.dataIndex),
        rowColorFn: props.rowColorFn,
        rowHeightFn: props.rowHeightFn,
        cellColorFn: cellColorFn,
        rowIndex: rowIndex,
        columnsStyle: props.columnsStyle,
        columnStyle: style,
        linkStyle,
        tableSize: props.size,
        autoHeight: props.rowAutoHeight,
        onClick: () => {
          props.onCellClick(col.titleText, String(col.dataIndex));
        },
        loading: customLoading,
      }),
      onHeaderCell: () => ({
        width: resizeWidth,
        title: col.titleText,
        viewModeResizable: props.viewModeResizable,
        onResize: (width: React.SyntheticEvent) => {
          if (width) {
            setResizeData({
              index: index,
              width: width as unknown as number,
            });
          }
        },
        onResizeStop: (e: React.SyntheticEvent, { size }: { size: { width: number } }) => {
          setResizeData({
            index: -1,
            width: -1,
          });
          if (col.onWidthResize) {
            col.onWidthResize(size.width);
          }
        },
      }),
    };
  });

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
      {...props}
      pagination={false}
      columns={columns}
      scroll={{
        x: COL_MIN_WIDTH * columns.length,
        y: undefined,
      }}
    ></Table>
  );
}

ResizeableTable.whyDidYouRender = true;

const createNewEmptyRow = (
  rowIndex: number,
  columnsAggrData: ColumnsAggrData,
) => {
  const emptyRowData: RecordType = {
    [OB_ROW_ORI_INDEX]: `${EMPTY_ROW_KEY}_${rowIndex}`,
  };
  Object.keys(columnsAggrData).forEach(columnKey => {
    emptyRowData[columnKey] = '';
  });
  return emptyRowData;
}

export function TableCompView(props: {
  comp: InstanceType<typeof TableImplComp>;
  onRefresh: (allQueryNames: Array<string>, setLoading: (loading: boolean) => void) => void;
  onDownload: (fileName: string) => void;
}) {
  const [emptyRowsMap, setEmptyRowsMap] = useState<Record<string, RecordType>>({});
  const editorState = useContext(EditorContext);
  const currentTheme = useContext(ThemeContext)?.theme;
  const showDataLoadingIndicators = currentTheme?.showDataLoadingIndicators;
  const { width, ref } = useResizeDetector({
    refreshMode: "debounce",
    refreshRate: 600,
    handleHeight: false,
  });
  const viewMode = useUserViewMode();
  const compName = useContext(CompNameContext);
  const [loading, setLoading] = useState(false);
  const { comp, onDownload, onRefresh } = props;
  const compChildren = comp.children;
  const style = compChildren.style.getView();
  const rowStyle = compChildren.rowStyle.getView();
  const headerStyle = compChildren.headerStyle.getView();
  const toolbarStyle = compChildren.toolbarStyle.getView();
  const rowAutoHeight = compChildren.rowAutoHeight.getView();
  const tableAutoHeight = comp.getTableAutoHeight();
  const showHorizontalScrollbar = compChildren.showHorizontalScrollbar.getView();
  const showVerticalScrollbar = compChildren.showVerticalScrollbar.getView();
  const visibleResizables = compChildren.visibleResizables.getView();
  const showHRowGridBorder = compChildren.showHRowGridBorder.getView();
  const columnsStyle = compChildren.columnsStyle.getView();
  const summaryRowStyle = compChildren.summaryRowStyle.getView();
  const changeSet = useMemo(() => compChildren.columns.getChangeSet(), [compChildren.columns]);
  const insertSet = useMemo(() => compChildren.columns.getChangeSet(true), [compChildren.columns]);
  const hasChange = useMemo(() => !_.isEmpty(changeSet) || !_.isEmpty(insertSet), [changeSet, insertSet]);
  const columns = useMemo(() => compChildren.columns.getView(), [compChildren.columns]);
  const columnViews = useMemo(() => columns.map((c) => c.getView()), [columns]);
  const data = comp.filterData;
  const sort = useMemo(() => compChildren.sort.getView(), [compChildren.sort]);
  const toolbar = useMemo(() => compChildren.toolbar.getView(), [compChildren.toolbar]);
  const showSummary = useMemo(() => compChildren.showSummary.getView(), [compChildren.showSummary]);
  const summaryRows = useMemo(() => compChildren.summaryRows.getView(), [compChildren.summaryRows]);
  const inlineAddNewRow = useMemo(() => compChildren.inlineAddNewRow.getView(), [compChildren.inlineAddNewRow]);
  const pagination = useMemo(() => compChildren.pagination.getView(), [compChildren.pagination]);
  const size = useMemo(() => compChildren.size.getView(), [compChildren.size]);
  const editModeClicks = useMemo(() => compChildren.editModeClicks.getView(), [compChildren.editModeClicks]);
  const onEvent = useMemo(() => compChildren.onEvent.getView(), [compChildren.onEvent]);
  const dynamicColumn = compChildren.dynamicColumn.getView();
  const dynamicColumnConfig = useMemo(
    () => compChildren.dynamicColumnConfig.getView(),
    [compChildren.dynamicColumnConfig]
  );
  const columnsAggrData = comp.columnAggrData;
  const expansion = useMemo(() => compChildren.expansion.getView(), [compChildren.expansion]);
  const antdColumns = useMemo(
    () =>
      columnsToAntdFormat(
        columnViews,
        sort,
        toolbar.columnSetting,
        size,
        dynamicColumn,
        dynamicColumnConfig,
        columnsAggrData,
        editModeClicks,
        onEvent,
      ),
    [
      columnViews,
      sort,
      toolbar.columnSetting,
      size,
      dynamicColumn,
      dynamicColumnConfig,
      columnsAggrData,
      editModeClicks,
    ]
  );

  const supportChildren = useMemo(
    () => supportChildrenTree(compChildren.data.getView()),
    [compChildren.data]
  );

  const updateEmptyRows = useCallback(() => {
    if (!inlineAddNewRow) {
      setEmptyRowsMap({})
      setTimeout(() => compChildren.columns.dispatchClearInsertSet());
      return;
    }

    let emptyRows: Record<string, RecordType> = {...emptyRowsMap};
    const existingRowsKeys = Object.keys(emptyRows);
    const existingRowsCount = existingRowsKeys.length;
    const updatedRowsKeys = Object.keys(insertSet).filter(
      key => key.startsWith(EMPTY_ROW_KEY)
    );
    const updatedRowsCount = updatedRowsKeys.length;
    const removedRowsKeys = existingRowsKeys.filter(
      x => !updatedRowsKeys.includes(x)
    );

    if (removedRowsKeys.length === existingRowsCount) {
      const newRowIndex = 0;
      const newRowKey = `${EMPTY_ROW_KEY}_${newRowIndex}`;
      setEmptyRowsMap({
        [newRowKey]: createNewEmptyRow(newRowIndex, columnsAggrData)
      });
      const ele = document.querySelector<HTMLElement>(`[data-row-key=${newRowKey}]`);
      if (ele) {
        ele.style.display = '';
      }
      return;
    }

    removedRowsKeys.forEach(rowKey => {
      if (
        rowKey === existingRowsKeys[existingRowsCount - 1]
        || rowKey === existingRowsKeys[existingRowsCount - 2]
      ) {
        delete emptyRows[rowKey];
      } else {
        const ele = document.querySelector<HTMLElement>(`[data-row-key=${rowKey}]`);
        if (ele) {
          ele.style.display = 'none';
        }
      }
    })
    const lastRowKey = updatedRowsCount ? updatedRowsKeys[updatedRowsCount - 1] : '';
    const lastRowIndex = lastRowKey ? parseInt(lastRowKey.replace(`${EMPTY_ROW_KEY}_`, '')) : -1;

    const newRowIndex = lastRowIndex + 1;
    const newRowKey = `${EMPTY_ROW_KEY}_${newRowIndex}`;
    emptyRows[newRowKey] = createNewEmptyRow(newRowIndex, columnsAggrData);
    setEmptyRowsMap(emptyRows);
  }, [
    inlineAddNewRow,
    JSON.stringify(insertSet),
    setEmptyRowsMap,
    createNewEmptyRow,
  ]);

  useEffect(() => {
    updateEmptyRows();
  }, [updateEmptyRows]);


  const pageDataInfo = useMemo(() => {
    // Data pagination
    let pagedData = data;
    let current = pagination.current;
    const total = pagination.total || data.length;
    if (data.length > pagination.pageSize) {
      // Local pagination
      let offset = (current - 1) * pagination.pageSize;
      if (offset >= total) {
        current = 1;
        offset = 0;
      }
      pagedData = pagedData.slice(offset, offset + pagination.pageSize);
    }

    return {
      total: total,
      current: current,
      data: pagedData,
    };
  }, [pagination, data]);

  const childrenProps = childrenToProps(comp.children);

  const handleChangeEvent = useCallback(
    (eventName: TableEventOptionValues) => {
      if (eventName === "saveChanges" && !compChildren.onEvent.isBind(eventName)) {
        !viewMode && messageInstance.warning(trans("table.saveChangesNotBind"));
        return;
      }
      compChildren.onEvent.getView()(eventName);
      setTimeout(() => compChildren.columns.dispatchClearChangeSet());
    },
    [viewMode, compChildren.onEvent, compChildren.columns]
  );

  const toolbarView = (
    <TableToolbar
      toolbar={toolbar}
      $style={toolbarStyle}
      pagination={{
        ...pagination,
        total: pageDataInfo.total,
        current: pageDataInfo.current,
      }}
      columns={columns}
      onRefresh={() =>
        onRefresh(
          editorState.queryCompInfoList().map((info) => info.name),
          setLoading
        )
      }
      onDownload={() => {
        handleChangeEvent("download");
        onDownload(`${compName}-data`)
      }}
      hasChange={hasChange}
      onSaveChanges={() => handleChangeEvent("saveChanges")}
      onCancelChanges={() => {
        handleChangeEvent("cancelChanges");
        if (inlineAddNewRow) {
          setEmptyRowsMap({});
        }
      }}
      onEvent={onEvent}
    />
  );

  const summaryView = () => {
    if (!showSummary) return undefined;
    return (
      <TableSummary
        tableSize={size}
        istoolbarPositionBelow={toolbar.position === "below"}
        expandableRows={Boolean(expansion.expandModalView)}
        summaryRows={parseInt(summaryRows)}
        columns={columns}
        summaryRowStyle={summaryRowStyle}
      />
    );
  }

  if (antdColumns.length === 0) {
    return <EmptyContent text={trans("table.emptyColumns")} />;
  }

  const hideScrollbar = !showHorizontalScrollbar && !showVerticalScrollbar;
  const showTableLoading = loading ||
    // fixme isLoading type
    ((showDataLoadingIndicators || compChildren.showDataLoadSpinner.getView()) &&
      (compChildren.data as any).isLoading()) ||
    compChildren.loading.getView();

  return (
    <BackgroundColorContext.Provider value={style.background} >
      <BackgroundWrapper
        ref={ref}
        $style={style}
        $tableAutoHeight={tableAutoHeight}
        $showHorizontalScrollbar={showHorizontalScrollbar}
        $showVerticalScrollbar={showVerticalScrollbar}
        $fixedToolbar={toolbar.fixedToolbar}
      >
        {toolbar.position === "above" && (toolbar.fixedToolbar || (tableAutoHeight && showHorizontalScrollbar)) && toolbarView}
        <ScrollBar
          className="table-scrollbar-wrapper"
          style={{ height: "100%", margin: "0px", padding: "0px" }}
          hideScrollbar={hideScrollbar}
          prefixNode={toolbar.position === "above" && !toolbar.fixedToolbar && !(tableAutoHeight && showHorizontalScrollbar) && toolbarView}
          suffixNode={toolbar.position === "below" && !toolbar.fixedToolbar && !(tableAutoHeight && showHorizontalScrollbar) && toolbarView}
        >
          <TableWrapper
            $style={style}
            $rowStyle={rowStyle}
            $headerStyle={headerStyle}
            $toolbarStyle={toolbarStyle}
            $toolbarPosition={toolbar.position}
            $fixedHeader={compChildren.fixedHeader.getView()}
            $fixedToolbar={toolbar.fixedToolbar && toolbar.position === 'above'}
            $visibleResizables={visibleResizables}
            $showHRowGridBorder={showHRowGridBorder}
          >
            <ResizeableTable<RecordType>
              expandable={{
                ...expansion.expandableConfig,
                childrenColumnName: supportChildren
                  ? COLUMN_CHILDREN_KEY
                  : "OB_CHILDREN_KEY_PLACEHOLDER",
                fixed: "left",
                onExpand: (expanded) => {
                  if (expanded) {
                    handleChangeEvent('rowExpand')
                  } else {
                    handleChangeEvent('rowShrink')
                  }
                }
              }}
              // rowKey={OB_ROW_ORI_INDEX}
              rowColorFn={compChildren.rowColor.getView() as any}
              rowHeightFn={compChildren.rowHeight.getView() as any}
              {...compChildren.selection.getView()(onEvent)}
              bordered={compChildren.showRowGridBorder.getView()}
              onChange={(pagination, filters, sorter, extra) => {
                onTableChange(pagination, filters, sorter, extra, comp.dispatch, onEvent);
              }}
              showHeader={!compChildren.hideHeader.getView()}
              columns={antdColumns}
              columnsStyle={columnsStyle}
              viewModeResizable={compChildren.viewModeResizable.getView()}
              visibleResizables={compChildren.visibleResizables.getView()}
              dataSource={pageDataInfo.data.concat(Object.values(emptyRowsMap))}
              size={compChildren.size.getView()}
              rowAutoHeight={rowAutoHeight}
              tableLayout="fixed"
              customLoading={showTableLoading}
              onCellClick={(columnName: string, dataIndex: string) => {
                comp.children.selectedCell.dispatchChangeValueAction({
                  name: columnName,
                  dataIndex: dataIndex,
                });
              }}
              summary={summaryView}
            />
            <SlotConfigContext.Provider value={{ modalWidth: width && Math.max(width, 300) }}>
              {expansion.expandModalView}
            </SlotConfigContext.Provider>
          </TableWrapper>
        </ScrollBar>
        {toolbar.position === "below" && (toolbar.fixedToolbar || (tableAutoHeight && showHorizontalScrollbar)) && toolbarView}
      </BackgroundWrapper>

    </BackgroundColorContext.Provider>
  );
}
