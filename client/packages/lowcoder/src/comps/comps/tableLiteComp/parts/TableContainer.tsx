// parts/TableContainer.tsx
import React from 'react';
import styled from 'styled-components';
import SimpleBar from 'simplebar-react';
import 'simplebar-react/dist/simplebar.min.css';

const MainContainer = styled.div<{
  $mode: 'AUTO' | 'FIXED';
  $showHorizontalScrollbar: boolean;
  $showVerticalScrollbar: boolean;
  $virtual: boolean;
}>`
  display: flex;
  flex-direction: column;
  height: 100%;
  position: relative;

  /* Critical CSS controls for SimpleBar */
 

    ${props => (!props.$showHorizontalScrollbar || props.$virtual) && `
      div.simplebar-horizontal {
        visibility: hidden !important;
      }  
    `}
    
    ${props => (!props.$showVerticalScrollbar || props.$virtual) && `
      div.simplebar-vertical {
        visibility: hidden !important;
      }  
    `}
  
`;

const StickyToolbar = styled.div<{
  $position: 'above' | 'below';
}>`
  position: sticky;
  ${props => props.$position === 'above' ? 'top: 0;' : 'bottom: 0;'}
  z-index: 10;
  background: inherit;
  box-shadow: ${props => props.$position === 'above' 
    ? '0 2px 8px rgba(0,0,0,0.1)' 
    : '0 -2px 8px rgba(0,0,0,0.1)'
  };
  flex-shrink: 0;
`;

const DefaultToolbar = styled.div`
  flex-shrink: 0;
  /* Prevent horizontal scrolling while allowing vertical flow */
  position: sticky;
  left: 0;
  right: 0;
  z-index: 1;
  background: inherit;
`;

const TableSection = styled.div<{
  $mode: 'AUTO' | 'FIXED';
}>`
  min-height: 0;
  min-width: 0;

  /* Ant Table virtualization scrollbar - match SimpleBar colors */
  .ant-table-tbody-virtual-scrollbar-thumb {
    background: rgba(0,0,0,0.35) !important;
    border-radius: 6px;
    transition: background .2s ease;
  }
`;

const SimpleBarWrapper = styled(SimpleBar)`
  height: 100%;
  overflow: auto !important;


  /* CRITICAL: Transfer scroll control from Ant Design to SimpleBar */
  .simplebar-track { background: transparent; }

  .simplebar-track.simplebar-vertical { width: 10px; }
  .simplebar-track.simplebar-horizontal { height: 10px; }

  .simplebar-scrollbar:before {
    background: rgba(0,0,0,0.35);
    border-radius: 6px;
    transition: background .2s ease, inset .2s ease;
  }

  .simplebar-track.simplebar-vertical .simplebar-scrollbar:before { left: 2px; right: 2px; }
  .simplebar-track.simplebar-horizontal .simplebar-scrollbar:before { top: 2px; bottom: 2px; }

  .simplebar-track:hover .simplebar-scrollbar:before { background: rgba(0,0,0,0.55); }
  .simplebar-track.simplebar-vertical:hover .simplebar-scrollbar:before { left: 1px; right: 1px; }
  .simplebar-track.simplebar-horizontal:hover .simplebar-scrollbar:before { top: 1px; bottom: 1px; }
`;

interface TableContainerProps {
  mode: 'AUTO' | 'FIXED';
  toolbarPosition: 'above' | 'below' | 'close';
  stickyToolbar: boolean;
  showToolbar: boolean;
  toolbar: React.ReactNode;
  children: React.ReactNode;
  containerRef?: React.RefObject<HTMLDivElement>;
  showVerticalScrollbar: boolean;
  showHorizontalScrollbar: boolean;
  virtual: boolean;
}

export const TableContainer: React.FC<TableContainerProps> = ({
  mode,
  toolbarPosition,
  stickyToolbar,
  showToolbar,
  toolbar,
  children,
  containerRef,
  showVerticalScrollbar,
  showHorizontalScrollbar,
  virtual
}) => {
  const hideScrollbar = !showHorizontalScrollbar && !showVerticalScrollbar;

  React.useEffect(() => {
    // eslint-disable-next-line no-console
    console.log('TableContainer virtual:', virtual);
  }, [virtual]);

  return (
    <MainContainer 
      $mode={mode} 
      ref={containerRef}
      $showHorizontalScrollbar={showHorizontalScrollbar}
      $showVerticalScrollbar={showVerticalScrollbar}
      $virtual={virtual}
    >
      {/* Sticky above toolbar - always visible */}
      {stickyToolbar && toolbarPosition === 'above' && showToolbar && (
        <StickyToolbar $position="above">{toolbar}</StickyToolbar>
      )}

      <TableSection $mode={mode}>
        {hideScrollbar ? (
          /* No scrollbars - render without SimpleBar */
          <>
            {!stickyToolbar && toolbarPosition === 'above' && showToolbar && (
              <DefaultToolbar>{toolbar}</DefaultToolbar>
            )}
            {children}
            {!stickyToolbar && toolbarPosition === 'below' && showToolbar && (
              <DefaultToolbar>{toolbar}</DefaultToolbar>
            )}
          </>
        ) : (
          /* Scrollbars enabled - use SimpleBar */
          <SimpleBarWrapper className="simplebar-wrapper" autoHide={true}>
            {!stickyToolbar && toolbarPosition === 'above' && showToolbar && (
              <DefaultToolbar>{toolbar}</DefaultToolbar>
            )}
            {children}
            {!stickyToolbar && toolbarPosition === 'below' && showToolbar && (
              <DefaultToolbar>{toolbar}</DefaultToolbar>
            )}
          </SimpleBarWrapper>
        )}
      </TableSection>

      {/* Sticky below toolbar - always visible */}
      {stickyToolbar && toolbarPosition === 'below' && showToolbar && (
        <StickyToolbar $position="below">{toolbar}</StickyToolbar>
      )}
    </MainContainer>
  );
};