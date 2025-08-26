import styled from "styled-components";

export const TableContainer = styled.div<{
  $style: any;
}>`
  /* SMALL SIZE */
  .ant-table-small {
    /* Body cell padding */
    .ant-table-tbody > tr > td {
      padding: 8px 8px !important;
      font-size: 12px; /* Smaller font */
      line-height: 1.4;
    }
    
    /* Header cell padding and font */
    .ant-table-thead > tr > th {
      padding: 8px 8px !important;
      font-size: 12px;
    }
    
    /* Row height adjustments */
    .ant-table-tbody > tr {
      height: auto;
      min-height: 32px; /* Smaller minimum row height */
    }
  }
  
  /* MIDDLE SIZE */
  .ant-table-middle {
    /* Body cell padding */
    .ant-table-tbody > tr > td {
      padding: 12px 12px !important;
      font-size: 14px;
      line-height: 1.5;
    }
    
    /* Header cell padding and font */
    .ant-table-thead > tr > th {
      padding: 12px 12px !important;
      font-size: 14px;
    }
    
    /* Row height adjustments */
    .ant-table-tbody > tr {
      min-height: 40px;
    }
  }
  
  /* DEFAULT/LARGE SIZE */
  .ant-table:not(.ant-table-small):not(.ant-table-middle) {
    /* Body cell padding */
    .ant-table-tbody > tr > td {
      padding: 16px 16px !important;
      font-size: 14px;
      line-height: 1.6;
    }
    
    /* Header cell padding and font */
    .ant-table-thead > tr > th {
      padding: 16px 16px !important;
      font-size: 14px;
      font-weight: 600;
    }
    
    /* Row height adjustments */
    .ant-table-tbody > tr {
      min-height: 48px;
    }
  }
  
  /* Your existing custom styles */
  ${props => props.$style?.customCSS || ''}
`;