import { message } from "antd";
import { ActionConfig, ActionExecuteParams } from "../types";
import { getEditorComponentInfo } from "../utils";
import { changeValueAction, multiChangeAction, wrapActionExtraInfo } from "lowcoder-core";

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

export const updateDynamicLayoutAction: ActionConfig = {
  key: 'update-dynamic-layout',
  label: 'Update Dynamic Layout',
  category: 'layout',
  requiresInput: false,
  dynamicLayout: true,
  execute: async (params: ActionExecuteParams) => {
    const { selectedDynamicLayoutIndex, selectedEditorComponent, editorState } = params;

    if (!selectedEditorComponent || !editorState || !selectedDynamicLayoutIndex) {
      message.error('Component, editor state, and layout index are required');
      return;
    }

    try {
      const componentInfo = getEditorComponentInfo(editorState, selectedEditorComponent);

      if (!componentInfo) {
        message.error(`Component "${selectedEditorComponent}" not found`);
        return;
      }

      const { componentKey, currentLayout, simpleContainer, items } = componentInfo;

      if (!componentKey || !currentLayout[componentKey]) {
        message.error(`Component "${selectedEditorComponent}" not found in layout`);
        return;
      }

      const currentLayoutItem = currentLayout[componentKey];
      const newPos = parseInt(selectedDynamicLayoutIndex);

      if (isNaN(newPos)) {
        message.error('Invalid layout index provided');
        return;
      }

      const currentPos = currentLayoutItem.pos || 0;
      const layoutItems = Object.entries(currentLayout).map(([key, item]) => ({
        key,
        item: item as any,
        pos: (item as any).pos || 0
      })).sort((a, b) => a.pos - b.pos);

      const otherItems = layoutItems.filter(item => item.key !== componentKey);
      const newLayout: any = {};
      
      newLayout[componentKey] = {
        ...currentLayoutItem,
        pos: newPos
      };
      
      // Update other components with shifted positions
      otherItems.forEach((item) => {
        let adjustedPos = item.pos;
        
        // If moving to a position before the current position, shift items in between
        if (newPos < currentPos && item.pos >= newPos && item.pos < currentPos) {
          adjustedPos = item.pos + 1;
        }
        // If moving to a position after the current position, shift items in between
        else if (newPos > currentPos && item.pos > currentPos && item.pos <= newPos) {
          adjustedPos = item.pos - 1;
        }
        
        newLayout[item.key] = {
          ...item.item,
          pos: adjustedPos
        };
      });

      simpleContainer.dispatch(
        wrapActionExtraInfo(
          multiChangeAction({
            layout: changeValueAction(newLayout, true),
          }),
          { 
            compInfos: [{ 
              compName: selectedEditorComponent, 
              compType: (items[componentKey] as any).children.compType.getView(), 
              type: "layout" 
            }] 
          }
        )
      );

      editorState.setSelectedCompNames(new Set([selectedEditorComponent]), "layoutComp");

      message.success(`Component "${selectedEditorComponent}" moved to position ${newPos}`);
      
    } catch (error) {
      console.error('Error updating dynamic layout:', error);
      message.error('Failed to update dynamic layout. Please try again.');
    }
  }
}; 