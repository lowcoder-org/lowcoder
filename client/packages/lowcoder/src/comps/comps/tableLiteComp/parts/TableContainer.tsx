// parts/TableContainer.tsx
import React from 'react';
import styled from 'styled-components';

const MainContainer = styled.div<{
  $mode: 'AUTO' | 'FIXED';
}>`
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
  position: relative;
  border: 4px solid red;
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
  overflow: ${props => props.$mode === 'FIXED' ? 'auto' : 'visible'};
  border: 4px solid blue;
`;

interface TableContainerProps {
  mode: 'AUTO' | 'FIXED';
  toolbarPosition: 'above' | 'below' | 'close';
  stickyToolbar: boolean;
  showToolbar: boolean;
  toolbar: React.ReactNode;
  children: React.ReactNode;
  containerRef?: React.RefObject<HTMLDivElement>;
}

export const TableContainer: React.FC<TableContainerProps> = ({
  mode,
  toolbarPosition,
  stickyToolbar,
  showToolbar,
  toolbar,
  children,
  containerRef
}) => {
 

  return (
    <MainContainer $mode={mode} ref={containerRef}>
    <TableSection $mode={mode}>
      {showToolbar && toolbarPosition === 'above' && (
        stickyToolbar
          ? <StickyToolbar $position="above">{toolbar}</StickyToolbar>
          : <DefaultToolbar>{toolbar}</DefaultToolbar>
      )}
      {children}
      {showToolbar && toolbarPosition === 'below' && (
        stickyToolbar
          ? <StickyToolbar $position="below">{toolbar}</StickyToolbar>
          : <DefaultToolbar>{toolbar}</DefaultToolbar>
      )}
    </TableSection>
  </MainContainer>
  );
};