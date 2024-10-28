import { default as InputPassword } from "antd/es/input/Password";
import { InputRef } from "antd/es/input";
import {
  NameConfig,
  NameConfigPlaceHolder,
  NameConfigRequired,
  withExposingConfigs,
} from "comps/generators/withExposing";
import { BoolControl } from "../../controls/boolControl";
import { dropdownControl } from "../../controls/dropdownControl";
import { LabelControl } from "../../controls/labelControl";
import { UICompBuilder, withDefault } from "../../generators";
import {
  fixOldInputCompData,
  getStyle,
  inputRefMethods,
  textInputChildren,
  TextInputConfigs,
  TextInputValidationOptions,
  useTextInputProps,
} from "./textInputConstants";
import { withMethodExposing } from "../../generators/withMethodExposing";
import { styleControl } from "comps/controls/styleControl";
import styled from "styled-components";
import {  AnimationStyle, InputFieldStyle, InputLikeStyle, InputLikeStyleType, LabelStyle } from "comps/controls/styleControlConstants";
import { trans } from "i18n";
import { IconControl } from "comps/controls/iconControl";
import { hasIcon } from "comps/utils";
import { RefControl } from "comps/controls/refControl";
import React from "react";
import { migrateOldData } from "comps/generators/simpleGenerators";
import {viewMode} from "@lowcoder-ee/util/editor";
const SetPropertyViewPasswordComp =  React.lazy( async () => await import("./setProperty").then(module => ({default: module.SetPropertyViewPasswordComp})))
const PasswordStyle = styled(InputPassword)<{
  $style: InputLikeStyleType;
}>`
  box-shadow: ${(props) =>
    `${props.$style?.boxShadow} ${props.$style?.boxShadowColor}`};
  ${(props) => props.$style && getStyle(props.$style)}
`;

let PasswordTmpComp = (function () {
  const childrenMap = {
    ...textInputChildren,
    viewRef: RefControl<InputRef>,
    label: withDefault(LabelControl, { text: trans("password.label") }),
    validationType: dropdownControl(TextInputValidationOptions, "Regex"),
    visibilityToggle: BoolControl.DEFAULT_TRUE,
    prefixIcon: IconControl,
    style: styleControl(InputFieldStyle ,'style' ) , 
    labelStyle: styleControl(LabelStyle,'labelStyle'),
    inputFieldStyle: styleControl(InputLikeStyle , 'inputFieldStyle'), 
    animationStyle: styleControl(AnimationStyle , 'animationStyle'),
  };
  let builder = new UICompBuilder(childrenMap, (props, dispatch) => {
    const [inputProps, validateState] = useTextInputProps(props);

    return props.label({
      required: props.required,
      children: (
        <PasswordStyle
          prefix={hasIcon(props.prefixIcon) && props.prefixIcon}
          {...inputProps}
          ref={props.viewRef}
          visibilityToggle={props.visibilityToggle}
          $style={props.inputFieldStyle}
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
    builder.setPropertyViewFn((children) => <SetPropertyViewPasswordComp {...children}></SetPropertyViewPasswordComp>);
  }
      return builder
    .build();
})();

PasswordTmpComp = migrateOldData(PasswordTmpComp, fixOldInputCompData);

const PasswordTmp2Comp = withMethodExposing(PasswordTmpComp, inputRefMethods);

export const PasswordComp = withExposingConfigs(PasswordTmp2Comp, [
  new NameConfig("value", trans("export.inputValueDesc")),
  NameConfigPlaceHolder,
  NameConfigRequired,
  ...TextInputConfigs,
]);
