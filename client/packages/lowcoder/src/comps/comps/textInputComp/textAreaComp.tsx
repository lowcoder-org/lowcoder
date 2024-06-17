import {
  NameConfig,
  NameConfigPlaceHolder,
  NameConfigRequired,
  withExposingConfigs,
} from "comps/generators/withExposing";
import { Section, sectionNames } from "lowcoder-design";
import { BoolControl } from "../../controls/boolControl";
import { AutoHeightControl } from "../../controls/autoHeightControl";
import { UICompBuilder, withDefault } from "../../generators";
import { FormDataPropertyView } from "../formComp/formDataConstants";
import {
  fixOldInputCompData,
  getStyle,
  TextInputBasicSection,
  textInputChildren,
  TextInputConfigs,
  TextInputInteractionSection,
  TextInputValidationSection,
  useTextInputProps,
} from "./textInputConstants";
import { withMethodExposing, refMethods } from "../../generators/withMethodExposing";
import { styleControl } from "comps/controls/styleControl";
import styled from "styled-components";
import {  AnimationStyle, InputFieldStyle, InputLikeStyle, InputLikeStyleType, LabelStyle } from "comps/controls/styleControlConstants";
import { TextArea } from "components/TextArea";
import {
  allowClearPropertyView,
  hiddenPropertyView,
  readOnlyPropertyView,
} from "comps/utils/propertyUtils";
import { trans } from "i18n";
import { RefControl } from "comps/controls/refControl";
import { TextAreaRef } from "antd/es/input/TextArea";
import { blurMethod, focusWithOptions } from "comps/utils/methodUtils";

import React, { useContext, useEffect } from "react";
import { EditorContext } from "comps/editorState";
import { migrateOldData } from "comps/generators/simpleGenerators";
import { setInitialCompStyles } from "../../utils/themeUtil";
import { ThemeContext } from "../../utils/themeContext";
import { CompTypeContext } from "../../utils/compTypeContext";

const TextAreaStyled = styled(TextArea)<{
  $style: InputLikeStyleType;
}>`
  box-shadow: ${(props) =>
    `${props.$style?.boxShadow} ${props.$style?.boxShadowColor}`};
  ${(props) => props.$style && getStyle(props.$style)}
`;

const Wrapper = styled.div<{
  $style: InputLikeStyleType;
}>`
  height: 100% !important;
  
  .ant-input { 
    height:100% !important;
  }

  .ant-input-clear-icon {
    opacity: 0.75;
    color: ${(props) => props.$style.text};
    top: 10px;

    &:hover {
      opacity: 0.9;
      color: ${(props) => props.$style.text};
    }
  }
`;

let TextAreaTmpComp = (function () {
  const childrenMap = {
    ...textInputChildren,
    viewRef: RefControl<TextAreaRef>,
    allowClear: BoolControl,
    autoHeight: withDefault(AutoHeightControl, "fixed"),
    style: styleControl(InputFieldStyle, 'style') , 
    labelStyle: styleControl(LabelStyle ,'labelStyle' ),
    inputFieldStyle: styleControl(InputLikeStyle , 'inputFieldStyle'),
    animationStyle: styleControl(AnimationStyle, 'animationStyle')
  };
  return new UICompBuilder(childrenMap, (props, dispatch) => {
    const [inputProps, validateState] = useTextInputProps(props);
    const theme = useContext(ThemeContext);
    const compType = useContext(CompTypeContext);
    const compTheme = theme?.theme?.components?.[compType];
    const styleProps: Record<string, any> = {};
    ['style', 'labelStyle', 'inputFieldStyle', 'animationStyle'].forEach((key: string) => {
      styleProps[key] = (props as any)[key];
    });

    useEffect(() => {
      setInitialCompStyles({
        dispatch,
        compTheme,
        styleProps,
      });
    }, []);

    return props.label({
      required: props.required,
      inputFieldStyle:props.inputFieldStyle,
      children: (
        <Wrapper $style={props.inputFieldStyle}>
          <TextAreaStyled
            {...inputProps}
            ref={props.viewRef}
            allowClear={props.allowClear}
            style={{ height: "100% !important", resize: "vertical" }}
            $style={props.inputFieldStyle}
          />
        </Wrapper>
      ),
      style: props.style,
      labelStyle: props.labelStyle,
      animationStyle: props.animationStyle,
      ...validateState,
    });
  })
    .setPropertyViewFn((children) => (
      <>
        <TextInputBasicSection {...children} />
        <FormDataPropertyView {...children} />

        {["layout", "both"].includes(useContext(EditorContext).editorModeStatus) && (
          children.label.getPropertyView()
        )}

        {["logic", "both"].includes(useContext(EditorContext).editorModeStatus) && (
          <><TextInputInteractionSection {...children} />
            <Section name={sectionNames.layout}>
              {children.autoHeight.getPropertyView()}
              {hiddenPropertyView(children)}
            </Section>
            <Section name={sectionNames.advanced}>
              {allowClearPropertyView(children)}
              {readOnlyPropertyView(children)}
            </Section>
            <TextInputValidationSection {...children} /></>
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
    ))
    .build();
})();

TextAreaTmpComp = class extends TextAreaTmpComp {
  override autoHeight(): boolean {
    return this.children.autoHeight.getView();
  }
};

TextAreaTmpComp = migrateOldData(TextAreaTmpComp, fixOldInputCompData);

const TextareaTmp2Comp = withMethodExposing(
  TextAreaTmpComp,
  refMethods([focusWithOptions, blurMethod])
);

export const TextAreaComp = withExposingConfigs(TextareaTmp2Comp, [
  new NameConfig("value", trans("export.inputValueDesc")),
  NameConfigPlaceHolder,
  NameConfigRequired,
  ...TextInputConfigs,
]);
