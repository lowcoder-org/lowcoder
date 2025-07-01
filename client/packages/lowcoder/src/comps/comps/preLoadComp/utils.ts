import { evalFunc } from "lowcoder-core";
import { runScriptInHost } from "util/commonUtils";
import log from "loglevel";
import { UICompCategory, UICompManifest, uiCompCategoryNames, uiCompRegistry } from "comps/uiCompRegistry";
import { MenuProps } from "antd/es/menu";
import React from "react";

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
    if (components.length > 0) {
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