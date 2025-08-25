import React from "react";
import BaseTable, { BaseTableProps } from "./BaseTable";

export interface FixedModeTableProps<RecordType> extends BaseTableProps<RecordType> {
  bodyHeight: number;
}

function FixedModeTableComp<RecordType extends object>(props: FixedModeTableProps<RecordType>) {
  const { bodyHeight, ...baseProps } = props;

  // Fixed mode configuration: height constraints and internal scrolling
  return (
    <BaseTable<RecordType>
      {...baseProps}
      containerHeight={bodyHeight}
      isFixedHeight={true}
    />
  );
}

const FixedModeTable = React.memo(FixedModeTableComp) as typeof FixedModeTableComp;
export default FixedModeTable;