import { BoolCodeControl } from "comps/controls/codeControl";
import { trans } from "i18n";
import { ColumnTypeCompBuilder, ColumnTypeViewFn } from "../columnTypeCompBuilder";
import { ColumnValueTooltip } from "../simpleColumnTypeComps";
import { InputFieldStyle } from "comps/controls/styleControlConstants";
import styled from "styled-components";
import { default as Switch } from "antd/es/switch";
import { styleControl } from "comps/controls/styleControl";
import { booleanExposingStateControl } from "comps/controls/codeStateControl";
import { changeEvent, eventHandlerControl } from "comps/controls/eventHandlerControl";
import { disabledPropertyView } from "comps/utils/propertyUtils";
import React, { useCallback, useRef, useEffect } from "react";

const EventOptions = [
  changeEvent,
  {
    label: trans("switchComp.open"),
    value: "true",
    description: trans("switchComp.openDesc"),
  },
  {
    label: trans("switchComp.close"),
    value: "false",
    description: trans("switchComp.closeDesc"),
  },
] as const;

const childrenMap = {
  value: booleanExposingStateControl("value"),
  switchState: BoolCodeControl,
  onEvent: eventHandlerControl(EventOptions),
  disabled: BoolCodeControl,
  style: styleControl(InputFieldStyle),
};

const getBaseValue: ColumnTypeViewFn<typeof childrenMap, boolean, boolean> = (props) => props.switchState;

const SwitchView = React.memo(({ value, disabled, onEvent, valueControl }: {
  value: boolean;
  disabled: boolean;
  onEvent: (event: string) => void;
  valueControl: { onChange: (value: boolean) => void };
}) => {
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const handleChange = useCallback((checked: boolean) => {
    if (!mountedRef.current) return;
    valueControl.onChange(checked);
    onEvent("change");
    onEvent(checked ? "true" : "false");
  }, [valueControl, onEvent]);

  return (
    <Switch 
      checked={value}
      disabled={disabled || true}
      onChange={handleChange}
    />
  );
});

SwitchView.displayName = 'SwitchView';

export const SwitchComp = (function () {
  return new ColumnTypeCompBuilder(
    childrenMap,
    (props, dispatch) => {
      const value = getBaseValue(props, dispatch);
      return (
        <SwitchView
          value={value}
          disabled={props.disabled}
          onEvent={props.onEvent}
          valueControl={props.value}
        />
      );
    },
    (nodeValue) => nodeValue.switchState.value,
    getBaseValue
  )
    .setPropertyViewFn((children) => {
      return (
        <>
          {children.switchState.propertyView({
            label: trans("table.columnValue"),
            tooltip: ColumnValueTooltip,
          })}
          {children.onEvent.propertyView()}
          {disabledPropertyView(children)}
          
        </>
      );
    })
    .build();
})();
