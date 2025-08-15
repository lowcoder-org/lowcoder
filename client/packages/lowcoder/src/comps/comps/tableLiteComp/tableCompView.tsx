import { TableToolbar } from "./tableToolbarComp";
import { TableEventOptionValues } from "./tableTypes";
import { COL_MIN_WIDTH, columnsToAntdFormat, onTableChange } from "./tableUtils";
import { CompNameContext, EditorContext } from "comps/editorState";
import { trans } from "i18n";
import React, { useCallback, useContext, useMemo, useState } from "react";
import { TableImplComp } from "./tableComp";
import { EmptyContent } from "pages/common/styledComponent";
import { TableSummary } from "./tableSummaryComp";
import { ThemeContext } from "@lowcoder-ee/comps/utils/themeContext";
import ResizeableTable from "./parts/ResizeableTable";

export const TableCompView = React.memo((props: {
	comp: InstanceType<typeof TableImplComp>;
	onRefresh: (allQueryNames: Array<string>, setLoading: (loading: boolean) => void) => void;
	onDownload: (fileName: string) => void;
}) => {
	const editorState = useContext(EditorContext);
	const currentTheme = useContext(ThemeContext)?.theme;
	const showDataLoadingIndicators = currentTheme?.showDataLoadingIndicators;

	const compName = useContext(CompNameContext);
	const [loading, setLoading] = useState(false);
	const { comp, onDownload, onRefresh } = props;
	const compChildren = comp.children;
	const hideToolbar = compChildren.hideToolbar.getView();
	const columnsStyle = compChildren.columnsStyle.getView();
	const summaryRowStyle = compChildren.summaryRowStyle.getView();
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
	const dynamicColumnConfig = useMemo(
		() => compChildren.dynamicColumnConfig.getView(),
		[compChildren.dynamicColumnConfig]
	);
	const columnsAggrData = comp.columnAggrData;
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
			<div>
				{toolbar.position === "above" && !hideToolbar && toolbarView}
				<EmptyContent text={trans("table.emptyColumns")} />
				{toolbar.position === "below" && !hideToolbar && toolbarView}
			</div>
		);
	}

	const showTableLoading =
		loading ||
		((showDataLoadingIndicators) && (compChildren.data as any).isLoading()) ||
		compChildren.loading.getView();

	// Virtualization: keep pagination, virtualize within the visible body
	const virtualEnabled = true; // enable by default for lite table
	// Estimate a sensible body height. If table auto-height is enabled, fallback to 480.
	const virtualBodyHeight = 480;

	return (
		<>
			{toolbar.position === "above" && !hideToolbar && toolbarView}
			<ResizeableTable<any>
				{...compChildren.selection.getView()(onEvent)}
				bordered={compChildren.showRowGridBorder.getView()}
				onChange={(pagination: any, filters: any, sorter: any, extra: any) => {
					onTableChange(pagination, filters, sorter, extra, comp.dispatch, onEvent);
				}}
				showHeader={!compChildren.hideHeader.getView()}
				columns={antdColumns}
				dataSource={pageDataInfo.data}
				size={compChildren.size.getView()}
				tableLayout="fixed"
				pagination={false}
				scroll={{ x: COL_MIN_WIDTH * columns.length }}
				summary={summaryView}
				viewModeResizable={compChildren.viewModeResizable.getView()}
				rowColorFn={compChildren.rowColor.getView() as any}
				rowHeightFn={compChildren.rowHeight.getView() as any}
				columnsStyle={columnsStyle}
				rowAutoHeight={compChildren.rowAutoHeight.getView()}
				customLoading={showTableLoading}
				virtualEnabled={virtualEnabled}
				virtualBodyHeight={virtualBodyHeight}
				onCellClick={(columnName: string, dataIndex: string) => {
					comp.children.selectedCell.dispatchChangeValueAction({
						name: columnName,
						dataIndex: dataIndex,
					});
				}}
			/>
			{toolbar.position === "below" && !hideToolbar && toolbarView}
		</>
	);
});
