import { useMemo, type MouseEvent } from "react";
import { SparklesIcon } from "lucide-react";
import styled from "styled-components";
import type { EditorView } from "@codemirror/view";
import Tooltip from "antd/es/tooltip";

import { useAIHelper } from "./context/AIHelperController";
import type {
  AIHelperApplyAction,
  AIHelperTarget,
  AIHelperTargetKind,
} from "./types";

export interface CodeEditorAIHelpButtonProps {
  view?: EditorView;
  label?: string;
  language?: AIHelperTarget["language"];
  targetKind?: AIHelperTargetKind;
  datasourceId?: string;
  queryType?: string;
  queryName?: string;
  componentName?: string;
  fieldName?: string;
  fieldDescription?: string;
  targetId?: string;
}

const Button = styled.button.attrs({ className: "code-editor-ai-help-button" })`
  position: absolute;
  top: 4px;
  right: 24px;
  z-index: 5;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  height: 22px;
  padding: 0 8px;
  border: 1px solid #dbe4ff;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.94);
  color: #4965f2;
  cursor: pointer;
  font-size: 11px;
  font-weight: 500;

  &:hover {
    border-color: #b7c4ff;
    background: #f2f5ff;
  }
`;

function applyToView(view: EditorView, action: AIHelperApplyAction) {
  const doc = view.state.doc;
  const docLen = doc.length;

  if (action.mode === "append") {
    view.dispatch({
      changes: { from: docLen, to: docLen, insert: action.value },
      selection: { anchor: docLen + action.value.length },
    });
    view.focus();
    return;
  }

  if (action.mode === "insertAtCursor") {
    const cursor = view.state.selection.main.head;
    view.dispatch({
      changes: { from: cursor, to: cursor, insert: action.value },
      selection: { anchor: cursor + action.value.length },
    });
    view.focus();
    return;
  }

  const selection = view.state.selection.main;
  const from = selection.empty ? 0 : selection.from;
  const to = selection.empty ? docLen : selection.to;
  view.dispatch({
    changes: { from, to, insert: action.value },
    selection: { anchor: from + action.value.length },
  });
  view.focus();
}

function defaultTargetKind(
  language: AIHelperTarget["language"] | undefined
): AIHelperTargetKind {
  if (language === "sql") return "sql";
  if (language === "javascript") return "javascript";
  if (language === "json") return "json";
  return "component-field";
}

export function CodeEditorAIHelpButton({
  view,
  label,
  language,
  targetKind,
  datasourceId,
  queryType,
  queryName,
  componentName,
  fieldName,
  fieldDescription,
  targetId,
}: CodeEditorAIHelpButtonProps) {
  const helper = useAIHelper();
  const id = useMemo(
    () =>
      targetId ??
      [
        queryName,
        componentName,
        fieldName,
        label,
        language,
      ].filter(Boolean).join("|"),
    [targetId, queryName, componentName, fieldName, label, language]
  );

  if (!helper || !view) return null;

  const onClick = (event: MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();

    const doc = view.state.doc.toString();
    const selection = view.state.selection.main;
    const target: AIHelperTarget = {
      id: id || "field",
      kind: targetKind ?? defaultTargetKind(language),
      label,
      language,
      currentValue: doc,
      selection: doc.slice(selection.from, selection.to),
      cursor: selection.head,
      datasourceId,
      queryType,
      queryName,
      componentName,
      fieldName,
      fieldDescription,
    };

    helper.openHelper({
      target,
      onApply: (action) => applyToView(view, action),
    });
  };

  return (
    <Tooltip title="Ask AI for help" placement="top">
      <Button
        type="button"
        aria-label="Ask AI for help"
        onClick={onClick}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <SparklesIcon size={12} />
      </Button>
    </Tooltip>
  );
}
