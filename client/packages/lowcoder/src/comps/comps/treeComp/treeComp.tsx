import { RecordConstructorToView } from "lowcoder-core";
import { UICompBuilder } from "comps/generators/uiCompBuilder";
import { withExposingConfigs } from "comps/generators/withExposing";
import { ScrollBar, Section, sectionNames } from "lowcoder-design";
import { default as Tree } from "antd/es/tree";
import { useEffect, useState } from "react";
import styled from "styled-components";
import { StyleConfigType, styleControl } from "comps/controls/styleControl";
import {  InputFieldStyle, LabelStyle, TreeStyle } from "comps/controls/styleControlConstants";
import { LabelControl } from "comps/controls/labelControl";
import { withDefault } from "comps/generators";
import { dropdownControl } from "comps/controls/dropdownControl";
import { BoolControl } from "comps/controls/boolControl";
import {
  formSection,
  // intersectSection,
  treeCommonChildren,
  treeDataPropertyView,
  TreeNameConfigs,
  useTree,
  valuePropertyView,
} from "./treeUtils";
import {
  SelectInputValidationSection,
} from "../selectInputComp/selectInputConstants";
import { selectInputValidate } from "../selectInputComp/selectInputConstants";
import { SelectEventHandlerControl } from "comps/controls/eventHandlerControl";
import { trans } from "i18n";
import { useContext } from "react";
import { EditorContext } from "comps/editorState";
import { AutoHeightControl } from "@lowcoder-ee/comps/controls/autoHeightControl";
import { showDataLoadingIndicatorsPropertyView } from "@lowcoder-ee/comps/utils/propertyUtils";

type TreeStyleType = StyleConfigType<typeof TreeStyle>;

const Container = styled.div<TreeStyleType & { verticalScrollbar: boolean }>`
  height: 100%;
  padding: 4px;
  background: ${(props) => props.background};
  border: 1px solid ${(props) => props.border};
  border-radius: ${(props) => props.radius};
  .ant-tree-show-line .ant-tree-switcher {
    background: ${(props) => props.background};
  }
  .simplebar-vertical {
    display: ${(props) => props.verticalScrollbar ? 'block' : 'none'};
  }
`;

const selectTypeOptions = [
  { label: trans("tree.noSelect"), value: "none" },
  { label: trans("tree.singleSelect"), value: "single" },
  { label: trans("tree.multiSelect"), value: "multi" },
  { label: trans("tree.checkbox"), value: "check" },
] as const;

// TODO: support drag, edit mode
const childrenMap = {
  ...treeCommonChildren,
  selectType: dropdownControl(selectTypeOptions, "single"),
  checkStrictly: BoolControl,
  autoExpandParent: BoolControl,
  label: withDefault(LabelControl, { position: "column" }),
  autoHeight: AutoHeightControl,
  verticalScrollbar: withDefault(BoolControl, false),
  // TODO: more event
  onEvent: SelectEventHandlerControl,
  style: styleControl(InputFieldStyle , 'style'),
  labelStyle: styleControl(LabelStyle.filter((style) => ['accent', 'validate'].includes(style.name) === false), 'labelStyle'),
  inputFieldStyle:styleControl(TreeStyle, 'inputFieldStyle')
};

const TreeCompView = (props: RecordConstructorToView<typeof childrenMap>) => {
  const { treeData, selectType, value, expanded, checkStrictly, style, labelStyle } = props;
  const [height, setHeight] = useState<number>();
  const selectable = selectType === "single" || selectType === "multi";
  const checkable = selectType === "check";
  useEffect(() => {
    if (selectType === "none" && value.value.length > 0) {
      value.onChange([]);
    } else if (selectType === "single" && value.value.length > 1) {
      value.onChange(value.value.slice(0, 1));
    }
  }, [selectType]);
  useTree(props);
  return props.label({
    required: props.required,
    ...selectInputValidate(props),
    style,
    labelStyle,
    inputFieldStyle:props.inputFieldStyle,
    children: (
      <Container {...props.inputFieldStyle} verticalScrollbar={props.verticalScrollbar}>
        <ScrollBar style={{ margin: 0, padding: 0 }}>
          <Tree
            key={selectType}
            disabled={props.disabled}
            height={height}
            rootStyle={{ background: "transparent", color: props.inputFieldStyle.text }}
            fieldNames={{ title: "label", key: "value" }}
            treeData={treeData}
            selectable={selectable}
            multiple={selectType === "multi"}
            selectedKeys={selectable ? value.value : []}
            checkable={checkable}
            checkedKeys={
              checkable
                ? checkStrictly
                  ? { checked: value.value, halfChecked: [] }
                  : value.value
                : undefined
            }
            checkStrictly={checkStrictly}
            showLine={props.showLine ? { showLeafIcon: props.showLeafIcon } : false}
            expandedKeys={expanded.value}
            autoExpandParent={props.autoExpandParent}
            onSelect={(keys) => {
              value.onChange(keys as (string | number)[]);
              props.onEvent("change");
            }}
            onCheck={(keys) => {
              value.onChange(Array.isArray(keys) ? keys as (string | number)[] : keys.checked as (string | number)[]);
              props.onEvent("change");
            }}
            onExpand={(keys) => {
              expanded.onChange(keys as (string | number)[]);
            }}
            onFocus={() => props.onEvent("focus")}
            onBlur={() => props.onEvent("blur")}
          />
        </ScrollBar>
      </Container>
    ),
    showValidationWhenEmpty: props.showValidationWhenEmpty,
  });
};

let TreeBasicComp = (function () {
  return new UICompBuilder(childrenMap, (props) => {
    return(<TreeCompView {...props} />)}
)
    .setPropertyViewFn((children) => (
      <>
        <Section name={sectionNames.basic}>
          {treeDataPropertyView(children)}
        </Section>

        {["logic", "both"].includes(useContext(EditorContext).editorModeStatus) && (
          <><SelectInputValidationSection {...children} />
            {formSection(children)}
            <Section name={sectionNames.interaction}>
              {children.onEvent.getPropertyView()}
              {children.hidden.propertyView({ label: trans("prop.hide") })}
              {children.disabled.propertyView({ label: trans("prop.disabled") })}
              {showDataLoadingIndicatorsPropertyView(children)}
              {children.selectType.propertyView({ label: trans("tree.selectType") })}
              {children.selectType.getView() !== "none" && valuePropertyView(children)}
              {children.selectType.getView() === "check" &&
                children.checkStrictly.propertyView({
                  label: trans("tree.checkStrictly"),
                  tooltip: trans("tree.checkStrictlyTooltip"),
                })}
            </Section>
          </>
        )}

        {["layout", "both"].includes(useContext(EditorContext).editorModeStatus) && (
          <Section name={sectionNames.layout}>
            {children.autoHeight.getPropertyView()}
            {!children.autoHeight.getView() && 
              children.verticalScrollbar.propertyView({
                label: trans("prop.showVerticalScrollbar")
              })}
            {children.expanded.propertyView({ label: trans("tree.expanded") })}
            {children.defaultExpandAll.propertyView({ label: trans("tree.defaultExpandAll") })}
            {children.showLine.propertyView({ label: trans("tree.showLine") })}
            {children.showLine.getView() && children.showLeafIcon.propertyView({ label: trans("tree.showLeafIcon") })}
          </Section>
        )}

        {["layout", "both"].includes(useContext(EditorContext).editorModeStatus) && (children.label.getPropertyView())}

        {["layout", "both"].includes(useContext(EditorContext).editorModeStatus) && (
          <>
            <Section name={sectionNames.style}>{children.style.getPropertyView()}</Section>
            <Section name={sectionNames.labelStyle}>{children.labelStyle.getPropertyView()}</Section>
            <Section name={sectionNames.inputFieldStyle}>{children.inputFieldStyle.getPropertyView()}</Section>
          </>
        )}
      </>
    ))
    .build();
})();

TreeBasicComp = class extends TreeBasicComp {
  override autoHeight(): boolean {
    return this.children.autoHeight.getView();
  }
};

export const TreeComp = withExposingConfigs(TreeBasicComp, TreeNameConfigs);
