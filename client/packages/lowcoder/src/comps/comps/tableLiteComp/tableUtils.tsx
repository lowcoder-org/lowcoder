import {
  ColumnType,
  FilterValue,
  SorterResult,
  TableCurrentDataSource,
  TablePaginationConfig,
} from "antd/es/table/interface";
import type { SortOrder } from "antd/es/table/interface";
import { __COLUMN_DISPLAY_VALUE_FN } from "./column/columnTypeCompBuilder";
import { CellColorViewType, RawColumnType, Render } from "./column/tableColumnComp";
import { SortValue, TableOnEventView } from "./tableTypes";
import _ from "lodash";
import { changeChildAction, CompAction, NodeToValue, wrapChildAction, customAction } from "lowcoder-core";
import { tryToNumber } from "util/convertUtils";
import { JSONObject, JSONValue } from "util/jsonTypes";
import { StatusType } from "./column/columnTypeComps/columnStatusComp";
import { ColumnListComp, tableDataRowExample } from "./column/tableColumnListComp";
import { TableColumnLinkStyleType, TableColumnStyleType } from "comps/controls/styleControlConstants";
import Tooltip from "antd/es/tooltip";
import dayjs from "dayjs";

export const COLUMN_CHILDREN_KEY = "children";
export const OB_ROW_ORI_INDEX = "__ob_origin_index";
export const OB_ROW_RECORD = "__ob_origin_record";

export const COL_MIN_WIDTH = 55;
export const COL_MAX_WIDTH = 500;

/**
 * Add __originIndex__, mainly for the logic of the default key
 */
export type RecordType = JSONObject & { [OB_ROW_ORI_INDEX]: string };

export function filterData(
  data: Array<RecordType>,
  searchValue: string,
  filter: { filters: any[], stackType: string },
  showFilter: boolean
) {
  let resultData = data;
  if (searchValue) {
    resultData = resultData.filter((row) => {
      let searchLower = searchValue?.toLowerCase();
      if (!searchLower) {
        return true;
      } else {
        return Object.values(row).find((v) => v?.toString().toLowerCase().includes(searchLower));
      }
    });
  }
  if (showFilter && filter.filters.length > 0) {
    resultData = resultData.filter((row) => {
      // filter
      for (let f of filter.filters) {
        const columnValue = row[f.columnKey];
        const result = f.operator.filter(f.filterValue, columnValue);
        if (filter.stackType === "or" && result) {
          // one condition is met
          return true;
        } else if (filter.stackType === "and" && !result) {
          // one condition is not met
          return false;
        }
      }
      if (filter.filters.length === 0) {
        return true;
      } else if (filter.stackType === "and") {
        return true;
      } else if (filter.stackType === "or") {
        return false;
      }
      return true;
    });
  }
  return resultData;
}

export function sortData(
  data: Array<JSONObject>,
  columns: Record<string, { sortable: boolean }>, // key: dataIndex
  sorter: Array<SortValue>
): Array<RecordType> {
  let resultData: Array<RecordType> = data.map((row, index) => ({
    ...row,
    [OB_ROW_ORI_INDEX]: index + "",
  }));
  if (sorter.length > 0) {
    const [sortColumns, sortMethods] = _(sorter)
      .filter((s) => {
        return !!s.column && columns[s.column]?.sortable;
      })
      .map((s) => [s.column, s.desc ? "desc" : "asc"] as const)
      .unzip()
      .value() as [string[], ("desc" | "asc")[]];
    resultData = _.orderBy(
      resultData,
      sortColumns.map((colName) => {
        return (obj) => {
          const val = obj[colName];
          if (typeof val === "string") {
            return val.toLowerCase();
          } else {
            return val;
          }
        };
      }),
      sortMethods
    );
  }
  return resultData;
}

export function columnHide({
  hide,
  tempHide,
  enableColumnSetting,
}: {
  hide: boolean;
  tempHide: boolean;
  enableColumnSetting: boolean;
}) {
  if (enableColumnSetting) {
    return tempHide || hide;
  } else {
    return hide;
  }
}

export function buildOriginIndex(index: string, childIndex: string) {
  return index + "-" + childIndex;
}

export function tranToTableRecord(dataObj: JSONObject, index: string | number): RecordType {
  const indexString = index + "";
  if (Array.isArray(dataObj[COLUMN_CHILDREN_KEY])) {
    return {
      ...dataObj,
      [OB_ROW_ORI_INDEX]: indexString,
      children: dataObj[COLUMN_CHILDREN_KEY].map((child: any, i: number) =>
        tranToTableRecord(child, buildOriginIndex(indexString, i + ""))
      ),
    };
  }
  return {
    ...dataObj,
    [OB_ROW_ORI_INDEX]: indexString,
  };
}

export function getOriDisplayData(
  data: Array<RecordType>,
  pageSize: number,
  columns: Array<{ dataIndex: string; render: NodeToValue<ReturnType<Render["node"]>> }>
) {
  return data.map((row, idx) => {
    const displayData: RecordType = { [OB_ROW_ORI_INDEX]: row[OB_ROW_ORI_INDEX] };
    columns.forEach((col) => {
      // if (!row.hasOwnProperty(col.dataIndex)) return;
      const node = col.render.wrap({
        currentCell: row[col.dataIndex],
        currentRow: _.omit(row, OB_ROW_ORI_INDEX),
        currentIndex: idx % pageSize,
        currentOriginalIndex: row[OB_ROW_ORI_INDEX],
      }) as any;
      if (Array.isArray(row[COLUMN_CHILDREN_KEY])) {
        displayData[COLUMN_CHILDREN_KEY] = getOriDisplayData(
          row[COLUMN_CHILDREN_KEY] as Array<RecordType>,
          pageSize,
          columns
        );
      }
      const colValue = node.comp[__COLUMN_DISPLAY_VALUE_FN](node.comp);
      if (colValue !== null) {
        displayData[col.dataIndex] = colValue;
      }
    });
    return displayData;
  });
}

export function transformDispalyData(
  oriDisplayData: JSONObject[],
  dataIndexTitleDict: _.Dictionary<string>
): JSONObject[] {
  return oriDisplayData.map((row) => {
    const transData = _(row)
      .omit(OB_ROW_ORI_INDEX)
      .mapKeys((value, key) => dataIndexTitleDict[key] || key)
      .value();
    if (Array.isArray(row[COLUMN_CHILDREN_KEY])) {
      return {
        ...transData,
        [COLUMN_CHILDREN_KEY]: transformDispalyData(
          row[COLUMN_CHILDREN_KEY] as JSONObject[],
          dataIndexTitleDict
        ),
      };
    }
    return transData;
  });
}

export type ColumnsAggrData = Record<string, Record<string, JSONValue> & { compType: string }>;

export function getColumnsAggr(
  oriDisplayData: JSONObject[],
  dataIndexWithParamsDict: NodeToValue<
    ReturnType<InstanceType<typeof ColumnListComp>["withParamsNode"]>
  >
): ColumnsAggrData {
  return _.mapValues(dataIndexWithParamsDict, (withParams, dataIndex) => {
    const compType = (withParams.wrap() as any).compType;
    const res: Record<string, JSONValue> & { compType: string } = { compType };
    if (compType === "tag") {
      res.uniqueTags = _(oriDisplayData)
        .map((row) => row[dataIndex]!)
        .filter((tag) => !!tag)
        .uniq()
        .value();
    } else if (compType === "badgeStatus") {
      res.uniqueStatus = _(oriDisplayData)
        .map((row) => {
          const value = row[dataIndex] as any;
          if (value.split(" ")[1]) {
            return {
              status: value.slice(0, value.indexOf(" ")),
              text: value.slice(value.indexOf(" ") + 1),
            };
          } else {
            return {
              status: value,
              text: "",
            };
          }
        })
        .uniqBy("text")
        .value();
    }
    // Generic unique values fallback for filters (cap to 100)
    const uniqueValues = _(oriDisplayData)
      .map((row) => row[dataIndex])
      .filter((v) => v !== undefined && v !== null)
      .uniqWith(_.isEqual)
      .slice(0, 100)
      .value();
    (res as any).uniqueValues = uniqueValues as any;
    return res;
  });
}

function renderTitle(props: { title: string; tooltip: string }) {
  const { title, tooltip } = props;
  return (
    <div>
      <Tooltip title={tooltip}>
        <span style={{borderBottom: tooltip ? '1px dotted' : ''}}>
          {title}
        </span>
      </Tooltip>
    </div>
  );
}

function getInitialColumns(
  columnsAggrData: ColumnsAggrData,
  customColumns: string[],
) {
  let initialColumns = [];
  Object.keys(columnsAggrData).forEach(column => {
    if(customColumns.includes(column)) return;
    initialColumns.push({
      label: column,
      value: `{{currentRow.${column}}}`
    });
  });
  initialColumns.push({
    label: 'Select with handlebars',
    value: '{{currentCell}}',
  })
  return initialColumns;
}

export type CustomColumnType<RecordType> = ColumnType<RecordType> & {
  onWidthResize?: (width: number) => void;
  titleText: string;
  style: TableColumnStyleType;
  linkStyle: TableColumnLinkStyleType;
  cellColorFn: CellColorViewType;
  columnClassName?: string;
  columnDataTestId?: string;
};

/**
 * Helper: build a mapping of column -> sort order
 */
function computeSortMap(sort: SortValue[]): Map<string | undefined, SortOrder> {
  return new Map(sort.map((s) => [s.column, s.desc ? "descend" : "ascend"]));
}

/**
 * Helper: sort columns by fixed position and dynamic config order
 */
function orderColumns(
  columns: Array<RawColumnType>,
  dynamicColumn: boolean,
  dynamicColumnConfig: string[],
): Array<RawColumnType> {
  const dynamicPositions: Record<string, number> = {};
  if (dynamicColumn && dynamicColumnConfig.length > 0) {
    dynamicColumnConfig.forEach((name, idx) => {
      dynamicPositions[name] = idx;
    });
  }
  return _.sortBy(columns, (c) => {
    if (c.fixed === "left") return -1;
    if (c.fixed === "right") return Number.MAX_SAFE_INTEGER;
    if (dynamicColumn && dynamicColumnConfig.length > 0) {
      const key = c.isCustom ? c.title : c.dataIndex;
      const pos = dynamicPositions[key];
      if (typeof pos === "number") return pos;
    }
    return 0;
  });
}

/**
 * Helper: should include a column based on hide and dynamic config gating
 */
function shouldIncludeColumn(
  column: RawColumnType,
  enableColumnSetting: boolean,
  dynamicColumn: boolean,
  dynamicColumnConfig: string[],
): boolean {
  if (
    columnHide({
      hide: column.hide,
      tempHide: column.tempHide,
      enableColumnSetting,
    })
  ) {
    return false;
  }
  if (
    dynamicColumn &&
    dynamicColumnConfig.length > 0 &&
    !dynamicColumnConfig.includes(column.isCustom ? column.title : column.dataIndex)
  ) {
    return false;
  }
  return true;
}

/**
 * Helper: aggregate data for a specific column
 */
function extractAggrForColumn(
  dataIndex: string,
  columnsAggrData: ColumnsAggrData,
) {
  const aggr = columnsAggrData[dataIndex] as any;
  const candidateTags: string[] = Array.isArray(aggr?.uniqueTags) ? aggr.uniqueTags : [];
  const candidateStatus: { text: string; status: StatusType }[] = Array.isArray(aggr?.uniqueStatus)
    ? aggr.uniqueStatus
    : [];
  const uniqueValues: any[] = Array.isArray(aggr?.uniqueValues) ? aggr.uniqueValues : [];
  return { candidateTags, candidateStatus, uniqueValues };
}

/**
 * Helper: build filter props for antd Table column
 */
function buildFilterProps(
  dataIndex: string,
  filterable: boolean,
  candidateTags: any[],
  uniqueValues: any[],
  headerFilters: Record<string, any[]> = {},
) {
  if (!filterable) return {};
  
  const candidates = (Array.isArray(candidateTags) && candidateTags.length > 0
    ? candidateTags
    : Array.isArray(uniqueValues) && uniqueValues.length > 0
      ? uniqueValues
      : [])
    .slice(0, 100);
    
  if (candidates.length === 0) return {};
  
  return {
    filters: candidates.map((v) => ({ 
      text: String(v ?? 'null'), 
      value: v 
    })),
    filteredValue: headerFilters[dataIndex] || null,
    // Enable search within the filter dropdown (AntD)
    filterSearch: true,
    // Use tree mode for better UX on long lists (AntD)
    filterMode: 'tree',
    // Allow selecting multiple values per column by default
    filterMultiple: true,
    // Remove onFilter as we handle filtering in buildFilteredDataNode
    // ANTD will call onChange with filters parameter instead
  } as const;
}

/**
 * Helper: build sorter props
 */
function buildSorterProps(
  column: RawColumnType,
  sortOrder: SortOrder | undefined,
  multiplePriority: number,
) {
  if (!column.sortable) return {};
  const sorter = {
    multiple: multiplePriority,
    compare:
      column.columnType === 'date' || column.columnType === 'dateTime'
        ? (a: any, b: any) => {
            return dayjs(a[column.dataIndex] as string).unix() - dayjs(b[column.dataIndex] as string).unix();
          }
        : undefined,
  } as const;
  return {
    sorter,
    sortOrder,
    showSorterTooltip: false,
  } as const;
}

/**
 * Helper: build static style props
 */
function buildStyleProps(column: RawColumnType) {
  const style = {
    background: column.background,
    margin: column.margin,
    text: column.text,
    border: column.border,
    radius: column.radius,
    textSize: column.textSize,
    textWeight: column.textWeight,
    fontStyle: column.fontStyle,
    fontFamily: column.fontFamily,
    borderWidth: column.borderWidth,
  } as TableColumnStyleType;
  const linkStyle = {
    text: column.linkColor,
    hoverText: column.linkHoverColor,
    activeText: column.linkActiveColor,
  } as TableColumnLinkStyleType;
  return { style, linkStyle };
}

/**
 * Helper: build render function with minimal closure
 */
function buildRenderFn(
  column: RawColumnType,
  size: string,
  candidateTags: string[],
  candidateStatus: { text: string; status: StatusType }[],
  onTableEvent: (eventName: any) => void,
  initialColumns: { label: string; value: string }[],
) {
  return (value: any, record: RecordType, index: number) => {
    const row = _.omit(record, OB_ROW_ORI_INDEX);
    return column
      .render(
        {
          currentCell: value,
          currentRow: row,
          currentIndex: index,
          currentOriginalIndex: tryToNumber(record[OB_ROW_ORI_INDEX]),
          initialColumns,
        },
        String(record[OB_ROW_ORI_INDEX])
      )
      .getView()
      .view({
        tableSize: size,
        candidateTags,
        candidateStatus,
        textOverflow: column.textOverflow,
        cellTooltip: column.cellTooltip({
          currentCell: value,
          currentRow: row,
          currentIndex: index,
        }),
        onTableEvent,
        cellIndex: `${column.dataIndex}-${record?.[OB_ROW_ORI_INDEX] ?? index}`,
      });
  };
}

/**
 * convert column in raw format into antd format
 */
export function columnsToAntdFormat(
  columns: Array<RawColumnType>,
  sort: SortValue[],
  enableColumnSetting: boolean,
  size: string,
  dynamicColumn: boolean,
  dynamicColumnConfig: Array<string>,
  columnsAggrData: ColumnsAggrData,
  onTableEvent: (eventName: any) => void,
  headerFilters: Record<string, any[]> = {},
): Array<CustomColumnType<RecordType>> {
  const customColumns = columns.filter(col => col.isCustom).map(col => col.dataIndex);
  const initialColumns = getInitialColumns(columnsAggrData, customColumns);
  const sortMap = computeSortMap(sort);
  const sortedColumns = orderColumns(columns, dynamicColumn, dynamicColumnConfig);

  const result: Array<CustomColumnType<RecordType>> = [];

  sortedColumns.forEach((column, mIndex) => {
    if (!shouldIncludeColumn(column, enableColumnSetting, dynamicColumn, dynamicColumnConfig)) {
      return;
    }

    const { candidateTags, candidateStatus, uniqueValues } = extractAggrForColumn(column.dataIndex, columnsAggrData);
    const title = renderTitle({ title: column.title, tooltip: column.titleTooltip });
    const filterProps = buildFilterProps(column.dataIndex, column.filterable, candidateTags, uniqueValues, headerFilters);
    const { style, linkStyle } = buildStyleProps(column);
    const multiplePriority = (sortedColumns.length - mIndex) + 1;
    const sorterProps = buildSorterProps(column, sortMap.get(column.dataIndex), multiplePriority);

    // 🔥 FIX: Handle auto-width columns properly
    const columnWidth = column.autoWidth === "auto" ? undefined : column.width;

    const antdColumn: CustomColumnType<RecordType> = {
      key: `${column.dataIndex}`,
      title: column.showTitle ? title : '',
      titleText: column.title,
      dataIndex: column.dataIndex,
      align: column.align,
      width: columnWidth, // Don't set width: 0 for auto columns
      fixed: column.fixed === "close" ? false : column.fixed,
      style,
      linkStyle,
      columnClassName: column.className,
      columnDataTestId: column.dataTestId,
      cellColorFn: column.cellColor,
      onWidthResize: column.onWidthResize,
      render: buildRenderFn(
        column,
        size,
        candidateTags,
        candidateStatus,
        onTableEvent,
        initialColumns,
      ),
      ...(sorterProps as any),
      ...(filterProps as any),
    } as any;

    result.push(antdColumn);
  });

  return result;
}

function getSortValue(sortResult: SorterResult<RecordType>) {
  return sortResult.column?.dataIndex
    ? {
        column: sortResult.column.dataIndex.toString(),
        desc: sortResult.order === "descend",
      }
    : null;
}

export function onTableChange(
  pagination: TablePaginationConfig,
  filters: Record<string, FilterValue | null>,
  sorter: SorterResult<RecordType> | SorterResult<RecordType>[],
  extra: TableCurrentDataSource<RecordType>,
  dispatch: (action: CompAction<JSONValue>) => void,
  onEvent: TableOnEventView
) {
  if (extra.action === "sort") {
    let sortValues: SortValue[] = [];
    if (Array.isArray(sorter)) {
      // multi-column sort
      sorter.forEach((s) => {
        const v = getSortValue(s);
        v && sortValues.push(v);
      });
    } else {
      const v = getSortValue(sorter);
      v && sortValues.push(v);
    }
    dispatch(changeChildAction("sort", sortValues, true));
    onEvent("sortChange");
  }
  if (extra.action === "filter") {
    // Convert filters to a format suitable for our filter state
    const headerFilters: Record<string, any[]> = {};
    Object.entries(filters).forEach(([columnKey, filterValues]) => {
      if (filterValues && Array.isArray(filterValues) && filterValues.length > 0) {
        headerFilters[columnKey] = filterValues;
      }
    });
    
    // Dispatch action to update header filters state
    dispatch(changeChildAction("headerFilters", headerFilters, true));
    onEvent("filterChange");
  }
}

export function calcColumnWidth(columnKey: string, data: Array<JSONObject>) {
  const getWidth = (str: string) => {
    const byteLength = new Blob([str]).size;
    return str.length === byteLength ? str.length * 10 : str.length * 20;
  };
  const cellWidth =
    _.max(
      data.map((d) => {
        const cellValue = d[columnKey];
        if (!cellValue) {
          return COL_MIN_WIDTH;
        }
        return getWidth(cellValue.toString());
      })
    ) || 0;
  const titleWidth = getWidth(columnKey);
  return Math.max(Math.min(COL_MAX_WIDTH, Math.max(titleWidth, cellWidth) + 10), COL_MIN_WIDTH);
}

export function genSelectionParams(
  filterData: RecordType[],
  selection: string
): Record<string, unknown> | undefined {
  const idx = filterData?.findIndex((row) => row[OB_ROW_ORI_INDEX] === selection);
  if (!Boolean(filterData) || idx < 0) {
    return undefined;
  }
  const currentRow = filterData[idx];
  return {
    currentRow: _.omit(currentRow, OB_ROW_ORI_INDEX),
    currentIndex: idx,
    currentOriginalIndex: tryToNumber(currentRow[OB_ROW_ORI_INDEX]),
  };
}

export function supportChildrenTree(data: Array<JSONObject>) {
  const rowSample = tableDataRowExample(data) as any;
  return rowSample && Array.isArray(rowSample[COLUMN_CHILDREN_KEY]);
}
