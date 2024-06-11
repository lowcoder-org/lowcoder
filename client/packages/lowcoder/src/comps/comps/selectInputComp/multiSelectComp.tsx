import { styleControl } from "comps/controls/styleControl";
import {  ChildrenMultiSelectStyle, InputFieldStyle, LabelStyle, MultiSelectStyle } from "comps/controls/styleControlConstants";
import { trans } from "i18n";
import { arrayStringExposingStateControl } from "../../controls/codeStateControl";
import { UICompBuilder } from "../../generators";
import { CommonNameConfig, NameConfig, withExposingConfigs } from "../../generators/withExposing";
import {
  baseSelectRefMethods,
  SelectChildrenMap,
  SelectPropertyView,
  SelectUIView,
} from "./selectCompConstants";
import { SelectInputInvalidConfig, useSelectInputValidate } from "./selectInputConstants";

import { PaddingControl } from "../../controls/paddingControl";	
import { MarginControl } from "../../controls/marginControl";
import { migrateOldData, withDefault } from "comps/generators/simpleGenerators";
import { fixOldInputCompData } from "../textInputComp/textInputConstants";

let MultiSelectBasicComp = (function () {
  const childrenMap = {
    ...SelectChildrenMap,
    defaultValue: arrayStringExposingStateControl("defaultValue", ["1", "2"]),
    value: arrayStringExposingStateControl("value"),
    style: withDefault(styleControl(InputFieldStyle),{background:'transparent'}),
    labelStyle:styleControl(LabelStyle),
    inputFieldStyle:withDefault(styleControl(MultiSelectStyle),{borderWidth:'1px'}),
    childrenInputFieldStyle:styleControl(ChildrenMultiSelectStyle),
    margin: MarginControl,	
    padding: PaddingControl,
  };
  return new UICompBuilder(childrenMap, (props, dispatch) => {
    const valueSet = new Set<any>(props.options.map((o) => o.value)); // Filter illegal default values entered by the user
    const [
      validateState,
      handleChange,
    ] = useSelectInputValidate(props);
    
    return props.label({
      required: props.required,
      style: props.style,
      labelStyle: props.labelStyle,
      inputFieldStyle:props.inputFieldStyle,
      childrenInputFieldStyle:props.childrenInputFieldStyle,
      children: (
        <SelectUIView
          {...props}
          mode={"multiple"}
          value={props.value.value.filter?.((v) => valueSet.has(v))}
          onChange={handleChange}
          dispatch={dispatch}
        />
      ),
      ...validateState,
    });
  })
    .setPropertyViewFn((children) => <SelectPropertyView {...children} />)
    .setExposeMethodConfigs(baseSelectRefMethods)
    .build();
})();

MultiSelectBasicComp = migrateOldData(MultiSelectBasicComp, fixOldInputCompData);

export const MultiSelectComp = withExposingConfigs(MultiSelectBasicComp, [
  new NameConfig("value", trans("selectInput.valueDesc")),
  new NameConfig("inputValue", trans("select.inputValueDesc")),
  SelectInputInvalidConfig,
  ...CommonNameConfig,
]);
