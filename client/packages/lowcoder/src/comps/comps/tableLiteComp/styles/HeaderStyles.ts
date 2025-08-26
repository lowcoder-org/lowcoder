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
    background: ${props => props.$headerStyle?.headerBackground};
    color: ${props => props.$headerStyle?.headerText};
    border-color: ${props => props.$headerStyle?.border};
    border-width: ${props => props.$headerStyle?.borderWidth};
    padding: ${props => props.$headerStyle?.padding};
    margin: ${props => props.$headerStyle?.margin};
    font-size: ${props => props.$headerStyle?.textSize};
    
    ${props => props.$headerStyle?.customCSS || ''}
  }
  
  ${props => props.$isSticky && `
    &&& .ant-table-thead > tr > th {
      position: sticky;
      top: 0;
      z-index: 3;
    }
  `}
`;