import React, { useCallback, useState } from "react";
import { TableRowContext } from "./tableContext";

export const TableRowView = React.forwardRef<HTMLTableRowElement, any>((props, ref) => {
  const [hover, setHover] = useState(false);
  const [selected, setSelected] = useState(false);

  // Memoize event handlers
  const handleMouseEnter = useCallback(() => setHover(true), []);
  const handleMouseLeave = useCallback(() => setHover(false), []);
  const handleFocus = useCallback(() => setSelected(true), []);
  const handleBlur = useCallback(() => setSelected(false), []);

  return (
    <TableRowContext.Provider value={{ hover, selected }}>
      <tr
        ref={ref}
        {...props}
        tabIndex={-1}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onFocus={handleFocus}
        onBlur={handleBlur}
      />
    </TableRowContext.Provider>
  );
});
