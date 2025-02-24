import { ScrollBar, Section, sectionNames } from "lowcoder-design";
import { UICompBuilder } from "../../generators";
import { NameConfigHidden, NameConfig, withExposingConfigs } from "../../generators/withExposing";
import { defaultData } from "./jsonConstants";
import styled from "styled-components";
import { jsonValueExposingStateControl } from "comps/controls/codeStateControl";
import { ChangeEventHandlerControl } from "comps/controls/eventHandlerControl";
import { hiddenPropertyView, showDataLoadingIndicatorsPropertyView } from "comps/utils/propertyUtils";
import { trans } from "i18n";
import { LabelControl } from "comps/controls/labelControl";
import { formDataChildren, FormDataPropertyView } from "../formComp/formDataConstants";
import { AnimationStyle, JsonEditorStyle } from "comps/controls/styleControlConstants";
import { styleControl } from "comps/controls/styleControl";
import { migrateOldData, withDefault } from "comps/generators/simpleGenerators";
import { useRef, useEffect, useContext } from "react";
import {
  EditorState,
  EditorView,
  type EditorView as EditorViewType,
} from "base/codeEditor/codeMirror";
import { useExtensions } from "base/codeEditor/extensions";
import { EditorContext } from "comps/editorState";
import { AutoHeightControl } from "@lowcoder-ee/comps/controls/autoHeightControl";
import { BoolControl } from "@lowcoder-ee/comps/controls/boolControl";

/**
 * JsonEditor Comp
 */

const Wrapper = styled.div<{$height: boolean; $showVerticalScrollbar: boolean}>`
  background-color: #fff;
  border: 1px solid #d7d9e0;
  border-radius: 4px;
  height: 100%;
  overflow-y: ${props => (props.$showVerticalScrollbar ? 'scroll' : 'auto')};
`;

/**
 * Compatible with old data 2022-10-19
 */
function fixOldData(oldData: any) {
  if (oldData && !oldData.hasOwnProperty("label")) {
    return {
      ...oldData,
      label: {
        text: "",
      },
    };
  }
  return oldData;
}

/**
 * Compatible with old data 2022-11-18
 */
function fixOldDataSecond(oldData: any) {
  if (oldData && oldData.hasOwnProperty("default")) {
    return {
      ...oldData,
      value: oldData.default,
    };
  }
  return oldData;
}

const childrenMap = {
  value: jsonValueExposingStateControl('value', defaultData),
  onEvent: ChangeEventHandlerControl,
  autoHeight: withDefault(AutoHeightControl,'auto'),
  showVerticalScrollbar:BoolControl,
  label: withDefault(LabelControl, {position: 'column'}),
  style: styleControl(JsonEditorStyle, 'style'),
  animationStyle: styleControl(AnimationStyle, 'animationStyle'),
  ...formDataChildren,
};

let JsonEditorTmpComp = (function () {
  return new UICompBuilder(childrenMap, (props) => {
    const wrapperRef = useRef<HTMLDivElement>(null);
    const view = useRef<EditorViewType | null>(null);
    const initialized = useRef(false);
    const state = useRef<EditorState | null>(null);
    const editContent = useRef<string>();
    const { extensions } = useExtensions({
      codeType: "PureJSON",
      language: "json",
      showLineNum: true,
      enableClickCompName: false,
      onFocus: (focused) => {
        if (focused) {
          wrapperRef.current?.click();
        }
      },
      onChange: (state) => {
        editContent.current = state.doc.toString();
        try {
          const value = JSON.parse(state.doc.toString());
          props.value.onChange(value);
          props.onEvent("change");
        } catch (error) {}
      },
    });

    useEffect(() => {
      if (!initialized.current && wrapperRef.current) {
        state.current = EditorState.create({
          doc: JSON.stringify(props.value.value, null, 2),
          extensions,
        });
      }
    }, [wrapperRef.current]);

    useEffect(() => {
      if (state.current&&wrapperRef.current) {
        view.current = new EditorView({ state: state.current, parent: wrapperRef.current });
        initialized.current = true;
      }
    }, [props.showVerticalScrollbar])

    if (wrapperRef.current && view.current && !editContent.current) {
      const state = EditorState.create({
        doc: JSON.stringify(props.value.value, null, 2),
        extensions,
      });
      view.current?.setState(state);
    }
    if (editContent.current) {
      editContent.current = undefined;
    }
    return props.label({
      style: props.style,
      animationStyle: props.animationStyle,
      children: (
        <ScrollBar hideScrollbar={!props.showVerticalScrollbar}>
          <Wrapper
            ref={wrapperRef}
            onFocus={() => (editContent.current = 'focus')}
            $height={props.autoHeight}
            $showVerticalScrollbar={props.showVerticalScrollbar}
          />
        </ScrollBar>
      ),
    });
  })
    .setPropertyViewFn((children) => {
      return (
        <>
          <Section name={sectionNames.basic}>
            {children.value.propertyView({ label: trans("export.jsonEditorDesc") })}
          </Section>

          <FormDataPropertyView {...children} />

          {(useContext(EditorContext).editorModeStatus === "logic" || useContext(EditorContext).editorModeStatus === "both") && (
            <Section name={sectionNames.interaction}>
              {children.onEvent.getPropertyView()}
              {hiddenPropertyView(children)}
              {showDataLoadingIndicatorsPropertyView(children)}
            </Section>
          )}
          <Section name={trans('prop.height')}>
            {children.autoHeight.propertyView({ label: trans('prop.height') })}
          </Section>
            {!children.autoHeight.getView()&&<Section name={sectionNames.layout}>
            {children.showVerticalScrollbar.propertyView({label: trans('prop.showVerticalScrollbar')})}
          </Section>}
          {(useContext(EditorContext).editorModeStatus === "layout" || useContext(EditorContext).editorModeStatus === "both") && ( children.label.getPropertyView() )}
          {(useContext(EditorContext).editorModeStatus === "layout" || useContext(EditorContext).editorModeStatus === "both") && (
            <>
            <Section name={sectionNames.style}>{children.style.getPropertyView()}</Section>
              <Section name={sectionNames.animationStyle} hasTooltip={true}>{children.animationStyle.getPropertyView()}</Section>
              </>
          )}

        </>
      );
    })
    .build();
})();

JsonEditorTmpComp = migrateOldData(JsonEditorTmpComp, fixOldData);

JsonEditorTmpComp = migrateOldData(JsonEditorTmpComp, fixOldDataSecond);

JsonEditorTmpComp = class extends JsonEditorTmpComp {
  override autoHeight(): boolean {
    return this.children.autoHeight.getView();
  }
};

export const JsonEditorComp = withExposingConfigs(JsonEditorTmpComp, [
  new NameConfig("value", trans("export.jsonEditorDesc")),
  NameConfigHidden,
]);
