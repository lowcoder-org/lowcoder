import {
  UICompBuilder,
  NameConfig,
  Section,
  withDefault,
  withExposingConfigs,
  withMethodExposing,
  eventHandlerControl,
  stringExposingStateControl,
  BoolControl,
  LabelControl,
  styleControl,
  dropdownControl,
  AutoHeightControl,
} from "lowcoder-sdk";
import {  CodeEditorContainerStyle, LabelStyle } from "comps/controls/styleControlConstants";
import { useResizeDetector } from "react-resize-detector";
import Editor from "@monaco-editor/react";
import { styled } from "styled-components";
import { trans } from "i18n";
import { useRef, useCallback, useLayoutEffect } from "react";
import debounce from "lodash/debounce";
import * as monacoEditor from "monaco-editor";
import { formDataChildren, FormDataPropertyView } from "../../comps/formComp/formDataConstants";

const CodeEditorWrapper = styled.div`
  border: 1px solid #dddddd;
`;

let CodeEditorTmpComp = (function () {

  const languages = [
    { label: trans("codeEditor.languages.yaml"), value: "yaml" },
    { label: trans("codeEditor.languages.json"), value: "json" },
    { label: trans("codeEditor.languages.xml"), value: "xml" },
    { label: trans("codeEditor.languages.html"), value: "html" },
    { label: trans("codeEditor.languages.css"), value: "css" },
    { label: trans("codeEditor.languages.ini"), value: "ini" },
    { label: trans("codeEditor.languages.sql"), value: "sql" },
    { label: trans("codeEditor.languages.php"), value: "php" },
    { label: trans("codeEditor.languages.shell"), value: "shell" },
    { label: trans("codeEditor.languages.powershell"), value: "powershell" },
    { label: trans("codeEditor.languages.handlebars"), value: "handlebars" },
    { label: trans("codeEditor.languages.dockerfile"), value: "dockerfile" },
    { label: trans("codeEditor.languages.graphql"), value: "graphql" },
    { label: trans("codeEditor.languages.markdown"), value: "markdown" },
    { label: trans("codeEditor.languages.plaintext"), value: "plaintext" },
    { label: trans("codeEditor.languages.python"), value: "python" },
    { label: trans("codeEditor.languages.ruby"), value: "ruby" },
    { label: trans("codeEditor.languages.rust"), value: "rust" },
    { label: trans("codeEditor.languages.java"), value: "java" },
    { label: trans("codeEditor.languages.c"), value: "c" },
    { label: trans("codeEditor.languages.csharp"), value: "csharp" },
    { label: trans("codeEditor.languages.cpp"), value: "cpp" },
    { label: trans("codeEditor.languages.go"), value: "go" },
    { label: trans("codeEditor.languages.javascript"), value: "javascript" },
    { label: trans("codeEditor.languages.typescript"), value: "typescript" }
  ].sort((a, b) => a.label.localeCompare(b.label))

  const defaultValues = {
    value: "",
    language: "yaml",
    theme: "light",
    lineNumbers: "on",
    wordWrap: "on",
    lightbulb: monacoEditor.editor.ShowLightbulbIconMode.OnCode,
    enabled: true,
    disabled: false,
    autoHeight: "445px",
  }

  const themes = [
    { label: trans("codeEditor.theme.light"), value: "light" },
    { label: trans("codeEditor.theme.dark"), value: "vs-dark" },
  ].sort((a, b) => a.label.localeCompare(b.label))

  const lineNumbersOptions = [
    { label: trans("codeEditor.lineNumberOptions.on"), value: "on" },
    { label: trans("codeEditor.lineNumberOptions.off"), value: "off" },
    { label: trans("codeEditor.lineNumberOptions.interval"), value: "interval" },
    { label: trans("codeEditor.lineNumberOptions.relative"), value: "relative" },
  ].sort((a, b) => a.label.localeCompare(b.label))

  const wordWrapOptions = [
    { label: trans("codeEditor.wordWrapOptions.on"), value: "on" },
    { label: trans("codeEditor.wordWrapOptions.off"), value: "off" },
    { label: trans("codeEditor.wordWrapOptions.wordWrapColumn"), value: "wordWrapColumn" },
    { label: trans("codeEditor.wordWrapOptions.bounded"), value: "bounded" },
  ].sort((a, b) => a.label.localeCompare(b.label))

  const childrenMap = {
    autoHeight: withDefault(AutoHeightControl, "auto"),
    language: dropdownControl(languages, defaultValues.language),
    theme: dropdownControl(themes, defaultValues.theme),
    lineNumbers: dropdownControl(lineNumbersOptions, defaultValues.lineNumbers),
    wordWrap: dropdownControl(wordWrapOptions, defaultValues.wordWrap),
    minimap: withDefault(BoolControl, defaultValues.enabled),
    stickyScroll: withDefault(BoolControl, defaultValues.enabled),
    lightbulb: withDefault(BoolControl, defaultValues.enabled),
    hover: withDefault(BoolControl, defaultValues.enabled),
    folding: withDefault(BoolControl, defaultValues.enabled),
    readOnly: withDefault(BoolControl, defaultValues.disabled),
    value: stringExposingStateControl("text", defaultValues.value),
    required: withDefault(BoolControl, defaultValues.disabled),
    label: withDefault(LabelControl, {
      text: "Code Editor",
      tooltip: "",
      hidden: false,
      widthUnit: "%",
      position: "column",
      align: "left"
    }),
    style: styleControl(CodeEditorContainerStyle , "style"),
    labelStyle: styleControl(LabelStyle , 'labelStyle'),
    onEvent: eventHandlerControl([
      {
        label: "onChange",
        value: "change",
        description: "Triggers when data changes",
      },
    ] as const),
    ...formDataChildren,
  };
  
  return new UICompBuilder(childrenMap, (props) => {

  const editorRef = useRef<monacoEditor.editor.IStandaloneCodeEditor | null>(null);
  const lastExternalValue = useRef<string>(props.value.value);

  const { ref: conRef } = useResizeDetector({
    onResize: () => {
      if (editorRef.current) {
        setTimeout(() => {
          editorRef.current?.layout();
        }, 0);
      }
    }
  });

  const getEffectiveDimensions = () => {
    if (props.autoHeight) {
      return {
        width: "100%",
        height: defaultValues.autoHeight
      };
    }
    return {
      width: "100%",
      height: "100%"
    };
  };

  const effectiveDimensions = getEffectiveDimensions();

  const handleEditorDidMount = (
    editor: monacoEditor.editor.IStandaloneCodeEditor
  ) => {
    editorRef.current = editor;
    setTimeout(() => {
      editor.layout();
    }, 0);
  };

  const debouncedOnChange = useCallback(
    debounce((value: string | undefined) => {
      if(props.value && value !== undefined) {
        lastExternalValue.current = value;
        props.value.onChange(value);
        props.onEvent("change");
      }
    }, 300),
    [props.value, props.onEvent]
  );

  const handleOnChange = (value: string | undefined) => {
    if (value !== undefined) {
      debouncedOnChange(value);
    }
  };

  useLayoutEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;

    const currentValue = editor.getValue();
    const newValue = props.value.value;

    if (newValue !== currentValue && newValue !== lastExternalValue.current) {
      const position = editor.getPosition();
      const scrollTop = editor.getScrollTop();

      editor.setValue(newValue);
      lastExternalValue.current = newValue;

      if (position) {
        editor.setPosition(position);
      }
      editor.setScrollTop(scrollTop);
    }
  }, [props.value.value]);

  return props.label({
    required: props.required,
    style: props.style,
    children: (
    <CodeEditorWrapper
      ref={conRef}
      style={{
        position: "relative",
        height: effectiveDimensions.height,
        width: effectiveDimensions.width,
        resize: "none",
        overflow: "hidden",
        minWidth: 200,
        minHeight: 100,
        boxSizing: "border-box",
      }}
    >
      <Editor
        height={effectiveDimensions.height}
        width={effectiveDimensions.width}
        language={props.language}
        defaultLanguage={defaultValues.language}
        defaultValue={props.value.value || defaultValues.value}
        theme={props.theme}
        options={{
          minimap: {
            enabled: props.minimap,
          },
          stickyScroll: {
            enabled: props.stickyScroll,
          },
          lightbulb: {
            enabled: props.lightbulb
              ? monacoEditor.editor.ShowLightbulbIconMode.OnCode
              : monacoEditor.editor.ShowLightbulbIconMode.Off,
          },
          hover: {
            enabled: props.hover,
          },
            wordWrap: props.wordWrap as 'off' | 'on' | 'wordWrapColumn' | 'bounded',
          folding: props.folding,
          readOnly: props.readOnly,
          lineNumbers: props.lineNumbers as monacoEditor.editor.LineNumbersType,
          automaticLayout: !props.autoHeight,
        }}
        onMount={handleEditorDidMount}
        onChange={handleOnChange}
      />
    </CodeEditorWrapper>
    )
  })
})
.setPropertyViewFn((children: any) => {
  return (
    <>
      <Section name="Basic">
        {children.value.propertyView({ label: trans("codeEditor.properties.value") })}
        {children.language.propertyView({ label: trans("codeEditor.properties.language") })}
        {children.theme.propertyView({ label: trans("codeEditor.properties.theme") })}
        {children.lineNumbers.propertyView({ label: trans("codeEditor.properties.lineNumbers") })}
        {children.wordWrap.propertyView({ label: trans("codeEditor.properties.wordWrap") })}
        {children.minimap.propertyView({ label: trans("codeEditor.properties.minimap") })}
        {children.stickyScroll.propertyView({ label: trans("codeEditor.properties.stickyScroll")})}
        {children.lightbulb.propertyView({ label: trans("codeEditor.properties.lightbulb") })}
        {children.hover.propertyView({ label: trans("codeEditor.properties.hover") })}
        {children.folding.propertyView({ label: trans("codeEditor.properties.folding") })}
      </Section>
      {children.label.getPropertyView()}
      <Section name="Interaction">
        {children.onEvent.propertyView()}
      </Section>
      <Section name="Layout">
        {children.autoHeight.getPropertyView()}
      </Section>
      <Section name="Advanced">
        {children.readOnly.propertyView({ label: trans("codeEditor.properties.readOnly") })}
      </Section>
      <Section name="Validation">
        {children.required.propertyView({ label: trans("codeEditor.properties.required") })}
      </Section>
      <Section name="Style">
        {children.style.getPropertyView()}
      </Section>
      <Section name="Label Style">
        {children.labelStyle.getPropertyView()}
      </Section>
      <FormDataPropertyView {...children} />
    </>
  );
})
.build();
})();

CodeEditorTmpComp = class extends CodeEditorTmpComp {
  autoHeight(): boolean {
    return this.children.autoHeight.getView();
  }
};

CodeEditorTmpComp = withMethodExposing(CodeEditorTmpComp, [
  {
    method: {
      name: "setValue",
      description: trans("codeEditor.methods.setValue"),
      params: [{
        name: "value",
        type: "JSON",
        description: "JSON value"
      }],
    },
    execute: (comp: any, values: any[]) => {
      let codeValue = Array.isArray(values) ? values[0] : values;
      if (typeof codeValue === "object" && codeValue !== null) {
        codeValue = JSON.stringify(codeValue, null, 2);
      }
      comp.children.value.dispatchChangeValueAction(codeValue);
    }
  },
  {
    method: {
      name: "setLanguage",
      description: trans("codeEditor.methods.setLanguage"),
      params: [{
        name: "language",
        type: "string",
        description: "string"
      }],
    },
    execute: (comp: any, values: any[]) => {
      if(Array.isArray(values)) {
        comp.children.language.dispatchChangeValueAction(values[0]);
      } else {
        comp.children.language.dispatchChangeValueAction(values);
      }
    }
  },
  {
    method: {
      name: "setTheme",
      description: trans("codeEditor.methods.setTheme"),
      params: [{
        name: "theme",
        type: "string",
        description: "string"
      }],
    },
    execute: (comp: any, values: any[]) => {
      if(Array.isArray(values)) {
        comp.children.theme.dispatchChangeValueAction(values[0]);
      } else {
        comp.children.theme.dispatchChangeValueAction(values);
      }
    }
  },
  {
    method: {
      name: "setLineNumbers",
      description: trans("codeEditor.methods.setLineNumbers"),
      params: [{
        name: "lineNumbers",
        type: "string",
        description: "string"
      }],
    },
    execute: (comp: any, values: any[]) => {
      if(Array.isArray(values)) {
        comp.children.lineNumbers.dispatchChangeValueAction(values[0]);
      } else {
        comp.children.lineNumbers.dispatchChangeValueAction(values);
      }
    }
  },
  {
    method: {
      name: "enableMinimap",
      description: trans("codeEditor.methods.enableMinimap"),
      params: [{
        name: "minimap",
        type: "boolean",
        description: "boolean"
      }],
    },
    execute: (comp: any, values: any[]) => {
      if(Array.isArray(values)) {
        comp.children.minimap.dispatchChangeValueAction(values[0]);
      } else {
        comp.children.minimap.dispatchChangeValueAction(values);
      }
    }
  },
  {
    method: {
      name: "enableStickyScroll",
      description: trans("codeEditor.methods.enableStickyScroll"),
      params: [{
        name: "stickyScroll",
        type: "boolean",
        description: "boolean"
      }],
    },
    execute: (comp: any, values: any[]) => {
      if(Array.isArray(values)) {
        comp.children.stickyScroll.dispatchChangeValueAction(values[0]);
      } else {
        comp.children.stickyScroll.dispatchChangeValueAction(values);
      }
    }
  },
  {
    method: {
      name: "enableLightbulb",
      description: trans("codeEditor.methods.enableLightbulb"),
      params: [{
        name: "lightbulb",
        type: "boolean",
        description: "boolean"
      }],
    },
    execute: (comp: any, values: any[]) => {
      const lightbulbEnum = monacoEditor.editor.ShowLightbulbIconMode;

      if(Array.isArray(values)) {
        if(Boolean(values[0])) {
          comp.children.lightbulb.dispatchChangeValueAction(lightbulbEnum.OnCode);
        } else {
          comp.children.lightbulb.dispatchChangeValueAction(lightbulbEnum.Off);
        }
      } else {
        if(Boolean(values)) {
          comp.children.lightbulb.dispatchChangeValueAction(lightbulbEnum.OnCode);
        } else {
          comp.children.lightbulb.dispatchChangeValueAction(lightbulbEnum.Off);
        }
      }
    }
  },
  {
    method: {
      name: "enableHover",
      description: trans("codeEditor.methods.enableHover"),
      params: [{
        name: "hover",
        type: "boolean",
        description: "boolean"
      }],
    },
    execute: (comp: any, values: any[]) => {
      if(Array.isArray(values)) {
        comp.children.hover.dispatchChangeValueAction(values[0]);
      } else {
        comp.children.hover.dispatchChangeValueAction(values);
      }
    }
  },
  {
    method: {
      name: "enableFolding",
      description: trans("codeEditor.methods.enableFolding"),
      params: [{
        name: "folding",
        type: "boolean",
        description: "boolean"
      }],
    },
    execute: (comp: any, values: any[]) => {
      if(Array.isArray(values)) {
        comp.children.folding.dispatchChangeValueAction(values[0]);
      } else {
        comp.children.folding.dispatchChangeValueAction(values);
      }
    }
  },
  {
    method: {
      name: "enableWordWrap",
      description: trans("codeEditor.methods.enableWordWrap"),
      params: [{
        name: "wordWrap",
        type: "boolean",
        description: "boolean"
      }],
    },
    execute: (comp: any, values: any[]) => {
      if(Array.isArray(values)) {
        comp.children.wordWrap.dispatchChangeValueAction(values[0]);
      } else {
        comp.children.wordWrap.dispatchChangeValueAction(values);
      }
    }
  },
  {
    method: {
      name: "setReadOnly",
      description: trans("codeEditor.methods.setReadOnly"),
      params: [{
        name: "readOnly",
        type: "boolean",
        description: "boolean"
      }],
    },
    execute: (comp: any, values: any[]) => {
      if(Array.isArray(values)) {
        comp.children.readOnly.dispatchChangeValueAction(values[0]);
      } else {
        comp.children.readOnly.dispatchChangeValueAction(values);
      }
    }
  },
  {
    method: {
      name: "markAsRequired",
      description: trans("codeEditor.methods.markAsRequired"),
      params: [{
        name: "required",
        type: "boolean",
        description: "boolean"
      }],
    },
    execute: (comp: any, values: any[]) => {
      if(Array.isArray(values)) {
        comp.children.required.dispatchChangeValueAction(values[0]);
      } else {
        comp.children.required.dispatchChangeValueAction(values);
      }
    }
  },
]);

export const CodeEditorComp = withExposingConfigs(CodeEditorTmpComp, [
  new NameConfig("value", trans("codeEditor.properties.value")),
  new NameConfig("language", trans("codeEditor.properties.language")),
  new NameConfig("theme", trans("codeEditor.properties.theme")),
  new NameConfig("lineNumbers", trans("codeEditor.properties.lineNumbers")),
  new NameConfig("wordWrap", trans("codeEditor.properties.wordWrap")),
  new NameConfig("minimap", trans("codeEditor.properties.minimap")),
  new NameConfig("stickyScroll", trans("codeEditor.properties.stickyScroll")),
  new NameConfig("lightbulb", trans("codeEditor.properties.lightbulb")),
  new NameConfig("hover", trans("codeEditor.properties.hover")),
  new NameConfig("folding", trans("codeEditor.properties.folding")),
  new NameConfig("readOnly", trans("codeEditor.properties.readOnly")),
  new NameConfig("required", trans("codeEditor.properties.required")),
]);