import { TableToolbar } from "./tableToolbarComp";
import { TableEventOptionValues } from "./tableTypes";
import { COL_MIN_WIDTH, columnsToAntdFormat, onTableChange } from "./tableUtils";
import { CompNameContext, EditorContext } from "comps/editorState";
import { trans } from "i18n";
import React, { useCallback, useContext, useMemo, useState, useRef, useEffect } from "react";
import { TableImplComp } from "./tableComp";
import { EmptyContent } from "pages/common/styledComponent";
import { TableSummary } from "./tableSummaryComp";
import { ThemeContext } from "@lowcoder-ee/comps/utils/themeContext";
import TableRenderer from "./parts/TableRenderer";
import { useContainerHeight, useTableMode, useTableHeights, useVirtualization } from "./hooks/useTableConfiguration";
import { ToolbarStyleProvider } from "./styles/ToolbarStyles";
import { TableContainer } from "./parts/TableContainer";

export const TableCompView = React.memo((props: {
	comp: InstanceType<typeof TableImplComp>;
	onRefresh: (allQueryNames: Array<string>, setLoading: (loading: boolean) => void) => void;
	onDownload: (fileName: string) => void;
}) => {
	const editorState = useContext(EditorContext);
	const currentTheme = useContext(ThemeContext)?.theme;
	const showDataLoadingIndicators = currentTheme?.showDataLoadingIndicators;

	const compName = useContext(CompNameContext);
	
	const { comp, onDownload, onRefresh } = props;
	const compChildren = comp.children;
	const hideToolbar = compChildren.hideToolbar.getView();
	const columnsStyle = compChildren.columnsStyle.getView();
	const summaryRowStyle = compChildren.summaryRowStyle.getView();
	const style = compChildren.style.getView();
	const rowStyle = compChildren.rowStyle.getView();
	const headerStyle = compChildren.headerStyle.getView();
	const toolbarStyle = compChildren.toolbarStyle.getView();
	const showHRowGridBorder = compChildren.showHRowGridBorder.getView();
	const columns = useMemo(() => compChildren.columns.getView(), [compChildren.columns]);
	const columnViews = useMemo(() => columns.map((c) => c.getView()), [columns]);
	const data = comp.filterData;
	const sort = useMemo(() => compChildren.sort.getView(), [compChildren.sort]);
	const toolbar = useMemo(() => compChildren.toolbar.getView(), [compChildren.toolbar]);
	const showSummary = useMemo(() => compChildren.showSummary.getView(), [compChildren.showSummary]);
	const summaryRows = useMemo(() => compChildren.summaryRows.getView(), [compChildren.summaryRows]);
	const pagination = useMemo(() => compChildren.pagination.getView(), [compChildren.pagination]);
	const size = useMemo(() => compChildren.size.getView(), [compChildren.size]);
	const onEvent = useMemo(() => compChildren.onEvent.getView(), [compChildren.onEvent]);
	const dynamicColumn = compChildren.dynamicColumn.getView();
	const [loading, setLoading] = useState(false);
	const autoHeight = compChildren.autoHeight.getView();
	const rowAutoHeight = compChildren.rowAutoHeight.getView();
	const showHeader = !compChildren.hideHeader.getView();
	const stickyToolbar = !!toolbar.fixedToolbar; // use toolbar setting


	// NEW: Use hooks for clean logic
	const { mode, isFixedMode } = useTableMode(autoHeight);
	const { containerHeight, containerRef } = useContainerHeight(isFixedMode);
	const heights = useTableHeights(mode as 'AUTO' | 'FIXED', containerHeight, {
		showToolbar: !hideToolbar,
		showHeader: showHeader,
		toolbarHeight: 48,
		headerHeight: 40,
		stickyToolbar,
	});
	const virtualization = useVirtualization(
		heights.canVirtualize,
		data?.length ?? 0,
		50
	);


	const dynamicColumnConfig = useMemo(
		() => compChildren.dynamicColumnConfig.getView(),
		[compChildren.dynamicColumnConfig]
	);
	const columnsAggrData = comp.columnAggrData;
	const headerFilters = useMemo(() => compChildren.headerFilters.getView(), [compChildren.headerFilters]);
		
		

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
				onEvent,
				headerFilters,
			),
		[
			columnViews,
			sort,
			toolbar.columnSetting,
			size,
			dynamicColumn,
			dynamicColumnConfig,
			columnsAggrData,
			headerFilters,
		]
	);

	const pageDataInfo = useMemo(() => {
		let pagedData = data;
		let current = pagination.current;
		const total = pagination.total || data.length;
		if (data.length > pagination.pageSize) {
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
		(eventName: TableEventOptionValues) => {
			compChildren.onEvent.getView()(eventName);
		},
		[compChildren.onEvent]
	);



	const toolbarView = !hideToolbar && (
		<ToolbarStyleProvider $toolbarStyle={toolbarStyle}>
		<TableToolbar
			toolbar={toolbar}
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
			onEvent={onEvent}
		/>
		</ToolbarStyleProvider>
	);

	const summaryView = () => {
		if (!showSummary) return undefined;
		return (
			<TableSummary
				tableSize={size}
				istoolbarPositionBelow={toolbar.position === "below"}
				multiSelectEnabled={compChildren.selection.children.mode.value === 'multiple'}
				summaryRows={parseInt(summaryRows)}
				columns={columns}
				summaryRowStyle={summaryRowStyle}
				dynamicColumn={dynamicColumn}
				dynamicColumnConfig={dynamicColumnConfig}
			/>
		);
	};

	if (antdColumns.length === 0) {
		return (
		  <TableContainer
			mode={mode as 'AUTO' | 'FIXED'}
			toolbarPosition={toolbar.position}
			stickyToolbar={stickyToolbar}
			showToolbar={!hideToolbar}
			toolbar={toolbarView}
			showVerticalScrollbar={compChildren.showVerticalScrollbar.getView()}
			showHorizontalScrollbar={compChildren.showHorizontalScrollbar.getView()}
			virtual={virtualization.enabled}
			containerRef={containerRef}
		  >
			<EmptyContent text={trans("table.emptyColumns")} />
		  </TableContainer>
		);
	  }
	const showTableLoading =
		loading ||
		((showDataLoadingIndicators) && (compChildren.data as any).isLoading()) ||
		compChildren.loading.getView();

		return (
			<TableContainer
			  mode={mode as 'AUTO' | 'FIXED'}
			  toolbarPosition={toolbar.position}
			  stickyToolbar={stickyToolbar}
			  showToolbar={!hideToolbar}
			  toolbar={toolbarView}
			  containerRef={containerRef}
			  showVerticalScrollbar={compChildren.showVerticalScrollbar.getView()}
			  showHorizontalScrollbar={compChildren.showHorizontalScrollbar.getView()}
			  virtual={virtualization.enabled}
			>
			
				<TableRenderer<any>
				  {...compChildren.selection.getView()(onEvent)}
				  bordered={compChildren.showRowGridBorder.getView()}
				  onChange={(pagination: any, filters: any, sorter: any, extra: any) => {
					onTableChange(pagination, filters, sorter, extra, comp.dispatch, onEvent);
				  }}
				  showHeader={showHeader}
				  columns={antdColumns}
				  dataSource={pageDataInfo.data}
				  size={size}
				  tableLayout="fixed"
				  pagination={false}
				  summary={summaryView}
				  viewModeResizable={compChildren.viewModeResizable.getView()}
				  rowColorFn={compChildren.rowColor.getView() as any}
				  rowHeightFn={compChildren.rowHeight.getView() as any}
				  columnsStyle={columnsStyle}
				  rowAutoHeight={rowAutoHeight}
				  customLoading={showTableLoading}
				  onCellClick={(columnName: string, dataIndex: string) => {
					comp.children.selectedCell.dispatchChangeValueAction({
					  name: columnName,
					  dataIndex: dataIndex,
					});
				  }}
				  mode={mode as 'AUTO' | 'FIXED'}
				  heights={heights}
				  virtualizationConfig={virtualization}
				  style={style}
				  toolbarStyle={toolbarStyle}
				  headerStyle={headerStyle}
				  rowStyle={rowStyle}
				  fixedHeader={compChildren.fixedHeader.getView()}
				  showHRowGridBorder={showHRowGridBorder}
				  showVerticalScrollbar={compChildren.showVerticalScrollbar.getView()}
				  showHorizontalScrollbar={compChildren.showHorizontalScrollbar.getView()}
				/>
			 
			</TableContainer>
		  );
});
