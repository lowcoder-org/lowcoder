import { Table } from "antd";
import { TableProps } from "antd/es/table";
import { TableCellContext, TableRowContext } from "comps/comps/tableComp/tableContext";
import { TableToolbar } from "comps/comps/tableComp/tableToolbarComp";
import { RowColorViewType, RowHeightViewType } from "comps/comps/tableComp/tableTypes";
import {
  COL_MIN_WIDTH,
  COLUMN_CHILDREN_KEY,
  columnsToAntdFormat,
  CustomColumnType,
  OB_ROW_ORI_INDEX,
  onTableChange,
  RecordType,
  supportChildrenTree,
} from "comps/comps/tableComp/tableUtils";
import {
  defaultTheme,
  handleToHoverRow,
  handleToSelectedRow,
  TableColumnLinkStyleType,
  TableColumnStyleType,
  TableRowStyleType,
  TableStyleType,
} from "comps/controls/styleControlConstants";
import { CompNameContext, EditorContext } from "comps/editorState";
import { BackgroundColorContext } from "comps/utils/backgroundColorContext";
import { PrimaryColor } from "constants/style";
import { trans } from "i18n";
import _ from "lodash";
import { darkenColor, isDarkColor } from "lowcoder-design";
import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { Resizable } from "react-resizable";
import styled, { css } from "styled-components";
import { useUserViewMode } from "util/hooks";
import { TableImplComp } from "./tableComp";
import { useResizeDetector } from "react-resize-detector";
import { SlotConfigContext } from "comps/controls/slotControl";
import { EmptyContent } from "pages/common/styledComponent";
import { messageInstance } from "lowcoder-design";
import { ReactRef, ResizeHandleAxis } from "layout/gridLayoutPropTypes";
import { CellColorViewType } from "./column/tableColumnComp";

const TitleResizeHandle = styled.span`
  position: absolute;
  top: 0;
  right: -5px;
  width: 10px;
  height: 100%;
  cursor: col-resize;
  z-index: 1;
`;

function genLinerGradient(color: string) {
  return `linear-gradient(${color}, ${color})`;
}

const getStyle = (
  style: TableStyleType,
  rowStyle: TableRowStyleType,
) => {
  const background = genLinerGradient(style.background);
  const selectedRowBackground = genLinerGradient(rowStyle.selectedRowBackground);
  const hoverRowBackground = genLinerGradient(rowStyle.hoverRowBackground);
  const alternateBackground = genLinerGradient(rowStyle.alternateBackground);

  return css`
    .ant-table-body {
      background: white;
    }
    .ant-table-tbody {
      > tr:nth-of-type(2n + 1) {
        &,
        > td {
          background: ${genLinerGradient(rowStyle.background)};
        }
      }

      > tr:nth-of-type(2n) {
        &,
        > td {
          background: ${alternateBackground};
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

const TableWrapper = styled.div<{
  $style: TableStyleType;
  $rowStyle: TableRowStyleType;
  toolbarPosition: "above" | "below" | "close";
  fixedHeader: boolean;
  fixedToolbar: boolean;
}>`
  max-height: 100%;
  overflow-y: auto;
  background: white;
  border: ${(props) => `1px solid ${props.$style.border}`};
  border-radius: ${(props) => props.$style.radius};

  .ant-table-wrapper {
    border-top: ${(props) => (props.toolbarPosition === "above" ? "1px solid" : "unset")};
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
  }

  .ant-table {
    background: ${(props) => props.$style.background};
    .ant-table-container {
      border-left: unset;
      border-top: none !important;
      border-inline-start: none !important;

      &::after {
        box-shadow: none !important;
      }

      .ant-table-content {
        overflow: unset !important;
      }

      // A table expand row contains table
      .ant-table-tbody .ant-table-wrapper:only-child .ant-table {
        margin: 0;
      }

      table {
        border-top: unset;

        > .ant-table-thead {
          > tr > th {
            background-color: ${(props) => props.$style.headerBackground};
            border-color: ${(props) => props.$style.border};
            color: ${(props) => props.$style.headerText};
            border-inline-end: ${(props) => `1px solid ${props.$style.border}`} !important;
            ${(props) => 
              props.fixedHeader && `
                position: sticky;
                position: -webkit-sticky;
                top: ${props.fixedToolbar ? '47px' : '0'};
                z-index: 99;
              `
            }

            &:last-child {
              border-inline-end: none !important;
            }
            &.ant-table-column-has-sorters:hover {
              background-color: ${(props) => darkenColor(props.$style.headerBackground, 0.05)};
            }
  
            > .ant-table-column-sorters > .ant-table-column-sorter {
              color: ${(props) => props.$style.headerText === defaultTheme.textDark ? "#bfbfbf" : props.$style.headerText};
            }

            &::before {
              background-color: ${(props) => props.$style.border};
            }
          }
        }

        > thead > tr > th,
        > tbody > tr > td {
          border-color: ${(props) => props.$style.border};
        }

        td {
          padding: 0px 0px;
        }

        thead > tr:first-child {
          th:last-child {
            border-right: unset;
          }
        }

        tbody > tr > td:last-child {
          border-right: unset;
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

        // hide the bottom border of the last row
        ${(props) =>
          props.toolbarPosition !== "below" &&
          `
            tbody > tr:last-child > td {
              border-bottom: unset;
            }
        `}
      }

      .ant-table-expanded-row-fixed:after {
        border-right: unset !important;
      }
    }
  }
  
  ${(props) => 
    props.$style && getStyle(props.$style, props.$rowStyle)}
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
  background: string;
  $style: TableColumnStyleType & {rowHeight?: string};
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
    background: ${(props) => props.background};
    border-color: ${(props) => props.$style.border};
  }
  background: ${(props) => props.background} !important;
  border-color: ${(props) => props.$style.border} !important;
  border-width: ${(props) => props.$style.borderWidth} !important;
  border-radius: ${(props) => props.$style.radius};
  padding: 0 !important;

  > div {
    color: ${(props) => props.$style.text};
    font-size: ${(props) => props.$style.textSize};
    line-height: 21px;

    ${(props) => props.$tableSize === 'small' && `
      padding: 8.5px 8px;
      min-height: ${props.$style.rowHeight || '39px'};
      ${!props.$autoHeight && `
        overflow-y: auto;
        max-height: ${props.$style.rowHeight || '39px'};
      `};
    `};
    ${(props) => props.$tableSize === 'middle' && `
      padding: 12.5px 8px;
      min-height: ${props.$style.rowHeight || '47px'};
      ${!props.$autoHeight && `
        overflow-y: auto;
        max-height: ${props.$style.rowHeight || '47px'};
      `};
    `};
    ${(props) => props.$tableSize === 'large' && `
      padding: 16.5px 16px;
      min-height: ${props.$style.rowHeight || '55px'};
      ${!props.$autoHeight && `
        overflow-y: auto;
        max-height: ${props.$style.rowHeight || '55px'};
      `};
    `};

    
    > div > .ant-badge > .ant-badge-status-text,
    > div > div > .markdown-body {
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
      <TableTh ref={elementRef} {...restProps} />
    </Resizable>
  );
};

type CustomTableProps<RecordType> = Omit<TableProps<RecordType>, "components" | "columns"> & {
  columns: CustomColumnType<RecordType>[];
  viewModeResizable: boolean;
  rowColorFn: RowColorViewType;
  rowHeightFn: RowHeightViewType;
  columnsStyle: TableColumnStyleType;
  size?: string;
  rowAutoHeight?: boolean;
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
      currentCell: record[title.toLowerCase()],
    });
  
    const style = {
      background: cellColor || rowColor || columnStyle.background || columnsStyle.background,
      text: columnStyle.text || columnsStyle.text,
      border: columnStyle.border || columnsStyle.border,
      radius: columnStyle.radius || columnsStyle.radius,
      borderWidth: columnStyle.borderWidth || columnsStyle.borderWidth,
      textSize: columnStyle.textSize || columnsStyle.textSize,
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
        background={background}
        $style={style}
        $linkStyle={linkStyle}
        $isEditing={editing}
        $tableSize={tableSize}
        $autoHeight={autoHeight}
      >
        {children}
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
    if (allColumnFixed && index === props.columns.length - 1) {
      // all column fixed, the last column fill extra space
      colWidth = "auto";
      minWidth = resizeWidth;
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
        title: col.titleText,
        rowColorFn: props.rowColorFn,
        rowHeightFn: props.rowHeightFn,
        cellColorFn: cellColorFn,
        rowIndex: rowIndex,
        columnsStyle: props.columnsStyle,
        columnStyle: style,
        linkStyle,
        tableSize: props.size,
        autoHeight: props.rowAutoHeight,
      }),
      onHeaderCell: () => ({
        width: resizeWidth,
        title: col.titleText,
        viewModeResizable: props.viewModeResizable,
        onResize: (width: number) => {
          if (width) {
            setResizeData({
              index: index,
              width: width,
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

export function TableCompView(props: {
  comp: InstanceType<typeof TableImplComp>;
  onRefresh: (allQueryNames: Array<string>, setLoading: (loading: boolean) => void) => void;
  onDownload: (fileName: string) => void;
}) {
  const editorState = useContext(EditorContext);
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
  const rowAutoHeight = compChildren.rowAutoHeight.getView();
  const columnsStyle = compChildren.columnsStyle.getView();
  const changeSet = useMemo(() => compChildren.columns.getChangeSet(), [compChildren.columns]);
  const hasChange = useMemo(() => !_.isEmpty(changeSet), [changeSet]);
  const columns = useMemo(() => compChildren.columns.getView(), [compChildren.columns]);
  const columnViews = useMemo(() => columns.map((c) => c.getView()), [columns]);
  const data = comp.filterData;
  const sort = useMemo(() => compChildren.sort.getView(), [compChildren.sort]);
  const toolbar = useMemo(() => compChildren.toolbar.getView(), [compChildren.toolbar]);
  const pagination = useMemo(() => compChildren.pagination.getView(), [compChildren.pagination]);
  const size = useMemo(() => compChildren.size.getView(), [compChildren.size]);
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
      ),
    [
      columnViews,
      sort,
      toolbar.columnSetting,
      size,
      dynamicColumn,
      dynamicColumnConfig,
      columnsAggrData,
    ]
  );
  const supportChildren = useMemo(
    () => supportChildrenTree(compChildren.data.getView()),
    [compChildren.data]
  );

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

  const handleChangeEvent = useCallback(
    (eventName) => {
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
      $style={style}
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
      onDownload={() => onDownload(`${compName}-data`)}
      hasChange={hasChange}
      onSaveChanges={() => handleChangeEvent("saveChanges")}
      onCancelChanges={() => handleChangeEvent("cancelChanges")}
      onEvent={onEvent}
    />
  );

  if (antdColumns.length === 0) {
    return <EmptyContent text={trans("table.emptyColumns")} />;
  }

  return (
    <BackgroundColorContext.Provider value={style.background}>
      <div ref={ref} style={{height: '100%'}}>
      <TableWrapper
        $style={style}
        $rowStyle={rowStyle}
        toolbarPosition={toolbar.position}
        fixedHeader={compChildren.fixedHeader.getView()}
        fixedToolbar={toolbar.fixedToolbar && toolbar.position === 'above'}
      >
        {toolbar.position === "above" && toolbarView}
        <ResizeableTable<RecordType>
          expandable={{
            ...expansion.expandableConfig,
            childrenColumnName: supportChildren
              ? COLUMN_CHILDREN_KEY
              : "OB_CHILDREN_KEY_PLACEHOLDER",
            fixed: "left",
            onExpand: (expanded) => {
              if(expanded) handleChangeEvent('rowExpand')
            }
          }}
          rowColorFn={compChildren.rowColor.getView() as any}
          rowHeightFn={compChildren.rowHeight.getView() as any}
          {...compChildren.selection.getView()(onEvent)}
          bordered={!compChildren.hideBordered.getView()}
          onChange={(pagination, filters, sorter, extra) => {
            onTableChange(pagination, filters, sorter, extra, comp.dispatch, onEvent);
          }}
          showHeader={!compChildren.hideHeader.getView()}
          columns={antdColumns}
          columnsStyle={columnsStyle}
          viewModeResizable={compChildren.viewModeResizable.getView()}
          dataSource={pageDataInfo.data}
          size={compChildren.size.getView()}
          rowAutoHeight={rowAutoHeight}
          tableLayout="fixed"
          loading={
            loading ||
            // fixme isLoading type
            (compChildren.showDataLoadSpinner.getView() &&
              (compChildren.data as any).isLoading()) ||
            compChildren.loading.getView()
          }
        />
        {toolbar.position === "below" && toolbarView}
        <SlotConfigContext.Provider value={{ modalWidth: width && Math.max(width, 300) }}>
          {expansion.expandModalView}
        </SlotConfigContext.Provider>
      </TableWrapper>
      </div>
    </BackgroundColorContext.Provider>
  );
}
