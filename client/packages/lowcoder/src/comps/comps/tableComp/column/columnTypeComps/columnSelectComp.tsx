import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";

import { SelectUIView } from "comps/comps/selectInputComp/selectCompConstants";
import { StringControl, BoolCodeControl } from "comps/controls/codeControl";
import { IconControl } from "comps/controls/iconControl";
import { MultiCompBuilder } from "comps/generators";
import { optionsControl } from "comps/controls/optionsControl";
import { disabledPropertyView, hiddenPropertyView } from "comps/utils/propertyUtils";
import { trans } from "i18n";
import { ColumnTypeCompBuilder, ColumnTypeViewFn } from "../columnTypeCompBuilder";
import { ColumnValueTooltip } from "../simpleColumnTypeComps";
import { styled } from "styled-components";
import { clickEvent, eventHandlerControl, doubleClickEvent } from "comps/controls/eventHandlerControl";

const Wrapper = styled.div`
  display: inline-flex;
  align-items: center;
  width: 100%;
  height: 100%;
  position: absolute;
  top: 0;
  background: transparent !important;
  padding: 8px;

  > div {
    width: 100%;
    height: 100%;
  }

  .ant-select {
    height: 100%;
    .ant-select-selector {
      padding: 0 7px;
      height: 100%;
      overflow: hidden;
      .ant-select-selection-item {
        display: inline-flex;
        align-items: center;
        padding-right: 24px;
      }
    }
    .ant-select-arrow {
      height: calc(100% - 3px);
      width: fit-content;
      top: 1.5px;
      margin-top: 0;
      background-color: white;
      right: 1.5px;
      border-right: 1px solid #d7d9e0;
      cursor: pointer;
      pointer-events: auto;
      svg {
        min-width: 18px;
        min-height: 18px;
      }
      &:hover svg path {
        fill: #315efb;
      }
    }
    .ant-select-selector .ant-select-selection-search {
      left: 7px;
      input {
        height: 100%;
      }
    }
    &.ant-select-open {
      .ant-select-arrow {
        border-right: none;
        border-left: 1px solid #d7d9e0;
        svg g path {
          fill: #315efb;
        }
      }
      .ant-select-selection-item {
        opacity: 0.4;
      }
    }
  }
`;

const SelectOptionEventOptions = [clickEvent, doubleClickEvent] as const;

// Create a new option type with event handlers for each option
const SelectOptionWithEvents = new MultiCompBuilder(
  {
    value: StringControl,
    label: StringControl,
    prefixIcon: IconControl,
    disabled: BoolCodeControl,
    hidden: BoolCodeControl,
    onEvent: eventHandlerControl(SelectOptionEventOptions),
  },
  (props) => props
)
  .setPropertyViewFn((children) => (
    <>
      {children.label.propertyView({ label: trans("label") })}
      {children.value.propertyView({ label: trans("value") })}
      {children.prefixIcon.propertyView({ label: trans("button.prefixIcon") })}
      {disabledPropertyView(children)}
      {hiddenPropertyView(children)}
      {children.onEvent.propertyView()}
    </>
  ))
  .build();

const SelectOptionWithEventsControl = optionsControl(SelectOptionWithEvents, {
  initOptions: [
    { label: trans("optionsControl.optionI", { i: 1 }), value: "1" },
    { label: trans("optionsControl.optionI", { i: 2 }), value: "2" },
  ],
  uniqField: "value",
});

const childrenMap = {
  text: StringControl,
  options: SelectOptionWithEventsControl,
  onEvent: eventHandlerControl(SelectOptionEventOptions),
};

const getBaseValue: ColumnTypeViewFn<typeof childrenMap, string, string> = (props) => props.text;

type SelectEditProps = {
  initialValue: string;
  onChange: (value: string) => void;
  onChangeEnd: () => void;
  options: any[];
  onMainEvent?: (eventName: string) => void;
};

const SelectEdit = React.memo((props: SelectEditProps) => {
  const [currentValue, setCurrentValue] = useState(props.initialValue);
  const mountedRef = useRef(true);
  const defaultProps: any = {};

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      setCurrentValue('');
    };
  }, []);

  const handleChange = useCallback((val: string) => {
    if (!mountedRef.current) return;
    props.onChange(val);
    setCurrentValue(val);
    
    // Trigger the specific option's event handler
    const selectedOption = props.options.find(option => option.value === val);
    if (selectedOption?.onEvent) {
      selectedOption.onEvent("click");
    }
    
    // Also trigger the main component's event handler
    if (props.onMainEvent) {
      props.onMainEvent("click");
    }
  }, [props.onChange, props.options, props.onMainEvent]);

  const handleEvent = useCallback(async (eventName: string) => {
    if (!mountedRef.current) return [] as unknown[];
    if (eventName === "blur") {
      props.onChangeEnd();
    }
    return [] as unknown[];
  }, [props.onChangeEnd]);

  const memoizedOptions = useMemo(() => props.options, [props.options]);

  return (
    <SelectUIView
      autoFocus
      allowClear
      value={currentValue}
      options={memoizedOptions}
      onChange={handleChange}
      onEvent={handleEvent}
      // @ts-ignore
      style={{}}
      {...defaultProps}
    />
  );
});

SelectEdit.displayName = 'SelectEdit';

export const ColumnSelectComp = (function () {
  return new ColumnTypeCompBuilder(
    childrenMap,
    (props, dispatch) => {
      const value = props.changeValue ?? getBaseValue(props, dispatch);
      const option = props.options.find(x => x.value === value);
      return (
        <>
          <span>{option?.prefixIcon}</span>
          <span>{option?.label}</span>
        </>
      );
    },
    (nodeValue) => nodeValue.text.value,
    getBaseValue,
  )
    .setEditViewFn((props) => {
      return (
        <Wrapper>
          <SelectEdit
            initialValue={props.value}
            options={props.otherProps?.options || []}
            onChange={props.onChange}
            onChangeEnd={props.onChangeEnd}
            onMainEvent={props.otherProps?.onEvent}
          />
        </Wrapper>
      )
    })
    .setPropertyViewFn((children) => {
      return (
        <>
          {children.text.propertyView({
            label: trans("table.columnValue"),
            tooltip: ColumnValueTooltip,
          })}
          {children.options.propertyView({
            title: trans("optionsControl.optionList"),
          })}
          {children.onEvent.propertyView()}
        </>
      );
    })
    .build();
})();
