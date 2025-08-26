import styled from "styled-components";

export const TableContainer = styled.div<{ $style: any }>`
  width: 100%;
  height: 100%;
  position: relative;
  
  /* Base table container styles */
  background: ${props => props.$style?.background || 'transparent'};
  border: ${props => props.$style?.border || 'none'};
  border-radius: ${props => props.$style?.borderRadius || '0'};
  
  /* Custom CSS injection */
  ${props => props.$style?.customCSS || ''}
`;