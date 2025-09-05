// FixedModeTable.tsx  
import React from "react";
import BaseTable, { BaseTableProps } from "./BaseTable";

export interface FixedModeTableProps<RecordType> extends BaseTableProps<RecordType> {
  bodyHeight: number;
}

function FixedModeTableComp<RecordType extends object>(props: FixedModeTableProps<RecordType>) {
  return <BaseTable<RecordType> {...props} />;
}

const FixedModeTable = React.memo(FixedModeTableComp) as typeof FixedModeTableComp;
export default FixedModeTable;