import { changeChildAction, DispatchType, RecordConstructorToView } from "lowcoder-core";
import { UICompBuilder } from "comps/generators/uiCompBuilder";
import { NameConfig, withExposingConfigs } from "comps/generators/withExposing";
import { Section, sectionNames, ValueFromOption } from "lowcoder-design";
import { default as TreeSelect } from "antd/es/tree-select";
import { useEffect } from "react";
import styled from "styled-components";
import { styleControl } from "comps/controls/styleControl";
import { TreeSelectStyle, TreeSelectStyleType } from "comps/controls/styleControlConstants";
import { LabelControl } from "comps/controls/labelControl";
import { dropdownControl } from "comps/controls/dropdownControl";
import {
  advancedSection,
  expandSection,
  formSection,
  treeCommonChildren,
  treeDataPropertyView,
  TreeNameConfigs,
  useTree,
  valuePropertyView,
} from "./treeUtils";
import { baseSelectRefMethods, getStyle } from "../selectInputComp/selectCompConstants";
import { useSelectInputValidate, SelectInputValidationSection } from "../selectInputComp/selectInputConstants";
import { StringControl } from "comps/controls/codeControl";
import { SelectEventHandlerControl } from "comps/controls/eventHandlerControl";
import { selectInputValidate } from "../selectInputComp/selectInputConstants";
import { BoolControl } from "comps/controls/boolControl";
import { stateComp, withDefault } from "comps/generators/simpleGenerators";
import { trans } from "i18n";
import {
  allowClearPropertyView,
  placeholderPropertyView,
  showSearchPropertyView,
} from "comps/utils/propertyUtils";
import { BaseSelectRef } from "rc-select";
import { RefControl } from "comps/controls/refControl";
import { useContext } from "react";
import { EditorContext } from "comps/editorState";

const StyledTreeSelect = styled(TreeSelect)<{ $style: TreeSelectStyleType }>`
  width: 100%;
  ${(props) => props.$style && getStyle(props.$style)}
`;

const selectTypeOptions = [
  { label: trans("tree.singleSelect"), value: "single" },
  { label: trans("tree.multiSelect"), value: "multi" },
  { label: trans("tree.checkbox"), value: "check" },
] as const;

const checkedStrategyOptions = [
  { label: trans("tree.showAll"), value: "all" },
  { label: trans("tree.showParent"), value: "parent" },
  { label: trans("tree.showChild"), value: "child" },
] as const;

const childrenMap = {
  ...treeCommonChildren,
  selectType: dropdownControl(selectTypeOptions, "single"),
  checkedStrategy: dropdownControl(checkedStrategyOptions, "parent"),
  label: LabelControl,
  placeholder: withDefault(StringControl, trans("tree.placeholder")),
  // TODO: more event
  onEvent: SelectEventHandlerControl,
  allowClear: BoolControl,
  showSearch: BoolControl.DEFAULT_TRUE,
  inputValue: stateComp<string>(""), // search value
  style: styleControl(TreeSelectStyle),
  viewRef: RefControl<BaseSelectRef>,
};

function getCheckedStrategy(v: ValueFromOption<typeof checkedStrategyOptions>) {
  switch (v) {
    case "all":
      return TreeSelect.SHOW_ALL;
    case "parent":
      return TreeSelect.SHOW_PARENT;
    case "child":
      return TreeSelect.SHOW_CHILD;
  }
}

const TreeCompView = (
  props: RecordConstructorToView<typeof childrenMap> & { dispatch: DispatchType }
) => {
  const { treeData, selectType, value, expanded, style, inputValue } = props;
  const isSingle = selectType === "single";
  const [
    validateState,
    handleChange,
  ] = useSelectInputValidate(props);

  useEffect(() => {
    if (isSingle && value.value.length > 1) {
      value.onChange(value.value.slice(0, 1));
    }
  }, [selectType]);
  useTree(props);
  return props.label({
    required: props.required,
    ...validateState,
    style: style,
    children: (
      <StyledTreeSelect
        ref={props.viewRef}
        key={selectType}
        $style={style}
        popupMatchSelectWidth={false}
        disabled={props.disabled}
        placeholder={props.placeholder}
        allowClear={props.allowClear}
        fieldNames={{ label: "label", value: "value" }}
        treeData={treeData}
        multiple={!isSingle}
        value={isSingle ? value.value[0] : value.value}
        treeCheckable={selectType === "check"}
        showCheckedStrategy={getCheckedStrategy(props.checkedStrategy)}
        treeLine={props.showLine ? { showLeafIcon: props.showLeafIcon } : false}
        // fix expand issue when searching
        treeExpandedKeys={inputValue ? undefined : expanded.value}
        onTreeExpand={(keys) => {
          expanded.onChange(keys as (string | number)[]);
        }}
        onChange={(keys) => {
          const nextValue = Array.isArray(keys) ? keys : keys !== undefined ? [keys] : [];
          handleChange(nextValue);
        }}
        showSearch={props.showSearch}
        // search label
        treeNodeFilterProp="label"
        // fix inputValue when select an option or lose focus
        autoClearSearchValue={false}
        onSearch={(value) => {
          props.dispatch(changeChildAction("inputValue", value, false));
        }}
        onFocus={() => props.onEvent("focus")}
        onBlur={() => props.onEvent("blur")}
      />
    ),
  });
};

let TreeBasicComp = (function () {
  return new UICompBuilder(childrenMap, (props, dispatch) => (
    <TreeCompView {...props} dispatch={dispatch} />
  ))
    .setPropertyViewFn((children) => (
      <>
        <Section name={sectionNames.basic}>
          {treeDataPropertyView(children)}
          {placeholderPropertyView(children)}
        </Section>

        {["logic", "both"].includes(useContext(EditorContext).editorModeStatus) && (
          <><SelectInputValidationSection {...children} />
            {formSection(children)}
            <Section name={sectionNames.interaction}>
              {children.onEvent.getPropertyView()}
              {children.hidden.propertyView({ label: trans("prop.hide") })}
              {children.disabled.propertyView({ label: trans("prop.disabled") })}
              {children.selectType.propertyView({ label: trans("tree.selectType") })}
              {valuePropertyView(children)}
              {children.selectType.getView() === "check" &&
                children.checkedStrategy.propertyView({ label: trans("tree.checkedStrategy") })}
              {allowClearPropertyView(children)}
              {showSearchPropertyView(children)}
            </Section>
          </>
        )}
      
        {["layout", "both"].includes(useContext(EditorContext).editorModeStatus) && (
          <Section name={sectionNames.layout}>
            {children.expanded.propertyView({ label: trans("tree.expanded") })}
            {children.defaultExpandAll.propertyView({ label: trans("tree.defaultExpandAll") })}
            {children.showLine.propertyView({ label: trans("tree.showLine") })}
            {children.showLine.getView() && children.showLeafIcon.propertyView({ label: trans("tree.showLeafIcon") })}
          </Section>
        )}

        {["layout", "both"].includes(useContext(EditorContext).editorModeStatus) && ( children.label.getPropertyView() )}

        {["layout", "both"].includes(useContext(EditorContext).editorModeStatus) && (
          <Section name={sectionNames.style}>{children.style.getPropertyView()}</Section>
        )}



      </>
    ))
    .setExposeMethodConfigs(baseSelectRefMethods)
    .build();
})();

TreeBasicComp = class extends TreeBasicComp {
  override autoHeight(): boolean {
    return true;
  }
};

export const TreeSelectComp = withExposingConfigs(TreeBasicComp, [
  ...TreeNameConfigs,
  new NameConfig("inputValue", trans("select.inputValueDesc")),
]);
