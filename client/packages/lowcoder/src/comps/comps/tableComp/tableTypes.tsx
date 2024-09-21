import { ColumnListComp } from "comps/comps/tableComp/column/tableColumnListComp";
import { TableToolbarComp } from "comps/comps/tableComp/tableToolbarComp";
import { BoolControl, BoolPureControl } from "comps/controls/boolControl";
import {
  ArrayStringControl,
  BoolCodeControl,
  ColorOrBoolCodeControl,
  HeightOrBoolCodeControl,
  JSONObjectArrayControl,
  RadiusControl,
  StringControl,
} from "comps/controls/codeControl";
import { dropdownControl } from "comps/controls/dropdownControl";
import { eventHandlerControl } from "comps/controls/eventHandlerControl";
import { styleControl } from "comps/controls/styleControl";
import { TableColumnStyle, TableRowStyle, TableStyle, TableToolbarStyle, TableHeaderStyle, TableSummaryRowStyle } from "comps/controls/styleControlConstants";
import {
  MultiCompBuilder,
  stateComp,
  UICompBuilder,
  valueComp,
  withContext,
  withDefault,
} from "comps/generators";
import { uiChildren } from "comps/generators/uiCompBuilder";
import { withIsLoadingMethod } from "comps/generators/withIsLoading";
import { trans } from "i18n";
import {
  ConstructorToView,
  RecordConstructorToComp,
  RecordConstructorToView,
} from "lowcoder-core";
import { controlItem } from "lowcoder-design";
import { JSONArray, JSONObject } from "util/jsonTypes";
import { ExpansionControl } from "./expansionControl";
import { PaginationControl } from "./paginationControl";
import { SelectionControl } from "./selectionControl";
import { AutoHeightControl } from "comps/controls/autoHeightControl";

const editModeClickOptions = [
  {
    label: trans("table.singleClick"),
    value: "single",
  },
  {
    label: trans("table.doubleClick"),
    value: "double",
  },
] as const;

const summarRowsOptions = [
  {
    label: "1",
    value: "1",
  },
  {
    label: "2",
    value: "2",
  },
  {
    label: "3",
    value: "3",
  },
] as const;

const sizeOptions = [
  {
    label: trans("table.small"),
    value: "small",
  },
  {
    label: trans("table.middle"),
    value: "middle",
  },
  {
    label: trans("table.large"),
    value: "large",
  },
] as const;

export const TableEventOptions = [
  {
    label: trans("table.saveChanges"),
    value: "saveChanges",
    description: trans("table.saveChanges"),
  },
  {
    label: trans("table.cancelChanges"),
    value: "cancelChanges",
    description: trans("table.cancelChanges"),
  },
  {
    label: trans("table.rowSelectChange"),
    value: "rowSelectChange",
    description: trans("table.rowSelectChange"),
  },
  {
    label: trans("table.rowClick"),
    value: "rowClick",
    description: trans("table.rowClick"),
  },
  {
    label: trans("table.rowExpand"),
    value: "rowExpand",
    description: trans("table.rowExpand"),
  },
  {
    label: trans("table.rowShrink"),
    value: "rowShrink",
    description: trans("table.rowShrink"),
  },
  {
    label: trans("table.columnEdited"),
    value: "columnEdited",
    description: trans("table.columnEdited"),
  },
  {
    label: trans("table.search"),
    value: "dataSearch",
    description: trans("table.search"),
  },
  {
    label: trans("table.download"),
    value: "download",
    description: trans("table.download"),
  },
  {
    label: trans("table.filterChange"),
    value: "filterChange",
    description: trans("table.filterChange"),
  },
  {
    label: trans("table.sortChange"),
    value: "sortChange",
    description: trans("table.sortChange"),
  },
  {
    label: trans("table.pageChange"),
    value: "pageChange",
    description: trans("table.pageChange"),
  },
  {
    label: trans("table.refresh"),
    value: "refresh",
    description: trans("table.refresh"),
  },
] as const;

export type TableEventOptionValues = typeof TableEventOptions[number]['value'];

export type SortValue = {
  column?: string;
  desc?: boolean;
};

const TableEventControl = eventHandlerControl(TableEventOptions);

const rowColorLabel = trans("table.rowColor");
const RowColorTempComp = withContext(
  new MultiCompBuilder({
    color: ColorOrBoolCodeControl,
  }, (props) => props.color)
    .setPropertyViewFn((children) =>
      children.color.propertyView({
        label: rowColorLabel,
        tooltip: trans("table.rowColorDesc"),
      })
    )
    .build(),
  ["currentRow", "currentIndex", "currentOriginalIndex", "columnTitle"] as const
);

// @ts-ignore
export class RowColorComp extends RowColorTempComp {
  override getPropertyView() {
    return controlItem({ filterText: rowColorLabel }, super.getPropertyView());
  }
}

// fixme, should be infer from RowColorComp, but withContext type incorrect
export type RowColorViewType = (param: {
  currentRow: any;
  currentIndex: number;
  currentOriginalIndex: number | string;
  columnTitle: string;
}) => string;

const rowHeightLabel = trans("table.rowHeight");
const RowHeightTempComp = withContext(
  new MultiCompBuilder({
    height: HeightOrBoolCodeControl,
  }, (props) => props.height)
    .setPropertyViewFn((children) =>
      children.height.propertyView({
        label: rowHeightLabel,
        tooltip: trans("table.rowHeightDesc"),
      })
    )
    .build(),
  ["currentRow", "currentIndex", "currentOriginalIndex", "columnTitle"] as const
);

// @ts-ignore
export class RowHeightComp extends RowHeightTempComp {
  override getPropertyView() {
    return controlItem({ filterText: rowHeightLabel }, super.getPropertyView());
  }
}

// fixme, should be infer from RowHeightComp, but withContext type incorrect
export type RowHeightViewType = (param: {
  currentRow: any;
  currentIndex: number;
  currentOriginalIndex: number | string;
  columnTitle: string;
}) => string;

const tableChildrenMap = {
  // hideBordered: BoolControl,
  showHeaderGridBorder: BoolControl,
  showRowGridBorder: withDefault(BoolControl,true),
  showHRowGridBorder: withDefault(BoolControl,true),
  hideHeader: BoolControl,
  fixedHeader: BoolControl,
  autoHeight: withDefault(AutoHeightControl, "auto"),
  showVerticalScrollbar: BoolControl,
  showHorizontalScrollbar: BoolControl,
  data: withIsLoadingMethod(JSONObjectArrayControl),
  newData: stateComp<JSONArray>([]),
  showDataLoadSpinner: withDefault(BoolPureControl, true),
  columns: ColumnListComp,
  size: dropdownControl(sizeOptions, "middle"),
  selection: SelectionControl,
  pagination: PaginationControl,
  sort: valueComp<Array<SortValue>>([]),
  toolbar: TableToolbarComp,
  showSummary: BoolControl,
  summaryRows: dropdownControl(summarRowsOptions, "1"),
  style: styleControl(TableStyle, 'style'),
  rowStyle: styleControl(TableRowStyle, 'rowStyle'),
  summaryRowStyle: styleControl(TableSummaryRowStyle, 'summaryRowStyle'),
  toolbarStyle: styleControl(TableToolbarStyle, 'toolbarStyle'),
  headerStyle: styleControl(TableHeaderStyle, 'headerStyle'),
  searchText: StringControl,
  columnsStyle: styleControl(TableColumnStyle, 'columnsStyle'),
  viewModeResizable: BoolControl,
  visibleResizables: BoolControl,
  // sample data for regenerating columns
  dataRowExample: stateComp<JSONObject | null>(null),
  onEvent: TableEventControl,
  loading: BoolCodeControl,
  rowColor: RowColorComp,
  rowAutoHeight: withDefault(AutoHeightControl, "auto"),
  tableAutoHeight: withDefault(AutoHeightControl, "auto"),
  rowHeight: RowHeightComp,
  dynamicColumn: BoolPureControl,
  // todo: support object config
  dynamicColumnConfig: ArrayStringControl,
  expansion: ExpansionControl,
  selectedCell: stateComp<JSONObject>({}),
  inlineAddNewRow: BoolControl,
  editModeClicks: dropdownControl(editModeClickOptions, "single"),
};

export const TableInitComp = (function () {
  return new UICompBuilder(tableChildrenMap, () => {
    return <></>;
  })
    .setPropertyViewFn(() => <></>)
    .build();
})();

const uiChildrenMap = uiChildren(tableChildrenMap);
export type TableChildrenType = RecordConstructorToComp<typeof uiChildrenMap>;
export type TableChildrenView = RecordConstructorToView<typeof uiChildrenMap>;
export type TableOnEventView = ConstructorToView<typeof TableEventControl>;
