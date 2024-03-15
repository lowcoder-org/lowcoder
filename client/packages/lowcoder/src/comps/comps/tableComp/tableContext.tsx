import React from "react";
import { noop } from "lodash";

export const TableRowContext = React.createContext<{
  hover: boolean;
  selected: boolean;
}>({ hover: false, selected: false });

export const TableCellContext = React.createContext<{
  isEditing: boolean;
  setIsEditing: (e: boolean) => void;
}>({ isEditing: false, setIsEditing: noop });
