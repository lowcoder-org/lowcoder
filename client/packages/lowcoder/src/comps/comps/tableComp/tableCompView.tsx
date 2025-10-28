import { TableCellContext, TableRowContext } from "comps/comps/tableComp/tableContext";
import { TableToolbar } from "comps/comps/tableComp/tableToolbarComp";
import { RowColorViewType, RowHeightViewType, TableEventOptionValues } from "comps/comps/tableComp/tableTypes";
import {
  COL_MIN_WIDTH,
  COLUMN_CHILDREN_KEY,
  ColumnsAggrData,
  columnsToAntdFormat,
  OB_ROW_ORI_INDEX,
  onTableChange,
  RecordType,
  supportChildrenTree,
} from "comps/comps/tableComp/tableUtils";
import { CompNameContext, EditorContext } from "comps/editorState";
import { BackgroundColorContext } from "comps/utils/backgroundColorContext";
import { trans } from "i18n";
import _, { isEqual } from "lodash";
import { ScrollBar } from "lowcoder-design";
import React, { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useMergeCompStyles, useUserViewMode } from "util/hooks";
import { TableImplComp } from "./tableComp";
import { useResizeDetector } from "react-resize-detector";
import { SlotConfigContext } from "comps/controls/slotControl";
import { EmptyContent } from "pages/common/styledComponent";
import { messageInstance } from "lowcoder-design/src/components/GlobalInstances";
import { childrenToProps } from "@lowcoder-ee/comps/generators/multi";
import { TableSummary } from "./tableSummaryComp";
import { ThemeContext } from "@lowcoder-ee/comps/utils/themeContext";
import { useUpdateEffect } from "react-use";
import { ResizeableTable } from "./ResizeableTable";
import { BackgroundWrapper, TableWrapper } from "./tableStyles";
import {
  useTableMode,
  useContainerHeight,
  useVirtualization,
  useScrollConfiguration
} from './hooks/useTableConfiguration';

export const EMPTY_ROW_KEY = 'empty_row';

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

export const TableCompView = React.memo((props: {
  comp: InstanceType<typeof TableImplComp>;
  onRefresh: (allQueryNames: Array<string>, setLoading: (loading: boolean) => void) => void;
  onDownload: (fileName: string) => void;
}) => {
  const [expandedRowKeys, setExpandedRowKeys] = useState<string[]>([]);
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
  const hideToolbar = compChildren.hideToolbar.getView()
  const rowAutoHeight = compChildren.rowAutoHeight.getView();
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
  const currentExpandedRows = useMemo(() => compChildren.currentExpandedRows.getView(), [compChildren.currentExpandedRows]);
  const dynamicColumn = compChildren.dynamicColumn.getView();
  const className = compChildren.className.getView();
  const dataTestId = compChildren.dataTestId.getView();

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

  useUpdateEffect(() => {
    if (!isEqual(currentExpandedRows, expandedRowKeys)) {
      compChildren.currentExpandedRows.dispatchChangeValueAction(expandedRowKeys);
    }
  }, [expandedRowKeys]);

  useUpdateEffect(() => {
    if (!isEqual(currentExpandedRows, expandedRowKeys)) {
      setExpandedRowKeys(currentExpandedRows);
    }
  }, [currentExpandedRows]);

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

// Table mode and height configuration
  const tableMode = useTableMode(comp.getTableAutoHeight());
  const { containerHeight, containerRef } = useContainerHeight(tableMode.isFixedMode);

  const virtualizationConfig = useVirtualization(
    containerHeight,
    pageDataInfo.data.length,
    size as 'small' | 'middle' | 'large',
    {
      showToolbar: !hideToolbar,
      showHeader: !compChildren.hideHeader.getView(),
      stickyToolbar: toolbar.fixedToolbar && toolbar.position === 'above',
      isFixedMode: tableMode.isFixedMode
    }
  );
  const totalColumnsWidth = COL_MIN_WIDTH * antdColumns.length;
  const scrollConfig = useScrollConfiguration(
    virtualizationConfig.enabled,
    virtualizationConfig.scrollY,
    totalColumnsWidth
  );
  
  useMergeCompStyles(
    childrenProps as Record<string, any>,
    comp.dispatch
  );

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

  const toolbarView = !hideToolbar && (
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
        multiSelectEnabled={compChildren.selection.children.mode.value === 'multiple'}
        expandableRows={Boolean(expansion.expandModalView)}
        summaryRows={parseInt(summaryRows)}
        columns={columns}
        summaryRowStyle={summaryRowStyle}
        dynamicColumn={dynamicColumn}
        dynamicColumnConfig={dynamicColumnConfig}
      />
    );
  }

  if (antdColumns.length === 0) {
    return (
      <div>
        {toolbar.position === "above" && !hideToolbar && toolbarView}
        <EmptyContent text={trans("table.emptyColumns")} />
        {toolbar.position === "below" && !hideToolbar && toolbarView}
      </div>
    );
  }

  const hideScrollbar = (!showHorizontalScrollbar && !showVerticalScrollbar) ||
                        (scrollConfig.virtual && (showHorizontalScrollbar || showVerticalScrollbar));
  const showTableLoading = loading ||
    // fixme isLoading type
    ((showDataLoadingIndicators) &&
      (compChildren.data as any).isLoading()) ||
    compChildren.loading.getView();

  return (
    <BackgroundColorContext.Provider value={style.background} >
      <BackgroundWrapper
        ref={containerRef}
        $style={style}
        $tableAutoHeight={tableMode.isAutoMode}
        $showHorizontalScrollbar={showHorizontalScrollbar}
        $showVerticalScrollbar={showVerticalScrollbar}
        $fixedToolbar={toolbar.fixedToolbar}
      >
        {toolbar.position === "above" && !hideToolbar && (toolbar.fixedToolbar || (tableMode.isAutoMode && showHorizontalScrollbar)) && toolbarView}
        <ScrollBar
          className="table-scrollbar-wrapper"
          style={{ height: "100%", margin: "0px", padding: "0px" }}
          hideScrollbar={hideScrollbar}
          prefixNode={toolbar.position === "above" && !toolbar.fixedToolbar && !(tableMode.isAutoMode && showHorizontalScrollbar) && toolbarView}
          suffixNode={toolbar.position === "below" && !toolbar.fixedToolbar && !(tableMode.isAutoMode && showHorizontalScrollbar) && toolbarView}
        >
          <TableWrapper
            className={className}
            data-testid={dataTestId}
            $style={style}
            $rowStyle={rowStyle}
            $headerStyle={headerStyle}
            $toolbarStyle={toolbarStyle}
            $toolbarPosition={toolbar.position}
            $fixedHeader={compChildren.fixedHeader.getView()}
            $fixedToolbar={toolbar.fixedToolbar && toolbar.position === 'above'}
            $visibleResizables={visibleResizables}
            $showHRowGridBorder={showHRowGridBorder}
            $isVirtual={scrollConfig.virtual}
            $showHorizontalScrollbar={showHorizontalScrollbar}
            $showVerticalScrollbar={showVerticalScrollbar}
            $tableSize={size as 'small' | 'middle' | 'large'}
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
                },
                onExpandedRowsChange: (expandedRowKeys) => {
                  setExpandedRowKeys(expandedRowKeys as unknown as string[]);
                },
                expandedRowKeys: expandedRowKeys,
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
              rowStyle={rowStyle}
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
              scroll={scrollConfig.scroll}
              virtual={scrollConfig.virtual}
            />
            <SlotConfigContext.Provider value={{ modalWidth: width && Math.max(width, 300) }}>
              {expansion.expandModalView}
            </SlotConfigContext.Provider>
          </TableWrapper>
        </ScrollBar>
        {toolbar.position === "below" && !hideToolbar && (toolbar.fixedToolbar || (tableMode.isAutoMode && showHorizontalScrollbar)) && toolbarView}
      </BackgroundWrapper>

    </BackgroundColorContext.Provider>
  );
});
