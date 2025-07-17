import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { default as Input } from "antd/es/input";
import {
  ColumnTypeCompBuilder,
  ColumnTypeViewFn,
} from "comps/comps/tableComp/column/columnTypeCompBuilder";
import { BoolCodeControl, StringControl } from "comps/controls/codeControl";
import { trans } from "i18n";
import { disabledPropertyView } from "comps/utils/propertyUtils";
import styled, { css } from "styled-components";
import { styleControl } from "comps/controls/styleControl";
import { TableColumnLinkStyle } from "comps/controls/styleControlConstants";
import { clickEvent, eventHandlerControl, doubleClickEvent } from "comps/controls/eventHandlerControl";
import { useCompClickEventHandler } from "@lowcoder-ee/comps/utils/useCompClickEventHandler";
import { migrateOldData } from "@lowcoder-ee/comps/generators/simpleGenerators";
import { fixOldActionData } from "comps/comps/tableComp/column/simpleColumnTypeComps";

export const ColumnValueTooltip = trans("table.columnValueTooltip");

const LinkEventOptions = [clickEvent, doubleClickEvent] as const;

const childrenMap = {
  text: StringControl,
  onClick: eventHandlerControl(LinkEventOptions),
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
export const ColumnLink = React.memo(({ disabled, label, onClick }: { disabled: boolean; label: string; onClick: (eventName: string) => void }) => {
  const handleClickEvent = useCompClickEventHandler({onEvent: onClick})
  const handleClick = useCallback(() => {
    if (!disabled) {
      handleClickEvent();
    }
  }, [disabled, onClick]);

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

const LinkCompTmp = (function () {
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
        {children.onClick.propertyView()}
      </>
    ))
    .setStylePropertyViewFn((children) => (
      <>
        {children.style.getPropertyView()}
      </>
    ))
    .build();
})();

export const LinkComp = migrateOldData(LinkCompTmp, fixOldActionData);
