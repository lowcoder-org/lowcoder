import styled from "styled-components";

export const RowStyleProvider = styled.div<{
  $rowStyle: any;
  $showHRowGridBorder: boolean;
}>`
  /* Row container styling */
  .ant-table-tbody > tr {
    background: ${props => props.$rowStyle?.background || '#ffffff'};
    border-color: ${props => props.$rowStyle?.borderColor || '#f0f0f0'};
    height: ${props => props.$rowStyle?.height || 'auto'};
    min-height: ${props => props.$rowStyle?.minHeight || 'auto'};
  }
  
  /* Row hover effects */
  .ant-table-tbody > tr:hover {
    background: ${props => props.$rowStyle?.hoverBackground || '#f5f5f5'};
  }
  
  /* Alternating row colors */
  .ant-table-tbody > tr:nth-child(even) {
    background: ${props => props.$rowStyle?.alternatingBackground || props.$rowStyle?.background || '#ffffff'};
  }
  
  /* Selected row styling */
  .ant-table-tbody > tr.ant-table-row-selected {
    background: ${props => props.$rowStyle?.selectedBackground || '#e6f7ff'};
  }
  
  /* Horizontal grid borders */
  ${props => props.$showHRowGridBorder && `
    .ant-table-tbody > tr > td {
      border-bottom: 1px solid ${props.$rowStyle?.borderColor || '#f0f0f0'};
    }
  `}
  
  /* Custom row CSS */
  ${props => props.$rowStyle?.customCSS || ''}
`;