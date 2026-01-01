import { SortableTree, TreeItems, TreeItemComponentProps, SimpleTreeItemWrapper } from "dnd-kit-sortable-tree";
import LinkPlusButton from "components/LinkPlusButton";
import { BluePlusIcon, controlItem } from "lowcoder-design";
import { trans } from "i18n";
import React, { useMemo, useCallback, createContext, useContext, useState } from "react";
import styled from "styled-components";
import { NavCompType, NavListCompType, NavTreeItemData } from "./types";
import MenuItem from "./MenuItem";

const Wrapper = styled.div`
  .menu-title {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
  }

  .menu-list {
    position: relative;
  }
`;

const TreeItemContent = styled.div`
  display: flex;
  align-items: center;
  width: 100%;
  height: 30px;
  background-color: #ffffff;
  border: 1px solid #d7d9e0;
  border-radius: 4px;
  padding: 0 8px;
  box-sizing: border-box;
  gap: 8px;

  &:hover {
    border-color: #315efb;
  }
`;

// Context for passing handlers to tree items
interface MenuItemHandlers {
  onDeleteItem: (path: number[]) => void;
  onAddSubItem: (path: number[], value?: any) => void;
  collapsedItems: Set<string>;
  onToggleCollapse: (id: string) => void;
}

const MenuItemHandlersContext = createContext<MenuItemHandlers | null>(null);

// Tree item component
const NavTreeItemComponent = React.forwardRef<
  HTMLDivElement,
  TreeItemComponentProps<NavTreeItemData>
>((props, ref) => {
  console.log("NavTreeItemComponent", props);
  const { item, depth, ...rest } = props;
  const { comp, path } = item;
  const handlers = useContext(MenuItemHandlersContext);

  const hasChildren = item.children && item.children.length > 0;

  const handleDelete = () => {
    handlers?.onDeleteItem(path);
  };

  const handleAddSubMenu = () => {
    handlers?.onAddSubItem(path, {
      label: `Sub Menu ${(item.children?.length || 0) + 1}`,
    });
  };

  return (
    <SimpleTreeItemWrapper {...rest} ref={ref} item={item} depth={depth}>
      <TreeItemContent>
        <MenuItem
          item={comp}
          onDelete={handleDelete}
          onAddSubMenu={handleAddSubMenu}
          showAddSubMenu={!hasChildren || depth === 0}
        />
      </TreeItemContent>
    </SimpleTreeItemWrapper>
  );
});

NavTreeItemComponent.displayName = "NavTreeItemComponent";

interface IMenuItemListProps {
  items: NavCompType[];
  onAddItem: (path: number[], value?: any) => number;
  onDeleteItem: (path: number[]) => void;
  onAddSubItem: (path: number[], value: any, unshift?: boolean) => number;
  onMoveItem: (path: number[], from: number, to: number) => void;
  onReorderItems: (newOrder: TreeItems<NavTreeItemData>) => void;
}

const menuItemLabel = trans("navigation.itemsDesc");

// Convert NavCompType[] to TreeItems format for dnd-kit-sortable-tree
function convertToTreeItems(
  items: NavCompType[],
  basePath: number[] = [],
  collapsedItems: Set<string> = new Set()
): TreeItems<NavTreeItemData> {
  return items.map((item, index) => {
    const path = [...basePath, index];
    const id = path.join("_");
    const subItems = item.getView().items || [];
    
    return {
      id,
      comp: item,
      path: path,
      collapsed: collapsedItems.has(id),
      children: subItems.length > 0 
        ? convertToTreeItems(subItems, path, collapsedItems) 
        : [],
    };
  });
}

function MenuItemList(props: IMenuItemListProps) {
  const { items, onAddItem, onDeleteItem, onAddSubItem, onReorderItems } = props;

  // State for tracking collapsed items
  const [collapsedItems, setCollapsedItems] = useState<Set<string>>(new Set());

  // Toggle collapse state for an item
  const handleToggleCollapse = useCallback((id: string) => {
    setCollapsedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  }, []);

  // Convert items to tree format
  const treeItems = useMemo(() => convertToTreeItems(items, [], collapsedItems), [items, collapsedItems]);

  // Handle tree changes from drag and drop
  const handleItemsChanged = useCallback(
    (newItems: TreeItems<NavTreeItemData>) => {
      // Update collapsed state from the new items
      const updateCollapsedState = (treeItems: TreeItems<NavTreeItemData>) => {
        treeItems.forEach(item => {
          if (item.collapsed !== undefined) {
            setCollapsedItems(prev => {
              const newSet = new Set(prev);
              if (item.collapsed) {
                newSet.add(item.id as string);
              } else {
                newSet.delete(item.id as string);
              }
              return newSet;
            });
          }
          if (item.children && item.children.length > 0) {
            updateCollapsedState(item.children);
          }
        });
      };
      updateCollapsedState(newItems);
      onReorderItems(newItems);
    },
    [onReorderItems]
  );

  // Handlers context value
  const handlers = useMemo<MenuItemHandlers>(
    () => ({
      onDeleteItem,
      onAddSubItem,
      collapsedItems,
      onToggleCollapse: handleToggleCollapse,
    }),
    [onDeleteItem, onAddSubItem, collapsedItems, handleToggleCollapse]
  );

  return (
    <Wrapper>
      <div className="menu-title">
        <div>{menuItemLabel}</div>
        <LinkPlusButton onClick={() => onAddItem([0])} icon={<BluePlusIcon />}>
          {trans("newItem")}
        </LinkPlusButton>
      </div>
      <div className="menu-list">
        <MenuItemHandlersContext.Provider value={handlers}>
          <SortableTree
            items={treeItems}
            onItemsChanged={handleItemsChanged}
            TreeItemComponent={NavTreeItemComponent}
            indentationWidth={20}
            
          />
        </MenuItemHandlersContext.Provider>
      </div>
    </Wrapper>
  );
}

export function menuPropertyView(itemsComp: NavListCompType) {
  const items = itemsComp.getView();

  const getItemByPath = (path: number[], scope?: NavCompType[]): NavCompType => {
    if (!scope) {
      scope = items;
    }
    if (path.length === 1) {
      return scope[path[0]];
    }
    return getItemByPath(path.slice(1), scope[path[0]].children.items.getView());
  };

  const getItemListByPath = (path: number[], root?: NavListCompType): NavListCompType => {
    if (!root) {
      root = itemsComp;
    }
    if (path.length === 1) {
      return root;
    }
    return getItemListByPath(path.slice(1), root.getView()[path[0]].children.items);
  };

  // Convert flat tree structure back to nested comp structure
  const handleReorderItems = (newItems: TreeItems<NavTreeItemData>) => {
    // Build the new order from tree items
    const buildJsonFromTree = (treeItems: TreeItems<NavTreeItemData>): any[] => {
      return treeItems.map((item) => {
        const jsonValue = item.comp.toJsonValue() as Record<string, any>;
        return {
          ...jsonValue,
          items: item.children && item.children.length > 0
            ? buildJsonFromTree(item.children)
            : [],
        };
      });
    };

    const newJson = buildJsonFromTree(newItems);
    
    // Clear all existing items and re-add in new order
    const currentLength = itemsComp.getView().length;
    
    // Delete all items from end to start
    for (let i = currentLength - 1; i >= 0; i--) {
      itemsComp.deleteItem(i);
    }
    
    // Add items back in new order
    newJson.forEach((itemJson) => {
      itemsComp.addItem(itemJson);
    });
  };

  return controlItem(
    { filterText: menuItemLabel },
    <MenuItemList
      items={items}
      onAddItem={(path: number[], value: any) => {
        const itemList = getItemListByPath(path);
        itemList.addItem(value);
        return itemList.getView().length;
      }}
      onDeleteItem={(path: number[]) => {
        getItemListByPath(path).deleteItem(path[path.length - 1]);
      }}
      onAddSubItem={(path: number[], value: any) => {
        const item = getItemByPath(path);
        item.addSubItem(value);
        return item.children.items.getView().length;
      }}
      onMoveItem={(path: number[], from: number, to: number) => {
        getItemListByPath(path).moveItem(from, to);
      }}
      onReorderItems={handleReorderItems}
    />
  );
}
