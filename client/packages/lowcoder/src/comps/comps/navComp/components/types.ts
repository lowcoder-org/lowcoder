import { NavItemComp, navListComp } from "../navItemComp";
import { LayoutMenuItemComp, LayoutMenuItemListComp } from "comps/comps/layout/layoutMenuItemComp";
import { TreeItem } from "dnd-kit-sortable-tree";

export type NavCompType = NavItemComp | LayoutMenuItemComp;

export type NavListCompType =
  | InstanceType<ReturnType<typeof navListComp>>
  | InstanceType<typeof LayoutMenuItemListComp>;

export interface NavCompItemType {
  label: string;
  hidden: boolean;
  active: boolean;
  items: NavItemComp[];
  onEvent: (name: string) => void;
}

// Tree item data for dnd-kit-sortable-tree
export interface NavTreeItemData {
  comp: NavCompType;
  path: number[];
  collapsed?: boolean;
}

// Full tree item type for the sortable tree
export type NavTreeItem = TreeItem<NavTreeItemData>;
