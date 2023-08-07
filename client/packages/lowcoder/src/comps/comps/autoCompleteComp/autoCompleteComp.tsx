import React, { useEffect, useState } from "react";
import { Input, Section, sectionNames } from "lowcoder-design";
import { BoolControl } from "comps/controls/boolControl";
import { styleControl } from "comps/controls/styleControl";
import {
  InputLikeStyle,
  InputLikeStyleType,
} from "comps/controls/styleControlConstants";
import {
  NameConfig,
  NameConfigPlaceHolder,
  NameConfigRequired,
  withExposingConfigs,
} from "comps/generators/withExposing";
import styled, { css } from "styled-components";
import { UICompBuilder } from "../../generators";
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
import {
  ConfigProvider,
  InputRef,
  AutoComplete,
  Input as AntInput,
} from "antd";
import { RefControl } from "comps/controls/refControl";
import {
  booleanExposingStateControl,
} from "comps/controls/codeStateControl";

import { getMomentLocale } from "i18n/momentLocale";
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

// const InputStyle = styled(Input)<{ $style: InputLikeStyleType }>`
//   ${(props) => props.$style && getStyle(props.$style) }
// `;

const InputStyle = styled(Input)<{ $style: InputLikeStyleType }>`
  ${(props) => css`
    ${getStyle(props.$style)}
    .ant-select-selection-search-input {
      height: 100%;
    }
    input {
      padding: ${props.style?.padding}
    }
  `}
`;

const CustomStyledSearch = styled(AntInput.Search)<{ $style: InputLikeStyleType }>`
  ${(props) => css`
    padding: 0;
    input.ant-input {
      padding: ${props.$style?.padding};
    }
    .ant-btn.ant-input-search-button {
      height: 100%;
      padding: ${props.$style?.padding} !important;
      padding-left: 15px !important;
      padding-right: 15px !important;
      .ant-btn-icon {
        line-height: 28px;
      }
    }
  `}
`;

const childrenMap = {
  ...textInputChildren,
  viewRef: RefControl<InputRef>,
  allowClear: BoolControl.DEFAULT_TRUE,
  style: styleControl(InputLikeStyle),
  prefixIcon: IconControl,
  suffixIcon: IconControl,
  items: jsonControl(convertAutoCompleteData, autoCompleteDate),
  ignoreCase: BoolControl.DEFAULT_TRUE,
  searchFirstPY: BoolControl.DEFAULT_TRUE,
  searchCompletePY: BoolControl,
  searchLabelOnly: BoolControl.DEFAULT_TRUE,
  valueOrLabel: dropdownControl(valueOrLabelOption, "label"),
  autoCompleteType: dropdownControl(autoCompleteType, "AntDesign"),
  autocompleteIconColor: dropdownControl(autocompleteIconColor, "blue"),
  componentSize: dropdownControl(componentSize, "small"),
  valueInItems: booleanExposingStateControl("valueInItems"),
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
    const [chineseEnv, setChineseEnv] = useState(getMomentLocale() === "zh-cn");

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
                colorBgContainer: props.style.background,
                colorBorder: props.style.border,
                borderRadius: parseInt(props.style.radius),
                colorText: props.style.text,
                colorPrimary: props.style.accent,
                controlHeight: componentSize === "small" ? 30 : 38,
              },
            }}
          >
            <AutoComplete
              disabled={props.disabled}
              value={searchtext}
              options={items}
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
              {autoCompleteType === "AntDesign" ? (
                <CustomStyledSearch
                  placeholder={placeholder}
                  enterButton={autocompleteIconColor === "blue"}
                  allowClear={props.allowClear}
                  ref={props.viewRef}
                  onPressEnter={undefined}
                  status={getValidate(validateState)}
                  onSubmit={() => props.onEvent("submit")}
                  $style={props.style}
                />
              ) : (
                <InputStyle
                  // style={{
                  //   height: componentSize === "small" ? "30px" : "38px",
                  // }}
                  ref={props.viewRef}
                  placeholder={placeholder}
                  allowClear={props.allowClear}
                  $style={props.style}
                  prefix={hasIcon(props.prefixIcon) && props.prefixIcon}
                  suffix={hasIcon(props.suffixIcon) && props.suffixIcon}
                  status={getValidate(validateState)}
                  onPressEnter={undefined}
                />
              )}
            </AutoComplete>
          </ConfigProvider>
        </>
      ),
      style: props.style,
      ...validateState,
    });
  })
    .setPropertyViewFn((children) => {
      return (
        <>
          <Section name={trans("autoComplete.ComponentType")}>
            {children.autoCompleteType.propertyView({
              label: trans("autoComplete.type"),
              radioButton: true,
            })}
            {children.autoCompleteType.getView() === "AntDesign" &&
              children.autocompleteIconColor.propertyView({
                label: trans("button.prefixIcon"),
                radioButton: true,
              })}

            {children.autoCompleteType.getView() === "normal" &&
              children.prefixIcon.propertyView({
                label: trans("button.prefixIcon"),
              })}
            {children.autoCompleteType.getView() === "normal" &&
              children.suffixIcon.propertyView({
                label: trans("button.suffixIcon"),
              })}
              {allowClearPropertyView(children)}
          </Section>
          <Section name={trans("autoComplete.SectionDataName")}>
            {children.items.propertyView({
              label: trans("autoComplete.value"),
              tooltip: itemsDataTooltip,
              placeholder: "[]",
            })}
            {getMomentLocale() === "zh-cn" &&
              children.searchFirstPY.propertyView({
                label: trans("autoComplete.searchFirstPY"),
              })}
            {getMomentLocale() === "zh-cn" &&
              children.searchCompletePY.propertyView({
                label: trans("autoComplete.searchCompletePY"),
              })}
            {children.searchLabelOnly.propertyView({
              label: trans("autoComplete.searchLabelOnly"),
            })}
            {children.ignoreCase.propertyView({
              label: trans("autoComplete.ignoreCase"),
            })}
            {children.valueOrLabel.propertyView({
              label: trans("autoComplete.checkedValueFrom"),
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
