import { default as Button } from "antd/es/button";
import { default as Pagination, PaginationProps } from "antd/es/pagination";
import { default as Popover } from "antd/es/popover";
import { ThemeDetail } from "api/commonSettingApi";
import { ColumnCompType } from "comps/comps/tableComp/column/tableColumnComp";
import { TableOnEventView } from "comps/comps/tableComp/tableTypes";
import { BoolControl } from "comps/controls/boolControl";
import { StringControl } from "comps/controls/codeControl";
import { dropdownControl } from "comps/controls/dropdownControl";
import { TableToolbarStyleType } from "comps/controls/styleControlConstants";
import { stateComp, withDefault } from "comps/generators";
import { genRandomKey } from "comps/utils/idGenerator";
import { ThemeContext } from "comps/utils/themeContext";
import { trans } from "i18n";
import _, { isNil } from "lodash";
import { changeChildAction, ConstructorToView } from "lowcoder-core";
import {
  AlignBottom,
  AlignClose,
  AlignTop,
  BluePlusIcon,
  CheckBox,
  CommonTextLabel,
  CustomSelect,
  DeleteIcon,
  DownloadIcon,
  FilterIcon,
  LinkButton,
  pageItemRender,
  RefreshIcon,
  TableColumnVisibilityIcon,
  SuspensionBox,
  TacoButton,
  TacoInput,
  ValueFromOption,
} from "lowcoder-design";
import React, { useContext, useEffect, useMemo, useRef, useState, memo, useCallback } from "react";
import styled, { css } from "styled-components";
import { JSONValue } from "util/jsonTypes";
import { ControlNodeCompBuilder } from "comps/generators/controlCompBuilder";
import { defaultTheme } from "@lowcoder-ee/constants/themeConstants";
import type { CheckboxChangeEvent } from 'antd/es/checkbox';

type ToolbarRowType = ConstructorToView<typeof TableToolbarComp>;

const SaveChangeButtons = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const getStyle = (
  style: TableToolbarStyleType,
  filtered: boolean,
  theme: ThemeDetail,
  position: ToolbarRowType["position"],
  fixedToolbar: boolean,
) => {
  return css`
    background: ${style.background};
    // Implement horizontal scrollbar and vertical page number selection is not blocked
    padding: 13px 12px;
    position: sticky;
    postion: -webkit-sticky;
    left: 0px !important;
    margin: ${style.margin} !important;
    z-index: 999;

    ${fixedToolbar && position === 'below' && `bottom: 0;`};
    ${fixedToolbar && position === 'above' && `top: 0;` };

    .toolbar-icons {
      .refresh,
      .download {
        cursor: pointer;

        * {
          ${style.toolbarText !== defaultTheme.textDark ? `stroke: ${style.toolbarText}` : null};
        }

        &:hover * {
          stroke: ${theme?.primary};
        }
      }

      .filter {
        cursor: pointer;

        * {
          ${filtered
            ? `stroke: ${defaultTheme.primary}`
            : style.toolbarText !== defaultTheme.textDark
            ? `stroke: ${style.toolbarText}`
            : null}
        }

        &:hover * {
          stroke: ${theme?.primary};
        }
      }

      .column-setting {
        width: 20px;
        cursor: pointer;

        * {
          ${style.toolbarText && style.toolbarText !== defaultTheme.textDark ? `fill: ${style.toolbarText}` : `fill: #8b8fa3`} 
        }

        &:hover * {
          fill: ${theme?.primary};
        }
      }
    }

    .ant-pagination-prev,
    .ant-pagination-next {
      path {
        ${style.toolbarText !== defaultTheme.textDark ? `fill: ${style.toolbarText}` : null};
      }

      svg:hover {
        path {
          fill: ${theme?.primary};
        }
      }
    }

    .ant-pagination {
      color: ${style.toolbarText};
    }

    .ant-pagination-item-active {
      border-color: ${style.border || theme?.primary};

      a {
        color: ${theme?.textDark};
      }
    }

    .ant-pagination-item:not(.ant-pagination-item-active) a {
      color: ${style.toolbarText};

      &:hover {
        color: ${theme?.primary};
      }
    }

    .ant-select:not(.ant-select-disabled):hover .ant-select-selector,
    .ant-select-focused:not(.ant-select-disabled).ant-select:not(.ant-select-customize-input)
      .ant-select-selector,
    .ant-pagination-options-quick-jumper input:hover,
    .ant-pagination-options-quick-jumper input:focus {
      border-color: ${style.border || theme?.primary};
    }
  `;
};

const ToolbarWrapper = styled.div<{
  $style: TableToolbarStyleType;
  $filtered: boolean;
  $theme: ThemeDetail;
  $position: ToolbarRowType["position"];
  $fixedToolbar: boolean;
}>`
  // overflow: auto;
  ${(props) => props.$style && getStyle(
    props.$style,
    props.$filtered,
    props.$theme,
    props.$position,
    props.$fixedToolbar,
  )}
`;

const ToolbarWrapper2 = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-width: max-content;
  height: 21px;
  width: 100%;
`;

const ToolbarIcons = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const StyledDeleteIcon = styled(DeleteIcon)<{ disabled: boolean }>`
  height: 16px;
  width: 16px;

  ${(props) =>
    props.disabled &&
    `
      cursor: not-allowed;
      g g {
      stroke: #D7D9E0;
    }
  `}
  :hover:not([disabled]) {
    cursor: pointer;

    g g {
      stroke: #315efb;
    }
  }
`;

const FilterItem = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const FilterViewContent = styled.div`
  min-height: 92px;
  overflow: auto;

  > div {
    margin-top: 4px;
  }
`;

const FilterViewBottom = styled.div`
  display: flex;
  align-items: end;
  height: 44px;
  justify-content: end;
  gap: 4px;

  > button {
    width: 76px;
    height: 28px;
  }
`;

const ColumnCheckItem = styled.div`
  display: flex;
  gap: 4px;
`;

const StyledCustomSelect = styled(CustomSelect)<{ $width: string }>`
  .ant-select {
  width: ${props => props.$width};
  }
`;

const CustomSelectionOptionInner = styled.div`
  width: 72px;
  font-size: 13px;
  line-height: 13px;
`;

const StyledTacoInput = styled(TacoInput)`
  width: 136px;
`;

const StyledLinkButton = styled(LinkButton)`
  margin-right: auto;
`;

const ColumnSettingContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const ColumnSettingFooter = styled.div`
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  height: 32px;
`;

const filterStackOptions = [
  {
    label: trans("table.and"),
    value: "and",
  },
  {
    label: trans("table.or"),
    value: "or",
  },
] as const;

const positionOptions = [
  {
    label: <AlignBottom />,
    value: "below",
  },
  {
    label: <AlignTop />,
    value: "above",
  },
  {
    label: <AlignClose />,
    value: "close",
  },
] as const;

const tableFilterOperators = [
  "contain",
  "notContain",
  "equal",
  "notEqual",
  "isEmpty",
  "isNotEmpty",
  "gt",
  "gte",
  "lt",
  "lte",
] as const;

const noValueOperators: TableFilterOperator[] = ["isEmpty", "isNotEmpty"];

type TableFilterOperator = typeof tableFilterOperators[number];
export const tableFilterOperatorMap: Record<
  TableFilterOperator,
  {
    label: string;
    filter: (filterValue: string, data: JSONValue | undefined) => boolean;
  }
> = {
  contain: {
    label: trans("table.contains"),
    filter: (filterValue, data) => {
      if (isNil(data)) {
        return false;
      }
      return data.toString().toLowerCase().includes(filterValue.toLowerCase());
    },
  },
  notContain: {
    label: trans("table.notContain"),
    filter: (filterValue, data) => {
      if (isNil(data)) {
        return true;
      }
      return !data.toString().toLowerCase().includes(filterValue.toLowerCase());
    },
  },
  equal: {
    label: trans("table.equals"),
    filter: (filterValue, data) => {
      if (isNil(data)) {
        return false;
      }
      return data.toString() === filterValue;
    },
  },
  notEqual: {
    label: trans("table.isNotEqual"),
    filter: (filterValue, data) => {
      if (isNil(data)) {
        return true;
      }
      return data.toString() !== filterValue;
    },
  },
  isEmpty: {
    label: trans("table.isEmpty"),
    filter: (filterValue, data) => {
      return data === "" || isNil(data);
    },
  },
  isNotEmpty: {
    label: trans("table.isNotEmpty"),
    filter: (filterValue, data) => {
      return data !== "" && !isNil(data);
    },
  },
  gt: {
    label: trans("table.greater"),
    filter: (value, data) => {
      return _.gt(data, value);
    },
  },
  gte: {
    label: trans("table.greaterThanOrEquals"),
    filter: (value, data) => {
      return _.gte(data, value);
    },
  },
  lt: {
    label: trans("table.lessThan"),
    filter: (value, data) => {
      return _.gt(value, data);
    },
  },
  lte: {
    label: trans("table.lessThanOrEquals"),
    filter: (value, data) => {
      return _.gte(value, data);
    },
  },
} as const;

const tableFilterOperatorOptions = tableFilterOperators.map((operator) => ({
  label: tableFilterOperatorMap[operator].label,
  value: operator,
}));

type TableFilterDataType = {
  columnKey: string;
  filterValue: string;
  operator: TableFilterOperator;
};

export type TableFilter = {
  stackType: ValueFromOption<typeof filterStackOptions>;
  filters: TableFilterDataType[];
};

const genFilterViewItem = (
  columnKey: string = "",
  filterValue: string = "",
  operator?: TableFilterOperator
) => {
  return {
    key: genRandomKey(),
    columnKey: columnKey,
    filterValue: filterValue,
    operator: operator,
  } as const;
};

type FilterItemType = ReturnType<typeof genFilterViewItem>;

function validFilterItem(filter: FilterItemType) {
  return (
    filter.columnKey &&
    filter.operator &&
    (filter.filterValue !== "" || noValueOperators.includes(filter.operator))
  );
}

function emptyFilterItem(filter: FilterItemType) {
  return !filter.columnKey && !filter.operator && filter.filterValue === "";
}

const FilterFooter = memo(function FilterFooter(props: {
  filterItems: FilterItemType[];
  setFilterItems: (items: FilterItemType[]) => void;
  setVisible: (v: boolean) => void;
}) {
  const { filterItems, setFilterItems, setVisible } = props;

  const handleAddFilter = useCallback(() => {
    setFilterItems(filterItems.concat(genFilterViewItem()));
  }, [filterItems, setFilterItems]);

  const handleClearFilters = useCallback(() => {
    setFilterItems([genFilterViewItem()]);
  }, [setFilterItems]);

  const handleClose = useCallback(() => {
    setVisible(false);
  }, [setVisible]);

  return (
    <FilterViewBottom>
      <StyledLinkButton
        text={trans("addItem")}
        icon={<BluePlusIcon />}
        onClick={handleAddFilter}
      />
      <TacoButton
        onClick={handleClearFilters}
        buttonType="delete"
      >
        {trans("table.clear")}
      </TacoButton>
      <TacoButton buttonType="primary" onClick={handleClose}>
        {trans("ok")}
      </TacoButton>
    </FilterViewBottom>
  );
});

FilterFooter.displayName = 'FilterFooter';

const FilterContent = memo(function FilterContent(props: {
  filterItems: FilterItemType[];
  columnKeyNames: Array<[string, string]>;
  stackTypeState: TableFilter["stackType"];
  stackTypeValue: TableFilter["stackType"] | undefined;
  updateFilter: (filterItem: FilterItemType) => void;
  handleStackTypeChange: (value: TableFilter["stackType"]) => void;
  removeFilter: (key: string) => void;
}) {
  const {
    filterItems,
    columnKeyNames,
    stackTypeState,
    stackTypeValue,
    updateFilter,
    handleStackTypeChange,
    removeFilter,
  } = props;

  const handleColumnKeyChange = useCallback((filter: FilterItemType, value: string) => {
    updateFilter({ ...filter, columnKey: value });
  }, [updateFilter]);

  const handleOperatorChange = useCallback((filter: FilterItemType, value: TableFilterOperator) => {
    updateFilter({ ...filter, operator: value });
  }, [updateFilter]);

  const handleFilterValueChange = useCallback((filter: FilterItemType, e: React.ChangeEvent<HTMLInputElement>) => {
    updateFilter({ ...filter, filterValue: e.target.value });
  }, [updateFilter]);

  return (
    <FilterViewContent>
      {filterItems &&
        filterItems.map((filter, index) => (
          <FilterItem key={filter.key}>
            {index === 0 && (
              <CommonTextLabel style={{ width: "65px" }}>
                {trans("table.filterRule")}
              </CommonTextLabel>
            )}
            {index >= 1 && (
              <StyledCustomSelect
                $width="65px"
                border
                defaultValue={stackTypeState}
                value={stackTypeValue}
                disabled={index > 1}
                onChange={handleStackTypeChange}
              >
                {filterStackOptions.map((item) => (
                  <CustomSelect.Option key={item.value} value={item.value}>
                    <CustomSelectionOptionInner>
                      {item.label}
                    </CustomSelectionOptionInner>
                  </CustomSelect.Option>
                ))}
              </StyledCustomSelect>
            )}
            <StyledCustomSelect
              $width="160px"
              options={columnKeyNames.map((c) => ({ label: c[1], value: c[0] }))}
              value={filter.columnKey}
              placeholder={trans("table.chooseColumnName")}
              allowClear
              onChange={(value) => handleColumnKeyChange(filter, value)}
            />
            <StyledCustomSelect
              $width="160px"
              defaultValue={filter.operator}
              placeholder={trans("table.chooseCondition")}
              allowClear
              options={tableFilterOperatorOptions}
              onChange={(value) => handleOperatorChange(filter, value)}
            />
            <StyledTacoInput
              disabled={filter.operator && noValueOperators.includes(filter.operator)}
              defaultValue={filter.filterValue}
              onChange={(e) => handleFilterValueChange(filter, e)}
            />
            <StyledDeleteIcon
              disabled={filterItems.length === 1 && emptyFilterItem(filterItems[0])}
              onClick={() => removeFilter(filter.key)}
            />
          </FilterItem>
        ))}
    </FilterViewContent>
  );
});

FilterContent.displayName = 'FilterContent';

const TableFilterView = memo(function TableFilterView(props: {
  columnKeyNames: Array<[string, string]>;
  tableFilter: TableFilter;
  onFilterChange: (filters: TableFilterDataType[], stackType: TableFilter["stackType"]) => void;
  setVisible: (v: boolean) => void;
}) {
  const { columnKeyNames, tableFilter, onFilterChange, setVisible } = props;
  const [stackTypeState, setStackTypeState] = useState(tableFilter.stackType);
  const [filterItems, setFilterItems] = useState<FilterItemType[]>(() => 
    tableFilter.filters.length > 0
      ? tableFilter.filters.map((f) => genFilterViewItem(f.columnKey, f.filterValue, f.operator))
      : [genFilterViewItem()]
  );
  const stackTypeValue = useMemo(() => filterStackOptions.find((f) => f.value === stackTypeState)?.value, [stackTypeState]);

  const updateFilter = useCallback((filterItem: FilterItemType) => {
    setFilterItems((items) =>
      items.map((item) => (item.key === filterItem.key ? filterItem : item))
    );
  }, []);

  const removeFilter = useCallback((key: string) => {
    if (filterItems.length === 1) {
      setFilterItems([genFilterViewItem()]);
    } else {
      setFilterItems((items) => items.filter((item) => item.key !== key));
    }
  }, [filterItems]);

  const handleStackTypeChange = useCallback((value: TableFilter["stackType"]) => {
    setStackTypeState(value);
  }, []);

  useEffect(() => {
    onFilterChange(
      filterItems
        .filter(validFilterItem)
        .map((f) => ({
          filterValue: f.filterValue,
          operator: f.operator!,
          columnKey: f.columnKey,
        })),
      stackTypeState
    );
  }, [stackTypeState, filterItems, onFilterChange]);

  return (
    <SuspensionBox
      title={trans("table.filter")}
      onClose={() => setVisible(false)}
      width={600}
      scrollable
      contentMaxHeight={292}
      content={
        <FilterContent
          filterItems={filterItems}
          columnKeyNames={columnKeyNames}
          stackTypeState={stackTypeState}
          stackTypeValue={stackTypeValue}
          updateFilter={updateFilter}
          handleStackTypeChange={handleStackTypeChange}
          removeFilter={removeFilter}
        />
      }
      footer={
        <FilterFooter
          filterItems={filterItems}
          setFilterItems={setFilterItems}
          setVisible={setVisible}
        />
      }
    />
  );
});

TableFilterView.displayName = 'TableFilterView';

const ColumnSetting = memo(function ColumnSetting(props: {
  columns: Array<ColumnCompType>;
  setVisible: (v: boolean) => void;
}) {
  const { columns, setVisible } = props;

  // Memoize checked states for all columns
  const checkedStates = useMemo(() => columns.map((c) => !c.getView().tempHide), [columns]);

  // Memoize allChecked calculation
  const allChecked = useMemo(() => checkedStates.every(Boolean), [checkedStates]);

  // Memoize checkViews rendering
  const checkViews = useMemo(() =>
    columns.map((c, idx) => {
      const columnView = c.getView();
      const checked = checkedStates[idx];
      return (
        <ColumnCheckItem key={columnView.dataIndex}>
          <CheckBox
            checked={checked}
            onChange={(e: CheckboxChangeEvent) => {
              c.children.tempHide.dispatchChangeValueAction(!e.target.checked);
            }}
          />
          <CommonTextLabel>{columnView.title || columnView.dataIndex}</CommonTextLabel>
        </ColumnCheckItem>
      );
    }),
    [columns, checkedStates]
  );

  // Memoize the 'Select All' onChange handler
  const handleSelectAll = useCallback((e: CheckboxChangeEvent) => {
    const checked = e.target.checked;
    columns.forEach((c) => {
      const tempHide = c.children.tempHide.getView();
      // fixme batch dispatch
      if (checked && tempHide) {
        c.children.tempHide.dispatchChangeValueAction(false);
      } else if (!checked && !tempHide) {
        c.children.tempHide.dispatchChangeValueAction(true);
      }
    });
  }, [columns]);

  return (
    <SuspensionBox
      title={trans("table.columnShows")}
      onClose={() => setVisible(false)}
      width={160}
      contentMaxHeight={150}
      scrollable
      content={<ColumnSettingContent>{checkViews}</ColumnSettingContent>}
      footer={
        <ColumnSettingFooter>
          <ColumnCheckItem>
            <CheckBox
              checked={allChecked}
              onChange={handleSelectAll}
            />
            <CommonTextLabel>{trans("table.selectAll")}</CommonTextLabel>
          </ColumnCheckItem>
        </ColumnSettingFooter>
      }
    />
  );
});

ColumnSetting.displayName = 'ColumnSetting';

const ToolbarPopover = memo(function ToolbarPopover(props: {
  visible: boolean;
  setVisible: (v: boolean) => void;
  Icon: React.FC<React.SVGProps<SVGSVGElement>>;
  iconClassName: string;
  content: JSX.Element;
}) {
  const { visible, setVisible, Icon, iconClassName, content } = props;

  const handleVisibleChange = useCallback((v: boolean) => {
    setVisible(v);
  }, [setVisible]);

  return (
    <Popover
      open={visible}
      onOpenChange={handleVisibleChange}
      content={content}
      trigger="click"
      placement="bottomRight"
      styles={{
        body: {
          padding: 0,
        },
      }}
    >
      <Icon className={iconClassName} />
    </Popover>
  );
});

ToolbarPopover.displayName = 'ToolbarPopover';

export const TableToolbar = memo(function TableToolbar(props: {
  toolbar: ToolbarRowType;
  $style: TableToolbarStyleType;
  pagination: PaginationProps;
  columns: Array<ColumnCompType>;
  onRefresh: () => void;
  onDownload: () => void;
  hasChange: boolean;
  onSaveChanges: () => void;
  onCancelChanges: () => void;
  onEvent: TableOnEventView;
}) {
  const {
    toolbar,
    $style,
    pagination,
    columns,
    onRefresh,
    onDownload,
    hasChange,
    onSaveChanges,
    onCancelChanges,
    onEvent,
  } = props;

  const theme = useContext(ThemeContext)?.theme;
  const filtered = useMemo(() => toolbar.filter.filters.length > 0, [toolbar.filter.filters.length]);
  const [filterVisible, setFilterVisible] = useState(false);
  const [columnSettingVisible, setColumnSettingVisible] = useState(false);
  const visibleColumns = useMemo(() => columns.filter((column) => !column.getView().hide), [columns]);

  const handleRefresh = useCallback(() => {
    onRefresh();
    onEvent("refresh");
  }, [onRefresh, onEvent]);

  const handleDownload = useCallback(() => {
    onDownload();
    onEvent("download");
  }, [onDownload, onEvent]);

  const handleSaveChanges = useCallback(() => {
    onSaveChanges();
    onEvent("saveChanges");
  }, [onSaveChanges, onEvent]);

  const handleCancelChanges = useCallback(() => {
    onCancelChanges();
    onEvent("cancelChanges");
  }, [onCancelChanges, onEvent]);

  const handleColumnFilterChange = useCallback((filters: TableFilterDataType[], stackType: TableFilter["stackType"]) => {
    if (
      !_.isEqual(filters, toolbar.filter.filters) ||
      stackType !== toolbar.filter.stackType
    ) {
      toolbar.onFilterChange(filters, stackType);
      onEvent("filterChange");
    }
  }, [toolbar, onEvent]);

  const columnKeyNameTuple = useMemo(() => {
    return visibleColumns.map((column) => {
      const c = column.getView();
      return [c.dataIndex, c.title || c.dataIndex] as [string, string];
    });
  }, [visibleColumns]);

  return (
    <ToolbarWrapper
      $style={$style}
      $filtered={filtered}
      $theme={theme || defaultTheme}
      $position={toolbar.position}
      $fixedToolbar={toolbar.fixedToolbar}
    >
      <ToolbarWrapper2>
        <ToolbarIcons className="toolbar-icons">
          {toolbar.showRefresh && (
            <RefreshIcon className="refresh" onClick={handleRefresh} />
          )}
          {toolbar.showFilter && (
            <ToolbarPopover
              visible={filterVisible}
              setVisible={setFilterVisible}
              Icon={FilterIcon}
              iconClassName="filter"
              content={
                <TableFilterView
                  columnKeyNames={columnKeyNameTuple}
                  tableFilter={toolbar.filter}
                  setVisible={setFilterVisible}
                  onFilterChange={handleColumnFilterChange}
                />
              }
            />
          )}
          {toolbar.showDownload && (
            <DownloadIcon className="download" onClick={handleDownload} />
          )}
          {toolbar.columnSetting && (
            <ToolbarPopover
              visible={columnSettingVisible}
              setVisible={setColumnSettingVisible}
              Icon={TableColumnVisibilityIcon}
              iconClassName="column-setting"
              content={<ColumnSetting columns={columns} setVisible={setColumnSettingVisible} />}
            />
          )}
        </ToolbarIcons>
        <Pagination
          size="small"
          {...pagination}
          itemRender={pageItemRender}
          onChange={(page, pageSize) => {
            pagination.onChange && pagination.onChange(page, pageSize);
            if (page !== pagination.current) {
              onEvent("pageChange");
            }
          }}
        />
        {hasChange && toolbar.showUpdateButtons && (
          <SaveChangeButtons>
            <TacoButton onClick={handleCancelChanges}>{trans("cancel")}</TacoButton>
            <TacoButton buttonType="primary" onClick={handleSaveChanges}>
              {trans("table.saveChanges")}
            </TacoButton>
          </SaveChangeButtons>
        )}
      </ToolbarWrapper2>
    </ToolbarWrapper>
  );
});

TableToolbar.displayName = 'TableToolbar';

export const TableToolbarComp = (function () {
  const childrenMap = {
    showRefresh: BoolControl,
    showDownload: BoolControl,
    showFilter: BoolControl,
    columnSetting: BoolControl,
    fixedToolbar: BoolControl,
    // searchText: StringControl,
    filter: stateComp<TableFilter>({ stackType: "and", filters: [] }),
    position: dropdownControl(positionOptions, "below"),
    columnSeparator: withDefault(StringControl, ','),
    showUpdateButtons: withDefault(BoolControl, true),
  };

  return new ControlNodeCompBuilder(childrenMap, (props, dispatch) => {
    return {
      ...props,
      onFilterChange: (filters: TableFilterDataType[], stackType: TableFilter["stackType"]) => {
        dispatch(
          changeChildAction(
            "filter",
            {
              stackType: stackType,
              filters: filters,
            },
            false
          )
        );
      },
    };
  })
    .setPropertyViewFn((children) => [
      children.position.propertyView({ label: trans("table.position"), radioButton: true }),
      children.fixedToolbar.propertyView({
        label: trans("table.fixedToolbar"),
        tooltip: trans("table.fixedToolbarTooltip")
      }),
      children.showUpdateButtons.propertyView({ label: trans("table.showUpdateButtons")}),
      children.showFilter.propertyView({ label: trans("table.showFilter") }),
      children.showRefresh.propertyView({ label: trans("table.showRefresh") }),
      children.showDownload.propertyView({ label: trans("table.showDownload") }),
      children.showDownload.getView() && children.columnSeparator.propertyView({
        label: trans("table.columnSeparator"),
        tooltip: trans("table.columnSeparatorTooltip"),
      }),
      children.columnSetting.propertyView({ label: trans("table.columnSetting") }),
      /* children.searchText.propertyView({
        label: trans("table.searchText"),
        tooltip: trans("table.searchTextTooltip"),
        placeholder: "{{input1.value}}",
      }), */
    ])
    .build();
})();
