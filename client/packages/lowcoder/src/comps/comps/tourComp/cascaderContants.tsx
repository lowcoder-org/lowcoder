import { SelectEventHandlerControl } from "../../controls/eventHandlerControl";
import { Section, sectionNames } from "lowcoder-design";
import { RecordConstructorToComp } from "lowcoder-core";
import { BoolCodeControl, JSONObjectArrayControl, StringControl } from "comps/controls/codeControl";
import { arrayStringExposingStateControl } from "comps/controls/codeStateControl";
import { BoolControl } from "comps/controls/boolControl";
import { LabelControl } from "comps/controls/labelControl";
import { styleControl } from "comps/controls/styleControl";
import { CascaderStyle } from "comps/controls/styleControlConstants";
import {
  allowClearPropertyView,
  disabledPropertyView,
  hiddenPropertyView,
  placeholderPropertyView,
  showSearchPropertyView,
} from "comps/utils/propertyUtils";
import { i18nObjs, trans } from "i18n";
import { RefControl } from "comps/controls/refControl";
import { CascaderRef } from "antd/lib/cascader";

import { MarginControl } from "../../controls/marginControl";	
import { PaddingControl } from "../../controls/paddingControl";

import { useContext } from "react";
import { EditorContext } from "comps/editorState";

export const defaultDataSource = JSON.stringify(i18nObjs.cascader, null, " ");

export const CascaderChildren = {
  value: arrayStringExposingStateControl("value", i18nObjs.cascaderDefult),
  label: LabelControl,
  placeholder: StringControl,
  disabled: BoolCodeControl,
  onEvent: SelectEventHandlerControl,
  allowClear: BoolControl,
  options: JSONObjectArrayControl,
  style: styleControl(CascaderStyle),
  showSearch: BoolControl.DEFAULT_TRUE,
  viewRef: RefControl<CascaderRef>,
  margin: MarginControl,	
  padding: PaddingControl,
};

export const CascaderPropertyView = (
  children: RecordConstructorToComp<typeof CascaderChildren & { hidden: typeof BoolCodeControl }>
) => (
  <>
    <Section name={sectionNames.basic}>
      {children.options.propertyView({ label: trans("cascader.options") })}
      {children.value.propertyView({ label: trans("prop.defaultValue") })}
      {placeholderPropertyView(children)}
    </Section>

    {["logic", "both"].includes(useContext(EditorContext).editorModeStatus) && (
      <Section name={sectionNames.interaction}>
        {children.onEvent.getPropertyView()}
        {disabledPropertyView(children)}
        {hiddenPropertyView(children)}
      </Section>
    )}

    {["layout", "both"].includes(useContext(EditorContext).editorModeStatus) && (
      children.label.getPropertyView()
    )}

    {["logic", "both"].includes(useContext(EditorContext).editorModeStatus) && (
      <Section name={sectionNames.advanced}>
        {allowClearPropertyView(children)}
        {showSearchPropertyView(children)}
      </Section>
    )}

    {["layout", "both"].includes(useContext(EditorContext).editorModeStatus) && (
      <Section name={sectionNames.style}>
        {children.style.getPropertyView()}
      </Section>
    )}
  </>
);
