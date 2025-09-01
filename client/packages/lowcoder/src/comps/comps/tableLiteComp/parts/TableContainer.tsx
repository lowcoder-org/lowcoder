// parts/TableContainer.tsx
import React from 'react';
import styled from 'styled-components';
import SimpleBar from 'simplebar-react';
import 'simplebar-react/dist/simplebar.min.css';

const MainContainer = styled.div<{
  $mode: 'AUTO' | 'FIXED';
  $showHorizontalScrollbar: boolean;
  $showVerticalScrollbar: boolean;
}>`
  display: flex;
  flex-direction: column;
  height: 100%;
  position: relative;

  /* Critical CSS controls for SimpleBar */
 

    ${props => !props.$showHorizontalScrollbar && `
      div.simplebar-horizontal {
        visibility: hidden !important;
      }  
    `}
    
    ${props => !props.$showVerticalScrollbar && `
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
  flex: 1 1 auto;
  min-height: 0;
  min-width: 0;
`;

const SimpleBarWrapper = styled(SimpleBar)`
  height: 100%;
  overflow: auto !important;


  /* CRITICAL: Transfer scroll control from Ant Design to SimpleBar */
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
  showHorizontalScrollbar
}) => {
  const hideScrollbar = !showHorizontalScrollbar && !showVerticalScrollbar;

  return (
    <MainContainer 
      $mode={mode} 
      ref={containerRef}
      $showHorizontalScrollbar={showHorizontalScrollbar}
      $showVerticalScrollbar={showVerticalScrollbar}
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
          <SimpleBarWrapper className="simplebar-wrapper">
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