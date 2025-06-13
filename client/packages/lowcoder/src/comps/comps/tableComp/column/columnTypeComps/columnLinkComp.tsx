import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
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
import { clickEvent, eventHandlerControl, doubleClickEvent } from "comps/controls/eventHandlerControl";
import { ComponentClickHandler } from "@lowcoder-ee/comps/utils/componentClickHandler";

export const ColumnValueTooltip = trans("table.columnValueTooltip");

const LinkEventOptions = [clickEvent, doubleClickEvent] as const;

const childrenMap = {
  text: StringControl,
  onClick: ActionSelectorControlInContext,
  onEvent: eventHandlerControl(LinkEventOptions),
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

// Memoized link component
export const ColumnLink = React.memo(({ disabled, label, onClick, onEvent }: { disabled: boolean; label: string; onClick?: () => void; onEvent?: (eventName: string) => void }) => {
  const handleClick = useCallback(() => {
    if (!disabled && onEvent) {
      ComponentClickHandler({onEvent})();
    }
  }, [disabled, onEvent]);
  //   if (disabled) return;
  //   onClick?.();
  //   // onEvent?.("click");
  // }, [disabled, onClick, onEvent]);

  return (
    <StyledLink
      $disabled={disabled}
      onClick={handleClick}
    >
      {label}
    </StyledLink>
  );
});

ColumnLink.displayName = 'ColumnLink';

// Memoized edit component
const LinkEdit = React.memo(({ value, onChange, onChangeEnd }: { value: string; onChange: (value: string) => void; onChangeEnd: () => void }) => {
  const mountedRef = useRef(true);
  const [currentValue, setCurrentValue] = useState(value);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (mountedRef.current) {
      const newValue = e.target.value;
      setCurrentValue(newValue);
      onChange(newValue);
    }
  }, [onChange]);

  const handleBlur = useCallback(() => {
    if (mountedRef.current) {
      onChangeEnd();
    }
  }, [onChangeEnd]);

  const handlePressEnter = useCallback(() => {
    if (mountedRef.current) {
      onChangeEnd();
    }
  }, [onChangeEnd]);

  return (
    <Input
      value={currentValue}
      autoFocus
      variant="borderless"
      onChange={handleChange}
      onBlur={handleBlur}
      onPressEnter={handlePressEnter}
    />
  );
});

LinkEdit.displayName = 'LinkEdit';

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
      <LinkEdit
        value={props.value}
        onChange={props.onChange}
        onChangeEnd={props.onChangeEnd}
      />
    ))
    .setPropertyViewFn((children) => (
      <>
        {children.text.propertyView({
          label: trans("table.columnValue"),
          tooltip: ColumnValueTooltip,
        })}
        {disabledPropertyView(children)}
        {/* {children.onEvent.propertyView()} */}
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
