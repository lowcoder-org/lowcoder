import { default as Input } from "antd/es/input";
import {
  ColumnTypeCompBuilder,
  ColumnTypeViewFn,
} from "comps/comps/tableComp/column/columnTypeCompBuilder";
import { ActionSelectorControlInContext } from "comps/controls/actionSelector/actionSelectorControl";
import { BoolCodeControl, StringControl } from "comps/controls/codeControl";
import { trans } from "i18n";
import { disabledPropertyView } from "comps/utils/propertyUtils";
import styled, { css } from "styled-components";
import { styleControl } from "comps/controls/styleControl";
import { TableColumnLinkStyle } from "comps/controls/styleControlConstants";

export const ColumnValueTooltip = trans("table.columnValueTooltip");

const childrenMap = {
  text: StringControl,
  onClick: ActionSelectorControlInContext,
  disabled: BoolCodeControl,
  style: styleControl(TableColumnLinkStyle),
};

const disableCss = css`
  &,
  &:hover {
    cursor: not-allowed;
    color: rgba(0, 0, 0, 0.25) !important;
  }
`;

const StyledLink = styled.a<{ $disabled: boolean }>`
  ${(props) => props.$disabled && disableCss};
`;

export const ColumnLink = (props: { disabled: boolean; label: string; onClick?: () => void }) => (
  <StyledLink
    $disabled={props.disabled}
    onClick={() => {
      !props.disabled && props.onClick && props.onClick();
    }}
  >
    {props.label}
  </StyledLink>
);

const getBaseValue: ColumnTypeViewFn<typeof childrenMap, string, string> = (props) => props.text;

export const LinkComp = (function () {
  return new ColumnTypeCompBuilder(
    childrenMap,
    (props, dispatch) => {
      const value = props.changeValue ?? getBaseValue(props, dispatch);
      return <ColumnLink disabled={props.disabled} label={value} onClick={props.onClick} />;
    },
    (nodeValue) => nodeValue.text.value,
    getBaseValue
  )
    .setEditViewFn((props) => (
      <Input
        defaultValue={props.value}
        autoFocus
        variant="borderless"
        onChange={(e) => {
          const value = e.target.value;
          props.onChange(value);
        }}
        onBlur={props.onChangeEnd}
        onPressEnter={props.onChangeEnd}
      />
    ))
    .setPropertyViewFn((children) => (
      <>
        {children.text.propertyView({
          label: trans("table.columnValue"),
          tooltip: ColumnValueTooltip,
        })}
        {disabledPropertyView(children)}
        {children.onClick.propertyView({
          label: trans("table.action"),
          placement: "table",
        })}
      </>
    ))
    .setStylePropertyViewFn((children) => (
      <>
        {children.style.getPropertyView()}
      </>
    ))
    .build();
})();
