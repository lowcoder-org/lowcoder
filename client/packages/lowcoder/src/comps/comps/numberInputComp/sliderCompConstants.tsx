import { BoolCodeControl, NumberControl } from "../../controls/codeControl";
import { LabelControl } from "../../controls/labelControl";
import { withDefault } from "../../generators";
import { ChangeEventHandlerControl } from "../../controls/eventHandlerControl";
import { Section, sectionNames } from "lowcoder-design";
import { RecordConstructorToComp } from "lowcoder-core";
import { styleControl } from "comps/controls/styleControl";
import {  AnimationStyle, InputFieldStyle, LabelStyle, SliderStyle, SliderStyleType, heightCalculator, widthCalculator  } from "comps/controls/styleControlConstants";
import styled, { css } from "styled-components";
import { default as Slider } from "antd/es/slider";
import { darkenColor, fadeColor } from "lowcoder-design";
import { disabledPropertyView, hiddenPropertyView } from "comps/utils/propertyUtils";
import { IconControl } from "comps/controls/iconControl";
import { trans } from "i18n";

import { useContext } from "react";
import { EditorContext } from "comps/editorState";

const getStyle = (style: SliderStyleType, vertical: boolean) => {
  return css`
    &.ant-slider:not(.ant-slider-disabled) {
      &,
      &:hover,
      &:focus {
        .ant-slider-rail {
          background-color: ${style.track};
        }
        .ant-slider-track {
          background-color: ${style.fill};
        }
        .ant-slider-handle {
          background-color: ${style.thumb};
          border-color: ${style.thumbBorder};
        }
      }
      &:hover {
        .ant-slider-rail {
          background-color: ${darkenColor(style.track, 0.1)};
        }
      }
      .ant-slider-handle:focus {
        box-shadow: 0 0 0 5px ${fadeColor(darkenColor(style.thumbBorder, 0.08), 0.12)};
      }
      ${vertical && css`
        width: auto;	
        min-height: calc(300px - ${style.margin});
        margin: ${style.margin} auto !important;
      `}
    }
  `;
};

export const SliderStyled = styled(Slider)<{ $style: SliderStyleType, vertical: boolean }>`
  ${(props) => props.$style && getStyle(props.$style, props.vertical)}
`;

export const SliderWrapper = styled.div<{ vertical: boolean }>`
  width: 100%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  .ant-slider {
    width: 100%;
  }
`

export const SliderChildren = {
  max: withDefault(NumberControl, "100"),
  min: withDefault(NumberControl, "0"),
  step: withDefault(NumberControl, "1"),
  label: LabelControl,
  disabled: BoolCodeControl,
  onEvent: ChangeEventHandlerControl,
  style: withDefault(styleControl(InputFieldStyle),{background:'transparent'}) , 
  labelStyle:styleControl(LabelStyle.filter((style)=> ['accent','validate'].includes(style.name) === false)),
  prefixIcon: IconControl,
  suffixIcon: IconControl,
  inputFieldStyle:styleControl(SliderStyle),
  animationStyle:styleControl(AnimationStyle)
};

export const SliderPropertyView = (
  children: RecordConstructorToComp<typeof SliderChildren & { hidden: typeof BoolCodeControl }>
) => (
  <>

    {["logic", "both"].includes(useContext(EditorContext).editorModeStatus) && (
      <Section name={sectionNames.interaction}>
        {children.onEvent.getPropertyView()}
        {disabledPropertyView(children)}
        {hiddenPropertyView(children)}
      </Section>
    )}

    {["layout", "both"].includes(useContext(EditorContext).editorModeStatus) && (
      children.label.getPropertyView()
    )}

    {["layout", "both"].includes(useContext(EditorContext).editorModeStatus) && (
      <><Section name={sectionNames.layout}>
          {children.prefixIcon.propertyView({ label: trans("button.prefixIcon") })}
          {children.suffixIcon.propertyView({ label: trans("button.suffixIcon") })}
        </Section>
        <Section name={sectionNames.style}>
          {children.style.getPropertyView()}
        </Section>
        <Section name={sectionNames.labelStyle}>
          {children.labelStyle.getPropertyView()}
        </Section>
        <Section name={sectionNames.inputFieldStyle}>
          {children.inputFieldStyle.getPropertyView()}
        </Section>
        <Section name={sectionNames.animationStyle} hasTooltip={true}>
          {children.animationStyle.getPropertyView()}
        </Section>
      </>
    )}
  </>
);
