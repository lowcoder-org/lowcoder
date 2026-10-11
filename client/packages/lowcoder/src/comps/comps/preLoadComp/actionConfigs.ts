import { ActionCategory } from "./types";
import {
  addComponentAction,
  moveComponentAction,
  renameComponentAction,
  deleteComponentAction,
  resizeComponentAction,
  configureAppMetaAction,
  addEventHandlerAction,
  applyStyleAction,
  nestComponentAction,
  updateDynamicLayoutAction,
  publishAppAction,
  shareAppAction,
  testAllDatasourcesAction,
  applyGlobalJSAction,
  applyCSSAction,
  applyThemeAction,
  setCanvasSettingsAction,
  setCustomShortcutsAction,
  alignComponentAction
} from "./actions";

export const actionCategories: ActionCategory[] = [
  {
    key: 'component-management',
    label: 'Component Management',
    actions: [
      addComponentAction, 
      moveComponentAction, 
      deleteComponentAction, 
      resizeComponentAction,
      renameComponentAction,
      nestComponentAction
    ]
  },
  {
    key: 'app-configuration',
    label: 'App Configuration',
    actions: [
      configureAppMetaAction, 
      publishAppAction,
      shareAppAction,
      testAllDatasourcesAction,
      applyGlobalJSAction,
      applyCSSAction,
      applyThemeAction,
      setCanvasSettingsAction,
      setCustomShortcutsAction
    ]
  },
  {
    key: 'layout',
    label: 'Layout',
    actions: [updateDynamicLayoutAction, alignComponentAction]
  },
  {
    key: 'events',
    label: 'Events',
    actions: [addEventHandlerAction]
  },
  {
    key: 'styling',
    label: 'Styling',
    actions: [applyStyleAction]
  }
];

export const actionRegistry = new Map<string, any>();
actionCategories.forEach(category => {
  category.actions.forEach(action => {
    actionRegistry.set(action.key, action);
  });
});

export const getAllActionItems = () => {
    return actionCategories.flatMap(category => {
      if (category.actions.length === 1) {
        const action = category.actions[0];
        return [{
          label: action.label,
          key: action.key
        }];
      }
  
      return [{
        label: category.label,
        key: `category-${category.key}`,
        children: category.actions.map(action => ({
          label: action.label,
          key: action.key
        }))
      }];
    });
  }; 