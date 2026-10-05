import { message } from "antd";
import merge from "lodash/merge";
import { ActionConfig, ActionExecuteParams } from "../types";

export const applyStyleAction: ActionConfig = {
  key: "apply-style",
  label: "Apply style to component",
  category: "styling",
  requiresEditorComponentSelection: true,
  requiresStyle: true,
  requiresInput: true,
  inputPlaceholder: "Enter namespaced styles as JSON",
  inputType: "json",
  validation: (value: string) => {
    if (!value.trim()) return "Styles are required";
    try {
      JSON.parse(value);
      return null;
    } catch {
      return "Invalid JSON format";
    }
  },
  execute: async (params: ActionExecuteParams) => {
    const { actionPayload, editorState } = params;
    const componentName =
      actionPayload?.component_name || params.selectedEditorComponent;
    const stylePatch = { ...(actionPayload?.action_parameters || {}) };
    delete stylePatch.animationStyle;

    if (!componentName) {
      message.error("No component name provided for set_style");
      return;
    }

    if (!editorState) {
      message.error("Editor state is required");
      return;
    }

    try {
      const comp = editorState.getUICompByName(componentName);
      if (!comp) {
        message.error(`Component "${componentName}" not found`);
        return;
      }

      const itemComp = comp.children.comp;
      const config = merge({}, itemComp.toJsonValue(), stylePatch);
      itemComp.dispatchChangeValueAction(config);

      message.success(`Styles updated on "${componentName}"`);
    } catch (error) {
      console.error("Error setting styles:", error);
      message.error("Failed to set component styles");
    }
  },
};
