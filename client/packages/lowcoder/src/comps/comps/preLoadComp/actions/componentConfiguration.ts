import { message } from "antd";
import merge from "lodash/merge";
import { ActionConfig, ActionExecuteParams } from "../types";

export const configureComponentAction: ActionConfig = {
  key: 'configure-components',
  label: 'Configure a component',
  category: 'component-configuration',
  requiresEditorComponentSelection: true,
  requiresInput: true,
  inputPlaceholder: 'Enter configuration (JSON format)',
  inputType: 'json',
  validation: (value: string) => {
    if (!value.trim()) return 'Configuration is required';
    try {
      JSON.parse(value);
      return null;
    } catch {
      return 'Invalid JSON format';
    }
  },
  execute: async (params: ActionExecuteParams) => {
    const { actionPayload, editorState } = params;
    const componentName = actionPayload?.component_name || actionPayload?.component || params.selectedEditorComponent;
    const compProperties = actionPayload?.action_parameters;

    if (!componentName) {
      message.error("No component name provided for set_properties");
      return;
    }

    if (!compProperties || typeof compProperties !== "object") {
      message.error("No properties provided for set_properties");
      return;
    }

    try {
      const comp = editorState.getUICompByName(componentName);
      if (!comp) {
        message.error(`Component "${componentName}" not found`);
        return;
      }

      const itemComp = comp.children.comp;
      const config = merge({}, itemComp.toJsonValue(), compProperties);
      itemComp.dispatchChangeValueAction(config);

      message.success(`Properties updated on "${componentName}"`);
    } catch (error) {
      console.error("Error setting properties:", error);
      message.error("Failed to set component properties");
    }
  }
};
