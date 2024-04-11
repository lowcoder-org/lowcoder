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
} from "./tourInputConstants";
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
import { TourStepControl } from "@lowcoder-ee/comps/controls/tourStepControl";
import { booleanExposingStateControl } from "lowcoder-sdk";

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

export const TourChildrenMap = {
  label: LabelControl,
  placeholder: StringControl,
  disabled: BoolCodeControl,
  open: booleanExposingStateControl("open"),
  onEvent: SelectEventHandlerControl,
  options: TourStepControl,
  allowClear: BoolControl,
  inputValue: stateComp<string>(""), // user's input value when search
  showSearch: BoolControl.DEFAULT_TRUE,
  viewRef: RefControl<BaseSelectRef>,
  margin: MarginControl,
  padding: PaddingControl,
  ...SelectInputValidationChildren,
  ...formDataChildren,
};

export const TourPropertyView = (
  children: RecordConstructorToComp<
    typeof TourChildrenMap & {
      hidden: typeof BoolCodeControl;
    }
  > & {
    defaultValue: { propertyView: (params: ControlParams) => ControlNode };
    value: { propertyView: (params: ControlParams) => ControlNode };
    style: { getPropertyView: () => ControlNode };
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
      <Section name={sectionNames.style}>
        {children.style.getPropertyView()}
      </Section>
    )}
  </>
);

export const baseSelectRefMethods = refMethods<BaseSelectRef>([
  focusMethod,
  blurMethod,
]);
