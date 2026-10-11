import { DispatchType } from "lowcoder-core";
import { ControlPlacement } from "../../controls/controlParams";
import React, { useContext, useState, useEffect } from "react";
import { Dropdown, OptionsType } from "lowcoder-design";
import { isEmpty, values } from "lodash";
import { useSelector } from "react-redux";
import { getDataSourceStructures } from "../../../redux/selectors/datasourceSelectors";
import { changeValueAction } from "lowcoder-core";
import { QueryContext } from "../../../util/context/QueryContext";

const COLUMN_SORT_KEY = "lowcoder_column_sort";

export const ColumnNameDropdown = (props: {
  table: string;
  value: string;
  dispatch: DispatchType;
  label?: string;
  placement?: ControlPlacement;
  changeEditDSL?: boolean;
}) => {
  const context = useContext(QueryContext);
  const datasourceId = context?.datasourceId ?? "";
  
  // Simple sort preference from localStorage
  const [sortColumns, setSortColumns] = useState(() => {
    return localStorage.getItem(COLUMN_SORT_KEY) === 'true';
  });

  useEffect(() => {
    localStorage.setItem(COLUMN_SORT_KEY, sortColumns.toString());
  }, [sortColumns]);

  const rawColumns = values(useSelector(getDataSourceStructures)[datasourceId])
    ?.find((t) => t.name === props.table)
    ?.columns.map((column) => ({
      label: column.name,
      value: column.name,
    })) ?? [];

  const columns: OptionsType = sortColumns 
    ? [...rawColumns].sort((a, b) => a.label.localeCompare(b.label))
    : rawColumns;

  return (
    <Dropdown
      options={columns}
      placeholder={"column"}
      value={isEmpty(props.value) ? undefined : props.value}
      onChange={(value) => props.dispatch(changeValueAction(value, props.changeEditDSL ?? true))}
      allowClear={true}
      placement={props.placement}
      label={props.label}
      showSearch={true}
      preNode={() => (
        <div style={{ padding: '4px 8px', borderBottom: '1px solid #f0f0f0' }}>
          <label style={{ fontSize: '12px', cursor: 'pointer', userSelect: 'none' }}>
            <input
              type="checkbox"
              checked={sortColumns}
              onChange={(e) => setSortColumns(e.target.checked)}
              style={{ marginRight: '6px' }}
            />
            Sort A-Z
          </label>
        </div>
      )}
    />
  );
};
