import { default as Badge } from "antd/es/badge";
import {
  ColumnTypeCompBuilder,
  ColumnTypeViewFn,
} from "comps/comps/tableComp/column/columnTypeCompBuilder";
import { trans } from "i18n";
import { StringControl, stringUnionControl } from "comps/controls/codeControl";
import { DropdownStyled, Wrapper } from "./columnTagsComp";
import React, { ReactNode, useContext, useState, useCallback, useRef, useEffect, useMemo } from "react";
import { StatusContext } from "components/table/EditableCell";
import { CustomSelect, PackUpIcon, ScrollBar } from "lowcoder-design";
import { PresetStatusColorType } from "antd/es/_util/colors";

export const ColumnValueTooltip = trans("table.columnValueTooltip");

export const BadgeStatusOptions = [
  "none",
  "success",
  "error",
  "default",
  "warning",
  "processing",
] as const;

export type StatusType = PresetStatusColorType | "none";

const childrenMap = {
  text: StringControl,
  status: stringUnionControl(BadgeStatusOptions, "none"),
};

const getBaseValue: ColumnTypeViewFn<
  typeof childrenMap,
  { value: string; status: StatusType },
  { value: string; status: StatusType }
> = (props) => ({
  value: props.text,
  status: props.status,
});

type StatusEditPropsType = {
  value: { value: string; status: StatusType };
  onChange: (value: { value: string; status: StatusType }) => void;
  onChangeEnd: () => void;
};

const StatusEdit = React.memo((props: StatusEditPropsType) => {
  const defaultStatus = useContext(StatusContext);
  const [status, setStatus] = useState<Array<{ text: string; status: StatusType }>>(() => {
    const result: Array<{ text: string; status: StatusType }> = [];
    defaultStatus.forEach((item) => {
      if (item.text.includes(",")) {
        item.text.split(",").forEach((tag) => result.push({ text: tag, status: "none" }));
      }
      result.push({ text: item.text, status: item.status });
    });
    return result;
  });
  const [open, setOpen] = useState(false);
  const mountedRef = useRef(true);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      setStatus([]);
      setOpen(false);
    };
  }, []);

  // Update status when defaultStatus changes
  useEffect(() => {
    if (!mountedRef.current) return;
    
    const result: Array<{ text: string; status: StatusType }> = [];
    defaultStatus.forEach((item) => {
      if (item.text.includes(",")) {
        item.text.split(",").forEach((tag) => result.push({ text: tag, status: "none" }));
      }
      result.push({ text: item.text, status: item.status });
    });
    setStatus(result);
  }, [defaultStatus]);

  const handleSearch = useCallback((value: string) => {
    if (!mountedRef.current) return;
    
    if (defaultStatus.findIndex((item) => item.text.includes(value)) < 0) {
      setStatus([...defaultStatus, { text: value, status: "none" }]);
    } else {
      setStatus(defaultStatus);
    }
    props.onChange({
      value,
      status: status.find((item) => item.text === value)?.status || "none",
    });
  }, [defaultStatus, status, props.onChange]);

  const handleChange = useCallback((value: string) => {
    if (!mountedRef.current) return;
    props.onChange({
      value,
      status: status.find((item) => item.text === value)?.status || "none",
    });
    setOpen(false);
  }, [status, props.onChange]);

  const handleBlur = useCallback(() => {
    if (!mountedRef.current) return;
    props.onChangeEnd();
    setOpen(false);
  }, [props.onChangeEnd]);

  const handleFocus = useCallback(() => {
    if (!mountedRef.current) return;
    setOpen(true);
  }, []);

  const handleClick = useCallback(() => {
    if (!mountedRef.current) return;
    setOpen(!open);
  }, [open]);

  const memoizedOptions = useMemo(() => 
    BadgeStatusOptions.map((value, index) => (
      <CustomSelect.Option value={value} key={index}>
        {value === "none" ? value : <Badge status={value} text={value} />}
      </CustomSelect.Option>
    )),
    []
  );

  return (
    <Wrapper>
      <CustomSelect
        autoFocus
        defaultOpen
        variant="borderless"
        optionLabelProp="children"
        open={open}
        defaultValue={props.value.value}
        style={{ width: "100%" }}
        suffixIcon={<PackUpIcon />}
        showSearch
        onSearch={handleSearch}
        onChange={handleChange}
        popupRender={(originNode: ReactNode) => (
          <DropdownStyled>
            <ScrollBar style={{ maxHeight: "256px" }}>{originNode}</ScrollBar>
          </DropdownStyled>
        )}
        styles={{ popup: { root: { marginTop: "7px", padding: "8px 0 6px 0" }}}}
        onBlur={handleBlur}
        onFocus={handleFocus}
        onClick={handleClick}
      >
        {memoizedOptions}
      </CustomSelect>
    </Wrapper>
  );
});

StatusEdit.displayName = 'StatusEdit';

export const BadgeStatusComp = (function () {
  return new ColumnTypeCompBuilder(
    childrenMap,
    (props, dispatch) => {
      const text = props.changeValue?.value ?? getBaseValue(props, dispatch).value;
      const status = props.changeValue?.status ?? getBaseValue(props, dispatch).status;
      return status === "none" ? text : <Badge status={status} text={text}/>;
    },
    (nodeValue) => [nodeValue.status.value, nodeValue.text.value].filter((t) => t).join(" "),
    getBaseValue
  )
    .setEditViewFn((props) => (
      <StatusEdit value={props.value} onChange={props.onChange} onChangeEnd={props.onChangeEnd} />
    ))
    .setPropertyViewFn((children) => (
      <>
        {children.text.propertyView({
          label: trans("table.columnValue"),
          tooltip: ColumnValueTooltip,
        })}
        {children.status.propertyView({
          label: trans("table.status"),
          tooltip: trans("table.statusTooltip"),
        })}
      </>
    ))
    .build();
})();
