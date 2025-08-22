import { css } from "styled-components";
import { TableToolbarStyleType } from "comps/controls/styleControlConstants";

export const getTableToolbarStyles = (
  toolbarStyle: TableToolbarStyleType
) => css`
  /* Toolbar container styles */
  .table-toolbar {
    background: ${toolbarStyle.background};
    border: 1px solid ${toolbarStyle.border};
    margin: ${toolbarStyle.margin};
    
    /* Toolbar text styles */
    color: ${toolbarStyle.toolbarText};
    
    /* Toolbar buttons and controls */
    .ant-btn {
      color: ${toolbarStyle.toolbarText};
      border-color: ${toolbarStyle.border};
      background: transparent;
      
      &:hover {
        color: ${toolbarStyle.toolbarText};
        border-color: ${toolbarStyle.border};
        background: rgba(0, 0, 0, 0.04);
      }
      
      &:focus {
        color: ${toolbarStyle.toolbarText};
        border-color: ${toolbarStyle.border};
      }
    }
    
    /* Pagination styles */
    .ant-pagination {
      color: ${toolbarStyle.toolbarText};
      
      .ant-pagination-item a {
        color: ${toolbarStyle.toolbarText};
      }
      
      .ant-pagination-item:hover a {
        color: ${toolbarStyle.toolbarText};
      }
      
      .ant-pagination-prev .ant-pagination-item-link,
      .ant-pagination-next .ant-pagination-item-link {
        color: ${toolbarStyle.toolbarText};
        border-color: ${toolbarStyle.border};
      }
      
      .ant-pagination-prev:hover .ant-pagination-item-link,
      .ant-pagination-next:hover .ant-pagination-item-link {
        color: ${toolbarStyle.toolbarText};
        border-color: ${toolbarStyle.border};
      }
    }
    
    /* Search and filter inputs */
    .ant-input {
      color: ${toolbarStyle.toolbarText};
      background: transparent;
      border-color: ${toolbarStyle.border};
      
      &::placeholder {
        color: ${toolbarStyle.toolbarText};
        opacity: 0.6;
      }
      
      &:hover {
        border-color: ${toolbarStyle.border};
      }
      
      &:focus {
        border-color: ${toolbarStyle.border};
        box-shadow: 0 0 0 2px rgba(0, 0, 0, 0.1);
      }
    }
    
    /* Dropdown styles */
    .ant-select {
      color: ${toolbarStyle.toolbarText};
      
      .ant-select-selector {
        background: transparent !important;
        border-color: ${toolbarStyle.border} !important;
        color: ${toolbarStyle.toolbarText} !important;
      }
      
      .ant-select-arrow {
        color: ${toolbarStyle.toolbarText};
      }
      
      &:hover .ant-select-selector {
        border-color: ${toolbarStyle.border} !important;
      }
    }
    
    /* Icons */
    .anticon {
      color: ${toolbarStyle.toolbarText};
    }
    
    /* Dividers */
    .ant-divider {
      border-color: ${toolbarStyle.border};
    }
  }
`; 