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
  textInputChildren,
  TextInputConfigs,
  useTextInputProps,
} from "./textInputConstants";
import { withMethodExposing, refMethods } from "../../generators/withMethodExposing";
import { styleControl } from "comps/controls/styleControl";
import styled from "styled-components";
import {  AnimationStyle, InputFieldStyle, InputLikeStyle, InputLikeStyleType, LabelStyle } from "comps/controls/styleControlConstants";
import { TextArea } from "components/TextArea";
import { trans } from "i18n";
import { RefControl } from "comps/controls/refControl";
import { TextAreaRef } from "antd/es/input/TextArea";
import { blurMethod, focusWithOptions } from "comps/utils/methodUtils";
import React from "react";
import { migrateOldData } from "comps/generators/simpleGenerators";
import {viewMode} from "@lowcoder-ee/util/editor";
const SetPropertyViewTextAreaComp =  React.lazy( async () => await import("./setProperty").then(module => ({default: module.SetPropertyViewTextAreaComp})))
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
    textAreaScrollBar: withDefault(BoolControl, false),
    inputFieldStyle: styleControl(InputLikeStyle , 'inputFieldStyle'),
    animationStyle: styleControl(AnimationStyle, 'animationStyle')
  };
  let builder = new UICompBuilder(childrenMap, (props) => {
    const [inputProps, validateState] = useTextInputProps(props);

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
      showValidationWhenEmpty: props.showValidationWhenEmpty,
      ...validateState,
    });
  })
  if (viewMode() === "edit") {
    builder.setPropertyViewFn((children) => <SetPropertyViewTextAreaComp {...children}></SetPropertyViewTextAreaComp>);
  }

      return builder
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
