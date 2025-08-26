import styled from "styled-components";

export const ScrollbarStyleProvider = styled.div<{
  $showVerticalScrollbar: boolean;
  $showHorizontalScrollbar: boolean;
}>`
  /* Debug console logs */
  ${props => {
    console.log('ScrollbarStyleProvider received:', {
      showVerticalScrollbar: props.$showVerticalScrollbar,
      showHorizontalScrollbar: props.$showHorizontalScrollbar
    });
    return '';
  }}

  
  ${props => !props.$showHorizontalScrollbar && `
    /* Target horizontal scrollbars - focus on .ant-table-body since it's common to all modes */
    .ant-table-body::-webkit-scrollbar:horizontal,
    .ant-table-body::-webkit-scrollbar {
      display: none;
    }
    .ant-table-content::-webkit-scrollbar:horizontal,
    .ant-table-content::-webkit-scrollbar {
      display: none;
    }
    
    .ant-table-body,
    .ant-table-content {
      scrollbar-width: none; /* Firefox */
      -ms-overflow-style: none; /* IE */
    }
  `}
  
  /* Hide ANTD's virtual scrollbars */
  ${props => !props.$showHorizontalScrollbar && `
    .ant-table-tbody-virtual-scrollbar-horizontal {
      display: none !important;
      height: 0 !important;
    }
  `}
  
  ${props => !props.$showVerticalScrollbar && `
    .ant-table-tbody-virtual-scrollbar {
      display: none !important;
      width: 0 !important;
    }
  `}
`;