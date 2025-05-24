import { BoolCodeControl } from "comps/controls/codeControl";
import { trans } from "i18n";
import { ColumnTypeCompBuilder, ColumnTypeViewFn } from "../columnTypeCompBuilder";
import { ColumnValueTooltip } from "../simpleColumnTypeComps";
import { InputFieldStyle } from "comps/controls/styleControlConstants";
import styled from "styled-components";
import { default as Switch } from "antd/es/switch";
import { styleControl } from "comps/controls/styleControl";
import { RefControl } from "comps/controls/refControl";
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

const Wrapper = styled.div`
  background: transparent !important;
  padding: 0 8px;
`

const childrenMap = {
  value: booleanExposingStateControl("value"),
  switchState: BoolCodeControl,
  onEvent: eventHandlerControl(EventOptions),
  disabled: BoolCodeControl,
  style: styleControl(InputFieldStyle),
  // viewRef: RefControl<HTMLButtonElement>,
};

const getBaseValue: ColumnTypeViewFn<typeof childrenMap, boolean, boolean> = (props) => props.switchState;

const SwitchView = React.memo(({ value, disabled, onEvent, valueControl }: {
  value: boolean;
  disabled: boolean;
  // viewRef: (viewRef: HTMLButtonElement | null) => void;
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
      // ref={viewRef}
      onChange={handleChange}
    />
  );
});

SwitchView.displayName = 'SwitchView';

const SwitchEdit = React.memo(({ value, onChange, onChangeEnd }: {
  value: boolean;
  onChange: (value: boolean) => void;
  onChangeEnd: () => void;
}) => {
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const handleChange = useCallback((checked: boolean) => {
    if (!mountedRef.current) return;
    onChange(checked);
  }, [onChange]);

  const handleBlur = useCallback(() => {
    if (!mountedRef.current) return;
    onChangeEnd();
  }, [onChangeEnd]);

  return (
    <Wrapper onBlur={handleBlur}>
      <Switch
        autoFocus
        defaultChecked={value}
        disabled={false}
        onChange={handleChange}
      />
    </Wrapper>
  );
});

SwitchEdit.displayName = 'SwitchEdit';

export const SwitchComp = (function () {
  return new ColumnTypeCompBuilder(
    childrenMap,
    (props, dispatch) => {
      const value = props.changeValue ?? getBaseValue(props, dispatch);
      return (
        <SwitchView
          value={value}
          disabled={props.disabled}
          // viewRef={props.viewRef}
          onEvent={props.onEvent}
          valueControl={props.value}
        />
      );
    },
    (nodeValue) => nodeValue.switchState.value,
    getBaseValue
  )
    .setEditViewFn((props) => {
      return (
        <Wrapper
          onBlur={() => {
            props.onChangeEnd()
          }}
        >
          <Switch
            autoFocus
            defaultChecked={props.value}
            disabled={false}
            onChange={(checked, e) => {
              props.onChange(checked);
              props.otherProps?.onEvent?.("change");
              props.otherProps?.onEvent?.(checked ? "true" : "false");
            }}
          />
        </Wrapper>
      );
    })
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
