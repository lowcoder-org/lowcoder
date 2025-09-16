import { tableDataRowExample } from "./column/tableColumnListComp";
import { getPageSize } from "./paginationControl";
import { TableCompView } from "./tableCompView";
import {
  columnHide,
  ColumnsAggrData,
  RecordType,
  transformDispalyData,
} from "./tableUtils";
import { isTriggerAction } from "comps/controls/actionSelector/actionSelectorControl";
import { withPropertyViewFn, withViewFn } from "comps/generators";
import { childrenToProps } from "comps/generators/multi";
import { HidableView } from "comps/generators/uiCompBuilder";
import { withDispatchHook } from "comps/generators/withDispatchHook";
import {
  CompDepsConfig,
  depsConfig,
  DepsConfig,
  NameConfig,
  withExposingConfigs,
} from "comps/generators/withExposing";
import { withMethodExposing } from "comps/generators/withMethodExposing";
import { trans } from "i18n";
import _ from "lodash";
import {
  changeChildAction,
  CompAction,
  CompActionTypes,
  deferAction,
  executeQueryAction,
  onlyEvalAction,
  routeByNameAction,
  wrapChildAction,
} from "lowcoder-core";
import { saveDataAsFile } from "util/fileUtils";
import { JSONObject } from "util/jsonTypes";
import { indexKeyToRecord, toDisplayIndex } from "./utils/selectionUtils";

import { getSelectedRowKeys } from "./selectionControl";
import { compTablePropertyView } from "./tablePropertyView";
import { RowColorComp, RowHeightComp, TableChildrenView, TableInitComp } from "./tableTypes";

import { useContext } from "react";
import { EditorContext } from "comps/editorState";
import { tableMethodExposings } from "./methods/tableMethodExposings";
import { buildSortedDataNode, buildFilteredDataNode, buildOriDisplayDataNode, buildColumnAggrNode } from "./nodes/dataNodes";

export class TableImplComp extends TableInitComp {
  private prevUnevaledValue?: string;
  readonly filterData: RecordType[] = [];
  readonly columnAggrData: ColumnsAggrData = {};

  override autoHeight(): boolean {
    return this.children.autoHeight.getView();
  }

  downloadData(fileName: string) {
    saveDataAsFile({
      data: (this as any).exposingValues["displayData"],
      filename: fileName,
      fileType: "csv",
      delimiter: this.children.toolbar.children.columnSeparator.getView(),
    });
  }

  refreshData(allQueryNames: Array<string>, setLoading: (loading: boolean) => void) {
    const deps: Array<string> = this.children.data.exposingNode().dependNames();
    const depsQueryNames = deps.map((d) => d.split(".")[0]);
    if (_.isEmpty(depsQueryNames)) {
      setLoading(true);
      setTimeout(() => setLoading(false), 200);
      return;
    }
    const queryNameSet = new Set(allQueryNames);
    depsQueryNames.forEach((name) => {
      if (queryNameSet.has(name)) {
        this.dispatch(deferAction(routeByNameAction(name, executeQueryAction({}))));
      }
    });
  }

  getProps() {
    return childrenToProps(_.omit(this.children, "style")) as TableChildrenView;
  }

  shouldGenerateColumn(comp: this, nextRowExample?: JSONObject) {
    const columnKeys = comp.children.columns
      .getView()
      .map((col) => {
        const colView = col.getView();
        if (colView.isCustom) {
          return "";
        } else {
          return colView.dataIndex;
        }
      })
      .filter((t) => !!t);
    const nextUnevaledVal = comp.children.data.unevaledValue;
    const prevUnevaledVal = this.prevUnevaledValue;
    if (!nextRowExample) {
      this.prevUnevaledValue = nextUnevaledVal;
      return false;
    }
    let doGenColumn = false;
    const nextRowKeys = Object.keys(nextRowExample);
    const dynamicColumn = comp.children.dynamicColumn.getView();
    if (!prevUnevaledVal && columnKeys.length === 0) {
      doGenColumn = true;
    } else if (prevUnevaledVal && nextUnevaledVal !== prevUnevaledVal) {
      doGenColumn = true;
    } else if (dynamicColumn) {
      doGenColumn = true;
    } else if (
      columnKeys.length < nextRowKeys.length &&
      columnKeys.every((key) => nextRowKeys.includes(key))
    ) {
      doGenColumn = true;
    }
    if (!doGenColumn) {
      const toBeGenRow = comp.children.dataRowExample.getView();
      const columnKeyChanged =
        columnKeys.length !== nextRowKeys.length ||
        !_.isEqual(_.sortBy(columnKeys), _.sortBy(nextRowKeys));
      if (columnKeyChanged && !_.isEqual(toBeGenRow, nextRowExample)) {
        setTimeout(() => {
          comp.children.dataRowExample.dispatchChangeValueAction(nextRowExample);
        });
      } else if (!columnKeyChanged && toBeGenRow) {
        setTimeout(() => {
          comp.children.dataRowExample.dispatchChangeValueAction(null);
        });
      }
    }
    this.prevUnevaledValue = nextUnevaledVal;
    return doGenColumn;
  }

  override reduce(action: CompAction): this {
    let comp = super.reduce(action);
    let dataChanged = false;
    if (action.type === CompActionTypes.UPDATE_NODES_V2) {
      const nextRowExample = tableDataRowExample(comp.children.data.getView());
      dataChanged =
        comp.children.data !== this.children.data &&
        !_.isEqual(this.children.data.getView(), comp.children.data.getView());
      if (dataChanged) {
        comp = comp.setChild(
          "rowColor",
          comp.children.rowColor.reduce(
            RowColorComp.changeContextDataAction({
              currentRow: nextRowExample,
              currentIndex: 0,
              currentOriginalIndex: 0,
              columnTitle: nextRowExample ? Object.keys(nextRowExample)[0] : undefined,
            })
          )
        );
        comp = comp.setChild(
          "rowHeight",
          comp.children.rowHeight.reduce(
            RowHeightComp.changeContextDataAction({
              currentRow: nextRowExample,
              currentIndex: 0,
              currentOriginalIndex: 0,
              columnTitle: nextRowExample ? Object.keys(nextRowExample)[0] : undefined,
            })
          )
        );
      }

      if (dataChanged) {
        const doGene = comp.shouldGenerateColumn(comp, nextRowExample);
        const actions: CompAction[] = [];
        actions.push(
          wrapChildAction(
            "columns",
            comp.children.columns.dataChangedAction({
              rowExample: nextRowExample || {},
              doGeneColumn: doGene,
              dynamicColumn: comp.children.dynamicColumn.getView(),
              data: comp.children.data.getView(),
            })
          )
        );
        doGene && actions.push(comp.changeChildAction("dataRowExample", null));
        setTimeout(() => {
          actions.forEach((action) => comp.dispatch(deferAction(action)));
        }, 0);
      }
    }

    let needMoreEval = false;

    const thisSelection = getSelectedRowKeys(this.children.selection)[0] ?? "0";
    const newSelection = getSelectedRowKeys(comp.children.selection)[0] ?? "0";
    const selectionChanged =
      this.children.selection !== comp.children.selection && thisSelection !== newSelection;
    if (
      (action.type === CompActionTypes.CUSTOM &&
        comp.children.columns.getView().length !== this.children.columns.getView().length) ||
      selectionChanged
    ) {
      comp = comp.setChild(
        "columns",
        comp.children.columns.reduce(comp.children.columns.setSelectionAction(newSelection))
      );
      needMoreEval = true;
    }
    if (action.type === CompActionTypes.UPDATE_NODES_V2 && needMoreEval) {
      setTimeout(() => comp.dispatch(onlyEvalAction()));
    }
    return comp;
  }

  override extraNode() {
    const extra = {
      sortedData: buildSortedDataNode(this),
      filterData: buildFilteredDataNode(this),
      oriDisplayData: buildOriDisplayDataNode(this),
      columnAggrData: buildColumnAggrNode(this),
    };
    return {
      node: extra,
      updateNodeFields: (value: any) => ({
        filterData: value.filterData,
        columnAggrData: value.columnAggrData,
      }),
    };
  }
}

let TableTmpComp = withViewFn(TableImplComp, (comp) => {
  return (
    <HidableView hidden={comp.children.hidden.getView()}>
      <TableCompView
        comp={comp}
        onRefresh={(allQueryNames, setLoading) => comp.refreshData(allQueryNames, setLoading)}
        onDownload={(fileName) => comp.downloadData(fileName)}
      />
    </HidableView>
  );
});

const withEditorModeStatus = (Component:any) => (props:any) => {
  const editorModeStatus = useContext(EditorContext).editorModeStatus;
  const {ref, ...otherProps} = props;
  return <Component {...otherProps} editorModeStatus={editorModeStatus} />;
};


TableTmpComp = withPropertyViewFn(TableTmpComp, (comp) => withEditorModeStatus(compTablePropertyView)(comp));

TableTmpComp = withDispatchHook(TableTmpComp, (dispatch) => (action) => {
  if (!dispatch) {
    return;
  }
  if (isTriggerAction(action)) {
    const context = action.value.context;
    if (context && !_.isNil(context["currentOriginalIndex"])) {
      const key = context["currentOriginalIndex"] + "";
      dispatch(wrapChildAction("selection", changeChildAction("selectedRowKey", key, false)));
    }
  }
  return dispatch(action);
});

TableTmpComp = withMethodExposing(TableTmpComp, tableMethodExposings);

export const TableLiteComp = withExposingConfigs(TableTmpComp, [
  new DepsConfig(
    "selectedRow",
    (children) => {
      return {
        selectedRowKey: children.selection.children.selectedRowKey.node(),
        data: children.data.exposingNode(),
      };
    },
    (input) => {
      if (!input.data) {
        return undefined;
      }
      return indexKeyToRecord(input.data, input.selectedRowKey);
    },
    trans("table.selectedRowDesc")
  ),
  new DepsConfig(
    "selectedRows",
    (children) => {
      return {
        selectedRowKeys: children.selection.children.selectedRowKeys.node(),
        data: children.data.exposingNode(),
      };
    },
    (input) => {
      if (!input.data) {
        return undefined;
      }
      return input.selectedRowKeys.flatMap((key: string) => {
        const result = indexKeyToRecord(input.data, key);
        return result === undefined ? [] : [result];
      });
    },
    trans("table.selectedRowsDesc")
  ),
  new CompDepsConfig(
    "selectedIndex",
    (comp) => {
      return {
        oriDisplayData: buildOriDisplayDataNode(comp),
        selectedRowKey: comp.children.selection.children.selectedRowKey.node(),
      };
    },
    (input) => {
      return toDisplayIndex(input.oriDisplayData, input.selectedRowKey);
    },
    trans("table.selectedIndexDesc")
  ),
  new CompDepsConfig(
    "selectedIndexes",
    (comp) => {
      return {
        oriDisplayData: buildOriDisplayDataNode(comp),
        selectedRowKeys: comp.children.selection.children.selectedRowKeys.node(),
      };
    },
    (input) => {
      return input.selectedRowKeys.flatMap((key: string) => {
        const result = toDisplayIndex(input.oriDisplayData, key);
        return result === undefined ? [] : [result];
      });
    },
    trans("table.selectedIndexDesc")
  ),

  new DepsConfig(
    "pageNo",
    (children) => {
      return {
        pageNo: children.pagination.children.pageNo.exposingNode(),
      };
    },
    (input) => input.pageNo,
    trans("table.pageNoDesc")
  ),
  new DepsConfig(
    "pageSize",
    (children) => {
      return {
        showSizeChanger: children.pagination.children.showSizeChanger.node(),
        changeablePageSize: children.pagination.children.changeablePageSize.node(),
        pageSize: children.pagination.children.pageSize.node(),
        pageSizeOptions: children.pagination.children.pageSizeOptions.node(),
      };
    },
    (input) => {
      return getPageSize(
        input.showSizeChanger.value,
        input.pageSize.value,
        input.pageSizeOptions.value,
        input.changeablePageSize
      );
    },
    trans("table.pageSizeDesc")
  ),
  new DepsConfig(
    "sortColumn",
    (children) => {
      return {
        sort: children.sort.node(),
        columns: children.columns.node()!,
      };
    },
    (input) => {
      const sortIndex = input.sort[0]?.column;
      const column = Object.values(input.columns as any).find(
        (c: any) => c.dataIndex === sortIndex
      ) as any;
      if (column?.isCustom && column?.title.value) {
        return column.title.value;
      } else {
        return sortIndex;
      }
    },
    trans("table.sortColumnDesc")
  ),
  new DepsConfig(
    "sortColumns",
    (children) => {
      return {
        sort: children.sort.node(),
      };
    },
    (input) => {
      return input.sort;
    },
    trans("table.sortColumnDesc")
  ),
  depsConfig({
    name: "sortDesc",
    desc: trans("table.sortDesc"),
    depKeys: ["sort"],
    func: (input) => {
      return input.sort[0]?.desc || false;
    },
  }),
  new DepsConfig(
    "pageOffset",
    (children) => {
      return {
        showSizeChanger: children.pagination.children.showSizeChanger.node(),
        changeablePageSize: children.pagination.children.changeablePageSize.node(),
        pageSize: children.pagination.children.pageSize.node(),
        pageSizeOptions: children.pagination.children.pageSizeOptions.node(),
        pageNo: children.pagination.children.pageNo.node(),
      };
    },
    (input) => {
      return (
        getPageSize(
          input.showSizeChanger.value,
          input.pageSize.value,
          input.pageSizeOptions.value,
          input.changeablePageSize
        ) *
        (input.pageNo - 1)
      );
    },
    trans("table.pageOffsetDesc")
  ),
  new CompDepsConfig(
    "displayData",
    (comp) => {
      return {
        oriDisplayData: buildOriDisplayDataNode(comp),
        dataIndexes: comp.children.columns.getColumnsNode("dataIndex"),
        titles: comp.children.columns.getColumnsNode("title"),
        hides: comp.children.columns.getColumnsNode("hide"),
        tempHides: comp.children.columns.getColumnsNode("tempHide"),
        columnSetting: comp.children.toolbar.children.columnSetting.node(),
      };
    },
    (input) => {
      const dataIndexTitleDict = _(input.dataIndexes)
        .pickBy(
          (_1, idx) =>
            !columnHide({
              hide: input.hides[idx].value,
              tempHide: input.tempHides[idx],
              enableColumnSetting: input.columnSetting.value,
            })
        )
        .mapValues((_dataIndex, idx) => input.titles[idx]?.value)
        .mapKeys((_title, idx) => input.dataIndexes[idx])
        .value();
      return transformDispalyData(input.oriDisplayData, dataIndexTitleDict);
    },
    trans("table.displayDataDesc")
  ),
  new DepsConfig(
    "selectedCell",
    (children) => {
      return {
        selectedCell: children.selectedCell.node(),
      };
    },
    (input) => {
      return input.selectedCell;
    },
    trans("table.selectedCellDesc")
  ),
  new NameConfig("data", trans("table.dataDesc")),
]);
