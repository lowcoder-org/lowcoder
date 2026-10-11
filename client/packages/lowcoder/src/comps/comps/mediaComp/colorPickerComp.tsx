import { Section, sectionNames } from "lowcoder-design";
import { BoolControl } from "comps/controls/boolControl";
import { styleControl } from "comps/controls/styleControl";
import { AnimationStyle, ColorPickerStyle, ColorPickerStyleType, DisabledInputStyle, DisabledInputStyleType, InputFieldStyle, InputLikeStyle, InputLikeStyleType, LabelStyle } from "comps/controls/styleControlConstants";
import { NameConfig } from "comps/generators/withExposing";
import styled, { css } from "styled-components";
import { UICompBuilder, withDefault } from "../../generators";
import { FormDataPropertyView } from "../formComp/formDataConstants";
import { textInputChildren } from "../textInputComp/textInputConstants";
import { disabledPropertyView, hiddenPropertyView, showDataLoadingIndicatorsPropertyView, } from "comps/utils/propertyUtils";
import { trans } from "i18n";
import { ColorPicker } from 'antd';
import { presets } from "./colorPickerConstants";
import _ from "lodash"
import { changeEvent, eventHandlerControl } from "comps/controls/eventHandlerControl";
import { jsonObjectExposingStateControl, stringExposingStateControl } from "comps/controls/codeStateControl";
import { dropdownControl } from "comps/controls/dropdownControl";
import { ArrayOrJSONObjectControl } from "comps/controls/codeControl";

export function getStyle(style: InputLikeStyleType) {
  return css`
    border-radius: ${style.radius};
    &:not(.ant-input-disabled, .ant-input-affix-wrapper-disabled),
    .ant-color-picker-trigger {
      color: ${style.text};
      font-weight: ${style.textWeight};
      font-family: ${style.fontFamily};
      font-style:${style.fontStyle};
      text-transform:${style.textTransform};
      text-decoration:${style.textDecoration};
      background-color: ${style.background};
      border-color: ${style.border};
      padding: ${style.padding};
      margin: ${style.margin};
      &:focus,
      &.ant-input-affix-wrapper-focused {
        border-color: ${style.accent};
      }
      &:hover {
        border-color: ${style.accent};
      }
      .ant-input-clear-icon svg:hover {
        opacity: 0.65;
      }
      .ant-color-picker-trigger-text {
        font-size: ${style.textSize};
      }
    }
  `;
}

const ColorPickerWrapper = styled(ColorPicker) <{
  $style: InputLikeStyleType;
  $disabledStyle?: DisabledInputStyleType;
}>`
  display: flex;
  justify-content: flex-start;
  box-shadow: ${(props) =>
    `${props.$style?.boxShadow} ${props.$style?.boxShadowColor}`};
  ${(props) => props.$style && getStyle(props.$style)}
  
  /* Disabled state styling */
  &:disabled,
  &.ant-input-disabled {
    color: ${(props) => props.$disabledStyle?.disabledText};
    background: ${(props) => props.$disabledStyle?.disabledBackground};
    border-color: ${(props) => props.$disabledStyle?.disabledBorder};
    cursor: not-allowed;
  }
`;

const colorPickerTriggerOption = [
  { label: trans('colorPicker.click'), value: 'click' },
  { label: trans('colorPicker.hover'), value: 'hover' },
] as const;

export const colorPickerEvent = eventHandlerControl([
  changeEvent
] as const);

const childrenMap = {
  ...textInputChildren,
  value: stringExposingStateControl('value', '#3377ff'),
  color: jsonObjectExposingStateControl('color', {}),
  trigger: dropdownControl(colorPickerTriggerOption, 'click'),
  disabledAlpha: BoolControl,
  showPresets: BoolControl,
  onEvent: colorPickerEvent,
  presets: withDefault(ArrayOrJSONObjectControl, JSON.stringify(presets, null, 2)),
  style: styleControl(InputFieldStyle, 'style'), 
  labelStyle:styleControl(LabelStyle, 'labelStyle'), 
  inputFieldStyle: styleControl(InputLikeStyle, 'inputFieldStyle'),
  animationStyle: styleControl(AnimationStyle, 'animationStyle'),
  disabledStyle: styleControl(DisabledInputStyle, 'disabledStyle'),
};

export const ColorPickerComp = new UICompBuilder(childrenMap, (props) => {
  return props.label({
    children: (
      <ColorPickerWrapper
        $style={props.inputFieldStyle}
        $disabledStyle={props.disabledStyle}
        value={props?.value?.value}
        disabledAlpha={props.disabledAlpha}
        showText={value => value.toHexString().toUpperCase()}
        allowClear
        trigger={props.trigger}
        disabled={props.disabled}
        onChange={(value) => {
          props.value.onChange(value.toHexString().toUpperCase())
          props.color.onChange({
            hex: value.toHexString().toUpperCase(),
            hsb: value.toHsb(),
            rgb: value.toRgb() as any,
          })
          props.onEvent('change')
        }}
        presets={props.showPresets && !_.isEmpty(props.presets) ? [(props.presets as any)] : []}
      />
    ),
    style: props.style,
    labelStyle: props.labelStyle,
    inputFieldStyle:props.inputFieldStyle,
    animationStyle:props.animationStyle,
  });
})
  .setPropertyViewFn((children) => {
    return (
      <>
        <Section name={sectionNames.basic}>
          {children.value.propertyView({ label: trans("prop.defaultValue") })}
        </Section>

        <FormDataPropertyView {...children} />
        {children.label.getPropertyView()}
        <Section name={sectionNames.interaction}>
          {children.onEvent.getPropertyView()}
          {disabledPropertyView(children)}
          {showDataLoadingIndicatorsPropertyView(children)}
        </Section>

        <Section name={sectionNames.advanced}>
          {children.trigger.propertyView({ label: trans("colorPicker.trigger"), radioButton: true })}
          {children.disabledAlpha.propertyView({ label: trans("colorPicker.disabledAlpha") })}
          {children.showPresets.propertyView({ label: trans("colorPicker.showPresets") })}
          {children.showPresets.getView() && children.presets.propertyView({ label: trans("colorPicker.recommended") })}
        </Section>

        <Section name={sectionNames.layout}>{hiddenPropertyView(children)}</Section>

        <Section name={sectionNames.style}>{children.style.getPropertyView()}</Section>
        <Section name={sectionNames.labelStyle}>{children.labelStyle.getPropertyView()}</Section>
        <Section name={sectionNames.inputFieldStyle}>{children.inputFieldStyle.getPropertyView()}</Section>
        <Section name={trans("prop.disabledStyle")}>{children.disabledStyle.getPropertyView()}</Section>
        <Section name={sectionNames.animationStyle} hasTooltip={true}>{children.animationStyle.getPropertyView()}</Section>
      </>
    );
  })
  .setExposeStateConfigs([
    new NameConfig("value", trans("export.inputValueDesc")),
    new NameConfig("color", trans("export.inputValueDesc")),
    new NameConfig("disabled", trans("prop.disabled")),
  ])
  .build();
