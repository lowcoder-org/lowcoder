// hooks/useTableConfiguration.ts
import { useMemo, useState, useEffect, useRef } from 'react';
import { VIRTUAL_ROW_HEIGHTS, VIRTUAL_THRESHOLD, MIN_VIRTUAL_HEIGHT, TOOLBAR_HEIGHT, HEADER_HEIGHT } from '../tableUtils';

// ============= HOOK 1: TABLE MODE =============
export function useTableMode(autoHeight: boolean) {
  return useMemo(() => ({
    isAutoMode: autoHeight,
    isFixedMode: !autoHeight
  }), [autoHeight]);
}

// ============= HOOK 2: CONTAINER HEIGHT MEASUREMENT =============
export function useContainerHeight(enabled: boolean) {
  const [containerHeight, setContainerHeight] = useState<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = containerRef.current;
    if (!enabled || !element) return;

    const measureHeight = () => {
      if (element) {
        setContainerHeight(element.clientHeight);
      }
    };

    measureHeight();
    const resizeObserver = new ResizeObserver(measureHeight);
    resizeObserver.observe(element);

    return () => {
      resizeObserver.disconnect();
    };
  }, [enabled]);

  return { containerHeight, containerRef };
}

// ============= HOOK 3: VIRTUALIZATION CALCULATION =============
export function useVirtualization(
  containerHeight: number,
  dataLength: number,
  tableSize: 'small' | 'middle' | 'large',
  config: {
    showToolbar: boolean;
    showHeader: boolean;
    stickyToolbar: boolean;
    isFixedMode: boolean;
  }
) {
  return useMemo(() => {
    if (!config.isFixedMode) {
      return {
        enabled: false,
        scrollY: undefined,
        itemHeight: VIRTUAL_ROW_HEIGHTS[tableSize],
        reason: 'auto_mode'
      };
    }

    // Calculate reserved space
    const toolbarSpace = config.showToolbar && config.stickyToolbar ? TOOLBAR_HEIGHT : 0;
    const headerSpace = config.showHeader ? HEADER_HEIGHT : 0;
    const availableHeight = containerHeight - toolbarSpace - headerSpace;

    // Check if virtualization should be enabled
    const canVirtualize = availableHeight > MIN_VIRTUAL_HEIGHT;
    const hasEnoughData = dataLength >= VIRTUAL_THRESHOLD;
    const enabled = canVirtualize && hasEnoughData;

    return {
      enabled,
      scrollY: availableHeight > 0 ? availableHeight : undefined,
      itemHeight: VIRTUAL_ROW_HEIGHTS[tableSize],
      reason: !canVirtualize 
        ? 'insufficient_height' 
        : !hasEnoughData 
        ? 'insufficient_data' 
        : 'enabled'
    };
  }, [containerHeight, dataLength, tableSize, config]);
}

// ============= HOOK 4: SCROLL CONFIGURATION =============
export function useScrollConfiguration(
  virtualizationEnabled: boolean,
  scrollY: number | undefined,
  totalColumnsWidth: number
) {
  return useMemo(() => {
    const baseScroll = { x: totalColumnsWidth };
    
    if (!virtualizationEnabled || !scrollY) {
      return { 
        scroll: baseScroll, 
        virtual: false 
      };
    }

    return {
      scroll: { 
        x: totalColumnsWidth, 
        y: scrollY 
      },
      virtual: true
    };
  }, [virtualizationEnabled, scrollY, totalColumnsWidth]);
}