import styled from "styled-components";
import { TableToolbarStyleType } from "comps/controls/styleControlConstants";

export const ToolbarStyleProvider = styled.div<{
 $toolbarStyle: TableToolbarStyleType;
}>`
 ${props => {
   console.log("ToolbarStyleProvider props:", props);
   console.log("Toolbar style object:", props.$toolbarStyle);
   return "";
 }}

 background: ${props => props.$toolbarStyle?.background};
 border: 1px solid ${props => props.$toolbarStyle?.border};
 margin: ${props => props.$toolbarStyle?.margin};
 color: ${props => props.$toolbarStyle?.toolbarText};

`;