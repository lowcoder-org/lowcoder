import { HelpText } from "components/HelpText";
import React, { useEffect } from "react";
import { trans } from "i18n";
import { ConstructorToComp } from "lowcoder-core";
import { ScriptComp, CSSComp } from "./components";

export function JavaScriptTabPane(props: { comp: ConstructorToComp<typeof ScriptComp> }) {
  useEffect(() => {
    props.comp.runPreloadScript();
  }, [props.comp]);

  const codePlaceholder = `window.name = 'Tom';\nwindow.greet = () => "hello world";`;

  return (
    <>
      <HelpText style={{ marginBottom: 20 }}>{trans("preLoad.jsHelpText")}</HelpText>
      {props.comp.propertyView({
        expandable: false,
        styleName: "window",
        codeType: "Function",
        language: "javascript",
        placeholder: codePlaceholder,
      })}
    </>
  );
}

export function CSSTabPane(props: { comp: CSSComp, isGlobal?: boolean }) {
  useEffect(() => {
    props.comp.applyAllCSS();
  }, [props.comp]);

  const codePlaceholder = `.top-header {\n  background-color: red; \n}`;

  return (
    <>
      <HelpText style={{ marginBottom: 20 }}>{trans("preLoad.cssHelpText")}</HelpText>
      {props.comp.propertyView({
        expandable: false,
        placeholder: codePlaceholder,
        styleName: "window",
        language: "css",
      })}
    </>
  );
} 