import { useState } from "react";

import { SelectUIView } from "comps/comps/selectInputComp/selectCompConstants";
import { SelectOptionControl } from "comps/controls/optionsControl";
import { StringControl } from "comps/controls/codeControl";

import { trans } from "i18n";
import { ColumnTypeCompBuilder, ColumnTypeViewFn } from "../columnTypeCompBuilder";
import { ColumnValueTooltip } from "../simpleColumnTypeComps";

const childrenMap = {
  text: StringControl,
  options: SelectOptionControl,
};

let options: any[] = []
const getBaseValue: ColumnTypeViewFn<typeof childrenMap, string, string> = (props) => props.text;

type SelectEditProps = {
  initialValue: string;
  onChange: (value: string) => void;
  onChangeEnd: () => void;
  options: any[];
};

const SelectEdit = (props: SelectEditProps) => {
  const [currentValue, setCurrentValue] = useState(props.initialValue);

  return (
    <SelectUIView 
      value={currentValue}
      options={options}
      onChange={(val) => {
        props.onChange(val);
        setCurrentValue(val)
      }}
      onEvent={async (eventName)=>{
        if(eventName==="blur"){
          props.onChangeEnd()
        }
        return []
      }}
      // @ts-ignore
      style={{}}
    />
  );
};


export const ColumnSelectComp = (function () {
  return new ColumnTypeCompBuilder(
    childrenMap,
    (props, dispatch) => {
      options = props.options;
      const value = props.changeValue ?? getBaseValue(props, dispatch)
      return props.options.find(x => x.value === value)?.label;
    },
    (nodeValue) => nodeValue.text.value,
    getBaseValue,
  )
    .setEditViewFn((props) => {
      return (
        <SelectEdit
          initialValue={props.value}
          options={options}
          onChange={props.onChange}
          onChangeEnd={props.onChangeEnd}
        />
    )})
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
        </>
      );
    })
    .build();
})();
