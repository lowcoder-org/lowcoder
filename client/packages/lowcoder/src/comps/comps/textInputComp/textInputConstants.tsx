import { BoolControl } from "comps/controls/boolControl";
import { check } from "util/convertUtils";
import {
  BoolCodeControl,
  CustomRuleControl,
  NumberControl,
  RegexControl,
  StringControl,
} from "comps/controls/codeControl";
import { stringExposingStateControl } from "comps/controls/codeStateControl";
import { LabelControl } from "comps/controls/labelControl";
import { InputLikeStyleType, LabelStyleType, heightCalculator, widthCalculator } from "comps/controls/styleControlConstants";
import { Section, sectionNames, ValueFromOption } from "lowcoder-design";
import _ from "lodash";
import { css } from "styled-components";
import { EMAIL_PATTERN, URL_PATTERN } from "util/stringUtils";
import { MultiBaseComp, RecordConstructorToComp, RecordConstructorToView } from "lowcoder-core";
import { dropdownControl } from "../../controls/dropdownControl";
import { InputEventHandlerControl } from "../../controls/eventHandlerControl";
import {
  ChildrenTypeToDepsKeys,
  CommonNameConfig,
  depsConfig,
} from "../../generators/withExposing";
import { formDataChildren } from "../formComp/formDataConstants";
import {
  disabledPropertyView,
  maxLengthPropertyView,
  minLengthPropertyView,
  placeholderPropertyView,
  regexPropertyView,
  requiredPropertyView,
  showDataLoadingIndicatorsPropertyView,
} from "comps/utils/propertyUtils";
import { trans } from "i18n";
import { ChangeEvent, useEffect, useRef, useState } from "react";
import { refMethods } from "comps/generators/withMethodExposing";
import { InputRef } from "antd/es/input";
import {
  blurMethod,
  clickMethod,
  focusWithOptions,
  selectMethod,
  setRangeTextMethod,
  setSelectionRangeMethod,
} from "comps/utils/methodUtils";
import { RefControl } from "comps/controls/refControl";
import { EvalParamType } from "comps/controls/actionSelector/executeCompTypes";

export const TextInputValidationOptions = [
  {
    label: "Text",
    value: "Text",
    extra: /.*/,
    help: "",
  },
  {
    label: "Email",
    value: "Email",
    extra: EMAIL_PATTERN,
    help: trans("validationDesc.email"),
  },
  {
    label: "URL",
    value: "URL",
    extra: URL_PATTERN,
    help: trans("validationDesc.url"),
  },
  {
    label: "Regex",
    value: "Regex",
    extra: undefined,
    help: trans("validationDesc.regex"),
  },
] as const;

type ValidationParams = {
  value: { value: string };
  required: boolean;
  minLength: number;
  maxLength: number;
  validationType: ValueFromOption<typeof TextInputValidationOptions>;
  regex: RegExp;
  customRule: string;
};

const valueInfoMap = _.fromPairs(
  TextInputValidationOptions.map((option) => [option.value, option])
);

export const textInputValidate = (
  props: ValidationParams
): {
  validateStatus: "success" | "warning" | "error" | "";
  help?: string;
} => {
  if (props.customRule) {
    return { validateStatus: "error", help: props.customRule };
  }
  const value = props.value.value;
  if (props.required && value.length === 0) {
    return { validateStatus: "error", help: trans("prop.required") };
  }
  if (props.maxLength > 0 && value.length > props.maxLength) {
    return {
      validateStatus: "error",
      help: trans("validationDesc.maxLength", { length: value.length, maxLength: props.maxLength }),
    };
  }
  if (props.minLength > 0 && value.length < props.minLength) {
    return {
      validateStatus: "error",
      help: trans("validationDesc.minLength", { length: value.length, minLength: props.minLength }),
    };
  }
  const optionValue = props.validationType;
  const regex: RegExp = valueInfoMap[optionValue]?.extra ?? props.regex; // pass if empty by default
  if (value && !regex.test(value)) {
    return { validateStatus: "error", help: valueInfoMap[optionValue].help };
  }
  return { validateStatus: "" };
};

const TextInputInvalidConfig = depsConfig<TextInputComp, ChildrenTypeToDepsKeys<TextInputComp>>({
  name: "invalid",
  desc: trans("export.invalidDesc"),
  depKeys: ["value", "required", "minLength", "maxLength", "validationType", "regex", "customRule"],
  func: (input) =>
    textInputValidate({
      ...input,
      value: { value: input.value },
    }).validateStatus !== "",
});

export const TextInputConfigs = [TextInputInvalidConfig, ...CommonNameConfig];

export const textInputChildren = {
  defaultValue: stringExposingStateControl("defaultValue"),
  value: stringExposingStateControl("value"),
  disabled: BoolCodeControl,
  label: LabelControl,
  placeholder: StringControl,
  onEvent: InputEventHandlerControl,
  readOnly: BoolControl,

  // validation
  required: BoolControl,
  showValidationWhenEmpty: BoolControl,
  minLength: NumberControl,
  maxLength: NumberControl,
  validationType: dropdownControl(TextInputValidationOptions, "Text"),
  regex: RegexControl,
  customRule: CustomRuleControl,

  ...formDataChildren,
};

export const textInputProps = (props: RecordConstructorToView<typeof textInputChildren>) => ({
  disabled: props.disabled,
  readOnly: props.readOnly,
  placeholder: props.placeholder,
  defaultValue: props.defaultValue.value,
  value: props.value.value,
  onFocus: () => props.onEvent("focus"),
  onBlur: () => props.onEvent("blur"),
  onPressEnter: () => props.onEvent("submit"),
});

export const useTextInputProps = (props: RecordConstructorToView<typeof textInputChildren>) => {
  const [validateState, setValidateState] = useState({});
  const changeRef = useRef(false)
  const touchRef = useRef(false);

  const propsRef = useRef<RecordConstructorToView<typeof textInputChildren>>(props);
  propsRef.current = props;

  const defaultValue = { ...props.defaultValue }.value;
  const inputValue = { ...props.value }.value;

  useEffect(() => {
    props.value.onChange(defaultValue)
  }, [defaultValue]);

  useEffect(() => {
    if (!changeRef.current) return;

    setValidateState(
      textInputValidate({
        ...propsRef.current,
        value: {
          value: inputValue,
        },
      })
    );
    propsRef.current.onEvent("change");
    changeRef.current = false;
  }, [inputValue]);

  useEffect(() => {
    if (!touchRef.current) return;

    setValidateState(
      textInputValidate({
        ...propsRef.current,
        value: {
          value: props.value.value,
        },
      })
    );
  }, [props.customRule])

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    props.value.onChange(e.target.value);
    changeRef.current = true;
    touchRef.current = true;
  };

  return [
    {
      ...textInputProps(props),
      onChange: handleChange,
    },
    validateState,
  ];
};

type TextInputComp = RecordConstructorToComp<typeof textInputChildren>;

export const TextInputBasicSection = (children: TextInputComp) => (
  <Section name={sectionNames.basic}>
    {children.defaultValue.propertyView({ label: trans("prop.defaultValue") })}
    {placeholderPropertyView(children)}
  </Section>
);

export const TextInputInteractionSection = (children: TextInputComp) => (
  <Section name={sectionNames.interaction}>
    {children.onEvent.getPropertyView()}
    {disabledPropertyView(children)}
    {showDataLoadingIndicatorsPropertyView(children as any)}
  </Section>
);

export const TextInputValidationSection = (children: TextInputComp) => (
  <Section name={sectionNames.validation}>
    {requiredPropertyView(children)}
    {children.showValidationWhenEmpty.propertyView({label: trans("prop.showEmptyValidation")})}
    {children.validationType.propertyView({ label: trans("prop.textType") })}
    {valueInfoMap[children.validationType.getView()]?.extra === undefined &&
      regexPropertyView(children)}
    {minLengthPropertyView(children)}
    {maxLengthPropertyView(children)}
    {children.customRule.propertyView({})}
  </Section>
);

export function getStyle(style: InputLikeStyleType, labelStyle?: LabelStyleType) {
  return css`
    border-radius: ${style.radius};
    border-width: ${style.borderWidth};
    padding: ${style.padding};	
    // still use antd style when disabled
    &:not(.ant-input-disabled, .ant-input-affix-wrapper-disabled),
    input {
      color: ${style.text};
      font-size: ${style.textSize};
      font-weight: ${style.textWeight};
      font-family: ${style.fontFamily};
      font-style:${style.fontStyle};
      text-transform:${style.textTransform};
      text-decoration:${style.textDecoration};
      background-color: ${style.background};
      border-color: ${style.border};
      // line-height: ${style.lineHeight};

      &:focus,
      &.ant-input-affix-wrapper-focused {
        border-color: ${style.accent};
      }

      &:hover {
        border-color: ${style.accent};
      }

      &::-webkit-input-placeholder {
        color: ${style.text};
        opacity: 0.4;
      }

      .ant-input-show-count-suffix,
      .ant-input-prefix,
      .ant-input-suffix svg {
        opacity: 0.45;
        color: ${style.text};
      }

      .ant-input-clear-icon svg:hover {
        opacity: 0.65;
      }
    }
  `;
}

export const inputRefMethods = [
  ...refMethods<InputRef>([focusWithOptions, blurMethod, selectMethod, setSelectionRangeMethod]),
  {
    method: clickMethod,
    execute: (comp: MultiBaseComp<{ viewRef: RefControl<InputRef> }>, params: EvalParamType[]) =>
      comp.children.viewRef.viewRef?.input?.click(),
  },
  {
    method: setRangeTextMethod,
    execute: (comp: MultiBaseComp<{ viewRef: RefControl<InputRef> }>, params: EvalParamType[]) =>
      (comp.children.viewRef.viewRef?.input?.setRangeText as any)?.(...params),
  },
];

export function checkMentionListData(data: any) {
  if (data === "") return {}
  for (const key in data) {
    check(data[key], ["array"], key, (node) => {
      check(node, ["string"],);
      return node
    })
  }
  return data
}

// separate defaultValue and value for old components
export function fixOldInputCompData(oldData: any) {
  if (!oldData) return oldData;
  if (Boolean(oldData.value) && !Boolean(oldData.defaultValue)) {
    const value = oldData.value;
    return {
      ...oldData,
      defaultValue: value,
      value: '',
    };
  }
  return oldData;
}
