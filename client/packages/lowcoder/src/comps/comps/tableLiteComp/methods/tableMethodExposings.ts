import _ from "lodash";
import { OB_ROW_ORI_INDEX } from "../tableUtils";
import { SortValue } from "../tableTypes";

export const tableMethodExposings = [
  {
    method: {
      name: "setPage",
      description: "",
      params: [{ name: "page", type: "number" as const }],
    },
    execute: (comp: any, values: any[]) => {
      const page = values[0] as number;
      if (page && page > 0) {
        comp.children.pagination.children.pageNo.dispatchChangeValueAction(page);
      }
    },
  },
  {
    method: {
      name: "setSort",
      description: "",
      params: [
        { name: "sortColumn", type: "string" as const },
        { name: "sortDesc", type: "boolean" as const },
      ],
    },
    execute: (comp: any, values: any[]) => {
      if (values[0]) {
        comp.children.sort.dispatchChangeValueAction([
          {
            column: values[0] as string,
            desc: values[1] as boolean,
          },
        ]);
      }
    },
  },
  {
    method: {
      name: "setMultiSort",
      description: "",
      params: [{ name: "sortColumns", type: "arrayObject" as const }],
    },
    execute: (comp: any, values: any[]) => {
      const sortColumns = values[0];
      if (!Array.isArray(sortColumns)) {
        return Promise.reject(
          "setMultiSort function only accepts array of sort objects i.e. [{column: column_name, desc: boolean}]"
        );
      }
      if (sortColumns && Array.isArray(sortColumns)) {
        comp.children.sort.dispatchChangeValueAction(sortColumns as SortValue[]);
      }
    },
  },
  {
    method: {
      name: "resetSelections",
      description: "",
      params: [],
    },
    execute: (comp: any) => {
      comp.children.selection.children.selectedRowKey.dispatchChangeValueAction("0");
      comp.children.selection.children.selectedRowKeys.dispatchChangeValueAction([]);
    },
  },
  {
    method: {
      name: "selectAll",
      description: "Select all rows in the current filtered view",
      params: [],
    },
    execute: (comp: any) => {
      const displayData = comp.filterData ?? [];
      const allKeys = displayData.map((row: any) => row[OB_ROW_ORI_INDEX] + "");
      comp.children.selection.children.selectedRowKey.dispatchChangeValueAction(allKeys[0] || "0");
      comp.children.selection.children.selectedRowKeys.dispatchChangeValueAction(allKeys);
    },
  },
  {
    method: {
      name: "rowClick",
      description:
        "Programmatically click a table row by index and trigger rowClick event handlers",
      params: [{ name: "rowIndex", type: "number" as const }],
    },
    execute: (comp: any, values: any[]) => {
      const rowIndex = Number(values[0]);
      const displayData = comp.filterData ?? [];
      if (Number.isNaN(rowIndex) || rowIndex < 0 || rowIndex >= displayData.length) {
        return Promise.reject(
          "rowClick expects a valid row index within the current filtered data"
        );
      }
      const key = displayData[rowIndex][OB_ROW_ORI_INDEX] + "";
      const prevKey = comp.children.selection.children.selectedRowKey.getView();
      if (key !== prevKey) {
        comp.children.selection.children.selectedRowKey.dispatchChangeValueAction(key);
      }
      const onEvent = comp.children.onEvent.getView();
      onEvent("rowClick");
      if (key !== prevKey) {
        onEvent("rowSelectChange");
      }
    },
  },
]; 