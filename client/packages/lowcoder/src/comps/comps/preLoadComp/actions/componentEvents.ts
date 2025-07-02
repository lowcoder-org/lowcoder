import { message } from "antd";
import { ActionConfig, ActionExecuteParams } from "../types";

export const addEventHandlerAction: ActionConfig = {
  key: 'add-event-handler',
  label: 'Add event handler',
  category: 'events',
  requiresEditorComponentSelection: true,
  requiresInput: true,
  inputPlaceholder: 'Enter event handler code (JavaScript)',
  inputType: 'textarea',
  execute: async (params: ActionExecuteParams) => {
    const { selectedEditorComponent, actionValue } = params;
    
    console.log('Adding event handler to component:', selectedEditorComponent, 'with code:', actionValue);
    message.info(`Event handler added to component "${selectedEditorComponent}"`);
    
    // TODO: Implement actual event handler logic
  }
}; 