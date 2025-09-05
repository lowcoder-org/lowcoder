import React from "react";
import BaseTable, { BaseTableProps } from "./BaseTable";

export interface VirtualizedTableProps<RecordType> extends BaseTableProps<RecordType> {
  bodyHeight: number;
  virtualizationConfig: {
    enabled: boolean;
    itemHeight: number;
    threshold: number;
    reason?: string;
  };
}

function VirtualizedTableComp<RecordType extends object>(props: VirtualizedTableProps<RecordType>) {
  const { bodyHeight, virtualizationConfig, ...baseProps } = props;

  // Virtualized mode: explicit scroll config for performance
  return (
    <BaseTable<RecordType>
      {...baseProps}
      // Props are set by TableRenderer
    />
  );
}

const VirtualizedTable = React.memo(VirtualizedTableComp) as typeof VirtualizedTableComp;
export default VirtualizedTable;