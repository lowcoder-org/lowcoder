import { message } from "antd";
import { genRandomKey } from "comps/utils/idGenerator";
import { parseCompType } from "comps/utils/remote";
import { defaultLayout, GridItemDataType } from "comps/comps/gridItemComp";
import { addMapChildAction } from "comps/generators/sameTypeMap";
import { uiCompRegistry, UICompType } from "comps/uiCompRegistry";
import { ActionConfig, ActionExecuteParams } from "../types";
import { 
    multiChangeAction, 
    wrapActionExtraInfo, 
    changeValueAction, 
    wrapChildAction, 
    deleteCompAction 
} from "lowcoder-core";
import { getEditorComponentInfo } from "../utils";

export const addComponentAction: ActionConfig = {
  key: 'add-components',
  label: 'Place a component',
  category: 'component-management',
  requiresComponentSelection: true,
  requiresInput: false,
  execute: async (params: ActionExecuteParams) => {
    const { selectedComponent, editorState } = params;
    
    if (!selectedComponent || !editorState) {
      message.error('Component and editor state are required');
      return;
    }

    try {
      const uiComp = editorState.getUIComp();
      const container = uiComp.getComp();
      
      if (!container) {
        message.error('No container available to add component');
        return;
      }

      const simpleContainer = container.realSimpleContainer();
      if (!simpleContainer) {
        message.error('No grid container available');
        return;
      }

      const nameGenerator = editorState.getNameGenerator();
      const compInfo = parseCompType(selectedComponent);
      const compName = nameGenerator.genItemName(compInfo.compName);
      const key = genRandomKey();

      const manifest = uiCompRegistry[selectedComponent];
      let defaultDataFn = undefined;

      if (manifest?.lazyLoad) {
        const { defaultDataFnName, defaultDataFnPath } = manifest;
        if (defaultDataFnName && defaultDataFnPath) {
          const module = await import(`../../../${defaultDataFnPath}.tsx`);
          defaultDataFn = module[defaultDataFnName];
        }
      } else if (!compInfo.isRemote) {
        defaultDataFn = manifest?.defaultDataFn;
      }

      const widgetValue: GridItemDataType = {
        compType: selectedComponent,
        name: compName,
        comp: defaultDataFn ? defaultDataFn(compName, nameGenerator, editorState) : undefined,
      };

      const currentLayout = simpleContainer.children.layout.getView();
      const layoutInfo = manifest?.layoutInfo || defaultLayout(selectedComponent as UICompType);
      
      let itemPos = 0;
      if (Object.keys(currentLayout).length > 0) {
        itemPos = Math.min(...Object.values(currentLayout).map((l: any) => l.pos || 0)) - 1;
      }

      const layoutItem = {
        i: key,
        x: 0,
        y: 0,
        w: layoutInfo.w || 6,
        h: layoutInfo.h || 5,
        pos: itemPos,
        isDragging: false,
      };

      simpleContainer.dispatch(
        wrapActionExtraInfo(
          multiChangeAction({
            layout: changeValueAction({
              ...currentLayout,
              [key]: layoutItem,
            }, true),
            items: addMapChildAction(key, widgetValue),
          }),
          { compInfos: [{ compName: compName, compType: selectedComponent, type: "add" }] }
        )
      );

      editorState.setSelectedCompNames(new Set([compName]), "addComp");
      
      message.success(`Component "${manifest?.name || selectedComponent}" added successfully!`);
    } catch (error) {
      console.error('Error adding component:', error);
      message.error('Failed to add component. Please try again.');
    }
  }
};

export const nestComponentAction: ActionConfig = {
  key: 'nest-components',
  label: 'Nest a component',
  category: 'component-management',
  requiresEditorComponentSelection: true,
  requiresInput: false,
  isNested: true,
  execute: async (params: ActionExecuteParams) => {
    const { selectedEditorComponent, selectedNestComponent, editorState } = params;
    
    if (!selectedEditorComponent || !selectedNestComponent || !editorState) {
      message.error('Parent component, child component, and editor state are required');
      return;
    }

    const parentComponentInfo = getEditorComponentInfo(editorState, selectedEditorComponent);
    
    if (!parentComponentInfo) {
      message.error(`Parent component "${selectedEditorComponent}" not found`);
      return;
    }

    const { componentKey: parentKey, items } = parentComponentInfo;
    
    if (!parentKey) {
      message.error(`Parent component "${selectedEditorComponent}" not found in layout`);
      return;
    }

    const parentItem = items[parentKey];
    if (!parentItem) {
      message.error(`Parent component "${selectedEditorComponent}" not found in items`);
      return;
    }

    // Check if parent is a container
    const parentCompType = parentItem.children.compType.getView();
    const parentManifest = uiCompRegistry[parentCompType];
    
    if (!parentManifest?.isContainer) {
      message.error(`Component "${selectedEditorComponent}" is not a container and cannot nest components`);
      return;
    }

    try {

      const nameGenerator = editorState.getNameGenerator();
      const compInfo = parseCompType(selectedNestComponent);
      const compName = nameGenerator.genItemName(compInfo.compName);
      const key = genRandomKey();

      const manifest = uiCompRegistry[selectedNestComponent];
      let defaultDataFn = undefined;

      if (manifest?.lazyLoad) {
        const { defaultDataFnName, defaultDataFnPath } = manifest;
        if (defaultDataFnName && defaultDataFnPath) {
          const module = await import(`../../../${defaultDataFnPath}.tsx`);
          defaultDataFn = module[defaultDataFnName];
        }
      } else if (!compInfo.isRemote) {
        defaultDataFn = manifest?.defaultDataFn;
      }

      const widgetValue: GridItemDataType = {
        compType: selectedNestComponent,
        name: compName,
        comp: defaultDataFn ? defaultDataFn(compName, nameGenerator, editorState) : undefined,
      };

      const parentContainer = parentItem.children.comp;
      
      const realContainer = parentContainer.realSimpleContainer();
      if (!realContainer) {
        message.error(`Container "${selectedEditorComponent}" cannot accept nested components`);
        return;
      }
      
      const currentLayout = realContainer.children.layout.getView();
      const layoutInfo = manifest?.layoutInfo || defaultLayout(selectedNestComponent as UICompType);
      
      let itemPos = 0;
      if (Object.keys(currentLayout).length > 0) {
        itemPos = Math.max(...Object.values(currentLayout).map((l: any) => l.pos || 0)) + 1;
      }

      const layoutItem = {
        i: key,
        x: 0,
        y: 0,
        w: layoutInfo.w || 6,
        h: layoutInfo.h || 5,
        pos: itemPos,
        isDragging: false,
      };

      realContainer.dispatch(
        wrapActionExtraInfo(
          multiChangeAction({
            layout: changeValueAction({
              ...currentLayout,
              [key]: layoutItem,
            }, true),
            items: addMapChildAction(key, widgetValue),
          }),
          { compInfos: [{ compName: compName, compType: selectedNestComponent, type: "add" }] }
        )
      );

      editorState.setSelectedCompNames(new Set([compName]), "nestComp");
      
      message.success(`Component "${manifest?.name || selectedNestComponent}" nested in "${selectedEditorComponent}" successfully!`);
    } catch (error) {
      console.error('Error nesting component:', error);
      message.error('Failed to nest component. Please try again.');
    }
  }
}

export const deleteComponentAction: ActionConfig = {
  key: 'delete-components',
  label: 'Delete a component',
  category: 'component-management',
  requiresEditorComponentSelection: true,
  requiresInput: false,
  execute: async (params: ActionExecuteParams) => {
    const { selectedEditorComponent, editorState } = params;
    
    if (!selectedEditorComponent || !editorState) {
      message.error('Component and editor state are required');
      return;
    }

    try {
      const componentInfo = getEditorComponentInfo(editorState, selectedEditorComponent);
      
      if (!componentInfo) {
        message.error(`Component "${selectedEditorComponent}" not found`);
        return;
      }

      const { componentKey, currentLayout, simpleContainer, componentType } = componentInfo;

      if (!componentKey || !currentLayout[componentKey]) {
        message.error(`Component "${selectedEditorComponent}" not found in layout`);
        return;
      }

      const newLayout = { ...currentLayout };
      delete newLayout[componentKey];

      simpleContainer.dispatch(
        wrapActionExtraInfo(
          multiChangeAction({
            layout: changeValueAction(newLayout, true),
            items: wrapChildAction(componentKey, deleteCompAction()),
          }),
          { 
            compInfos: [{ 
              compName: selectedEditorComponent, 
              compType: componentType || 'unknown', 
              type: "delete" 
            }] 
          }
        )
      );

      editorState.setSelectedCompNames(new Set(), "deleteComp");
      
      message.success(`Component "${selectedEditorComponent}" deleted successfully`);
    } catch (error) {
      console.error('Error deleting component:', error);
      message.error('Failed to delete component. Please try again.');
    }
  }
};

export const moveComponentAction: ActionConfig = {
  key: 'move-components',
  label: 'Move a component',
  category: 'component-management',
  requiresEditorComponentSelection: true,
  requiresInput: true,
  inputPlaceholder: 'Enter move parameters (e.g., x:100, y:200)',
  inputType: 'text',
  validation: (value: string) => {
    if (!value.trim()) return 'Move parameters are required';
    
    const params = value.toLowerCase().split(',').map(p => p.trim());
    for (const param of params) {
      if (!param.includes(':')) {
        return 'Invalid format. Use "x:value, y:value"';
      }
      const [key, val] = param.split(':').map(s => s.trim());
      if (!['x', 'y'].includes(key)) {
        return 'Only x and y parameters are supported';
      }
      const num = parseInt(val);
      if (isNaN(num) || num < 0) {
        return `${key} must be a positive number`;
      }
    }
    return null;
  },
  execute: async (params: ActionExecuteParams) => {
    const { selectedEditorComponent, actionValue, editorState } = params;

    if (!selectedEditorComponent || !editorState) {
      message.error('Component and editor state are required');
      return;
    }

    try {
      const moveParams: { x?: number; y?: number } = {};
      const params = actionValue.toLowerCase().split(',').map(p => p.trim());
      
      for (const param of params) {
        const [key, val] = param.split(':').map(s => s.trim());
        if (['x', 'y'].includes(key)) {
          moveParams[key as 'x' | 'y'] = parseInt(val);
        }
      }

      if (!moveParams.x && !moveParams.y) {
        message.error('No valid move parameters provided');
        return;
      }

      const componentInfo = getEditorComponentInfo(editorState, selectedEditorComponent);
      
      if (!componentInfo) {
        message.error(`Component "${selectedEditorComponent}" not found`);
        return;
      }

      const { componentKey, currentLayout, simpleContainer } = componentInfo;

      if (!componentKey || !currentLayout[componentKey]) {
        message.error(`Component "${selectedEditorComponent}" not found in layout`);
        return;
      }

      const currentLayoutItem = currentLayout[componentKey];
      const items = simpleContainer.children.items.children;

      const newLayoutItem = {
        ...currentLayoutItem,
        x: moveParams.x !== undefined ? moveParams.x : currentLayoutItem.x,
        y: moveParams.y !== undefined ? moveParams.y : currentLayoutItem.y,
      };

      const newLayout = {
        ...currentLayout,
        [componentKey]: newLayoutItem,
      };

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

      editorState.setSelectedCompNames(new Set([selectedEditorComponent]), "moveComp");
      
      const moveDescription = [];
      if (moveParams.x !== undefined) moveDescription.push(`x: ${moveParams.x}`);
      if (moveParams.y !== undefined) moveDescription.push(`y: ${moveParams.y}`);
      
      message.success(`Component "${selectedEditorComponent}" moved to ${moveDescription.join(', ')}`);
    } catch (error) {
      console.error('Error moving component:', error);
      message.error('Failed to move component. Please try again.');
    }
  }
};

export const renameComponentAction: ActionConfig = {
  key: 'rename-components',
  label: 'Rename a component',
  category: 'component-management',
  requiresEditorComponentSelection: true,
  requiresInput: true,
  inputPlaceholder: 'Enter new name',
  inputType: 'text',
  validation: (value: string, params?: ActionExecuteParams) => {
    if (!value.trim()) return 'Name is required';
    
    if (params?.editorState && params?.selectedEditorComponent) {
      const error = params.editorState.checkRename(params.selectedEditorComponent, value);
      return error || null;
    }
    return null;
  },
  execute: async (params: ActionExecuteParams) => {
    const { selectedEditorComponent, actionValue, editorState } = params;
    
    if (!selectedEditorComponent || !actionValue) {
      message.error('Component and name is required');
      return;
    }

    try {
      const componentInfo = getEditorComponentInfo(editorState, selectedEditorComponent);
      
      if (!componentInfo) {
        message.error(`Component "${selectedEditorComponent}" not found`);
        return;
      }

      const { componentKey, currentLayout, items } = componentInfo;

      if (!componentKey) {
        message.error(`Component "${selectedEditorComponent}" not found in layout`);
        return;
      }

      const componentItem = items[componentKey];
      if (!componentItem) {
        message.error(`Component "${selectedEditorComponent}" not found in items`);
        return;
      }

      if (editorState.rename(selectedEditorComponent, actionValue)) {
        editorState.setSelectedCompNames(new Set([actionValue]), "renameComp");
        message.success(`Component "${selectedEditorComponent}" renamed to "${actionValue}" successfully`);
      } else {
        message.error('Failed to rename component. The name might already exist or be invalid.');
      }
    } catch(error) {
      console.error('Error renaming component:', error);
      message.error('Failed to rename component. Please try again.');
    }
  }
};

export const resizeComponentAction: ActionConfig = {
  key: 'resize-components',
  label: 'Resize a component',
  category: 'component-management',
  requiresEditorComponentSelection: true,
  requiresInput: true,
  inputPlaceholder: 'Enter resize parameters (e.g., w:8, h:6)',
  inputType: 'text',
  validation: (value: string) => {
    if (!value.trim()) return 'Resize parameters are required';
    
    const params = value.toLowerCase().split(',').map(p => p.trim());
    for (const param of params) {
      if (!param.includes(':')) {
        return 'Invalid format. Use "w:value, h:value"';
      }
      const [key, val] = param.split(':').map(s => s.trim());
      if (!['w', 'h'].includes(key)) {
        return 'Only w (width) and h (height) parameters are supported';
      }
      const num = parseInt(val);
      if (isNaN(num) || num < 1) {
        return `${key} must be a positive number greater than 0`;
      }
    }
    return null;
  },
  execute: async (params: ActionExecuteParams) => {
    const { selectedEditorComponent, actionValue, editorState } = params;

    if (!selectedEditorComponent || !editorState) {
      message.error('Component and editor state are required');
      return;
    }

    try {
      const resizeParams: { w?: number; h?: number } = {};
      const params = actionValue.toLowerCase().split(',').map(p => p.trim());
      
      for (const param of params) {
        const [key, val] = param.split(':').map(s => s.trim());
        if (['w', 'h'].includes(key)) {
          resizeParams[key as 'w' | 'h'] = parseInt(val);
        }
      }

      if (!resizeParams.w && !resizeParams.h) {
        message.error('No valid resize parameters provided');
        return;
      }

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
      
      const newLayoutItem = {
        ...currentLayoutItem,
        w: resizeParams.w !== undefined ? resizeParams.w : currentLayoutItem.w,
        h: resizeParams.h !== undefined ? resizeParams.h : currentLayoutItem.h,
      };

      const newLayout = {
        ...currentLayout,
        [componentKey]: newLayoutItem,
      };

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

      editorState.setSelectedCompNames(new Set([selectedEditorComponent]), "resizeComp");
      
      const resizeDescription = [];
      if (resizeParams.w !== undefined) resizeDescription.push(`width: ${resizeParams.w}`);
      if (resizeParams.h !== undefined) resizeDescription.push(`height: ${resizeParams.h}`);
      
      message.success(`Component "${selectedEditorComponent}" resized to ${resizeDescription.join(', ')}`);
    } catch (error) {
      console.error('Error resizing component:', error);
      message.error('Failed to resize component. Please try again.');
    }
  }
};