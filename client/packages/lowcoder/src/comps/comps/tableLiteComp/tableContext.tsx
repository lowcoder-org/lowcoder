import React from "react";
import _ from "lodash";

export const TableRowContext = React.createContext<{
  hover: boolean;
  selected: boolean;
}>({ hover: false, selected: false });
