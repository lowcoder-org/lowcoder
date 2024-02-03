import { CompInfo, EditorContext } from "comps/editorState";
import {
  BaseSection,
  Collapse,
  CollapseLabel as Label,
  CollapseTitle as Title,
  CopyTextButton,
  FoldedIcon,
  LeftCommon,
  LeftInfoFill,
  LeftInfoLine,
  PadDiv,
  ScrollBar,
  Tooltip,
  UnfoldIcon,
  UnShow,
} from "lowcoder-design";
import React, { ReactNode, useCallback, useContext, useMemo, useState, useEffect } from "react";
import { hookCompCategory } from "comps/hooks/hookCompTypes";
import _ from "lodash";
import styled from "styled-components";
import { leftCompListClassName } from "pages/tutorials/tutorialsConstant";
import UIComp from "comps/comps/uiComp";
import { BottomResTypeEnum } from "types/bottomRes";
import { getParentNodeKeysByKey, getTreeNodeByKey, safeJSONStringify } from "util/objectUtils";
import { Tabs, TabTitle } from "components/Tabs";
import { BackgroundColor, TopHeaderHeight } from "constants/style";
import { trans } from "i18n";
import { CompTree } from "comps/comps/containerBase";
import { CompStateIcon } from "./editorConstants";
import { UICompType } from "comps/uiCompRegistry";
import { CollapseWrapper, DirectoryTreeStyle, Node } from "./styledComponents";
import { DataNode, EventDataNode } from "antd/lib/tree";
import { isAggregationApp } from "util/appUtils";
import cloneDeep from 'lodash/cloneDeep';
import { useDispatch } from "react-redux";
import { useApplicationId } from "util/hooks";
import { updateApplication } from "redux/reduxActions/applicationActions";
import { Divider } from "antd";
import { Switch } from "antd";
import {
  saveCollisionStatus,
  getCollisionStatus,
} from "util/localStorageUtil";


export type DisabledCollisionStatus = "true" | "false"; // "true" means collision is not enabled - Layering works, "false" means collision is enabled - Layering does not work
export  type ToggleCollisionStatus = (
    collisionStatus?: DisabledCollisionStatus
  ) => void;

interface LeftLayersContentProps {
  uiComp: InstanceType<typeof UIComp>;
}

type NodeItem = {
  key: string;
  title: string;
  type?: UICompType;
  children: NodeItem[];
  pos?: number;
  disabled?: boolean;
  fixed?: boolean;
};

const LeftLayersContentWrapper = styled.div`
  height: calc(100vh - ${TopHeaderHeight});
`;

export const LeftLayersContent = (props: LeftLayersContentProps) => {
  const { uiComp } = props;
  const editorState = useContext(EditorContext);
  const [expandedKeys, setExpandedKeys] = useState<Array<React.Key>>([]);
  const dispatch = useDispatch();
  const applicationId = useApplicationId();

  // added by Falk Wolsky to support a Layers in Lowcoder
  const [collisionStatus, setCollisionStatus] = useState(() => {
    return getCollisionStatus();
  });

  const toggleCollisionStatus: ToggleCollisionStatus = useCallback(
    (value) => {
      setCollisionStatus(value ? value : ("false" as DisabledCollisionStatus));
      saveCollisionStatus(value ? value : ("false" as DisabledCollisionStatus));
    },
    [collisionStatus]
  );

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

  useEffect(() => {
    const compData = getTreeUIData();
    setComponentTreeData(compData);
  }, [editorState]);
  
  const getTreeUIData = () => {
    const tree = editorState.getUIComp().getTree();
    const explorerData: NodeItem[] = getTree(tree, []);
    const dsl = editorState.rootComp.toJsonValue();
    explorerData.forEach(data => {
      data['pos'] = dsl.ui.layout[data.key].pos;
    })
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
        parentNode.children.forEach((data, index) => {
          layout[data.key] = {
            ...dsl.ui.layout[data.key],
            pos: index,
          };
        })
        
        dispatch(
          updateApplication({
            applicationId: applicationId,
            editingApplicationDSL: {
              ...dsl,
              ui: {
                ...dsl.ui,
                layout,
              }
            } as object,
          })
        );
        editorState.rootComp.children.ui.dispatchChangeValueAction({
          ...dsl.ui,
          layout,
        })
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

  const [checkedKeys, setCheckedKeys] = useState<string[]>([]);

  const onCheck = (checkedKeys: any, e: any) => {
    setCheckedKeys(checkedKeys);
    console.log('onCheck', checkedKeys);
  }

  const getTreeUI = () => {
    // here the components get sorted by name
    // TODO: sort by category
    // TODO: sort by Types etc.
    const uiCompInfos = _.sortBy(editorState.uiCompInfoList(), [(x) => x.name]);
    
    /* const tree =
      type === TreeUIKey.Components
        ? editorState.getUIComp().getTree()
        : editorState.getHooksComp().getUITree();
    const explorerData: NodeItem[] = getTree(tree, []); */
    
    let selectedKeys = [];
    if (editorState.selectedCompNames.size === 1) {
      const key = Object.keys(editorState.selectedComps())[0];
      const parentKeys = getParentNodeKeysByKey(componentTreeData, key);
      if (parentKeys && parentKeys.length) {
        let needSet = false;
        parentKeys.forEach((key) => {
          if (!expandedKeys.includes(key)) {
            needSet = true;
          }
        });
        needSet && setExpandedKeys(_.union(expandedKeys, parentKeys));
      }
      selectedKeys.push(key);
    }

    const isDraggable = editorState.collisionStatus === "true" ? true : false;

    return (
      <>
        <Switch
          checked={editorState.collisionStatus == "true"}
          disabled={false}
          onChange={(value: any) => {
            toggleCollisionStatus(value == true ? "true" : "false");
            editorState.setCollisionStatus(value == true ? "true" : "false");
          } } />
      <DirectoryTreeStyle
        checkable={true}
        onCheck={onCheck}
        draggable={isDraggable}
        onDragEnter={handleDragEnter}
        onDrop={(info) => handleDrop(info)}
        treeData={componentTreeData}
        icon={(props: any) => props.type && (
          <div style={{ margin: '3px 0 0 -3px'}}> {/* Adjust the margin as needed */}
            {CompStateIcon[props.type as UICompType] || <LeftCommon />}
          </div>
        )}
        switcherIcon={(props: any) => props.expanded ? <FoldedIcon /> : <UnfoldIcon />}
        expandedKeys={expandedKeys}
        onExpand={(keys) => setExpandedKeys(keys)}
        // onClick={(e, node) => handleNodeClick(e, node, uiCompInfos)}
        selectedKeys={selectedKeys}
        titleRender={(nodeData) => getTreeNode(nodeData as NodeItem, uiCompInfos)} />
        <Divider />
        <div></div>
        </>
    );
  };

  const uiCollapse = useMemo(() => {
    if (isAggregationApp(editorState.getAppType())) {
      return;
    }
    return getTreeUI();
  }, [editorState, uiCollapseClick, expandedKeys, componentTreeData]);
  
  const layerControlContent = (
    <ScrollBar>
      <div style={{ paddingBottom: 80 }}>
        <BaseSection name={trans("leftPanel.components")} width={288} noMargin>
          <span className={leftCompListClassName}>{uiCollapse}</span>
        </BaseSection>
      </div>
    </ScrollBar>
  );

  return <LeftLayersContentWrapper className="cypress-left-content">{layerControlContent}</LeftLayersContentWrapper>;
  
};