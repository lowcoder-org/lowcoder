import React, { useCallback, useMemo, useState, useRef, useEffect } from "react";
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
	// Virtualization props
	enableVirtualization?: boolean;
	containerHeight?: number;
	isFixedHeight?: boolean;
};

/**
 * Simplified row height estimate - only used when virtualization is actually enabled
 */
function getRowHeightEstimate(size?: string, rowAutoHeight?: boolean): number {
	if (rowAutoHeight) {
		switch (size) {
			case 'small': return 40;
			case 'large': return 80;
			default: return 60;
		}
	}
	
	switch (size) {
		case 'small': return 32;
		case 'large': return 68;
		default: return 50;
	}
}

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
		enableVirtualization,
		containerHeight,
		isFixedHeight,
		dataSource,
		...restProps
	} = props;
	const [resizeData, setResizeData] = useState({ index: -1, width: -1 });
	const tableRef = useRef<HTMLDivElement>(null);
	const [measuredHeights, setMeasuredHeights] = useState<{ header: number; summary: number }>({ header: 0, summary: 0 });

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

	// Only observe heights when virtualization is actually enabled
	useEffect(() => {
		if (!enableVirtualization || !tableRef.current) return;
		const tableEl = tableRef.current;

		const measure = () => {
			const headerH = (tableEl.querySelector('.ant-table-header') as HTMLElement)?.clientHeight ?? 0;
			const summaryH = (tableEl.querySelector('.ant-table-summary') as HTMLElement)?.clientHeight ?? 0;
			setMeasuredHeights({ header: headerH, summary: summaryH });
		};

		measure();
		const resizeObserver = new ResizeObserver(measure);
		resizeObserver.observe(tableEl);

		return () => resizeObserver.disconnect();
	}, [enableVirtualization, dataSource?.length, columns.length]);

	const scrollAndVirtualizationSettings = useMemo(() => {
		// Calculate total width for horizontal scrolling
		const totalWidth = columns.reduce((sum, col, index) => {
			const resizeWidth = (resizeData.index === index ? resizeData.width : col.width) ?? 0;
			const w = typeof resizeWidth === 'number' && resizeWidth > 0 ? resizeWidth : COL_MIN_WIDTH;
			return sum + w;
		}, 0);

		// Base scroll settings - always provide scroll configuration
		const scrollSettings: { x?: number; y?: number } = {};
		
		// Set horizontal scroll if we have columns
		if (columns.length > 0) {
			scrollSettings.x = totalWidth;
		}

		// For fixed height mode, add vertical scroll
		if (isFixedHeight && containerHeight && containerHeight > 0) {
			const availableHeight = Math.max(containerHeight - measuredHeights.header - measuredHeights.summary, 200);
			scrollSettings.y = availableHeight;
		}

		// Determine if virtualization should be enabled
		const shouldUseVirtualization = Boolean(
			enableVirtualization && 
			containerHeight && 
			dataSource?.length && 
			dataSource.length > 0
		);
		
		return {
			virtual: shouldUseVirtualization,
			scroll: scrollSettings
		};
	}, [enableVirtualization, containerHeight, dataSource?.length, columns, resizeData, measuredHeights, isFixedHeight]);

	return (
		<div ref={tableRef}>
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
		</div>
	);
}

const ResizeableTable = React.memo(ResizeableTableComp) as typeof ResizeableTableComp;
export default ResizeableTable; 