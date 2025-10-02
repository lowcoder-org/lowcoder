import styled from "styled-components";

export const CellStyleProvider = styled.div<{
  $rowStyle: any;
  $columnsStyle: any;
}>`
  .ant-table-tbody > tr > td {
    background: ${props => props.$rowStyle?.background || '#ffffff'};
    color: ${props => props.$rowStyle?.color || 'rgba(0, 0, 0, 0.85)'};
    border-color: ${props => props.$rowStyle?.borderColor || '#f0f0f0'};
    /* padding: ${props => props.$rowStyle?.padding || '12px 16px'}; */
    ${props => props.$rowStyle?.customCSS || ''}
  }
  
  .ant-table-tbody > tr > td {
    ${props => props.$columnsStyle?.textAlign && `text-align: ${props.$columnsStyle.textAlign};`}
    ${props => props.$columnsStyle?.customCSS || ''}
  }
`;