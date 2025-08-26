import styled from "styled-components";

export const ScrollbarStyleProvider = styled.div<{
  $showVerticalScrollbar: boolean;
  $showHorizontalScrollbar: boolean;
}>`
  ${props => !props.$showVerticalScrollbar && `
    .ant-table-body::-webkit-scrollbar:vertical {
      display: none;
    }
    .ant-table-body {
      scrollbar-width: none;
    }
  `}
  
  ${props => !props.$showHorizontalScrollbar && `
    .ant-table-body::-webkit-scrollbar:horizontal {
      display: none;
    }
  `}
  
  /* Hide ANTD's virtual scrollbars */
  .ant-table-tbody-virtual-scrollbar-horizontal {
    display: none !important;
    height: 0 !important;
  }
  
  .ant-table-tbody-virtual-scrollbar {
    pointer-events: none !important;
  }
`;