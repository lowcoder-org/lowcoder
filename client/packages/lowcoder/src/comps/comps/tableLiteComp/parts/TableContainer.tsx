// parts/TableContainer.tsx
import React from 'react';
import styled from 'styled-components';
import SimpleBar from 'simplebar-react';
import 'simplebar-react/dist/simplebar.min.css';

const MainContainer = styled.div<{
  $mode: 'AUTO' | 'FIXED';
}>`
  display: flex;
  flex-direction: column;
  height: 100%;
  position: relative;
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
`;

const DefaultToolbar = styled.div`
  flex-shrink: 0;
`;

const TableSection = styled.div<{
  $mode: 'AUTO' | 'FIXED';
}>`

  flex: 1 1 auto;
  min-height: 0;
  border: 4px solid blue;
  overflow: hidden;
`;


const SimpleBarWrapper = styled(SimpleBar)<{
  $showVertical: boolean;
  $showHorizontal: boolean;
}>`
  height: 100%;
  border: 4px solid red;
  
  ${props => !props.$showVertical && `
    .simplebar-scrollbar[data-direction="vertical"] {
      opacity: 0 !important;
      pointer-events: none;
    }
  `}
  
  ${props => !props.$showHorizontal && `
    .simplebar-scrollbar[data-direction="horizontal"] {
      opacity: 0 !important;
      pointer-events: none;
    }
  `}
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
 

  return (
    <MainContainer $mode={mode} ref={containerRef}>
      {stickyToolbar && toolbarPosition === 'above' && (
        <StickyToolbar $position="above">{toolbar}</StickyToolbar>
      )}
    <TableSection $mode={mode}>
      
      <SimpleBarWrapper
        $showVertical={showVerticalScrollbar}
        $showHorizontal={showHorizontalScrollbar}
      >
        {!stickyToolbar && toolbarPosition === 'above' && (
        <DefaultToolbar>{toolbar}</DefaultToolbar>
      )}
        {children}
        {!stickyToolbar && toolbarPosition === 'below' && (
        <DefaultToolbar>{toolbar}</DefaultToolbar>
      )}
      </SimpleBarWrapper>
      
    </TableSection>
    {stickyToolbar && toolbarPosition === 'below' && (
      <StickyToolbar $position="below">{toolbar}</StickyToolbar>
    )}
  </MainContainer>
  );
};