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
import { useRef, useEffect, useContext, useCallback, useMemo } from "react";
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
  showVerticalScrollbar: BoolControl,
  label: withDefault(LabelControl, {position: 'column'}),
  style: styleControl(JsonEditorStyle, 'style'),
  animationStyle: styleControl(AnimationStyle, 'animationStyle'),
  ...formDataChildren,
};

let JsonEditorTmpComp = (function () {
  return new UICompBuilder(childrenMap, (props) => {
    const wrapperRef = useRef<HTMLDivElement>(null);
    const viewRef = useRef<EditorViewType | null>(null);
    const initializedRef = useRef(false);
    const stateRef = useRef<EditorState | null>(null);
    const editContentRef = useRef<string>();
    const mountedRef = useRef(true);

    const handleChange = useCallback((state: EditorState) => {
      if (!mountedRef.current) return;
      
      editContentRef.current = state.doc.toString();
      try {
        const value = JSON.parse(state.doc.toString());
        props.value.onChange(value);
        props.onEvent("change");
      } catch (error) {
        // Invalid JSON - ignore
      }
    }, [props.value, props.onEvent]);

    const { extensions } = useExtensions({
      codeType: "PureJSON",
      language: "json",
      showLineNum: true,
      enableClickCompName: false,
      onFocus: useCallback((focused: boolean) => {
        if (focused) {
          wrapperRef.current?.click();
        }
      }, []),
      onChange: handleChange,
    });

    // Initialize editor state
    useEffect(() => {
      if (!initializedRef.current && wrapperRef.current) {
        stateRef.current = EditorState.create({
          doc: JSON.stringify(props.value.value, null, 2),
          extensions,
        });
      }
      if (wrapperRef.current && viewRef.current && !editContentRef.current) {
        const newState = EditorState.create({
          doc: JSON.stringify(props.value.value, null, 2),
          extensions,
        });
        viewRef.current?.setState(newState);
      }
    }, [wrapperRef.current, extensions, props.value.value]);

    // Create editor view
    useEffect(() => {
      if (stateRef.current && wrapperRef.current) {
        viewRef.current = new EditorView({ 
          state: stateRef.current, 
          parent: wrapperRef.current 
        });
        initializedRef.current = true;
      }

      return () => {
        viewRef.current?.destroy();
        viewRef.current = null;
        stateRef.current = null;
        initializedRef.current = false;
      };
    }, [props.showVerticalScrollbar]);

    // Cleanup on unmount
    useEffect(() => {
      return () => {
        mountedRef.current = false;
        viewRef.current?.destroy();
        viewRef.current = null;
        stateRef.current = null;
        initializedRef.current = false;
      };
    }, []);

    const handleFocus = useCallback(() => {
      editContentRef.current = 'focus';
    }, []);

    const editorContent = useMemo(() => (
      <ScrollBar hideScrollbar={!props.showVerticalScrollbar}>
        <Wrapper
          ref={wrapperRef}
          onFocus={handleFocus}
          $height={props.autoHeight}
          $showVerticalScrollbar={props.showVerticalScrollbar}
        />
      </ScrollBar>
    ), [props.showVerticalScrollbar, props.autoHeight, handleFocus]);

    return props.label({
      style: props.style,
      animationStyle: props.animationStyle,
      children: editorContent,
    });
  })
    .setPropertyViewFn((children) => {
      const editorContext = useContext(EditorContext);
      const isLogicMode = editorContext.editorModeStatus === "logic" || editorContext.editorModeStatus === "both";
      const isLayoutMode = editorContext.editorModeStatus === "layout" || editorContext.editorModeStatus === "both";

      return (
        <>
          <Section name={sectionNames.basic}>
            {children.value.propertyView({ label: trans("export.jsonEditorDesc") })}
          </Section>

          <FormDataPropertyView {...children} />

          {isLogicMode && (
            <Section name={sectionNames.interaction}>
              {children.onEvent.getPropertyView()}
              {hiddenPropertyView(children)}
              {showDataLoadingIndicatorsPropertyView(children)}
            </Section>
          )}

          <Section name={trans('prop.height')}>
            {children.autoHeight.propertyView({ label: trans('prop.height') })}
          </Section>

          {!children.autoHeight.getView() && (
            <Section name={sectionNames.layout}>
              {children.showVerticalScrollbar.propertyView({label: trans('prop.showVerticalScrollbar')})}
            </Section>
          )}

          {isLayoutMode && (
            <>
              {children.label.getPropertyView()}
              <Section name={sectionNames.style}>{children.style.getPropertyView()}</Section>
              <Section name={sectionNames.animationStyle} hasTooltip={true}>
                {children.animationStyle.getPropertyView()}
              </Section>
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
