import {
  changeChildAction,
  DispatchType,
  RecordConstructorToComp,
  RecordConstructorToView,
} from "lowcoder-core";
import { BoolControl } from "../../controls/boolControl";
import { LabelControl } from "../../controls/labelControl";
import { BoolCodeControl, StringControl } from "../../controls/codeControl";
import { PaddingControl } from "../../controls/paddingControl";
import { MarginControl } from "../../controls/marginControl";
import {
  ControlNode,
  isDarkColor,
  lightenColor,
  MultiselectTagIcon,
  Section,
  sectionNames,
} from "lowcoder-design";
import { SelectOptionControl } from "../../controls/optionsControl";
import { SelectEventHandlerControl } from "../../controls/eventHandlerControl";
import { default as AntdSelect } from "antd/es/select";
import { ControlParams } from "../../controls/controlParams";
import { ReactNode } from "react";
import styled, { css } from "styled-components";
import {
  SelectInputValidationChildren,
  SelectInputValidationSection,
} from "./selectInputConstants";
import {
  formDataChildren,
  FormDataPropertyView,
} from "../formComp/formDataConstants";
import {
  CascaderStyleType,
  MultiSelectStyleType,
  SelectStyleType,
  TreeSelectStyleType,
  widthCalculator,
  heightCalculator,
  
  SelectStyle,
  ChildrenMultiSelectStyleType,
} from "comps/controls/styleControlConstants";
import { stateComp, withDefault } from "../../generators";
import {
  allowClearPropertyView,
  disabledPropertyView,
  hiddenPropertyView,
  placeholderPropertyView,
  showSearchPropertyView,
} from "comps/utils/propertyUtils";
import { trans } from "i18n";
import { hasIcon } from "comps/utils";
import { RefControl } from "comps/controls/refControl";
import { BaseSelectRef } from "rc-select";
import { refMethods } from "comps/generators/withMethodExposing";
import { blurMethod, focusMethod } from "comps/utils/methodUtils";
import { useContext } from "react";
import { EditorContext } from "comps/editorState";
import { styleControl } from "comps/controls/styleControl";

export const getStyle = (
  style:
    | SelectStyleType
    | MultiSelectStyleType
    | CascaderStyleType
    | TreeSelectStyleType
) => {
  return css`
    &.ant-select .ant-select-selector,
    &.ant-select-multiple .ant-select-selection-item {
      border-radius: ${style.radius};
      padding: ${style.padding};	
      height: auto;	
    }	
    .ant-select-selection-search {	
      padding: ${style.padding};
    }	
    .ant-select-selection-search-input {
      font-family:${(style as SelectStyleType).fontFamily} !important;
      text-transform:${(style as SelectStyleType).textTransform} !important;
      text-decoration:${(style as SelectStyleType).textDecoration} !important;
      font-size:${(style as SelectStyleType).textSize} !important;
      font-weight:${(style as SelectStyleType).textWeight};
      color:${(style as SelectStyleType).text} !important;
      font-style:${(style as SelectStyleType).fontStyle};
    }
    .ant-select-selector::after,	
    .ant-select-selection-placeholder,	
    .ant-select-selection-item {	
      line-height: 1.5715 !important;
    }

    &.ant-select:not(.ant-select-disabled) {
      color: ${style.text};
      .ant-select-selection-placeholder,
      .ant-select-selection-item {
        line-height: 1.5715 !important;
      }
      .ant-select-selection-placeholder,
      &.ant-select-single.ant-select-open .ant-select-selection-item {
        color: ${style.text};
        opacity: 0.4;
        width: 100%;
      }

      .ant-select-selector {
        background-color: ${style.background};
        border-color: ${style.border};
        border-width:${(style as SelectStyleType).borderWidth};
        box-shadow:${(style as SelectStyleType).boxShadow} ${(style as SelectStyleType).boxShadowColor};
      }

      &.ant-select-focused,
      &:hover {
        .ant-select-selector {
          border-color: ${style.accent};
        }
      }

      .ant-select-arrow,
      .ant-select-clear {
        background-color: ${style.background};
        color: ${style.text === "#222222"
      ? "#8B8FA3"
      : isDarkColor(style.text)
        ? lightenColor(style.text, 0.2)
        : style.text};
      }

      .ant-select-clear:hover {
        color: ${style.text === "#222222"
      ? "#8B8FA3"
      : isDarkColor(style.text)
        ? lightenColor(style.text, 0.1)
        : style.text};
      }

      &.ant-select-multiple .ant-select-selection-item {
        border: none;
        background-color: ${(style as MultiSelectStyleType).tags};
        color: ${(style as MultiSelectStyleType).tagsText};
        border-radius: ${style.radius};

        .ant-select-selection-item-remove {
          color: ${(style as MultiSelectStyleType).tagsText};
          opacity: 0.5;
        }
      }
    }
  `;
};

const getDropdownStyle = (style: MultiSelectStyleType) => {
  return css`
    padding: 8px 0;

    .ant-select-item-option-selected {
      font-weight: 600;
      background-color: transparent;
    }

    .ant-select-item {
      border-radius: 4px;
      margin: 0 8px;
      padding: 5px 8px;

      &:hover {
        background-color: rgb(242, 247, 252);
      }

      .ant-select-item-option-state {
        display: inline-flex;
        align-items: center;

        path {
          fill: ${style.multiIcon};
        }
      }
    }
  `;
};

const Select = styled(AntdSelect) <{ $style: SelectStyleType & MultiSelectStyleType,$inputFieldStyle:SelectStyleType }>`
  width: 100%;
  ${(props) => props.$inputFieldStyle && getStyle(props.$inputFieldStyle)}
`;

const DropdownStyled = styled.div<{ $style: ChildrenMultiSelectStyleType }>`
 background-color: ${props => props.$style?.background};
    border: ${props => props.$style?.border};
    border-style: ${props => props.$style?.borderStyle};
    border-width: ${props => props.$style?.borderWidth};
    border-radius: ${props => props.$style?.radius};
    rotate: ${props => props.$style?.rotation};
    margin: ${props => props.$style?.margin};
    padding: ${props => props.$style?.padding};
  .ant-select-item-option-content {
    font-size: ${props => props.$style?.textSize};
    font-style: ${props => props.$style?.fontStyle};
    font-family: ${props => props.$style?.fontFamily};
    font-weight: ${props => props.$style?.textWeight};
    text-transform: ${props => props.$style?.textTransform};
    color: ${props => props.$style?.text};
  }
  .option-label{
    text-decoration: ${props => props.$style?.textDecoration} !important;
  }
  .option-label img {
    min-width: 14px;
    margin-right: 0;
  }
`;

const Wrapper = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 6px;

  img {
    margin-right: -6px;
  }
`;

export const SelectChildrenMap = {
  label: LabelControl,
  placeholder: StringControl,
  disabled: BoolCodeControl,
  onEvent: SelectEventHandlerControl,
  options: SelectOptionControl,
  allowClear: BoolControl,
  inputValue: stateComp<string>(""), // user's input value when search
  showSearch: BoolControl.DEFAULT_TRUE,
  viewRef: RefControl<BaseSelectRef>,
  margin: MarginControl,
  padding: PaddingControl,
  inputFieldStyle:styleControl(SelectStyle),
  ...SelectInputValidationChildren,
  ...formDataChildren,
};

export const SelectUIView = (
  props: RecordConstructorToView<typeof SelectChildrenMap> & {
    mode?: "multiple" | "tags";
    value: any;
    style: SelectStyleType | MultiSelectStyleType;
    childrenInputFieldStyle: ChildrenMultiSelectStyleType;
    inputFieldStyle: SelectStyleType;
    onChange: (value: any) => void;
    dispatch: DispatchType;
  }
) => {
  return <Select
    ref={props.viewRef}
    mode={props.mode}
    $inputFieldStyle={props.inputFieldStyle}
    $style={props.style as SelectStyleType & MultiSelectStyleType}
    disabled={props.disabled}
    allowClear={props.allowClear}
    placeholder={props.placeholder}
    value={props.value}
    showSearch={props.showSearch}
    filterOption={(input, option) =>
      option?.label.toLowerCase().includes(input.toLowerCase())
    }
    dropdownRender={(originNode: ReactNode) => (
      <DropdownStyled $style={props.childrenInputFieldStyle as ChildrenMultiSelectStyleType}>
        {originNode}
      </DropdownStyled>
    )}
    dropdownStyle={{
      padding: 0,
    }}
    menuItemSelectedIcon={props.mode ? <MultiselectTagIcon title="" /> : ""}
    onChange={props.onChange}
    onFocus={() => props.onEvent("focus")}
    onBlur={() => props.onEvent("blur")}
    onSearch={
      props.showSearch
        ? (value) => {
          props.dispatch(changeChildAction("inputValue", value, false));
        }
        : undefined
    }
  >
    {props.options
      .filter((option) => option.value !== undefined && !option.hidden)
      .map((option) => (
        <Select.Option
          value={option.value}
          label={option.label}
          disabled={option.disabled}
          key={option.value}
        >
          <Wrapper className="option-label">
            {props.options.findIndex((option) => hasIcon(option.prefixIcon)) >
              -1 && option.prefixIcon}
            {<span>{option.label}</span>}
          </Wrapper>
        </Select.Option>
      ))}
  </Select>
}

export const SelectPropertyView = (
  children: RecordConstructorToComp<
    typeof SelectChildrenMap & {
      hidden: typeof BoolCodeControl;
    }
  > & {
    defaultValue: { propertyView: (params: ControlParams) => ControlNode };
    value: { propertyView: (params: ControlParams) => ControlNode };
    style: { getPropertyView: () => ControlNode };
    labelStyle: { getPropertyView: () => ControlNode };
    inputFieldStyle: { getPropertyView: () => ControlNode };
    childrenInputFieldStyle: { getPropertyView: () => ControlNode };
  }
) => (
  <>
    <Section name={sectionNames.basic}>
      {children.options.propertyView({})}
      {children.defaultValue.propertyView({
        label: trans("prop.defaultValue"),
      })}
      {placeholderPropertyView(children)}
    </Section>

    {["logic", "both"].includes(useContext(EditorContext).editorModeStatus) && (
      <>
        <>
          <SelectInputValidationSection {...children} />
          <FormDataPropertyView {...children} />
        </>
        <Section name={sectionNames.interaction}>
          {children.onEvent.getPropertyView()}
          {disabledPropertyView(children)}
          {hiddenPropertyView(children)}
        </Section>
      </>
    )}

    {["layout", "both"].includes(useContext(EditorContext).editorModeStatus) &&
      children.label.getPropertyView()}

    {["logic", "both"].includes(useContext(EditorContext).editorModeStatus) && (
      <Section name={sectionNames.advanced}>
        {allowClearPropertyView(children)}
        {showSearchPropertyView(children)}
      </Section>
    )}

    {["layout", "both"].includes(
      useContext(EditorContext).editorModeStatus
    ) && (
        <>
          <Section name={sectionNames.style}>
            {children.style.getPropertyView()}
          </Section>
          <Section name={sectionNames.labelStyle}>
            {children.labelStyle.getPropertyView()}
          </Section>
          <Section name={sectionNames.inputFieldStyle}>
            {children.inputFieldStyle.getPropertyView()}
          </Section>
          <Section name={'Children Input Field Styles'}>
            {children.childrenInputFieldStyle.getPropertyView()}
          </Section>
        </>
      )}
  </>
);

export const baseSelectRefMethods = refMethods<BaseSelectRef>([
  focusMethod,
  blurMethod,
]);
