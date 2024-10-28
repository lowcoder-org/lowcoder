import { BoolControl } from "comps/controls/boolControl";
import { styleControl } from "comps/controls/styleControl";
import { ColorPickerStyle, ColorPickerStyleType } from "comps/controls/styleControlConstants";
import { NameConfig } from "comps/generators/withExposing";
import styled, { css } from "styled-components";
import { UICompBuilder, withDefault } from "../../generators";
import { textInputChildren } from "../textInputComp/textInputConstants";
import { trans } from "i18n";
import { ColorPicker } from 'antd';
import { presets } from "./colorPickerConstants";
import _ from "lodash"
import { changeEvent, eventHandlerControl } from "comps/controls/eventHandlerControl";
import { jsonObjectExposingStateControl, stringExposingStateControl } from "comps/controls/codeStateControl";
import { dropdownControl } from "comps/controls/dropdownControl";
import { ArrayOrJSONObjectControl } from "comps/controls/codeControl";
import {viewMode} from "@lowcoder-ee/util/editor";
import React from "react";
const SetPropertyViewColorPicker =  React.lazy( async () => await import("./setProperty").then(module => ({default: module.SetPropertyViewColorPicker})))
export function getStyle(style: ColorPickerStyleType) {
    return css`
    border-radius: ${style.radius};
    &:not(.ant-input-disabled, .ant-input-affix-wrapper-disabled),
    input {
      background-color: ${style.background};
      color:${style.text};
      font-weight:${style.textWeight};
      font-family:${style.fontFamily};
      border-color: ${style.border};
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
    }
  `;
}

const ColorPickerWrapper = styled(ColorPicker) <{ $style: ColorPickerStyleType }>`
  width: 100%;
  display: flex;
  justify-content: flex-start;
  ${(props) => props.$style && getStyle(props.$style)}
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
    style: styleControl(ColorPickerStyle , 'style'),
    color: jsonObjectExposingStateControl('color', {}),
    trigger: dropdownControl(colorPickerTriggerOption, 'click'),
    disabledAlpha: BoolControl,
    showPresets: BoolControl,
    onEvent: colorPickerEvent,
    presets: withDefault(ArrayOrJSONObjectControl, JSON.stringify(presets, null, 2)),
};

let ColorPickerComps = new UICompBuilder(childrenMap, (props) => {
    return props.label({
        children: (
            <ColorPickerWrapper
                $style={props.style}
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
    });
})

if (viewMode() === "edit") {
    ColorPickerComps.setPropertyViewFn((children) => <SetPropertyViewColorPicker {...children}></SetPropertyViewColorPicker>);
}

const ColorPickerComp = ColorPickerComps
    .setExposeStateConfigs([
        new NameConfig("value", trans("export.inputValueDesc")),
        new NameConfig("color", trans("export.inputValueDesc")),
        new NameConfig("disabled", trans("prop.disabled")),
    ])
    .build();
export { ColorPickerComp };