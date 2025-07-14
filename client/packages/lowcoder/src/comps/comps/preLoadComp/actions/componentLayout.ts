import { message } from "antd";
import { ActionConfig, ActionExecuteParams } from "../types";
import { getEditorComponentInfo } from "../utils";
import { changeValueAction, multiChangeAction, wrapActionExtraInfo } from "lowcoder-core";

export const alignComponentAction: ActionConfig = {
  key: 'align-component',
  label: 'Align component',
  category: 'layout',
  requiresInput: true,
  requiresEditorComponentSelection: true,
  inputPlaceholder: 'Enter alignment type (left, center, right)',
  inputType: 'text',
  validation: (value: string) => {
    const alignment = value.toLowerCase().trim();
    if (!['left', 'center', 'right'].includes(alignment)) {
      return 'Alignment must be one of: left, center, right';
    }
    return null;
  },
  execute: async (params: ActionExecuteParams) => {
    const { actionValue, editorState, selectedEditorComponent } = params;
    
    if (!selectedEditorComponent || !editorState) {
      message.error('Component and editor state are required');
      return;
    }

    const alignment = actionValue.toLowerCase().trim();
    if (!['left', 'center', 'right'].includes(alignment)) {
      message.error('Invalid alignment. Must be: left, center, or right');
      return;
    }

    try {
      const componentInfo = getEditorComponentInfo(editorState, selectedEditorComponent);
      if(!componentInfo) {
        message.error(`Component "${selectedEditorComponent}" not found`);
        return;
      }

      const { componentKey, currentLayout, simpleContainer, items } = componentInfo;
      if(!componentKey) {
        message.error(`Component "${selectedEditorComponent}" not found`);
        return;
      }

      const layout = currentLayout[componentKey];
      if(!layout) {
        message.error(`Component "${selectedEditorComponent}" not found`);
        return;
      }

      const appSettingsComp = editorState.getAppSettingsComp();
      if (!appSettingsComp) {
        message.error('App settings component not found');
        return;
      }

      const gridColumns = appSettingsComp.children.gridColumns?.getView() || 24;
      
      const currentX = layout.x || 0;
      const currentY = layout.y || 0;
      const currentWidth = layout.w || 1;
      const currentHeight = layout.h || 1;

      let newX = currentX;
      
      switch (alignment) {
        case 'left':
          newX = 0;
          break;
        case 'center':
          newX = Math.max(0, Math.floor((gridColumns - currentWidth) / 2));
          break;
        case 'right':
          newX = Math.max(0, gridColumns - currentWidth);
          break;
      }

      newX = Math.max(0, Math.min(newX, gridColumns - currentWidth));

      const newLayout = {
        ...currentLayout,
        [componentKey]: {
          ...layout,
          x: newX,
          y: currentY,
          w: currentWidth,
          h: currentHeight,
        }
      };

      Object.entries(currentLayout).forEach(([key, item]) => {
        if (key !== componentKey) {
          const otherItem = item as any;
          const otherX = otherItem.x || 0;
          const otherY = otherItem.y || 0;
          const otherWidth = otherItem.w || 1;
          const otherHeight = otherItem.h || 1;

          const collision = !(
            newX + currentWidth <= otherX ||
            otherX + otherWidth <= newX ||
            currentY + currentHeight <= otherY ||
            otherY + otherHeight <= currentY
          );

          if (collision) {
            newLayout[key] = {
              ...otherItem,
              y: Math.max(otherY, currentY + currentHeight)
            };
          } else {
            newLayout[key] = otherItem;
          }
        }
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

      editorState.setSelectedCompNames(new Set([selectedEditorComponent]), "alignComp");
      
      message.success(`Component "${selectedEditorComponent}" aligned to ${alignment}`);
      
    } catch (error) {
      console.error('Error aligning component:', error);
      message.error('Failed to align component. Please try again.');
    }
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