import styled from "styled-components";

export const HeaderStyleProvider = styled.div<{
  $headerStyle: any;
  $isSticky: boolean;
  $isHidden: boolean;
}>`
  ${props => props.$isHidden && `
    .ant-table-thead {
      display: none;
    }
  `}
  
  .ant-table-thead > tr > th {
    background: ${props => props.$headerStyle?.background || '#fafafa'};
    color: ${props => props.$headerStyle?.color || 'rgba(0, 0, 0, 0.85)'};
    border-color: ${props => props.$headerStyle?.borderColor || '#f0f0f0'};
    padding: ${props => props.$headerStyle?.padding || '16px'};
    font-weight: ${props => props.$headerStyle?.fontWeight || '600'};
    ${props => props.$headerStyle?.customCSS || ''}
  }
  
  ${props => props.$isSticky && `
    .ant-table-thead > tr > th {
      position: sticky;
      top: 0;
      z-index: 3;
    }
  `}
`;