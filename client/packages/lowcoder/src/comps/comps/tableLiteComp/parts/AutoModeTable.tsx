import React from "react";
import BaseTable, { BaseTableProps } from "./BaseTable";

export interface AutoModeTableProps<RecordType> extends BaseTableProps<RecordType> {
  // No additional props needed - auto mode is simple!
}

function AutoModeTableComp<RecordType extends object>(props: AutoModeTableProps<RecordType>) {
  const { ...baseProps } = props;

  // Auto mode configuration: natural growth, no height constraints
  return (
    <BaseTable<RecordType>
      {...baseProps}
      // Override any height-related props for auto mode
      containerHeight={undefined}
      isFixedHeight={false}
    />
  );
}

const AutoModeTable = React.memo(AutoModeTableComp) as typeof AutoModeTableComp;
export default AutoModeTable;