import { CompInfo, EditorContext } from "comps/editorState";
import {
  BaseSection,
  CollapseLabel as Label,
  CollapseTitle as Title,
  FoldedIcon,
  LeftCommon,
  ScrollBar,
  UnfoldIcon,
  LeftShow,
} from "lowcoder-design";
import React, { useCallback, useContext, useMemo, useState, useEffect, useRef } from "react";
import _, { get, set } from "lodash";
import styled from "styled-components";
import { leftCompListClassName } from "pages/tutorials/tutorialsConstant";
import type UIComp from "comps/comps/uiComp";
import { getTreeNodeByKey } from "util/objectUtils";
import { TopHeaderHeight } from "constants/style";
import { trans } from "i18n";
import { CompTree } from "comps/comps/containerBase";
import { CompStateIcon } from "./editorConstants";
import type { UICompType } from "comps/uiCompRegistry";
import { DirectoryTreeStyle, Node } from "./styledComponents";
import { isAggregationApp } from "util/appUtils";
import cloneDeep from 'lodash/cloneDeep';
import { useDispatch } from "react-redux";
import { useApplicationId } from "util/hooks";
import { default as Button } from "antd/es/button";
import { default as Divider } from "antd/es/divider";
import { default as Dropdown } from "antd/es/dropdown";
import { default as Flex } from "antd/es/flex";
import { default as Input } from "antd/es/input";
import { default as Menu } from "antd/es/menu";
import { default as Space } from "antd/es/space";
import { default as Switch } from "antd/es/switch";
import { MenuProps } from "antd/es/menu";
import type { InputRef } from 'antd';
import {
  saveCollisionStatus,
} from "util/localStorageUtil";
import { default as DownOutlined } from "@ant-design/icons/DownOutlined";
import ThemeSettingsSelector from "components/ThemeSettingsSelector";

export type DisabledCollisionStatus = "true" | "false"; // "true" means collision is not enabled - Layering works, "false" means collision is enabled - Layering does not work
export type ToggleCollisionStatus = (collisionStatus?: DisabledCollisionStatus) => void;

interface LeftLayersContentProps {
  uiComp: InstanceType<typeof UIComp>;
}

const DropdownLeftShow = () => (
  <LeftShow viewBox="0 0 256 256" /> // Setting custom viewBox
);

type NodeItem = {
  key: string;
  title: string;
  type?: UICompType;
  children: NodeItem[];
  pos?: number;
  disabled?: boolean;
  fixed?: boolean;
};

const items: MenuProps['items'] = [
  {
    label: 'Hide Component',
    key: 'hidden',
  },
  {
    label: 'Disable Component',
    key: 'disable',
  },
  {
    label: 'Margin',
    key: 'style.margin',
  },
  {
    label: 'Padding',
    key: 'style.padding',
  },
  {
    label: 'Font Size',
    key: 'style.textSize',
  },
  {
    label: 'Font Weight',
    key: 'style.textWeight',
  },
  {
    label: 'Font Family',
    key: 'style.fontFamily',
  },
  {
    label: 'Font Style',
    key: 'style.fontStyle',
  },
  {
    label: 'Text Transform',
    key: 'style.textTransform',
  },
  {
    label: 'Text Decoration',
    key: 'style.textDecoration',
  },
  {
    label: 'Border Radius',
    key: 'style.borderRadius',
  },
  {
    label: 'Border Width',
    key: 'style.borderWidth',
  },
  {
    label: 'Border Style',
    key: 'style.borderStyle',
  },
  {
    label: 'Background Image',
    key: 'style.backgroundImage',
  },
  {
    label: 'Background Image Repeat',
    key: 'style.backgroundImageRepeat',
  },
  {
    label: 'Background Image Size',
    key: 'style.backgroundImageSize',
  },
  {
    label: 'Background Image Position',
    key: 'style.backgroundImagePosition',
  },
  {
    label: 'Background Image Origin',
    key: 'style.backgroundImageOrigin',
  }
];

const LeftLayersContentWrapper = styled.div`
  height: calc(100vh - ${TopHeaderHeight});
`;

const CustomDropdown = styled(Dropdown)`
  .ant-dropdown-menu-item-icon {
    width: 14px !important;
    height: 14px !important; 
    max-width: 14px !important;
  }
`;

export const LeftLayersContent = (props: LeftLayersContentProps) => {
  const { uiComp } = props;
  const editorState = useContext(EditorContext);
  const [expandedKeys, setExpandedKeys] = useState<Array<React.Key>>([]);
  const dispatch = useDispatch();
  const applicationId = useApplicationId();

  // added by Falk Wolsky to support a Layers in Lowcoder
  const [collisionStatus, setCollisionStatus] = useState(editorState.getCollisionStatus());

  const [checkedKeys, setCheckedKeys] = useState<string[]>([]);
  const [actionValue, setActionValue] = useState<string>("");
  const [selectedActionKey, setSelectedActionKey] = useState<string | null>(null);
  const [placeholderText, setPlaceholderText] = useState<string>("");
  // const [color, setColor] = useState<string>("");
  const inputRef = useRef<InputRef>(null);

  useEffect(() => {
    saveCollisionStatus(collisionStatus);
  }, [collisionStatus])


  const handleActionSelection = useCallback((key: string) => {
    setSelectedActionKey(key);
  }, []);

  const handleToggleLayer = (checked: boolean) => {
    editorState.rootComp.children.settings.children.disableCollision.dispatchChangeValueAction(
      checked
    )
    setCollisionStatus(checked);
  }

  const getTree = (tree: CompTree, result: NodeItem[], key?: string) => {
    const { items, children } = tree;
    if (Object.keys(items).length) {
      for (const i in items) {
        const info: NodeItem = {
          title: items[i].children.name.getView(),
          type: items[i].children.compType.getView() as UICompType,
          key: i,
          children: [],
        };
        if (key) {
          const parent = getTreeNodeByKey(result, key);
          info.disabled = true;
          parent?.children.push(info);
        } else {
          result.push(info);
        }
      }
      // result = _.sortBy(result, [(x) => x.title]);
    }
    if (Object.keys(children).length) {
      for (const i in children) {
        getTree(children[i], result, i);
      }
    }
    return result;
  };

  const uiCollapseClick = useCallback(
    (compName: string) => {
      editorState.setSelectedCompNames(new Set([compName]), "leftPanel");
    },
    [editorState]
  );

  const getTreeNode = (node: NodeItem, uiCompInfos: CompInfo[]) => {
    const data = uiCompInfos.find((item) => item.name === node.title);
    return (
      <Node>
        <span>
          <span>{node.title}</span>
        </span>
      </Node>
    );
  };

  const [componentTreeData, setComponentTreeData] = useState<NodeItem[]>([]);

  // update component tree data when editor state changes
  useEffect(() => {
    const compData = getTreeUIData();
    setComponentTreeData(compData);
  }, [editorState]);


  const getTreeUIData = () => {
    const tree = editorState.getUIComp().getTree();
    const explorerData: NodeItem[] = getTree(tree, []);
    const dsl = editorState.rootComp.toJsonValue();

    if (dsl.ui.compType === "module") {
      explorerData.forEach(data => {
        data['pos'] = dsl.ui.comp.container.layout[data.key].pos;
      })
    }
    else {
      explorerData.forEach(data => {
        data['pos'] = dsl.ui.layout[data.key].pos;
      })
    }

    explorerData.sort((a, b) => {
      const aPos = a?.pos || 0;
      const bPos = b?.pos || 0;
      if (aPos < bPos) return -1;
      if (aPos > bPos) return 1;
      return 0;
    });

    return explorerData;
  }

  interface DropInfo {
    node: { key: string; pos: string };
    dragNode: { key: string; pos: string };
  }

  const handleDragEnter = (info: { node?: any; expandedKeys?: any; }) => {
    // Assuming 'info' has a property 'expandedKeys' which is an array of keys
    const { expandedKeys } = info;
    if (!expandedKeys.includes(info.node.key)) {
      setExpandedKeys(expandedKeys);
    }
  };

  const handleDrop = (info: { node: { key: any; pos: string; }; dragNode: { key: any; pos: string; }; }) => {
    const dropPos = info.node.pos.split('-');
    const dragPos = info.dragNode.pos.split('-');

    if (dropPos.length === dragPos.length) {
      setComponentTreeData(prevData => {
        let newTreeData = cloneDeep(prevData);
        const dropIndex = Number(dropPos[dropPos.length - 1]);
        const dragIndex = Number(dragPos[dragPos.length - 1]);
        const parentNodePos = dropPos.slice(0, -1).join('-');

        // TODO: handle drag and drop for childen of root (container components for example)
        // findNodeByPos does not work yet
        const parentNode = parentNodePos === "0" ? { children: newTreeData } : findNodeByPos(newTreeData, parentNodePos);
    
        if (parentNode && parentNode.children) {
          const draggedNodeIndex = parentNode.children.findIndex(node => node.key === info.dragNode.key);
          if (draggedNodeIndex !== -1) {
            const [draggedNode] = parentNode.children.splice(draggedNodeIndex, 1);
            parentNode.children.splice(dropIndex > dragIndex ? dropIndex - 1 : dropIndex, 0, draggedNode);
          }
        }

        const dsl = editorState.rootComp.toJsonValue();
        let layout: any = {};
        if(dsl.ui.compType === 'module') {
          parentNode.children.forEach((data, index) => {
            layout[data.key] = {
              ...dsl.ui.comp.container.layout[data.key],
              pos: index,
            };
          })
          const moduleLayoutComp = editorState.rootComp.children.ui.getModuleLayoutComp();
          moduleLayoutComp?.children.container.dispatchChangeValueAction({
            ...dsl.ui.comp.container,
            layout,
          })
        } else {
          parentNode.children.forEach((data, index) => {
            layout[data.key] = {
              ...dsl.ui.layout[data.key],
              pos: index,
            };
          })
  
          editorState.rootComp.children.ui.dispatchChangeValueAction({
            ...dsl.ui,
            layout,
          })
        }
        return newTreeData;
      });
    }
  };
  
  const findNodeByPos = (nodes: NodeItem[], pos: string): { children: NodeItem[] } => {
    const posArr = pos.split('-').map(p => Number(p));
    let currentNode = { children: nodes };
    for (let i = 0; i < posArr.length; i++) {
      currentNode = currentNode.children[posArr[i]];
    }
    return currentNode;
  };

  // here we handle the checked keys of the component tree

  const getPlaceholderText = useCallback((key: string) => {
    switch (key) {
      case 'hidden':
      case 'disable':
        return 'true | false';
      case 'style.border':
        return 'e.g., #ffffff'; // Example format indication
      case 'style.borderRadius':
      case 'style.radius': // Supporting legacy key if needed
        return 'e.g., 4px'; // Example format indication
      case 'style.borderWidth':
        return 'e.g., 2px'; // Example format indication
      case 'style.borderStyle':
        return 'solid | dashed | dotted';
      case 'style.backgroundImage':
        return 'URL as string';
      case 'style.backgroundImageRepeat':
        return 'repeat | repeat-x | repeat-y | no-repeat';
      case 'style.backgroundImageSize':
        return 'cover | contain | % | px';
      case 'style.backgroundImagePosition':
        return 'top | bottom | center | % | px';
      case 'style.backgroundImageOrigin':
        return 'padding-box | border-box | content-box';
      case 'style.margin':
      case 'style.padding':
        return 'e.g., 4px 8px 16px 32px'; // Example format indication
      case 'style.textSize':
        return 'e.g., 16px'; // Example format indication
      case 'style.textWeight':
        return 'bold | 900 | normal | 400';
      case 'style.fontFamily':
        return 'Arial, sans-serif';
      case 'style.fontStyle':
        return 'normal | italic | oblique';
      case 'style.textTransform':
        return 'none | capitalize | uppercase | lowercase';
      case 'style.textDecoration':
        return 'none | underline | overline | line-through';
      default:
        return 'Action Value';
    }
  }, []);

  const handleColorChange = (color: string | undefined, actionType: string) => {
    const newColor = color || '#ffffff';

    for (let key of getCheckedKeys()) {
      const node = getTreeNodeByKey(componentTreeData, key);
      const comp = editorState.getUICompByName(node.title);
      if(comp) {
        const { children } = comp.children.comp;
        const compType = comp.children.compType.getView();
        const types = actionType.split('.');
        if(types.length === 1) { // e.g hidden, disabled
          children[types[0]]?.dispatchChangeValueAction(color);
        }
        else if(types.length === 2) { // nested object e.g. style.background
          // (children[types[0]]);
          if (!children[types[0]]) {
            if (children[compType].children[types[0]]?.children[types[1]]) {
              children[compType].children[types[0]].children[types[1]]?.dispatchChangeValueAction(color);
            }
          }
          else {
            if (children[types[0]].children[types[1]]) {
              children[types[0]].children[types[1]]?.dispatchChangeValueAction(color);
            }
            else {
              children[types[0]][types[1]]?.dispatchChangeValueAction(color);
            }
          }
        }
      }
    }
  };

  // sync selected components with checked keys
  useEffect(() => {
    setCheckedKeys([]);
    const selectedComponentsOnCanvas: string[] = [];
    const compTree = editorState.getUIComp().getTree();
    const explorerData: NodeItem[] = getTree(compTree, []);
    for (let value of editorState.selectedCompNames) {
      for (let key of explorerData) {
        if (key.title === value) {
          selectedComponentsOnCanvas.push(key.key);
        }
      }
    }
    setCheckedKeys(selectedComponentsOnCanvas);
  }, [editorState]);

  // make sure to handle the selectedActionKey for the changed input fields
  /* useEffect(() => {
    setActionValue('');
    // setColor('#ffffff');
  }, [selectedActionKey, placeholderText]); */

  const onCheck = (checkedKeys: any, e: any) => {
    setCheckedKeys(checkedKeys);
    const checkedComponents = new Set<string>();
    for (let key of e.checkedNodes){
      checkedComponents.add(key.title);
    }
    editorState.setSelectedCompNames(checkedComponents, "leftPanel");
  }

  const getCheckedKeys = () => {
    return checkedKeys;
  }
  
  const getActionValue = () => {
    return actionValue;
  }

  const handleComponentsActions = useCallback((actionType: string) => {
    const value = getActionValue();
    for (let key of getCheckedKeys()) {
      const node = getTreeNodeByKey(componentTreeData, key);
      const comp = editorState.getUICompByName(node.title);
      if(comp) {
        const { children } = comp.children.comp;
        const compType = comp.children.compType.getView();
        const types = actionType.split('.');
        if(types.length === 1) { // e.g hidden, disabled
          children[types[0]]?.dispatchChangeValueAction(value);
        }
        else if(types.length === 2) { // nested object e.g. style.background
          // console.log(children[types[0]]);
          if (!children[types[0]]) {
            if (children[compType].children[types[0]]?.children[types[1]]) {
              children[compType].children[types[0]].children[types[1]]?.dispatchChangeValueAction(value);
            }
          }
          else {
            if (children[types[0]].children[types[1]]) {
              children[types[0]].children[types[1]]?.dispatchChangeValueAction(value);
            }
            else {
              children[types[0]][types[1]]?.dispatchChangeValueAction(value);
            }
          }
        }
      }
    }
  }, [getActionValue, getCheckedKeys]);
  
  const getTreeUI = () => {
    // here the components get sorted by name
    // TODO: sort by category
    // TODO: sort by Types etc.
    const uiCompInfos = _.sortBy(editorState.uiCompInfoList(), [(x) => x.name]);
    const isDraggable = editorState.getCollisionStatus();

    return (
      <>
      <div style={{margin:"0px 16px"}}>
        <div style={{marginBottom:"10px"}}>
 
          {trans("leftPanel.activatelayers")}
          <Switch 
            style={{margin : "0px 10px"}}
            size="small"
            defaultChecked={collisionStatus}
            disabled={false}
            onChange={(value: boolean) => {
              handleToggleLayer(value);
            }}
          />
        </div>

        <DirectoryTreeStyle
          checkable={true}
          onCheck={onCheck}
          selectable={false}
          checkedKeys={checkedKeys}
          draggable={isDraggable}
          onDragEnter={handleDragEnter}
          onDrop={(info) => handleDrop(info)}
          treeData={componentTreeData}
          icon={(props: any) => props.type && (
            <div style={{ margin: '16px 5px 0 -3px'}}> 
              {CompStateIcon[props.type as UICompType] || <LeftCommon />}
            </div>
          )}
          switcherIcon={(props: any) => props.expanded ? <FoldedIcon /> : <UnfoldIcon />}
          expandedKeys={expandedKeys}
          onExpand={(keys) => setExpandedKeys(keys)}
          titleRender={(nodeData) => getTreeNode(nodeData as NodeItem, uiCompInfos)}
        />

        <div style={{margin:"10px 0px"}}> 
          <Flex gap="small" vertical>
            <CustomDropdown
              popupRender={() => (
                <Menu
                  items={items}
                  onClick={({ key }) => {
                    handleActionSelection(key);
                  }}
                />
              )}
            >
              <Button size={"small"}>
                <Space>Action <DownOutlined /></Space>
              </Button>
            </CustomDropdown>
            <Input
              ref={inputRef}
              value={actionValue}
              onChange={(e) => setActionValue(e.target.value)}
              placeholder={placeholderText}
            />
            <Button 
              type="primary"
              disabled={!selectedActionKey}
              onClick={() => selectedActionKey && handleComponentsActions(selectedActionKey)}
            >
              Apply Action
            </Button>
            <br/>
            <ThemeSettingsSelector
                themeSettingKey={"background"}
                name={trans("componentDoc.styleBackgroundColor")}
                color={"#ffffff"}
                configChange={(params) => handleColorChange(params.color, "style.background")}
            />
            <ThemeSettingsSelector
                themeSettingKey={"border"}
                name={trans("componentDoc.styleBorderColor")}
                color={"#ffffff"}
                configChange={(params) => handleColorChange(params.color, "style.border")}
            />
            <ThemeSettingsSelector
                themeSettingKey={"text"}
                name={trans("style.textColor")}
                color={"#ffffff"}
                configChange={(params) => handleColorChange(params.color, "style.text")}
            />
          </Flex>
        </div>
      </div>
     
      <Divider />
      </>
    );
  };

  const uiCollapse = useMemo(() => {
    if (isAggregationApp(editorState.getAppType())) {
      return;
    }
    return getTreeUI();
  }, [editorState, uiCollapseClick, expandedKeys, componentTreeData, actionValue]);
  
  const layerControlContent = (
    <ScrollBar>
      <div style={{ paddingBottom: 80 }}>
        <BaseSection name={trans("leftPanel.layers")} width={288} noMargin>
          <div className={leftCompListClassName}>{uiCollapse}</div>
        </BaseSection>
      </div>
    </ScrollBar>
  );

  return <LeftLayersContentWrapper className="cypress-left-content">{layerControlContent}</LeftLayersContentWrapper>;
  
};