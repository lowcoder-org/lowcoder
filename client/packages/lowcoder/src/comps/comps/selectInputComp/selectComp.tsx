import { styleControl } from "comps/controls/styleControl";
import {  ChildrenMultiSelectStyle, InputFieldStyle, LabelStyle, SelectStyle } from "comps/controls/styleControlConstants";
import { trans } from "i18n";
import { stringExposingStateControl } from "../../controls/codeStateControl";
import { UICompBuilder } from "../../generators";
import { CommonNameConfig, NameConfig, withExposingConfigs } from "../../generators/withExposing";
import {
  baseSelectRefMethods,
  SelectChildrenMap,
  SelectPropertyView,
  SelectUIView,
} from "./selectCompConstants";
import {
  SelectInputCommonConfig,
  SelectInputInvalidConfig,
  useSelectInputValidate,
} from "./selectInputConstants";
import { useContext, useEffect, useRef } from "react";
import { RecordConstructorToView } from "lowcoder-core";
import { fixOldInputCompData } from "../textInputComp/textInputConstants";
import { migrateOldData, withDefault } from "comps/generators/simpleGenerators";

let SelectBasicComp = (function () {
  const childrenMap = {
    ...SelectChildrenMap,
    defaultValue: stringExposingStateControl("defaultValue"),
    value: stringExposingStateControl("value"),
    style: styleControl(InputFieldStyle , 'style'),
    labelStyle: styleControl(LabelStyle , 'labelStyle'),
    inputFieldStyle: styleControl(SelectStyle , 'inputFieldStyle'),
    childrenInputFieldStyle: styleControl(ChildrenMultiSelectStyle, 'childrenInputFieldStyle')
  };
  return new UICompBuilder(childrenMap, (props, dispatch) => {
    const [
      validateState,
      handleChange,
    ] = useSelectInputValidate(props);

    const propsRef = useRef<RecordConstructorToView<typeof childrenMap>>(props);
    propsRef.current = props;

    const valueSet = new Set<any>((props.options as any[]).map((o: any) => o.value)); // Filter illegal default values entered by the user

    return props.label({
      required: props.required,
      style: props.style,
      labelStyle: props.labelStyle,
      inputFieldStyle:props.inputFieldStyle,
      childrenInputFieldStyle:props.childrenInputFieldStyle,
      children: (
        <SelectUIView
          {...props}
          value={valueSet.has(props.value.value) ? props.value.value : undefined}
          onChange={handleChange}
          dispatch={dispatch}
        />
      ),
      showValidationWhenEmpty: props.showValidationWhenEmpty,
      ...validateState,
    });
  })
    .setPropertyViewFn((children) => <SelectPropertyView {...children} />)
    .setExposeMethodConfigs(baseSelectRefMethods)
    .build();
})();

SelectBasicComp = migrateOldData(SelectBasicComp, fixOldInputCompData);

export const SelectComp = withExposingConfigs(SelectBasicComp, [
  new NameConfig("value", trans("selectInput.valueDesc")),
  new NameConfig("inputValue", trans("select.inputValueDesc")),
  SelectInputInvalidConfig,
  ...SelectInputCommonConfig,
  ...CommonNameConfig,
]);
