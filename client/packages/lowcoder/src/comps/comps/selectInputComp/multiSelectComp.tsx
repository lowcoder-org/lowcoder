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
import { migrateOldData } from "comps/generators/simpleGenerators";
import { fixOldInputCompData } from "../textInputComp/textInputConstants";

let MultiSelectBasicComp = (function () {
  const childrenMap = {
    ...SelectChildrenMap,
    defaultValue: arrayStringExposingStateControl("defaultValue", ["1", "2"]),
    value: arrayStringExposingStateControl("value"),
    style: styleControl(InputFieldStyle , 'style'),
    labelStyle: styleControl(LabelStyle , 'labelStyle'),
    inputFieldStyle: styleControl(MultiSelectStyle , 'inputFieldStyle'),
    childrenInputFieldStyle: styleControl(ChildrenMultiSelectStyle, 'childrenInputFieldStyle'),
    margin: MarginControl,	
    padding: PaddingControl,
  };
  return new UICompBuilder(childrenMap, (props, dispatch) => {
    const valueSet = new Set<any>((props.options as any[]).map((o: any) => o.value)); // Filter illegal default values entered by the user
    const [
      validateState,
      handleChange,
    ] = useSelectInputValidate(props);

    const removeIllegalEntries = () => {
      return props.value.value.filter?.((v) => valueSet.has(v))
    }
    
    return props.label({
      required: props.required,
      style: props.style,
      labelStyle: props.labelStyle,
      inputFieldStyle:props.inputFieldStyle,
      childrenInputFieldStyle:props.childrenInputFieldStyle,
      children: (
        <SelectUIView
          {...props}
          mode={props.allowCustomTags ? "tags" : "multiple"}
          value={props.allowCustomTags ? props.value.value : removeIllegalEntries()}
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
