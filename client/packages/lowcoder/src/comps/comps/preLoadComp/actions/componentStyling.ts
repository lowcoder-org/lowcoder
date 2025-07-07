import { message } from "antd";
import { ActionConfig, ActionExecuteParams } from "../types";
import { getEditorComponentInfo } from "../utils";

// Fallback constant style object to apply
// This wil be replaced by a JSON object returned by the AI model.
const FALLBACK_STYLE_OBJECT = {
  fontSize: "10px",
  fontWeight: "500",
  color: "#333333",
  backgroundColor: "#ffffff",
  padding: "8px",
  borderRadius: "4px",
  border: "1px solid #ddd"
};

export const applyStyleAction: ActionConfig = {
  key: 'apply-style',
  label: 'Apply style to component',
  category: 'styling',
  requiresEditorComponentSelection: true,
  requiresStyle: true,
  requiresInput: true,
  inputPlaceholder: 'Enter CSS styles (JSON format)',
  inputType: 'textarea',
  validation: (value: string) => {
    if (!value.trim()) return 'Styles are required'
    else return null;
  },
  execute: async (params: ActionExecuteParams) => {
    const { selectedEditorComponent, actionValue, editorState } = params;
    
    if (!selectedEditorComponent || !editorState) {
      message.error('Component and editor state are required');
      return;
    }

    // A fallback constant is currently used to style the component.
    // This is a temporary solution and will be removed once we integrate the AI model with the component styling.
    try {
      let styleObject: Record<string, any> = {};
      let usingFallback = false;
      
      try {
        if (typeof actionValue === 'string') {
          styleObject = JSON.parse(actionValue);
        } else {
          styleObject = actionValue;
        }
      } catch (e) {
        styleObject = FALLBACK_STYLE_OBJECT;
        usingFallback = true;
      }
      
      const comp = editorState.getUICompByName(selectedEditorComponent);
      
      if (!comp) {
        message.error(`Component "${selectedEditorComponent}" not found`);
        return;
      }

      const appliedStyles: string[] = [];
      
      for (const [styleKey, styleValue] of Object.entries(styleObject)) {
        try {
          const { children } = comp.children.comp;
          const compType = comp.children.compType.getView();

          // This method is used in LeftLayersContent.tsx to style the component.
          if (!children.style) {
            if (children[compType]?.children?.style?.children?.[styleKey]) {
              children[compType].children.style.children[styleKey].dispatchChangeValueAction(styleValue);
              appliedStyles.push(styleKey);
            } else if (children[compType]?.children?.[styleKey]) {
              children[compType].children[styleKey].dispatchChangeValueAction(styleValue);
              appliedStyles.push(styleKey);
            } else {
              console.warn(`Style property ${styleKey} not found in component ${selectedEditorComponent}`);
            }
          } else {
            if (children.style.children?.[styleKey]) {
              children.style.children[styleKey].dispatchChangeValueAction(styleValue);
              appliedStyles.push(styleKey);
            } else if (children.style[styleKey]) {
              children.style[styleKey].dispatchChangeValueAction(styleValue);
              appliedStyles.push(styleKey);
            } else {
              console.warn(`Style property ${styleKey} not found in style object`);
            }
          }
        } catch (error) {
          console.error(`Error applying style ${styleKey}:`, error);
        }
      }

      if (appliedStyles.length > 0) {
        editorState.setSelectedCompNames(new Set([selectedEditorComponent]), "applyStyle");
        
        if (usingFallback) {
          message.success(`Applied ${appliedStyles.length} fallback style(s) to component "${selectedEditorComponent}": ${appliedStyles.join(', ')}`);
        } else {
          message.success(`Applied ${appliedStyles.length} style(s) to component "${selectedEditorComponent}": ${appliedStyles.join(', ')}`);
        }
      } else {
        message.warning('No styles were applied. Check if the component supports styling.');
      }
      
    } catch (error) {
      console.error('Error applying styles:', error);
      message.error('Failed to apply styles. Please try again.');
    }
  }
}; 