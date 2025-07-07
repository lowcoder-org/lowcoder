import { message } from "antd";
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
    const { selectedEditorComponent, actionValue } = params;
    
    try {
      const config = JSON.parse(actionValue);
      console.log('Configuring component:', selectedEditorComponent, 'with config:', config);
      message.info(`Configure action for component "${selectedEditorComponent}"`);
      
      // TODO: Implement actual configuration logic
    } catch (error) {
      message.error('Invalid configuration format');
    }
  }
}; 