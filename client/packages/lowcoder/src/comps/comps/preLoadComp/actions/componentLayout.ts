import { message } from "antd";
import { ActionConfig, ActionExecuteParams } from "../types";

export const changeLayoutAction: ActionConfig = {
  key: 'change-layout',
  label: 'Change layout',
  category: 'layout',
  requiresInput: true,
  inputPlaceholder: 'Enter layout type (grid, flex, absolute)',
  inputType: 'text',
  execute: async (params: ActionExecuteParams) => {
    const { actionValue } = params;
    
    console.log('Changing layout to:', actionValue);
    message.info(`Layout changed to: ${actionValue}`);
    
    // TODO: Implement actual layout change logic
  }
}; 