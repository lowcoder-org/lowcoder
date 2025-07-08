import { evalFunc } from "lowcoder-core";
import { runScriptInHost } from "util/commonUtils";
import log from "loglevel";
import { UICompCategory, UICompManifest, uiCompCategoryNames, uiCompRegistry } from "comps/uiCompRegistry";
import { MenuProps } from "antd/es/menu";
import React from "react";
import { EditorState } from "@lowcoder-ee/comps/editorState";

export function runScript(code: string, inHost?: boolean) {
  if (inHost) {
    runScriptInHost(code);
    return;
  }
  try {
    evalFunc(code, {}, {});
  } catch (e) {
    log.error(e);
  }
}

export function generateComponentActionItems(categories: Record<string, [string, UICompManifest][]>) {
  const componentItems: MenuProps['items'] = [];
  
  Object.entries(categories).forEach(([categoryKey, components]) => {
    if (components.length) {
      componentItems.push({
        label: uiCompCategoryNames[categoryKey as UICompCategory],
        key: `category-${categoryKey}`,
        disabled: true,
        style: { fontWeight: 'bold', color: '#666' }
      });
      
      components.forEach(([compName, manifest]) => {
        componentItems.push({
          label: manifest.name,
          key: `comp-${compName}`,
          icon: React.createElement(manifest.icon, { width: 14, height: 14 })
        });
      });
    }
  });

  return componentItems;
}

export function getComponentCategories() {
  const cats: Record<string, [string, UICompManifest][]> = Object.fromEntries(
    Object.keys(uiCompCategoryNames).map((cat) => [cat, []])
  );
  Object.entries(uiCompRegistry).forEach(([name, manifest]) => {
    manifest.categories.forEach((cat) => {
      cats[cat].push([name, manifest]);
    });
  });
  return cats;
} 
export function getEditorComponentInfo(editorState: EditorState, componentName?: string): {
  componentKey: string | null;
  currentLayout: any;
  simpleContainer: any;
  componentType?: string | null;
  items: any;
} | null {
  try {
    // Get the UI component container
    if (!editorState) {
      return null;
    }

    const uiComp = editorState.getUIComp();
    const container = uiComp.getComp();
    if (!container) {
      return null;
    }

    const uiCompTree = uiComp.getTree();

    // Get the simple container (the actual grid container)
    const simpleContainer = container.realSimpleContainer();
    if (!simpleContainer) {
      return null;
    }

    // Get current layout and items
    const currentLayout = simpleContainer.children.layout.getView();
    const items = getCombinedItems(uiCompTree);

    // If no componentName is provided, return all items
    if (!componentName) {
      return {
        componentKey: null,
        currentLayout,
        simpleContainer,
        items,
      };
    }

    // Find the component by name and get its key
    let componentKey: string | null = null;
    let componentType: string | null = null;

    for (const [key, item] of Object.entries(items)) {
      if ((item as any).children.name.getView() === componentName) {
        componentKey = key;
        componentType = (item as any).children.compType.getView();
        break;
      }
    }

    return {
      componentKey,
      currentLayout,
      simpleContainer,
      componentType,
      items,
    };  
  } catch(error) {
    console.error('Error getting editor component key:', error);
    return null;
  }
}

interface Container {
  items?: Record<string, any>; 
}

function getCombinedItems(uiCompTree: any) {
  const combined: Record<string, any> = {};

  if (uiCompTree.items) {
    Object.entries(uiCompTree.items).forEach(([itemKey, itemValue]) => {
      combined[itemKey] = itemValue;
    });
  }

  if (uiCompTree.children) {
    Object.entries(uiCompTree.children).forEach(([parentKey, container]) => {
      const typedContainer = container as Container; 
      if (typedContainer.items) {
        Object.entries(typedContainer.items).forEach(([itemKey, itemValue]) => {
          itemValue.parentContainer = parentKey;
          combined[itemKey] = itemValue;
        });
      }
    });
  }

  return combined;
}

export function getLayoutItemsOrder(layoutItems: any[]){
  const maxIndex = layoutItems.length;
  return Array.from({ length: maxIndex }, (_, index) => ({
    key: index,
    label: `Position ${index}`,
    value: index.toString()
  }));
}
