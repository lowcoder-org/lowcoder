import React, { useState, useRef, useEffect, useCallback, useMemo, ReactNode } from "react";
import { default as InputNumber } from "antd/es/input-number";
import { NumberControl, RangeControl, StringControl } from "comps/controls/codeControl";
import { BoolControl } from "comps/controls/boolControl";
import { trans } from "i18n";
import { ColumnTypeCompBuilder, ColumnTypeViewFn } from "../columnTypeCompBuilder";
import { ColumnValueTooltip } from "../simpleColumnTypeComps";
import { withDefault } from "comps/generators";
import styled from "styled-components";
import { IconControl } from "comps/controls/iconControl";
import { hasIcon } from "comps/utils";
import { clickEvent, eventHandlerControl, doubleClickEvent } from "comps/controls/eventHandlerControl";
import { useCompClickEventHandler } from "@lowcoder-ee/comps/utils/useCompClickEventHandler";

const InputNumberWrapper = styled.div`
  .ant-input-number  {
    width: 100%;
    border-radius: 0;
    background: transparent !important;
    // padding: 0 !important;
    box-shadow: none;

    input {
      padding: 0;
      border-radius: 0;
    }
  }
`;

const NumberViewWrapper = styled.div`
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
`;

const NumberEventOptions = [clickEvent, doubleClickEvent] as const;

const childrenMap = {
  text: NumberControl,
  step: withDefault(NumberControl, 1),
  precision: RangeControl.closed(0, 20, 0),
  float: BoolControl,
  prefix: StringControl,
  prefixIcon: IconControl,
  suffixIcon: IconControl,
  suffix: StringControl,
  onEvent: eventHandlerControl(NumberEventOptions),
};

const getBaseValue: ColumnTypeViewFn<typeof childrenMap, number, number> = (props) => props.text;

type NumberViewProps = {
  value: number;
  prefix: string;
  suffix: string;
  prefixIcon: ReactNode;
  suffixIcon: ReactNode;
  float: boolean;
  precision: number;
  onEvent?: (eventName: string) => void;
};

type NumberEditProps = {
  value: number;
  onChange: (value: number) => void;
  onChangeEnd: () => void;
  step: number;
  precision: number;
  float: boolean;
};

const ColumnNumberView = React.memo((props: NumberViewProps) => {
  const handleClickEvent = useCompClickEventHandler({onEvent: props.onEvent ?? (() => {})})
  
  const formattedValue = useMemo(() => {
    let result = !props.float ? Math.floor(props.value) : props.value;
    if (props.float) {
      result = Number(result.toFixed(props.precision + 1));
    }
    return result;
  }, [props.value, props.float, props.precision]);

  const handleClick = useCallback(() => {
    handleClickEvent()
  }, [props.onEvent]);

  return (
    <NumberViewWrapper onClick={handleClick}>
      {hasIcon(props.prefixIcon) && (
        <span>{props.prefixIcon}</span>
      )}
      <span>{props.prefix + formattedValue + props.suffix}</span>
      {hasIcon(props.suffixIcon) && (
        <span>{props.suffixIcon}</span>
      )}
    </NumberViewWrapper>
  );
});

ColumnNumberView.displayName = 'ColumnNumberView';


const ColumnNumberEdit = React.memo((props: NumberEditProps) => {
  const [currentValue, setCurrentValue] = useState(props.value);
  const mountedRef = useRef(true);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      setCurrentValue(0);
    };
  }, []);

  const handleChange = useCallback((value: string | number | null) => {
    if (!mountedRef.current) return;
    const newValue = typeof value === 'number' ? value : 0;
    const finalValue = !props.float ? Math.floor(newValue) : newValue;
    props.onChange(finalValue);
    setCurrentValue(finalValue);
  }, [props.onChange, props.float]);

  const handleBlur = useCallback(() => {
    if (!mountedRef.current) return;
    props.onChangeEnd();
  }, [props.onChangeEnd]);

  const handlePressEnter = useCallback(() => {
    if (!mountedRef.current) return;
    props.onChangeEnd();
  }, [props.onChangeEnd]);

  return (
    <InputNumberWrapper>
      <InputNumber
        step={props.step}
        value={currentValue}
        autoFocus
        variant="borderless"
        onChange={handleChange}
        precision={props.float ? props.precision : 0}
        onBlur={handleBlur}
        onPressEnter={handlePressEnter}
      />
    </InputNumberWrapper>
  );
});

ColumnNumberEdit.displayName = 'NumberEdit';

export const ColumnNumberComp = (function () {
  return new ColumnTypeCompBuilder(
    childrenMap,
    (props, dispatch) => {
      const value = props.changeValue ?? getBaseValue(props, dispatch);
      return <ColumnNumberView value={value} {...props} />;
    },
    (nodeValue) => nodeValue.text.value,
    getBaseValue
  )
    .setEditViewFn((props) => {
      const { value, onChange, onChangeEnd, otherProps } = props;
      return (
        <ColumnNumberEdit
          value={value}
          onChange={onChange}
          onChangeEnd={onChangeEnd}
          step={otherProps?.step ?? 1}
          precision={otherProps?.precision ?? 0}
          float={otherProps?.float ?? false}
        />
      );
    })
    .setPropertyViewFn((children) => {
      return (
        <>
          {children.text.propertyView({
            label: trans("table.columnValue"),
            tooltip: ColumnValueTooltip,
          })}
          {children.step.propertyView({
            label: trans("table.numberStep"),
            tooltip: trans("table.numberStepTooltip"),
            onFocus: (focused) => {
              if (!focused) {
                const value = children.step.getView();
                const isFloat = children.float.getView();
                const newValue = !isFloat ? Math.floor(value) : value;
                children.step.dispatchChangeValueAction(String(newValue));
              }
            }
          })}
          {children.float.getView() && (
            children.precision.propertyView({
              label: trans("table.precision"),
            })
          )}
          {children.prefix.propertyView({
            label: trans("table.prefix"),
          })}
          {children.prefixIcon.propertyView({
            label: trans("button.prefixIcon"),
          })}
          {children.suffix.propertyView({
            label: trans("table.suffix"),
          })}
          {children.suffixIcon.propertyView({
            label: trans("button.suffixIcon"),
          })}
          {children.float.propertyView({
            label: trans("table.float"),
            onChange: (isFloat) => {
              const value = children.step.getView();
              const newValue = !isFloat ? Math.floor(value) : value;
              children.step.dispatchChangeValueAction(String(newValue));
            }
          })}
          {children.onEvent.propertyView()}
        </>
      );
    })
    .build();
})();
