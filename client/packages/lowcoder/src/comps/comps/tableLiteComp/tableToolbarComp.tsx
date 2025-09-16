import { default as Pagination, PaginationProps } from "antd/es/pagination";
import { default as Popover } from "antd/es/popover";
import { ColumnCompType } from "comps/comps/tableLiteComp/column/tableColumnComp";
import { TableOnEventView } from "comps/comps/tableLiteComp/tableTypes";
import { BoolControl } from "comps/controls/boolControl";
import { StringControl } from "comps/controls/codeControl";
import { dropdownControl } from "comps/controls/dropdownControl";
import { withDefault } from "comps/generators";
import { trans } from "i18n";
import { ConstructorToView } from "lowcoder-core";
import {
  AlignBottom,
  AlignClose,
  AlignTop,
  CheckBox,
  CommonTextLabel,
  DownloadIcon,
  pageItemRender,
  RefreshIcon,
  TableColumnVisibilityIcon,
  SuspensionBox,
} from "lowcoder-design";
import React, { useMemo, useState, memo, useCallback } from "react";
import { ToolbarContainer, ToolbarRow, ToolbarIcons } from "./styles/toolbar.styles";
import { ControlNodeCompBuilder } from "comps/generators/controlCompBuilder";
import type { CheckboxChangeEvent } from 'antd/es/checkbox';

type ToolbarRowType = ConstructorToView<typeof TableToolbarComp>;

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
        <div key={columnView.dataIndex}>
          <CheckBox
            checked={checked}
            onChange={(e: CheckboxChangeEvent) => {
              c.children.tempHide.dispatchChangeValueAction(!e.target.checked);
            }}
          />
          <CommonTextLabel>{columnView.title || columnView.dataIndex}</CommonTextLabel>
        </div>
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
      content={<div>{checkViews}</div>}
      footer={
        <div>
          <div>
            <CheckBox
              checked={allChecked}
              onChange={handleSelectAll}
            />
            <CommonTextLabel>{trans("table.selectAll")}</CommonTextLabel>
          </div>
        </div>
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
  pagination: PaginationProps;
  columns: Array<ColumnCompType>;
  onRefresh: () => void;
  onDownload: () => void;
  onEvent: TableOnEventView;
}) {
  const {
    toolbar,
    pagination,
    columns,
    onRefresh,
    onDownload,
    onEvent,
  } = props;
  const [columnSettingVisible, setColumnSettingVisible] = useState(false);


  const handleRefresh = useCallback(() => {
    onRefresh();
    onEvent("refresh");
  }, [onRefresh, onEvent]);

  const handleDownload = useCallback(() => {
    onDownload();
    onEvent("download");
  }, [onDownload, onEvent]);

  return (
    <ToolbarContainer>
      <ToolbarRow>
        <ToolbarIcons>
          {toolbar.showRefresh && (
            <RefreshIcon className="refresh" onClick={handleRefresh} />
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
      </ToolbarRow>
    </ToolbarContainer>
  );
});

TableToolbar.displayName = 'TableToolbar';

export const TableToolbarComp = (function () {
  const childrenMap = {
    showRefresh: BoolControl,
    showDownload: BoolControl,
    columnSetting: BoolControl,
    fixedToolbar: BoolControl,
    // searchText: StringControl,
    position: dropdownControl(positionOptions, "below"),
    columnSeparator: withDefault(StringControl, ','),
  };

  return new ControlNodeCompBuilder(childrenMap, (props, dispatch) => {
    return {
      ...props,
     
    };
  })
    .setPropertyViewFn((children) => [
      children.position.propertyView({ label: trans("table.position"), radioButton: true }),
      children.fixedToolbar.propertyView({
        label: trans("table.fixedToolbar"),
        tooltip: trans("table.fixedToolbarTooltip")
      }),
      children.showRefresh.propertyView({ label: trans("table.showRefresh") }),
      children.showDownload.propertyView({ label: trans("table.showDownload") }),
      children.showDownload.getView() && children.columnSeparator.propertyView({
        label: trans("table.columnSeparator"),
        tooltip: trans("table.columnSeparatorTooltip"),
      }),
      children.columnSetting.propertyView({ label: trans("table.columnSetting") }),
    ])
    .build();
})();
