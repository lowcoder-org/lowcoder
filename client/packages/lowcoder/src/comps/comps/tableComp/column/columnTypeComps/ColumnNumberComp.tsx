  import { default as InputNumber } from "antd/es/input-number";
import { NumberControl, StringControl } from "comps/controls/codeControl";
import { BoolControl } from "comps/controls/boolControl";
import { trans } from "i18n";
import { ColumnTypeCompBuilder, ColumnTypeViewFn } from "../columnTypeCompBuilder";
import { ColumnValueTooltip } from "../simpleColumnTypeComps";
import { withDefault } from "comps/generators";
import styled from "styled-components";

const InputNumberWrapper = styled.div`
  .ant-input-number  {
    width: 100%;
    border-radius: 0;
    background: transparent !important;
    padding: 0 !important;
    box-shadow: none;

    input {
      padding: 0;
      border-radius: 0;
    }
  }
`;

const childrenMap = {
  text: NumberControl,
  step: withDefault(NumberControl, 1),
  float: BoolControl,
  prefix: StringControl,
  suffix: StringControl,
};

let float = false;
let step = 1;
const getBaseValue: ColumnTypeViewFn<typeof childrenMap, number, number> = (
  props
) => {
  return props.text
};

export const ColumnNumberComp = (function () {
  return new ColumnTypeCompBuilder(
    childrenMap,
    (props, dispatch) => {
      float = props.float;
      step = props.step;
      const value = !float ? Math.floor(props.changeValue ?? getBaseValue(props, dispatch)) : props.changeValue ?? getBaseValue(props, dispatch);
      return props.prefix + value + props.suffix;
    },
    (nodeValue) => nodeValue.text.value,
    getBaseValue,
  )
    .setEditViewFn((props) => {
      return (
      <InputNumberWrapper>
        <InputNumber
          step={step}
          defaultValue={props.value}
          autoFocus
          bordered={false}
          onChange={(value) => {
            value = value ?? 0;
            props.onChange(!float ? Math.floor(value) : value);
          }}
          onBlur={props.onChangeEnd}
          onPressEnter={props.onChangeEnd}
        />
      </InputNumberWrapper>
    )})
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
              if(!focused) {
                const value = children.step.getView();
                const isFloat = children.float.getView();
                const newValue = !isFloat ? Math.floor(value) : value;
                children.step.dispatchChangeValueAction(String(newValue));
              }
            }
          })}
          {children.prefix.propertyView({
            label: trans("table.prefix"),
          })}
          {children.suffix.propertyView({
            label: trans("table.suffix"),
          })}
          {children.float.propertyView({
            label: trans("table.float"),
            onChange: (isFloat) => {
              const value = children.step.getView();
              const newValue = !isFloat ? Math.floor(value) : value;
              children.step.dispatchChangeValueAction(String(newValue));
            }
          })}
        </>
      );
    })
    .build();
})();
