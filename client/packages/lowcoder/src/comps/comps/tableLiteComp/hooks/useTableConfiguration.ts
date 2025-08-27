// hooks/useTableConfiguration.ts
import { useMemo, useState, useEffect, useRef } from 'react';

// ============= HOOK 1: TABLE MODE =============
export function useTableMode(autoHeight: boolean) {
  return useMemo(() => ({
    mode: autoHeight ? 'AUTO' : 'FIXED' as const,
    isAutoMode: autoHeight,
    isFixedMode: !autoHeight
  }), [autoHeight]);
}

// ============= HOOK 2: CONTAINER HEIGHT MEASUREMENT =============
export function useContainerHeight(enabled: boolean) {
  const [containerHeight, setContainerHeight] = useState<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!enabled || !containerRef.current) return;

    const measureHeight = () => {
      const element = containerRef.current;
      if (element) {
        // clientHeight gives us the inner height available for content
        setContainerHeight(element.clientHeight);
      }
    };

    // Initial measurement
    measureHeight();

    // Watch for size changes
    const resizeObserver = new ResizeObserver(measureHeight);
    resizeObserver.observe(containerRef.current);

    return () => resizeObserver.disconnect();
  }, [enabled]);

  return { containerHeight, containerRef };
}

// ============= HOOK 3: HEIGHT CALCULATIONS =============
interface HeightConfig {
  showToolbar: boolean;
  showHeader: boolean;
  toolbarHeight?: number;
  headerHeight?: number;
  containerPadding?: number;
}

export function useTableHeights(
  mode: 'AUTO' | 'FIXED',
  containerHeight: number,
  config: HeightConfig
) {
  return useMemo(() => {
    if (mode === 'AUTO') {
      return {
        containerStyle: { 
          height: '100%', 
          display: 'flex', 
          flexDirection: 'column' as const 
        },
        tableHeight: undefined,
        bodyHeight: undefined,
        scrollY: undefined,
        canVirtualize: false
      };
    }

    // FIXED mode calculations
    const {
      showToolbar = false,
      showHeader = true,
      toolbarHeight = 48,
      headerHeight = 40,
      containerPadding = 0
    } = config;

    const toolbarSpace = showToolbar ? toolbarHeight : 0;
    const headerSpace = showHeader ? headerHeight : 0;
    const totalUsedSpace = toolbarSpace + headerSpace + containerPadding;
    
    // Calculate available height for table body
    const bodyHeight = Math.max(0, containerHeight - totalUsedSpace);

    console.log('Container height:', containerHeight);
    console.log('Body height calculated:', bodyHeight);
  
    
    return {
      containerStyle: { 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column' as const 
      },
      tableHeight: containerHeight,
      bodyHeight,
      scrollY: bodyHeight > 0 ? bodyHeight : undefined,
      canVirtualize: bodyHeight > 100 // Reasonable minimum for virtualization
    };
  }, [mode, containerHeight, config]);
}

// ============= HOOK 4: VIRTUALIZATION CONFIG =============
export function useVirtualization(
  canVirtualize: boolean,
  dataLength: number,
  threshold: number = 50
) {
  return useMemo(() => {
    const shouldVirtualize = canVirtualize && dataLength >= threshold;
    
    return {
      enabled: shouldVirtualize,
      threshold,
      itemHeight: 40, // Could be made configurable later
      reason: !canVirtualize 
        ? 'height_insufficient' 
        : dataLength < threshold 
        ? 'data_too_small' 
        : 'enabled'
    };
  }, [canVirtualize, dataLength, threshold]);
}