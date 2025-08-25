// AutoModeTable.tsx
import React from "react";
import BaseTable, { BaseTableProps } from "./BaseTable";

export interface AutoModeTableProps<RecordType> extends BaseTableProps<RecordType> {}

function AutoModeTableComp<RecordType extends object>(props: AutoModeTableProps<RecordType>) {
  return <BaseTable<RecordType> {...props} />;
}

const AutoModeTable = React.memo(AutoModeTableComp) as typeof AutoModeTableComp;
export default AutoModeTable;