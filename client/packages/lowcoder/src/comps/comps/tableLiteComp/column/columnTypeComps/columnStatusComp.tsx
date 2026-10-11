import { default as Badge } from "antd/es/badge";
import {
  ColumnTypeCompBuilder,
  ColumnTypeViewFn,
} from "comps/comps/tableComp/column/columnTypeCompBuilder";
import { trans } from "i18n";
import { StringControl, stringUnionControl } from "comps/controls/codeControl";
import { DropdownStyled, Wrapper } from "./columnTagsComp";
import React from "react";
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

export const BadgeStatusComp = (function () {
  return new ColumnTypeCompBuilder(
    childrenMap,
    (props, dispatch) => {
      const text = getBaseValue(props, dispatch).value;
      const status = getBaseValue(props, dispatch).status;
      return status === "none" ? text : <Badge status={status} text={text}/>;
    },
    (nodeValue) => [nodeValue.status.value, nodeValue.text.value].filter((t) => t).join(" "),
    getBaseValue
  )
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
