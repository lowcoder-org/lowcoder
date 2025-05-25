import { default as AntdCheckboxGroup } from "antd/es/checkbox/Group";
import { SelectInputOptionControl } from "comps/controls/optionsControl";
import { BoolCodeControl, NumberControl } from "../../controls/codeControl";
import { arrayStringExposingStateControl } from "../../controls/codeStateControl";
import { LabelControl } from "../../controls/labelControl";
import { ChangeEventHandlerControl } from "../../controls/eventHandlerControl";
import { UICompBuilder } from "../../generators";
import { CommonNameConfig, NameConfig, withExposingConfigs } from "../../generators/withExposing";
import styled, { css } from "styled-components";
import {
  selectDivRefMethods,
  SelectInputInvalidConfig,
  SelectInputValidationChildren,
  useSelectInputValidate,
} from "./selectInputConstants";
import { formDataChildren } from "../formComp/formDataConstants";
import { styleControl } from "comps/controls/styleControl";
import { AnimationStyle, CheckboxStyle, CheckboxStyleType, InputFieldStyle, LabelStyle } from "comps/controls/styleControlConstants";
import { RadioLayoutOptions, RadioPropertyView } from "./radioCompConstants";
import { dropdownControl } from "../../controls/dropdownControl";
import { ValueFromOption, lightenColor } from "lowcoder-design";
import { EllipsisTextCss } from "lowcoder-design";
import { trans } from "i18n";
import { RefControl } from "comps/controls/refControl";
import { migrateOldData } from "comps/generators/simpleGenerators";
import { fixOldInputCompData } from "../textInputComp/textInputConstants";
import Tooltip from "antd/es/tooltip";
import { useCallback, useRef, useEffect, memo } from "react";

export const getStyle = (style: CheckboxStyleType) => {
  return css`
    .ant-checkbox-wrapper:not(.ant-checkbox-wrapper-disabled) {
      color: ${style.staticText};
      max-width: calc(100% - 8px);

      span:not(.ant-checkbox) {
        ${EllipsisTextCss};
      }

      .ant-checkbox .ant-checkbox-checked > .ant-checkbox-inner {
        border-color: ${style.checkedBorder};
        border-width:${!!style.borderWidth ? style.borderWidth : '2px'};
      }

      .ant-checkbox:not(.ant-checkbox-checked) > .ant-checkbox-inner{
        border-color: ${style.uncheckedBorder};
        border-width:${!!style.borderWidth ? style.borderWidth : '2px'};
      }

      .ant-checkbox-checked:not(.ant-checkbox-disabled) {
        .ant-checkbox-inner {
          background-color: ${style.checkedBackground};
          border-color: ${style.checkedBorder};
          border-width:${!!style.borderWidth ? style.borderWidth : '2px'};

          &::after {
            border-color: ${style.checked};
          }
        }

        &::after {
          border-color: ${style.checkedBorder};
          border-width:${!!style.borderWidth ? style.borderWidth : '2px'};
          border-radius: ${style.radius};
        }
      }
      
      .ant-checkbox-inner {
        background-color: ${style.uncheckedBackground};
        border-radius: ${style.radius};
        border-color: ${style.checkedBorder};
        border-width:${style.borderWidth ? style.borderWidth : '2px'};
      }
    
      &:hover .ant-checkbox-inner, 
      .ant-checkbox:hover .ant-checkbox-inner,
      .ant-checkbox-input + ant-checkbox-inner {
        ${style.hoverBackground && `background-color: ${style.hoverBackground}`};
        ${style.hoverBackground && `border-color: ${style.hoverBackground}`};
      }

      

      &:hover .ant-checkbox-inner,
      .ant-checkbox:hover .ant-checkbox-inner,
      .ant-checkbox-input:focus + .ant-checkbox-inner {
        border-color: ${style.checkedBorder};
        border-width:${!!style.borderWidth ? style.borderWidth : '2px'};
      }

      &:hover .ant-checkbox-checked:not(.ant-checkbox-disabled) .ant-checkbox-inner {
        background-color: ${style.hoverBackground || lightenColor(style.checkedBackground, 0.1)};
        border-color: ${style.hoverBackground || lightenColor(style.checkedBackground, 0.1)};
      }
    }

    

    .ant-checkbox-group-item {
      font-family:${style.fontFamily};
      font-size:${style.textSize};
      font-weight:${style.textWeight};
      font-style:${style.fontStyle};
      text-transform:${style.textTransform};
      text-decoration:${style.textDecoration};
    }
    .ant-checkbox-wrapper {
      padding: ${style.padding};
      .ant-checkbox-inner,
      .ant-checkbox-checked::after {
        border-radius: ${style.radius};
      }
    }
  `;
};

const CheckboxGroup = styled(AntdCheckboxGroup) <{
  $style: CheckboxStyleType;
  $layout: ValueFromOption<typeof RadioLayoutOptions>;
  tabIndex?: number;
}>`
  min-height: 32px;
  ${(props) => props.$style && getStyle(props.$style)}
  ${(props) => {
    if (props.$layout === "horizontal") {
      return css`
        display: flex;
        align-items: center;
        flex-wrap: wrap;
      `;
    } else if (props.$layout === "vertical") {
      return css`
        display: flex;
        flex-direction: column;
      `;
    } else if (props.$layout === "auto_columns") {
      return css`
        break-inside: avoid;
        columns: 160px;
      `;
    }
  }}
`;

const MemoizedCheckboxGroup = memo(({ 
  value, 
  disabled, 
  style, 
  layout, 
  options, 
  onChange, 
  viewRef,
  tabIndex
}: { 
  value: string[];
  disabled: boolean;
  style: CheckboxStyleType;
  layout: ValueFromOption<typeof RadioLayoutOptions>;
  options: Array<{ label: any; value: string; disabled?: boolean }>;
  onChange: (values: string[]) => void;
  viewRef: React.Ref<HTMLDivElement>;
  tabIndex?: number
}) => {
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const handleChange = useCallback((values: unknown[]) => {
    if (!mountedRef.current) return;
    onChange(values as string[]);
  }, [onChange]);

  return (
    <CheckboxGroup
      ref={viewRef}
      disabled={disabled}
      value={value}
      $style={style}
      $layout={layout}
      options={options}
      onChange={handleChange}
      tabIndex={tabIndex}
    />
  );
});

MemoizedCheckboxGroup.displayName = 'MemoizedCheckboxGroup';

let CheckboxBasicComp = (function () {
  const childrenMap = {
    defaultValue: arrayStringExposingStateControl("defaultValue"),
    value: arrayStringExposingStateControl("value"),
    label: LabelControl,
    disabled: BoolCodeControl,
    onEvent: ChangeEventHandlerControl,
    options: SelectInputOptionControl,
    style: styleControl(InputFieldStyle , 'style'),
    labelStyle: styleControl(
      LabelStyle.filter((style) => ['accent', 'validate', 'lineheight'].includes(style.name) === false),
      'labelStyle',
    ),
    layout: dropdownControl(RadioLayoutOptions, "horizontal"),
    viewRef: RefControl<HTMLDivElement>,
    inputFieldStyle: styleControl(CheckboxStyle , 'inputFieldStyle'),
    animationStyle: styleControl(AnimationStyle , 'animationStyle'),
    tabIndex: NumberControl,
    ...SelectInputValidationChildren,
    ...formDataChildren,
  };

  return new UICompBuilder(childrenMap, (props) => {
    const mountedRef = useRef(true);
    const [validateState, handleChange] = useSelectInputValidate(props);

    useEffect(() => {
      return () => {
        mountedRef.current = false;
      };
    }, []);

    const handleValidateChange = useCallback((values: string[]) => {
      if (!mountedRef.current) return;
      handleChange(values);
    }, [handleChange]);

    const filteredOptions = useCallback(() => {
      return props.options
        .filter((option) => option.value !== undefined && !option.hidden)
        .map((option) => ({
          label: option.label,
          value: option.value,
          disabled: option.disabled,
        }));
    }, [props.options]);

    return props.label({
      required: props.required,
      style: props.style,
      labelStyle: props.labelStyle,
      inputFieldStyle: props.inputFieldStyle,
      animationStyle: props.animationStyle,
      children: (
        <MemoizedCheckboxGroup
          value={props.value.value}
          disabled={props.disabled}
          style={props.inputFieldStyle}
          layout={props.layout}
          options={filteredOptions()}
          onChange={handleValidateChange}
          viewRef={props.viewRef}
          tabIndex={typeof props.tabIndex === 'number' ? props.tabIndex : undefined}
        />
      ),
      ...validateState,
    });
  })
    .setPropertyViewFn((children) => <RadioPropertyView {...children} />)
    .setExposeMethodConfigs(selectDivRefMethods)
    .build();
})();

CheckboxBasicComp = migrateOldData(CheckboxBasicComp, fixOldInputCompData);

export const CheckboxComp = withExposingConfigs(CheckboxBasicComp, [
  new NameConfig("value", trans("selectInput.valueDesc")),
  SelectInputInvalidConfig,
  ...CommonNameConfig,
]);
