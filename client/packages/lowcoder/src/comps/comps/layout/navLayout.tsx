import { Layout, Menu as AntdMenu, MenuProps, Segmented } from "antd";
import MainContent from "components/layout/MainContent";
import { LayoutMenuItemComp, LayoutMenuItemListComp } from "comps/comps/layout/layoutMenuItemComp";
import { menuPropertyView } from "comps/comps/navComp/components/MenuItemList";
import { registerLayoutMap } from "comps/comps/uiComp";
import { MultiCompBuilder, withDefault, withViewFn } from "comps/generators";
import { withDispatchHook } from "comps/generators/withDispatchHook";
import { NameAndExposingInfo } from "comps/utils/exposingTypes";
import { ALL_APPLICATIONS_URL } from "constants/routesURL";
import { TopHeaderHeight } from "constants/style";
import { Section, controlItem, sectionNames } from "lowcoder-design";
import { trans } from "i18n";
import { EditorContainer, EmptyContent } from "pages/common/styledComponent";
import { useCallback, useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import { isUserViewMode, useAppPathParam } from "util/hooks";
import { StringControl, jsonControl } from "comps/controls/codeControl";
import { styleControl } from "comps/controls/styleControl";
import {
  NavLayoutStyle,
  NavLayoutItemStyle,
  NavLayoutItemStyleType,
  NavLayoutItemHoverStyle,
  NavLayoutItemHoverStyleType,
  NavLayoutItemActiveStyle,
  NavLayoutItemActiveStyleType,
} from "comps/controls/styleControlConstants";
import { dropdownControl } from "comps/controls/dropdownControl";
import _ from "lodash";
import { check } from "util/convertUtils";
import { genRandomKey } from "comps/utils/idGenerator";
import history from "util/history";
import {
  DataOption,
  DataOptionType,
  ModeOptions,
  jsonMenuItems,
  menuItemStyleOptions
} from "./navLayoutConstants";

const DEFAULT_WIDTH = 240;
type MenuItemStyleOptionValue = "normal" | "hover" | "active";

const StyledSide = styled(Layout.Sider)`
  max-height: calc(100vh - ${TopHeaderHeight});
  overflow: auto;

  .ant-menu-item:first-child {
    margin-top: 0;
  }

  .ant-layout-sider-trigger {
    position: relative;
    bottom: 1px;
    border-right: 1px solid #f0f0f0;
    border-top: 1px solid #f0f0f0;
  }
`;

const ContentWrapper = styled.div`
  height: 100%;

  main::-webkit-scrollbar {
    display: none;
  }
`;

const StyledMenu = styled(AntdMenu)<{
  $navItemStyle?: NavLayoutItemStyleType & { width: string},
  $navItemHoverStyle?: NavLayoutItemHoverStyleType,
  $navItemActiveStyle?: NavLayoutItemActiveStyleType,
}>`
  .ant-menu-item {
    height: auto;
    width: ${(props) => props.$navItemStyle?.width};
    background-color: ${(props) => props.$navItemStyle?.background};
    color: ${(props) => props.$navItemStyle?.text};
    border-radius: ${(props) => props.$navItemStyle?.radius} !important;
    border: ${(props) => `1px solid ${props.$navItemStyle?.border}`};
    margin: ${(props) => props.$navItemStyle?.margin};
    padding: ${(props) => props.$navItemStyle?.padding};

  }
  .ant-menu-item-active {
    background-color: ${(props) => props.$navItemHoverStyle?.background} !important;
    color: ${(props) => props.$navItemHoverStyle?.text} !important;
    border: ${(props) => `1px solid ${props.$navItemHoverStyle?.border}`};
  }

  .ant-menu-item-selected {
    background-color: ${(props) => props.$navItemActiveStyle?.background} !important;
    color: ${(props) => props.$navItemActiveStyle?.text} !important;
    border: ${(props) => `1px solid ${props.$navItemActiveStyle?.border}`};
  }

  .ant-menu-submenu {
    margin: ${(props) => props.$navItemStyle?.margin};
    width: ${(props) => props.$navItemStyle?.width};

    .ant-menu-submenu-title {
      width: 100%;
      height: auto !important;
      background-color: ${(props) => props.$navItemStyle?.background};
      color: ${(props) => props.$navItemStyle?.text};
      border-radius: ${(props) => props.$navItemStyle?.radius} !important;
      border: ${(props) => `1px solid ${props.$navItemStyle?.border}`};
      margin: 0;
      padding: ${(props) => props.$navItemStyle?.padding};

    }

    .ant-menu-item {
      width: 100%;
    }

    &.ant-menu-submenu-active {
      >.ant-menu-submenu-title {
        width: 100%;
        background-color: ${(props) => props.$navItemHoverStyle?.background} !important;
        color: ${(props) => props.$navItemHoverStyle?.text} !important;
        border: ${(props) => `1px solid ${props.$navItemHoverStyle?.border}`};
      }
    }
    &.ant-menu-submenu-selected {
      >.ant-menu-submenu-title {
        width: 100%;
        background-color: ${(props) => props.$navItemActiveStyle?.background} !important;
        color: ${(props) => props.$navItemActiveStyle?.text} !important;
        border: ${(props) => `1px solid ${props.$navItemActiveStyle?.border}`};
      }
    }
  }

`;

const StyledImage = styled.img`
  height: 1em;
  color: currentColor;
`;

const defaultStyle = {
  radius: '0px',
  margin: '0px',
  padding: '0px',
}

type UrlActionType = {
  url?: string;
  newTab?: boolean;
}

export type MenuItemNode = {
  label: string;
  key: string;
  hidden?: boolean;
  icon?: any;
  action?: UrlActionType,
  children?: MenuItemNode[];
}

function checkDataNodes(value: any, key?: string): MenuItemNode[] | undefined {
  return check(value, ["array", "undefined"], key, (node, k) => {
    check(node, ["object"], k);
    check(node["label"], ["string"], "label");
    check(node["hidden"], ["boolean", "undefined"], "hidden");
    check(node["icon"], ["string", "undefined"], "icon");
    check(node["action"], ["object", "undefined"], "action");
    checkDataNodes(node["children"], "children");
    return node;
  });
}

function convertTreeData(data: any) {
  return data === "" ? [] : checkDataNodes(data) ?? [];
}

let NavTmpLayout = (function () {
  const childrenMap = {
    dataOptionType: dropdownControl(DataOptionType, DataOption.Manual),
    items: withDefault(LayoutMenuItemListComp, [
      {
        label: trans("menuItem") + " 1",
        itemKey: genRandomKey(),
      },
    ]),
    jsonItems: jsonControl(convertTreeData, jsonMenuItems),
    width: withDefault(StringControl, DEFAULT_WIDTH),
    backgroundImage: withDefault(StringControl, ""),
    mode: dropdownControl(ModeOptions, "inline"),
    navStyle: withDefault(styleControl(NavLayoutStyle), defaultStyle),
    navItemStyle: withDefault(styleControl(NavLayoutItemStyle), defaultStyle),
    navItemHoverStyle: withDefault(styleControl(NavLayoutItemHoverStyle), {}),
    navItemActiveStyle: withDefault(styleControl(NavLayoutItemActiveStyle), {}),
  };
  return new MultiCompBuilder(childrenMap, (props) => {
    return null;
  })
    .setPropertyViewFn((children) => {
      const [styleSegment, setStyleSegment] = useState('normal')

      return (
        <div style={{overflowY: 'auto'}}>
          <Section name={trans("menu")}>
            {children.dataOptionType.propertyView({
              radioButton: true,
              type: "oneline",
            })}
            {
              children.dataOptionType.getView() === DataOption.Manual
                ? menuPropertyView(children.items)
                : children.jsonItems.propertyView({
                  label: "Json Data",
                })
            }
          </Section>
          <Section name={sectionNames.layout}>
            { children.width.propertyView({
                label: trans("navLayout.width"),
                tooltip: trans("navLayout.widthTooltip"),
                placeholder: DEFAULT_WIDTH + "",
            })}
            { children.mode.propertyView({
              label: trans("labelProp.position"),
              radioButton: true
            })}
            {children.backgroundImage.propertyView({
              label: `Background Image`,
              placeholder: 'https://temp.im/350x400',
            })}
          </Section>
          <Section name={trans("navLayout.navStyle")}>
            { children.navStyle.getPropertyView() }
          </Section>
          <Section name={trans("navLayout.navItemStyle")}>
            {controlItem({}, (
              <Segmented
                block
                options={menuItemStyleOptions}
                value={styleSegment}
                onChange={(k) => setStyleSegment(k as MenuItemStyleOptionValue)}
              />
            ))}
            {styleSegment === 'normal' && (
              children.navItemStyle.getPropertyView()
            )}
            {styleSegment === 'hover' && (
              children.navItemHoverStyle.getPropertyView()
            )}
            {styleSegment === 'active' && (
              children.navItemActiveStyle.getPropertyView()
            )}
          </Section>
        </div>
      );
    })
    .build();
})();

NavTmpLayout = withViewFn(NavTmpLayout, (comp) => {
  const pathParam = useAppPathParam();
  const isViewMode = isUserViewMode(pathParam);
  const [selectedKey, setSelectedKey] = useState("");
  const items = comp.children.items.getView();
  const navWidth = comp.children.width.getView();
  const navMode = comp.children.mode.getView();
  const navStyle = comp.children.navStyle.getView();
  const navItemStyle = comp.children.navItemStyle.getView();
  const navItemHoverStyle = comp.children.navItemHoverStyle.getView();
  const navItemActiveStyle = comp.children.navItemActiveStyle.getView();
  const backgroundImage = comp.children.backgroundImage.getView();
  const jsonItems = comp.children.jsonItems.getView();
  const dataOptionType = comp.children.dataOptionType.getView();
  
  // filter out hidden. unauthorised items filtered by server
  const filterItem = useCallback((item: LayoutMenuItemComp): boolean => {
    return !item.children.hidden.getView();
  }, []);

  const generateItemKeyRecord = useCallback(
    (items: LayoutMenuItemComp[] | MenuItemNode[]) => {
      const result: Record<string, LayoutMenuItemComp | MenuItemNode> = {};
      if(dataOptionType === DataOption.Manual) {
        (items as LayoutMenuItemComp[])?.forEach((item) => {
          const subItems = item.children.items.getView();
          if (subItems.length > 0) {
            Object.assign(result, generateItemKeyRecord(subItems))
          }
          result[item.getItemKey()] = item;
        });
      }
      if(dataOptionType === DataOption.Json) {
        (items as MenuItemNode[])?.forEach((item) => {
          if (item.children?.length) {
            Object.assign(result, generateItemKeyRecord(item.children))
          }
          result[item.key] = item;
        })
      }
      return result;
    }, [dataOptionType]
  )

  const itemKeyRecord = useMemo(() => {
    if(dataOptionType === DataOption.Json) {
      return generateItemKeyRecord(jsonItems)
    }
    return generateItemKeyRecord(items)
  }, [dataOptionType, jsonItems, items, generateItemKeyRecord]);

  const onMenuItemClick = useCallback(({key}: {key: string}) => {
    const itemComp = itemKeyRecord[key]
  
    const url = [
      ALL_APPLICATIONS_URL,
      pathParam.applicationId,
      pathParam.viewMode,
      key,
    ].join("/");

    // handle manual menu item action
    if(dataOptionType === DataOption.Manual) {
      (itemComp as LayoutMenuItemComp).children.action.act(url);
      return;
    }
    // handle json menu item action
    if((itemComp as MenuItemNode).action?.newTab) {
      return window.open((itemComp as MenuItemNode).action?.url, '_blank')
    }
    history.push(url);
  }, [pathParam.applicationId, pathParam.viewMode, dataOptionType, itemKeyRecord])

  const getJsonMenuItem = useCallback(
    (items: MenuItemNode[]): MenuProps["items"] => {
      return items?.map((item: MenuItemNode) => {
        const {
          label,
          key,
          hidden,
          icon,
          children,
        } = item;
        return {
          label,
          key,
          hidden,
          icon: <StyledImage src={icon} />,
          onTitleClick: onMenuItemClick,
          onClick: onMenuItemClick,
          ...(children?.length && { children: getJsonMenuItem(children) }),
        }
      })
    }, [onMenuItemClick]
  )

  const getMenuItem = useCallback(
    (itemComps: LayoutMenuItemComp[]): MenuProps["items"] => {
      return itemComps.filter(filterItem).map((item) => {
        const label = item.children.label.getView();
        const subItems = item.children.items.getView();
        return {
          label: label,
          title: label,
          key: item.getItemKey(),
          icon: <span>{item.children.icon.getView()}</span>,
          onTitleClick: onMenuItemClick,
          onClick: onMenuItemClick,
          ...(subItems.length > 0 && { children: getMenuItem(subItems) }),
        };
      });
    },
    [onMenuItemClick, filterItem]
  );

  const menuItems = useMemo(() => {
    if(dataOptionType === DataOption.Json) return getJsonMenuItem(jsonItems)

    return getMenuItem(items)
  }, [dataOptionType, jsonItems, getJsonMenuItem, items, getMenuItem]);

  // Find by path itemKey
  const findItemPathByKey = useCallback(
    (itemComps: LayoutMenuItemComp[], itemKey: string): string[] => {
      for (let item of itemComps) {
        const subItems = item.children.items.getView();
        if (subItems.length > 0) {
          // have subMenus
          const childPath = findItemPathByKey(subItems, itemKey);
          if (childPath.length > 0) {
            return [item.getItemKey(), ...childPath];
          }
        } else {
          if (item.getItemKey() === itemKey && !item.children.hidden.getView()) {
            return [item.getItemKey()];
          }
        }
      }
      return [];
    },
    []
  );

  // Get the first visible menu
  const findFirstItemPath = useCallback(
    (itemComps: LayoutMenuItemComp[]): string[] => {
      for (let item of itemComps) {
        if (filterItem(item)) {
          const subItems = item.children.items.getView();
          if (subItems.length > 0) {
            // have subMenus
            const childPath = findFirstItemPath(subItems);
            if (childPath.length > 0) {
              return [item.getItemKey(), ...childPath];
            }
          } else {
            return [item.getItemKey()];
          }
        }
      }
      return [];
    },
    [filterItem]
  );

  // Find by path itemKey
  const findItemPathByKeyJson = useCallback(
    (itemComps: MenuItemNode[], itemKey: string): string[] => {
      for (let item of itemComps) {
        const subItems = item.children;
        if (subItems?.length) {
          // have subMenus
          const childPath = findItemPathByKeyJson(subItems, itemKey);
          if (childPath.length > 0) {
            return [item.key, ...childPath];
          }
        } else {
          if (item.key === itemKey) {
            return [item.key];
          }
        }
      }
      return [];
    },
    []
  );

  // Get the first visible menu
  const findFirstItemPathJson = useCallback(
    (itemComps: MenuItemNode[]): string[] => {
      for (let item of itemComps) {
        if (!item.hidden) {
          const subItems = item.children;
          if (subItems?.length) {
            // have subMenus
            const childPath = findFirstItemPathJson(subItems);
            if (childPath.length > 0) {
              return [item.key, ...childPath];
            }
          } else {
            return [item.key];
          }
        }
      }
      return [];
    }, []
  );

  const defaultOpenKeys = useMemo(() => {
    if(dataOptionType === DataOption.Json) {
      let itemPath: string[];
      if (pathParam.appPageId) {
        itemPath = findItemPathByKeyJson(jsonItems, pathParam.appPageId);
      } else {
        itemPath = findFirstItemPathJson(jsonItems);
      }
      return itemPath.slice(0, itemPath.length - 1);
    }

    let itemPath: string[];
    if (pathParam.appPageId) {
      itemPath = findItemPathByKey(items, pathParam.appPageId);
    } else {
      itemPath = findFirstItemPath(items);
    }
    return itemPath.slice(0, itemPath.length - 1);
  }, []);

  useEffect(() => {
    let selectedKey = pathParam.appPageId;
    if (!selectedKey) {
      const firstItem = findFirstItemPath(items)?.slice(-1);
      if (firstItem.length > 0) {
        selectedKey = firstItem[0];
      }
    }
    setSelectedKey(selectedKey);
  }, [pathParam.appPageId]);

  const pageView = useMemo(() => {
    let pageView = <EmptyContent text="" style={{ height: "100%" }} />;
    
    if(dataOptionType === DataOption.Manual) {
      const selectedItem = (itemKeyRecord[selectedKey] as LayoutMenuItemComp);
      if (selectedItem && !selectedItem.children.hidden.getView()) {
        const compView = selectedItem.children.action.getView();
        if (compView) {
          pageView = compView;
        }
      }
    }
    if(dataOptionType === DataOption.Json) {
      const item = (itemKeyRecord[selectedKey] as MenuItemNode)
      if(item?.action?.url) {
        pageView =  <iframe
          title={item?.action?.url}
          src={item?.action?.url}
          width="100%"
          height="100%"
          style={{ border: "none", marginBottom: "-6px" }}
        />
      }
    }
    return pageView;
  }, [dataOptionType, itemKeyRecord, selectedKey])

  const getVerticalMargin = (margin: string[]) => {
    if(margin.length === 1) return `${margin[0]}`;
    if(margin.length === 2) return `(${margin[0]} + ${margin[0]})`;
    if(margin.length === 3 || margin.length === 4)
      return `(${margin[0]} + ${margin[2]})`;

    return '0px';
  }
  const getHorizontalMargin = (margin: string[]) => {
    if(margin.length === 1) return `(${margin[0]} + ${margin[0]})`;
    if(margin.length === 2) return `(${margin[1]} + ${margin[1]})`;
    if(margin.length === 3 || margin.length === 4)
      return `(${margin[1]} + ${margin[3]})`;

    return '0px';
  }

  let backgroundStyle = navStyle.background;
  if(!_.isEmpty(backgroundImage))  {
    backgroundStyle = `center / cover url('${backgroundImage}') no-repeat, ${backgroundStyle}`;
  }

  let content = (
    <Layout>
      <StyledSide theme="light" width={navWidth}>
        <StyledMenu
          items={menuItems}
          mode={navMode}
          style={{
            height: `calc(100% - ${getVerticalMargin(navStyle.margin.split(' '))})`,
            width: `calc(100% - ${getHorizontalMargin(navStyle.margin.split(' '))})`,
            borderRight: `1px solid ${navStyle.border}`,
            borderRadius: navStyle.radius,
            color: navStyle.text,
            margin: navStyle.margin,
            padding: navStyle.padding,
            background: backgroundStyle,
          }}
          defaultOpenKeys={defaultOpenKeys}
          selectedKeys={[selectedKey]}
          $navItemStyle={{
            width: `calc(100% - ${getHorizontalMargin(navItemStyle.margin.split(' '))})`,
            ...navItemStyle,
          }}
          $navItemHoverStyle={navItemHoverStyle}
          $navItemActiveStyle={navItemActiveStyle}
        />
      </StyledSide>
      <MainContent>{pageView}</MainContent>
    </Layout>
  );
  return isViewMode ? (
    content
  ) : (
    <EditorContainer>
      <ContentWrapper>{content}</ContentWrapper>
    </EditorContainer>
  );
});

const navLayoutCompType = "nav";

// action adds extraInfo to save history
NavTmpLayout = withDispatchHook(NavTmpLayout, (dispatch) => (action) => {
  if (!dispatch) {
    return;
  }
  return dispatch({
    ...action,
    extraInfo: {
      compInfos: [
        {
          compName: trans("aggregation.navLayout"),
          compType: navLayoutCompType,
          type: "modify",
        },
      ],
    },
  });
});

export const NavLayout = class extends NavTmpLayout {
  getAllCompItems() {
    return {};
  }

  nameAndExposingInfo(): NameAndExposingInfo {
    return {};
  }
};
registerLayoutMap({ compType: navLayoutCompType, comp: NavLayout });
