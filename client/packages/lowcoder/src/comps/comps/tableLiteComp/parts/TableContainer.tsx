// parts/TableContainer.tsx
import React from 'react';
import styled from 'styled-components';

const MainContainer = styled.div<{
  $mode: 'AUTO' | 'FIXED';
  $height?: number;
}>`
  display: flex;
  flex-direction: column;
  height: ${props => props.$mode === 'FIXED' && props.$height ? `${props.$height}px` : '100%'};
  overflow: hidden;
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
  flex: 1;
  min-height: 0;
  overflow: ${props => props.$mode === 'FIXED' ? 'auto' : 'visible'};
`;

interface TableContainerProps {
  mode: 'AUTO' | 'FIXED';
  containerHeight?: number;
  toolbarPosition: 'above' | 'below' | 'close';
  stickyToolbar: boolean;
  showToolbar: boolean;
  toolbar: React.ReactNode;
  children: React.ReactNode;
  containerRef?: React.RefObject<HTMLDivElement>;
}

export const TableContainer: React.FC<TableContainerProps> = ({
  mode,
  containerHeight,
  toolbarPosition,
  stickyToolbar,
  showToolbar,
  toolbar,
  children,
  containerRef
}) => {
  const ToolbarComponent = stickyToolbar ? StickyToolbar : DefaultToolbar;
  
  return (
    <MainContainer $mode={mode} $height={containerHeight} ref={containerRef}>
      {/* Above toolbar */}
      {showToolbar && toolbarPosition === 'above' && (
        <ToolbarComponent $position="above">
          {toolbar}
        </ToolbarComponent>
      )}
      
      {/* Table content */}
      <TableSection $mode={mode}>
        {children}
      </TableSection>
      
      {/* Below toolbar */}
      {showToolbar && toolbarPosition === 'below' && (
        <ToolbarComponent $position="below">
          {toolbar}
        </ToolbarComponent>
      )}
    </MainContainer>
  );
};