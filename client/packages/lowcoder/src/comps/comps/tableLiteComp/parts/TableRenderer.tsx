import React, { useMemo } from "react";
import AutoModeTable from "./AutoModeTable";
import FixedModeTable from "./FixedModeTable";
import VirtualizedTable from "./VirtualizedTable";
import { BaseTableProps } from "./BaseTable";
import { COL_MIN_WIDTH } from "../tableUtils";

export interface TableRendererProps<RecordType> extends BaseTableProps<RecordType> {
  mode: 'AUTO' | 'FIXED';
  heights: {
    bodyHeight?: number;
    canVirtualize: boolean;
    [key: string]: any;
  };
  virtualizationConfig: {
    enabled: boolean;
    itemHeight: number;
    threshold: number;
    reason?: string;
  };
}

function TableRendererComp<RecordType extends object>(props: TableRendererProps<RecordType>) {
  const {
    mode,
    heights,
    virtualizationConfig,
    columns,
    ...baseTableProps
  } = props;

  // Calculate total width for X scroll
  const totalWidth = useMemo(() => {
    return columns.reduce((sum, col) => {
      const width = typeof col.width === "number" && col.width > 0 ? col.width : COL_MIN_WIDTH;
      return sum + width;
    }, 0);
  }, [columns]);

  // AUTO MODE: Natural growth
  if (mode === 'AUTO') {
    console.log('AutoModeTable');
    return (
      <AutoModeTable
        {...baseTableProps}
        columns={columns}
        scroll={{ x: totalWidth }}
        virtual={false}
      />
    );
  }

  // FIXED MODE: Height-constrained with optional virtualization
  if (mode === 'FIXED') {
    console.log('FixedModeTable');
    const bodyHeight = heights.bodyHeight ?? 0;
    
    if (bodyHeight <= 0) {
      console.warn('TableRenderer: Invalid bodyHeight, falling back to auto mode');
      return (
        <AutoModeTable
          {...baseTableProps}
          columns={columns}
          scroll={{ x: totalWidth }}
          virtual={false}
        />
      );
    }

    const scrollConfig = { x: totalWidth, y: bodyHeight };

    // VIRTUALIZED: High performance for large datasets
    if (virtualizationConfig.enabled && heights.canVirtualize) {
        console.log('VirtualizedTable');
      return (
        <VirtualizedTable
          {...baseTableProps}
          columns={columns}
          bodyHeight={bodyHeight}
          virtualizationConfig={virtualizationConfig}
          scroll={scrollConfig}
          virtual={true}
        />
      );
    }

    // FIXED: Regular height-constrained mode
    return (
      <FixedModeTable
        {...baseTableProps}
        columns={columns}
        bodyHeight={bodyHeight}
        scroll={scrollConfig}
        virtual={false}
      />
    );
  }

  // Fallback
  return (
    <AutoModeTable
      {...baseTableProps}
      columns={columns}
      scroll={{ x: totalWidth }}
      virtual={false}
    />
  );
}

const TableRenderer = React.memo(TableRendererComp) as typeof TableRendererComp;
export default TableRenderer;