import { message } from "antd";
import { ActionConfig, ActionExecuteParams } from "../types";

export const applyStyleAction: ActionConfig = {
  key: 'apply-style',
  label: 'Apply style to component',
  category: 'styling',
  requiresEditorComponentSelection: true,
  requiresInput: true,
  inputPlaceholder: 'Enter CSS styles (JSON format)',
  inputType: 'json',
  validation: (value: string) => {
    if (!value.trim()) return 'Styles are required';
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
      const styles = JSON.parse(actionValue);
      console.log('Applying styles to component:', selectedEditorComponent, 'with styles:', styles);
      message.info(`Styles applied to component "${selectedEditorComponent}"`);
      
      // TODO: Implement actual style application logic
    } catch (error) {
      message.error('Invalid style format');
    }
  }
}; 