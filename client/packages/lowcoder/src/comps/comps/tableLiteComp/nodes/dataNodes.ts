import _ from "lodash";
import { fromRecord, Node, RecordNode, ValueAndMsg, withFunction } from "lowcoder-core";
import { lastValueIfEqual, shallowEqual } from "util/objectUtils";
import { JSONObject } from "util/jsonTypes";
import { getPageSize } from "../paginationControl";
import {
  getOriDisplayData,
  getColumnsAggr,
  OB_ROW_ORI_INDEX,
  RecordType,
  sortData,
  tranToTableRecord,
} from "../tableUtils";
import type { SortValue } from "../tableTypes";
import type { TableImplComp } from "../tableComp";

export function buildSortedDataNode(comp: TableImplComp) {
  const nodes: {
    data: Node<JSONObject[]>;
    sort: Node<SortValue[]>;
    dataIndexes: RecordNode<Record<string, Node<string>>>;
    sortables: RecordNode<Record<string, Node<ValueAndMsg<boolean>>>>;
    withParams: RecordNode<_.Dictionary<any>>;
  } = {
    data: comp.children.data.exposingNode(),
    sort: comp.children.sort.node(),
    dataIndexes: comp.children.columns.getColumnsNode("dataIndex"),
    sortables: comp.children.columns.getColumnsNode("sortable"),
    withParams: comp.children.columns.withParamsNode(),
  };

  const sortedDataNode = withFunction(fromRecord(nodes), (input) => {
    const { data, sort, dataIndexes, sortables } = input;
    const sortColumns = _(dataIndexes)
      .mapValues((dataIndex, idx) => ({ sortable: !!sortables[idx] }))
      .mapKeys((sortable, idx) => dataIndexes[idx])
      .value();
    const dataColumns = _(dataIndexes)
      .mapValues((dataIndex, idx) => ({
        dataIndex,
        render: input.withParams[idx] as any,
      }))
      .value();

    const updatedData: Array<RecordType> = data.map((row, index) => ({
      ...row,
      [OB_ROW_ORI_INDEX]: index + "",
    }));

    const updatedDataMap: Record<string, RecordType> = {};
    updatedData.forEach((row) => {
      updatedDataMap[row[OB_ROW_ORI_INDEX]] = row;
    });

    const originalData = getOriDisplayData(updatedData, 1000, Object.values(dataColumns));
    const sorted = sortData(originalData, sortColumns, sort);

    const newData = sorted.map((row) => ({
      ...row,
      ...updatedDataMap[row[OB_ROW_ORI_INDEX]],
    }));
    return newData;
  });

  return lastValueIfEqual(comp, "sortedDataNode", [sortedDataNode, nodes] as const, (a, b) =>
    shallowEqual(a[1], b[1])
  )[0];
}

export function buildFilteredDataNode(comp: TableImplComp) {
  const nodes = {
    data: buildSortedDataNode(comp),
  };
  const filteredDataNode = withFunction(fromRecord(nodes), ({ data }) => {
    // No pre-filtering here; AntD header filters are handled internally by Table
    return data.map((row) => tranToTableRecord(row, (row as any)[OB_ROW_ORI_INDEX]));
  });
  return lastValueIfEqual(comp, "filteredDataNode", [filteredDataNode, nodes] as const, (a, b) =>
    shallowEqual(a[1], b[1])
  )[0];
}

export function buildOriDisplayDataNode(comp: TableImplComp) {
  const nodes = {
    data: buildFilteredDataNode(comp),
    showSizeChanger: comp.children.pagination.children.showSizeChanger.node(),
    pageSize: comp.children.pagination.children.pageSize.node(),
    pageSizeOptions: comp.children.pagination.children.pageSizeOptions.node(),
    changablePageSize: comp.children.pagination.children.changeablePageSize.node(),
    withParams: comp.children.columns.withParamsNode(),
    dataIndexes: comp.children.columns.getColumnsNode("dataIndex"),
  };
  const resNode = withFunction(fromRecord(nodes), (input) => {
    const columns = _(input.dataIndexes)
      .mapValues((dataIndex, idx) => ({
        dataIndex,
        render: input.withParams[idx],
      }))
      .value();
    const pageSize = getPageSize(
      input.showSizeChanger.value,
      input.pageSize.value,
      input.pageSizeOptions.value,
      input.changablePageSize
    );
    return getOriDisplayData(input.data, pageSize, Object.values(columns));
  });
  return lastValueIfEqual(comp, "oriDisplayDataNode", [resNode, nodes] as const, (a, b) =>
    shallowEqual(a[1], b[1])
  )[0];
}

export function buildColumnAggrNode(comp: TableImplComp) {
  const nodes = {
    oriDisplayData: buildOriDisplayDataNode(comp),
    withParams: comp.children.columns.withParamsNode(),
    dataIndexes: comp.children.columns.getColumnsNode("dataIndex"),
  };
  const resNode = withFunction(fromRecord(nodes), (input) => {
    const dataIndexWithParamsDict = _(input.dataIndexes)
      .mapValues((dataIndex, idx) => input.withParams[idx])
      .mapKeys((withParams, idx) => input.dataIndexes[idx])
      .value();
    const res = getColumnsAggr(input.oriDisplayData, dataIndexWithParamsDict);
    return res;
  });
  return lastValueIfEqual(comp, "columnAggrNode", [resNode, nodes] as const, (a, b) =>
    shallowEqual(a[1], b[1])
  )[0];
} 