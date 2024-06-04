import React, { useEffect, useState } from "react";
import { Input, Section, sectionNames } from "lowcoder-design";
import { BoolControl } from "comps/controls/boolControl";
import { styleControl } from "comps/controls/styleControl";
import {
  AnimationStyle,
  InputFieldStyle,
  InputLikeStyle,
  InputLikeStyleType,
  LabelStyle,
} from "comps/controls/styleControlConstants";
import {
  NameConfig,
  NameConfigPlaceHolder,
  NameConfigRequired,
  withExposingConfigs,
} from "comps/generators/withExposing";
import styled, { css } from "styled-components";
import { UICompBuilder, withDefault } from "../../generators";
import { FormDataPropertyView } from "../formComp/formDataConstants";
import { jsonControl } from "comps/controls/codeControl";
import { dropdownControl } from "comps/controls/dropdownControl";
import {
  getStyle,
  TextInputBasicSection,
  textInputChildren,
  TextInputConfigs,
  TextInputInteractionSection,
  textInputValidate,
  TextInputValidationSection,
} from "../textInputComp/textInputConstants";
import {
  allowClearPropertyView,
  hiddenPropertyView,
} from "comps/utils/propertyUtils";
import { trans } from "i18n";
import { IconControl } from "comps/controls/iconControl";
import { hasIcon } from "comps/utils";
import { InputRef } from "antd/es/input";
import { default as ConfigProvider } from "antd/es/config-provider";
import { default as AutoComplete } from "antd/es/auto-complete";
import { RefControl } from "comps/controls/refControl";
import {
  booleanExposingStateControl,
} from "comps/controls/codeStateControl";

import { getDayJSLocale } from "i18n/dayjsLocale";
import {
  autoCompleteDate,
  itemsDataTooltip,
  convertAutoCompleteData,
  valueOrLabelOption,
  autoCompleteRefMethods,
  autoCompleteType,
  autocompleteIconColor,
  componentSize,
} from "./autoCompleteConstants";



const InputStyle = styled(Input) <{ $style: InputLikeStyleType }>`
box-shadow: ${props=>`${props.$style?.boxShadow} ${props.$style?.boxShadowColor}`};
  ${(props) => css`
    ${getStyle(props.$style)}
    input {
      padding: ${props.style?.padding};
    }
    .ant-select-single {
      width: 100% !important;
    }
  `}
`;


const childrenMap = {
  ...textInputChildren,
  viewRef: RefControl<InputRef>,
  allowClear: BoolControl.DEFAULT_TRUE,
  style: withDefault(styleControl(InputFieldStyle),{background:'transparent'}),
  labelStyle:styleControl(LabelStyle),
  prefixIcon: IconControl,
  suffixIcon: IconControl,
  items: jsonControl(convertAutoCompleteData, autoCompleteDate),
  ignoreCase: BoolControl.DEFAULT_TRUE,
  searchFirstPY: BoolControl.DEFAULT_TRUE,
  searchCompletePY: BoolControl,
  searchLabelOnly: BoolControl.DEFAULT_TRUE,
  valueOrLabel: dropdownControl(valueOrLabelOption, "label"),
  autoCompleteType: dropdownControl(autoCompleteType, "normal"),
  autocompleteIconColor: dropdownControl(autocompleteIconColor, "blue"),
  componentSize: dropdownControl(componentSize, "small"),
  valueInItems: booleanExposingStateControl("valueInItems"),
  inputFieldStyle: withDefault(styleControl(InputLikeStyle),{borderWidth:'1px'}),
  animationStyle: styleControl(AnimationStyle),
};

const getValidate = (value: any): "" | "warning" | "error" | undefined => {
  if (
    value.hasOwnProperty("validateStatus") &&
    value["validateStatus"] === "error"
  )
    return "error";
  return "";
};

let AutoCompleteCompBase = (function () {
  return new UICompBuilder(childrenMap, (props) => {
    const {
      items,
      onEvent,
      placeholder,
      searchFirstPY,
      searchCompletePY,
      searchLabelOnly,
      ignoreCase,
      valueOrLabel,
      autoCompleteType,
      autocompleteIconColor,
      componentSize,
    } = props;
    

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

    const [activationFlag, setActivationFlag] = useState(false);
    const [searchtext, setsearchtext] = useState<string>(props.value.value);
    const [validateState, setvalidateState] = useState({});

    //   是否中文环境
    const [chineseEnv, setChineseEnv] = useState(getDayJSLocale() === "zh-cn");

    useEffect(() => {
      setsearchtext(props.value.value);
      activationFlag &&
        setvalidateState(textInputValidate(getTextInputValidate()));
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
        <>
          <ConfigProvider
            theme={{
              token: {
                colorBgContainer: props.inputFieldStyle.background,
                colorBorder: props.inputFieldStyle.border,
                borderRadius: parseInt(props.inputFieldStyle.radius),
                colorText: props.inputFieldStyle.text,
                colorPrimary: props.inputFieldStyle.accent,
                controlHeight: componentSize === "small" ? 30 : 38,
              },
            }}
          >
            <AutoComplete 
              disabled={props.disabled}
              value={searchtext}
              options={items} 
              style={{ width: "100%" }}
              onChange={(value: string, option) => {
                props.valueInItems.onChange(false);
                setvalidateState(textInputValidate(getTextInputValidate()));
                setsearchtext(value);
                props.value.onChange(value); 
                props.onEvent("change")
              }} 
              onFocus={() => {
                setActivationFlag(true) 
                props.onEvent("focus")
              }}
              onBlur={() => props.onEvent("blur")}
              onSelect={(data: string, option) => {
                setsearchtext(option[valueOrLabel]);
                props.valueInItems.onChange(true);
                props.value.onChange(option[valueOrLabel]);
                props.onEvent("submit");
              }}
              filterOption={(inputValue: string, option) => {
                if (ignoreCase) {
                  if (
                    option?.label &&
                    option?.label
                      .toUpperCase()
                      .indexOf(inputValue.toUpperCase()) !== -1
                  )
                    return true;
                } else {
                  if (option?.label && option?.label.indexOf(inputValue) !== -1)
                    return true;
                }
                if (
                  chineseEnv &&
                  searchFirstPY &&
                  option?.label &&
                  option.label
                    .spell("first")
                    .toString()
                    .toLowerCase()
                    .indexOf(inputValue.toLowerCase()) >= 0
                )
                  return true;
                if (
                  chineseEnv &&
                  searchCompletePY &&
                  option?.label &&
                  option.label
                    .spell()
                    .toString()
                    .toLowerCase()
                    .indexOf(inputValue.toLowerCase()) >= 0
                )
                  return true;
                if (!searchLabelOnly) {
                  if (ignoreCase) {
                    if (
                      option?.value &&
                      option?.value
                        .toUpperCase()
                        .indexOf(inputValue.toUpperCase()) !== -1
                    )
                      return true;
                  } else {
                    if (
                      option?.value &&
                      option?.value.indexOf(inputValue) !== -1
                    )
                      return true;
                  }
                  if (
                    chineseEnv &&
                    searchFirstPY &&
                    option?.value &&
                    option.value
                      .spell("first")
                      .toString()
                      .toLowerCase()
                      .indexOf(inputValue.toLowerCase()) >= 0
                  )
                    return true;
                  if (
                    chineseEnv &&
                    searchCompletePY &&
                    option?.value &&
                    option.value
                      .spell()
                      .toString()
                      .toLowerCase()
                      .indexOf(inputValue.toLowerCase()) >= 0
                  )
                    return true;
                }
                return false;
              }}
            >
                <InputStyle
                  ref={props.viewRef}
                  placeholder={placeholder}
                  allowClear={props.allowClear}
                  $style={props.inputFieldStyle}
                  prefix={hasIcon(props.prefixIcon) && props.prefixIcon}
                  suffix={hasIcon(props.suffixIcon) && props.suffixIcon}
                  status={getValidate(validateState)}
                  onPressEnter={undefined}
                />
            </AutoComplete>
          </ConfigProvider>
        </>
      ),
      style: props.style,
      labelStyle: props.labelStyle,
      inputFieldStyle:props.inputFieldStyle,
      animationStyle: props.animationStyle,
      ...validateState,
    });
  })
    .setPropertyViewFn((children) => {
      return (
        <>
          <Section>
            {children.autoCompleteType.getView() === 'normal' &&
              children.prefixIcon.propertyView({
                label: trans('button.prefixIcon'),
              })}
            {children.autoCompleteType.getView() === 'normal' &&
              children.suffixIcon.propertyView({
                label: trans('button.suffixIcon'),
              })}
            {allowClearPropertyView(children)}
          </Section>
          <Section name={trans('autoComplete.SectionDataName')}>
            {children.items.propertyView({
              label: trans('autoComplete.value'),
              tooltip: itemsDataTooltip,
              placeholder: '[]',
            })}
            {getDayJSLocale() === 'zh-cn' &&
              children.searchFirstPY.propertyView({
                label: trans('autoComplete.searchFirstPY'),
              })}
            {getDayJSLocale() === 'zh-cn' &&
              children.searchCompletePY.propertyView({
                label: trans('autoComplete.searchCompletePY'),
              })}
            {children.searchLabelOnly.propertyView({
              label: trans('autoComplete.searchLabelOnly'),
            })}
            {children.ignoreCase.propertyView({
              label: trans('autoComplete.ignoreCase'),
            })}
            {children.valueOrLabel.propertyView({
              label: trans('autoComplete.checkedValueFrom'),
              radioButton: true,
            })}
          </Section>
          <TextInputBasicSection {...children} />

          <FormDataPropertyView {...children} />
          {children.label.getPropertyView()}

          <TextInputInteractionSection {...children} />

          {<TextInputValidationSection {...children} />}

          <Section name={sectionNames.layout}>
            {hiddenPropertyView(children)}
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
          <Section
            name={sectionNames.animationStyle}
            hasTooltip={true}
          >
            {children.animationStyle.getPropertyView()}
          </Section>
        </>
      );
    })
    .setExposeMethodConfigs(autoCompleteRefMethods)
    .setExposeStateConfigs([
      new NameConfig("value", trans("export.inputValueDesc")),
      new NameConfig("valueInItems", trans("autoComplete.valueInItems")),
      NameConfigPlaceHolder,
      NameConfigRequired,
      ...TextInputConfigs,
    ])
    .build();
})();

AutoCompleteCompBase = class extends AutoCompleteCompBase {
  override autoHeight(): boolean {
    return true;
  }
};

export const AutoCompleteComp = withExposingConfigs(AutoCompleteCompBase, [
  new NameConfig("value", trans("export.inputValueDesc")),
  new NameConfig("valueInItems", trans("autoComplete.valueInItems")),
  NameConfigPlaceHolder,
  NameConfigRequired, 
  ...TextInputConfigs,
]);
