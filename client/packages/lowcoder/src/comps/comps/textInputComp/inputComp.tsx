import { Input } from "lowcoder-design";
import { BoolControl } from "comps/controls/boolControl";
import { styleControl } from "comps/controls/styleControl";
import { AnimationStyle, InputFieldStyle, InputLikeStyle, InputLikeStyleType, LabelStyle } from "comps/controls/styleControlConstants";
import {
  NameConfig,
  NameConfigPlaceHolder,
  NameConfigRequired,
} from "comps/generators/withExposing";
import styled from "styled-components";
import { UICompBuilder } from "../../generators";
import {
  fixOldInputCompData,
  getStyle,
  inputRefMethods,
  textInputChildren,
  TextInputConfigs,
  useTextInputProps,
} from "./textInputConstants";
import { trans } from "i18n";
import { IconControl } from "comps/controls/iconControl";
import { hasIcon } from "comps/utils";
import { InputRef } from "antd/es/input";
import { RefControl } from "comps/controls/refControl";
import { migrateOldData } from "comps/generators/simpleGenerators";

import React from "react";
import {viewMode} from "@lowcoder-ee/util/editor";
const SetPropertyViewInputComp =  React.lazy( async () => await import("./setProperty").then(module => ({default: module.SetPropertyViewInputComp})))

/**
 * Input Comp
 */

const InputStyle = styled(Input)<{$style: InputLikeStyleType}>`
  box-shadow: ${(props) =>
    `${props.$style?.boxShadow} ${props.$style?.boxShadowColor}`};
  ${(props) => props.$style && getStyle(props.$style)}
`;

const childrenMap = {
  ...textInputChildren,
  viewRef: RefControl<InputRef>,
  showCount: BoolControl,
  allowClear: BoolControl,
  style: styleControl(InputFieldStyle, 'style'), 
  labelStyle:styleControl(LabelStyle, 'labelStyle'), 
  prefixIcon: IconControl,
  suffixIcon: IconControl,
  inputFieldStyle: styleControl(InputLikeStyle, 'inputFieldStyle') ,
  animationStyle: styleControl(AnimationStyle, 'animationStyle'),
};

let InputBasicComp = new UICompBuilder(childrenMap, (props) => {
  const [inputProps, validateState] = useTextInputProps(props);
  return props.label({
    required: props.required,
    children: (
      <InputStyle
        {...inputProps}
        ref={props.viewRef}
        showCount={props.showCount}
        allowClear={props.allowClear}
        $style={props.inputFieldStyle}
        prefix={hasIcon(props.prefixIcon) && props.prefixIcon}
        suffix={hasIcon(props.suffixIcon) && props.suffixIcon}
      />
    ),
    style: props.style,
    labelStyle: props.labelStyle,
    inputFieldStyle:props.inputFieldStyle,
    animationStyle:props.animationStyle,
    showValidationWhenEmpty: props.showValidationWhenEmpty,
    ...validateState,
  });
})
if (viewMode() === "edit") {
  InputBasicComp.setPropertyViewFn((children) => <SetPropertyViewInputComp {...children}></SetPropertyViewInputComp>);
}
const InputBasicCompBuilder = InputBasicComp
  .setExposeMethodConfigs(inputRefMethods)
  .setExposeStateConfigs([
    new NameConfig("value", trans("export.inputValueDesc")),
    NameConfigPlaceHolder,
    NameConfigRequired,
    ...TextInputConfigs,
  ])
  .build();


const InputComp = migrateOldData(InputBasicCompBuilder, fixOldInputCompData);

export { InputComp };
