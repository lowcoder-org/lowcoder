import { useState, useEffect } from "react";
import {
  NameConfig,
  NameConfigPlaceHolder,
  NameConfigRequired,
  withExposingConfigs,
} from "comps/generators/withExposing";
import { Section, sectionNames } from "lowcoder-design";
import { BoolControl } from "../../controls/boolControl";
import { AutoHeightControl } from "../../controls/autoHeightControl";
import { UICompBuilder } from "../../generators";
import { FormDataPropertyView } from "../formComp/formDataConstants";
import {
  checkMentionListData,
  textInputChildren,
} from "./textInputConstants";
import {
  withMethodExposing,
  refMethods,
} from "../../generators/withMethodExposing";
import { styleControl } from "comps/controls/styleControl";
import styled from "styled-components";
import {
  InputLikeStyle,
  InputLikeStyleType,
} from "comps/controls/styleControlConstants";
import {
  disabledPropertyView,
  hiddenPropertyView,
  maxLengthPropertyView,
  minLengthPropertyView,
  readOnlyPropertyView,
  requiredPropertyView,
} from "comps/utils/propertyUtils";
import { booleanExposingStateControl } from "comps/controls/codeStateControl";
import { trans } from "i18n";
import { RefControl } from "comps/controls/refControl";
import { TextAreaRef } from "antd/lib/input/TextArea";
import { default as ConfigProvider } from "antd/es/config-provider";
import { default as Mentions, MentionsOptionProps } from "antd/es/mentions";
import { blurMethod, focusWithOptions } from "comps/utils/methodUtils";
import {
  textInputValidate,
} from "../textInputComp/textInputConstants";
import { jsonControl } from "@lowcoder-ee/comps/controls/codeControl";
import {
  submitEvent,
  eventHandlerControl,
  mentionEvent,
  focusEvent,
  blurEvent,
  changeEvent
} from "comps/controls/eventHandlerControl";

import React, { useContext } from "react";
import { EditorContext } from "comps/editorState";

const Wrapper = styled.div<{
  $style: InputLikeStyleType;
}>`
  box-sizing:border-box;
  .rc-textarea {
    background-color:${(props) => props.$style.background};
    padding:${(props) => props.$style.padding};
    text-transform:${(props)=>props.$style.textTransform};
    text-decoration:${(props)=>props.$style.textDecoration};
    margin: 0px 3px 0px 3px !important;
  }

  .ant-input-clear-icon {
    opacity: 0.45;
    color: ${(props) => props.$style.text};
    top: 10px;

    &:hover {
      opacity: 0.65;
      color: ${(props) => props.$style.text};
    }
  }
`;

const EventOptions = [
  focusEvent,
  blurEvent,
  changeEvent,
  mentionEvent,
  submitEvent,
] as const;

let MentionTmpComp = (function () {
  const childrenMap = {
    ...textInputChildren,
    viewRef: RefControl<TextAreaRef>,
    allowClear: BoolControl,
    autoHeight: AutoHeightControl,
    style: styleControl(InputLikeStyle),
    mentionList: jsonControl(checkMentionListData, {
      "@": ["Li Lei", "Han Meimei"],
      "#": ["123", "456", "789"],
    }),
    onEvent: eventHandlerControl(EventOptions),
    invalid: booleanExposingStateControl("invalid"),
  };

  return new UICompBuilder(childrenMap, (props) => {
    const { mentionList } = props;
    const [validateState, setvalidateState] = useState({});
    const [activationFlag, setActivationFlag] = useState(false);
    const [prefix, setPrefix] = useState<PrefixType>("@");
    type PrefixType = "@" | keyof typeof mentionList;

    const onSearch = (_: string, newPrefix: PrefixType) => {
      setPrefix(newPrefix);
    };
    const onChange = (value: string) => {
      props.value.onChange(value);
      props.onEvent("change");
    };

    const onPressEnter = (e: any) => {
      if (e.shiftKey) {
        e.preventDefault();
        props.onEvent("submit");
      }
    };

    const onSelect = (option: MentionsOptionProps) => {
      props.onEvent("mention");
    };
    const getValidate = (value: any): "" | "warning" | "error" | undefined => {
      if (
        value.hasOwnProperty("validateStatus") &&
        value["validateStatus"] === "error"
      )
        return "error";
      return "";
    };

    const getTextInputValidate = () => {
      return {
        value: { value: props.value.value },
        required: props.required,
        minLength: props?.minLength ?? 0,
        maxLength: props?.maxLength ?? 0,
        validationType: props.validationType,
        regex: props.regex,
        customRule: props.customRule,
      };
    };

    useEffect(() => {
      if (activationFlag) {
        const temp = textInputValidate(getTextInputValidate());
        setvalidateState(temp);
        props.invalid.onChange(temp.validateStatus !== "");
      }
    }, [
      props.value.value,
      props.required,
      props?.minLength,
      props?.maxLength,
      props.validationType,
      props.regex,
      props.customRule,
    ]);
    return props.label({
      required: props.required,
      children: (
        <Wrapper $style={props.style}>
          <ConfigProvider
            theme={{
              token: {
                colorBgContainer: props.style.background,
                colorBorder: props.style.border,
                borderRadius: parseInt(props.style.radius),
                colorText: props.style.text,
                colorPrimary: props.style.accent,
              },
            }}
          >
            <Mentions
              prefix={Object.keys(mentionList)}
              onFocus={() => {
                setActivationFlag(true);
                props.onEvent("focus");
              }}
              onBlur={() => props.onEvent("blur")}
              onPressEnter={onPressEnter}
              onSearch={onSearch}
              onChange={onChange}
              onSelect={onSelect}
              placeholder={props.placeholder}
              value={props.value.value}
              disabled={props.disabled}
              status={getValidate(validateState)}
              options={(mentionList[prefix] || []).map((value: string) => ({
                key: value,
                value,
                label: value,
              }))}
              autoSize={props.autoHeight}
              style={{
                height: "100%",
                maxHeight: "100%",
                resize: "none",
                // padding: props.style.padding,
                fontStyle: props.style.fontStyle,
                fontFamily: props.style.fontFamily,
                borderWidth: props.style.borderWidth,
                fontWeight: props.style.textWeight,
                fontSize: props.style.textSize
              }}
              readOnly={props.readOnly}
            />
          </ConfigProvider>
        </Wrapper>
      ),
      style: props.style,
      ...validateState,
    });
  })
    .setPropertyViewFn((children) => (
      <>
        <Section name={sectionNames.basic}>
          {children.value.propertyView({ label: trans("prop.defaultValue") })}
          {children.placeholder.propertyView({
            label: trans("prop.placeholder"),
          })}
          {["logic", "both"].includes(useContext(EditorContext).editorModeStatus) && (
            children.mentionList.propertyView({
              label: trans("mention.mentionList"),
            })
          )}
        </Section>
        <FormDataPropertyView {...children} />

        {["layout", "both"].includes(useContext(EditorContext).editorModeStatus) && (
          children.label.getPropertyView()
        )}

        {["logic", "both"].includes(useContext(EditorContext).editorModeStatus) && (
          <><Section name={sectionNames.interaction}>
            {children.onEvent.getPropertyView()}
            {disabledPropertyView(children)}
          </Section>
            <Section name={sectionNames.layout}>{hiddenPropertyView(children)}</Section>
            <Section name={sectionNames.advanced}>
              {readOnlyPropertyView(children)}
            </Section><Section name={sectionNames.validation}>
              {requiredPropertyView(children)}
              {children.validationType.propertyView({
                label: trans("prop.textType"),
              })}
              {minLengthPropertyView(children)}
              {maxLengthPropertyView(children)}
              {children.customRule.propertyView({})}
            </Section></>
        )}

        {["layout", "both"].includes(useContext(EditorContext).editorModeStatus) && (
          <><Section name={sectionNames.style}>
            {children.style.getPropertyView()}
          </Section></>
        )}
      </>
    ))
    .build();
})();

MentionTmpComp = class extends MentionTmpComp {
  override autoHeight(): boolean {
    return this.children.autoHeight.getView();
  }
};

const TextareaTmp2Comp = withMethodExposing(
  MentionTmpComp,
  refMethods([focusWithOptions, blurMethod])
);

export const MentionComp = withExposingConfigs(TextareaTmp2Comp, [
  new NameConfig("value", trans("export.inputValueDesc")),
  NameConfigPlaceHolder,
  NameConfigRequired,
  new NameConfig("invalid", trans("export.invalidDesc")),
  new NameConfig("hidden", trans("export.hiddenDesc")),
  new NameConfig("disabled", trans("export.disabledDesc")),
]);
