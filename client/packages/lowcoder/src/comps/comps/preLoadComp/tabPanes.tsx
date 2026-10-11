import { HelpText } from "components/HelpText";
import React, { useEffect } from "react";
import styled from "styled-components";
import { trans } from "i18n";
import { ConstructorToComp } from "lowcoder-core";
import { ScriptComp, CSSComp } from "./components";
import { runScript } from "./utils";

const PaneWrapper = styled.div`
  height: 100%;
  display: flex;
  flex-direction: column;
`;

const EditorWrapper = styled.div`
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;

  /* the tooltip container the editor renders inside */
  > div {
    flex: 1;
    min-height: 0;
  }
`;

export function JavaScriptTabPane(props: { comp: ConstructorToComp<typeof ScriptComp> }) {
  useEffect(() => {
    // Use the imported runScript function instead of the component's method to avoid require() issues
    const code = props.comp.getView();
    if (code) {
      runScript(code, false);
    }
  }, [props.comp]);

  const codePlaceholder = `window.name = 'Tom';\nwindow.greet = () => "hello world";`;

  return (
    <PaneWrapper>
      <HelpText style={{ marginBottom: 20 }}>{trans("preLoad.jsHelpText")}</HelpText>
      <EditorWrapper>
        {props.comp.editorView({
          expandable: false,
          styleName: "fill",
          codeType: "Function",
          language: "javascript",
          placeholder: codePlaceholder,
          enableAIHelp: true,
          aiHelp: {
            targetKind: "javascript",
            label: "App JavaScript",
            fieldName: "preloadJavaScript",
            targetId: "preload.script",
            fieldDescription:
              "Application-level JavaScript loaded for the current app. Help generate, explain, or improve global methods and variables that can be used by app logic.",
          },
        })}
      </EditorWrapper>
    </PaneWrapper>
  );
}

export function CSSTabPane(props: { comp: CSSComp, isGlobal?: boolean }) {
  useEffect(() => {
    props.comp.applyAllCSS();
  }, [props.comp]);

  const codePlaceholder = `.top-header {\n  background-color: red; \n}`;

  return (
    <PaneWrapper>
      <HelpText style={{ marginBottom: 20 }}>{trans("preLoad.cssHelpText")}</HelpText>
      <EditorWrapper>
        {props.comp.editorView({
          expandable: false,
          placeholder: codePlaceholder,
          styleName: "fill",
          language: "css",
          enableAIHelp: true,
          aiHelp: {
            label: props.isGlobal ? "App Global CSS" : "App CSS",
            fieldName: props.isGlobal ? "preloadGlobalCSS" : "preloadCSS",
            targetId: props.isGlobal ? "preload.globalCSS" : "preload.css",
            fieldDescription: props.isGlobal
              ? "Global CSS rules for the current app. Help generate, explain, or improve CSS that applies globally."
              : "Application-level CSS rules for the current app. Help generate, explain, or improve CSS for app styling.",
          },
        })}
      </EditorWrapper>
    </PaneWrapper>
  );
} 
