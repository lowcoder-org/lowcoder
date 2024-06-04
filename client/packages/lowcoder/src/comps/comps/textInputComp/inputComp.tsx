import { Input, Section, sectionNames } from "lowcoder-design";
import { BoolControl } from "comps/controls/boolControl";
import { styleControl } from "comps/controls/styleControl";
import { AnimationStyle, InputFieldStyle, InputLikeStyle, InputLikeStyleType, LabelStyle, LabelStyleType } from "comps/controls/styleControlConstants";
import {
  NameConfig,
  NameConfigPlaceHolder,
  NameConfigRequired,
} from "comps/generators/withExposing";
import styled from "styled-components";
import { UICompBuilder } from "../../generators";
import { FormDataPropertyView } from "../formComp/formDataConstants";
import {
  fixOldInputCompData,
  getStyle,
  inputRefMethods,
  TextInputBasicSection,
  textInputChildren,
  TextInputConfigs,
  TextInputInteractionSection,
  TextInputValidationSection,
  useTextInputProps,
} from "./textInputConstants";
import {
  allowClearPropertyView,
  hiddenPropertyView,
  readOnlyPropertyView,
} from "comps/utils/propertyUtils";
import { trans } from "i18n";
import { IconControl } from "comps/controls/iconControl";
import { hasIcon } from "comps/utils";
import { InputRef } from "antd/es/input";
import { RefControl } from "comps/controls/refControl";
import { migrateOldData, withDefault } from "comps/generators/simpleGenerators";

import React, { useContext } from "react";
import { EditorContext } from "comps/editorState";

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
  style: withDefault(styleControl(InputFieldStyle),{background:'transparent'}) , 
  labelStyle:styleControl(LabelStyle), 
  prefixIcon: IconControl,
  suffixIcon: IconControl,
  inputFieldStyle:withDefault(styleControl(InputLikeStyle),{borderWidth: '1px'}) ,
  animationStyle: styleControl(AnimationStyle),
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
              {children.prefixIcon.propertyView({ label: trans("button.prefixIcon") })}
              {children.suffixIcon.propertyView({ label: trans("button.suffixIcon") })}
              {children.showCount.propertyView({ label: trans("prop.showCount") })}
              {allowClearPropertyView(children)}
              {readOnlyPropertyView(children)}
            </Section>
            <TextInputValidationSection {...children} />
          </>
        )}
        {["layout", "both"].includes(useContext(EditorContext).editorModeStatus) && (
          <>
            <Section name={sectionNames.style}>{children.style.getPropertyView()}</Section>
            <Section name={sectionNames.labelStyle}>{children.labelStyle.getPropertyView()}</Section>
            <Section name={sectionNames.inputFieldStyle}>{children.inputFieldStyle.getPropertyView()}</Section>
            <Section name={sectionNames.animationStyle} hasTooltip={true}>{children.animationStyle.getPropertyView()}</Section>
          </>
        )}
      </>
    );
  })
  .setExposeMethodConfigs(inputRefMethods)
  .setExposeStateConfigs([
    new NameConfig("value", trans("export.inputValueDesc")),
    NameConfigPlaceHolder,
    NameConfigRequired,
    ...TextInputConfigs,
  ])
  .build();


const InputComp = migrateOldData(InputBasicComp, fixOldInputCompData);

export { InputComp };
