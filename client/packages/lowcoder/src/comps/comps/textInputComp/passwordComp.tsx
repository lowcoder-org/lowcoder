import { default as InputPassword } from "antd/es/input/Password";
import { InputRef } from "antd/es/input";
import {
  NameConfig,
  NameConfigPlaceHolder,
  NameConfigRequired,
  withExposingConfigs,
} from "comps/generators/withExposing";
import { Section, sectionNames } from "lowcoder-design";
import { BoolControl } from "../../controls/boolControl";
import { dropdownControl } from "../../controls/dropdownControl";
import { LabelControl } from "../../controls/labelControl";
import { UICompBuilder, withDefault } from "../../generators";
import { FormDataPropertyView } from "../formComp/formDataConstants";
import {
  fixOldInputCompData,
  getStyle,
  inputRefMethods,
  TextInputBasicSection,
  textInputChildren,
  TextInputConfigs,
  TextInputInteractionSection,
  TextInputValidationOptions,
  useTextInputProps,
} from "./textInputConstants";
import { withMethodExposing } from "../../generators/withMethodExposing";
import { styleControl } from "comps/controls/styleControl";
import styled from "styled-components";
import { InputLikeStyle, InputLikeStyleType, LabelStyle } from "comps/controls/styleControlConstants";
import {
  hiddenPropertyView,
  minLengthPropertyView,
  readOnlyPropertyView,
  requiredPropertyView,
  regexPropertyView,
  maxLengthPropertyView,
} from "comps/utils/propertyUtils";
import { trans } from "i18n";
import { IconControl } from "comps/controls/iconControl";
import { hasIcon } from "comps/utils";
import { RefControl } from "comps/controls/refControl";
import React, { useContext } from "react";
import { EditorContext } from "comps/editorState";
import { migrateOldData } from "comps/generators/simpleGenerators";

const PasswordStyle = styled(InputPassword) <{
  $style: InputLikeStyleType;
}>`
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
    style: styleControl(InputLikeStyle),
    labelStyle: styleControl(LabelStyle)
  };
  return new UICompBuilder(childrenMap, (props) => {
    const [inputProps, validateState] = useTextInputProps(props);
    return props.label({
      required: props.required,
      children: (
        <PasswordStyle
          prefix={hasIcon(props.prefixIcon) && props.prefixIcon}
          {...inputProps}
          ref={props.viewRef}
          visibilityToggle={props.visibilityToggle}
          $style={props.style}
        />
      ),
      style: props.style,
      labelStyle:props.labelStyle,
      ...validateState,
    });
  })
    .setPropertyViewFn((children) => {
      return (
        <>
          <TextInputBasicSection {...children} />
          <FormDataPropertyView {...children} />

          {["layout", "both"].includes(useContext(EditorContext).editorModeStatus) && (
            children.label.getPropertyView()
          )}

          {["logic", "both"].includes(useContext(EditorContext).editorModeStatus) && (
            <><TextInputInteractionSection {...children} />
              <Section name={sectionNames.layout}>{hiddenPropertyView(children)}</Section>
              <Section name={sectionNames.advanced}>
                {children.visibilityToggle.propertyView({
                  label: trans("password.visibilityToggle"),
                })}
                {readOnlyPropertyView(children)}
                {children.prefixIcon.propertyView({ label: trans("button.prefixIcon") })}
              </Section><Section name={sectionNames.validation}>
                {requiredPropertyView(children)}
                {regexPropertyView(children)}
                {minLengthPropertyView(children)}
                {maxLengthPropertyView(children)}
                {children.customRule.propertyView({})}
              </Section></>
          )}

          {["layout", "both"].includes(useContext(EditorContext).editorModeStatus) && (
            <>
              <Section name={sectionNames.style}>{children.style.getPropertyView()}</Section>
              <Section name={sectionNames.labelStyle}>{children.labelStyle.getPropertyView()}</Section>
            </>
          )}
        </>
      );
    })
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
