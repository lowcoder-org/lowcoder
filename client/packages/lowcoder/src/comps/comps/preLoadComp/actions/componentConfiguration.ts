import { message } from "antd";
import { ActionConfig, ActionExecuteParams } from "../types";
import { getEditorComponentInfo } from "../utils";

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
    const { actionValue: name, actionValue, actionPayload, editorState } = params;
    const { component_name: selectedEditorComponent, action_parameters: compProperties } = actionPayload;
    // const { onEvent, ...compProperties } = action_parameters;
    // const { name, ...otherProps } = actionPayload;
    
    try {
      // const componentInfo = getEditorComponentInfo(editorState, name);
      
      // if (!componentInfo) {
      //   message.error(`Component "${selectedEditorComponent}" not found`);
      //   return;
      // }

      // const { componentKey: parentKey, items } = componentInfo;
    
      // if (!parentKey) {
      //   message.error(`Parent component "${selectedEditorComponent}" not found in layout`);
      //   return;
      // }

      // const parentItem = items[parentKey];
      // if (!parentItem) {
      //   message.error(`Parent component "${selectedEditorComponent}" not found in items`);
      //   return;
      // }
      const parentItem = editorState.getUICompByName(selectedEditorComponent);
      if (!parentItem) {
        message.error(`Parent component "${selectedEditorComponent}" not found in items`);
        return;
      }

      const itemComp = parentItem.children.comp;
      const itemData = itemComp.toJsonValue();
      const config = {
        ...itemData,
        ...compProperties
      };
      itemComp.dispatchChangeValueAction(config);

      console.log('Configuring component:', selectedEditorComponent, 'with config:', config);
      message.info(`Configure action for component "${selectedEditorComponent}"`);
      
      // TODO: Implement actual configuration logic
    } catch (error) {
      message.error('Invalid configuration format');
    }
  }
};