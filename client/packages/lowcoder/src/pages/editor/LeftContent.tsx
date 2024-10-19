import { CompInfo, EditorContext } from "comps/editorState";
import {
  BaseSection,
  Collapse,
  CollapseLabel as Label,
  CollapseTitle as Title,
  CopyTextButton,
  FoldedIcon,
  LeftClose,
  LeftCommon,
  LeftOpen,
  ScrollBar,
  Tooltip,
  UnfoldIcon,
  UnShow,
  TacoButton,
} from "lowcoder-design";
import React, { ReactNode, useCallback, useContext, useMemo, useState } from "react";
import { hookCompCategory } from "comps/hooks/hookCompTypes";
import _ from "lodash";
import styled from "styled-components";
import { leftCompListClassName } from "pages/tutorials/tutorialsConstant";
import type UIComp from "comps/comps/uiComp";
import { BottomResTypeEnum } from "types/bottomRes";
import { getParentNodeKeysByKey, getTreeNodeByKey, safeJSONStringify } from "util/objectUtils";
import { Tabs, TabTitle } from "components/Tabs";
import { BackgroundColor, TopHeaderHeight } from "constants/style";
import { trans } from "i18n";
import { CompTree } from "comps/comps/containerBase";
import { CompStateIcon } from "./editorConstants";
import type { UICompType } from "comps/uiCompRegistry";
import { CollapseWrapper, DirectoryTreeStyle, Node } from "./styledComponents";
import { DataNode, EventDataNode } from "antd/es/tree";
import { isAggregationApp } from "util/appUtils";
import Modal from "antd/es/modal/Modal";

const CollapseTitleWrapper = styled.div`
  display: flex;
  width: fit-content;
  max-width: calc(100% - 8px);
`;

const PadDiv = styled.div`
  padding: 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;

  &:hover .copy-icon {
    visibility: visible;
  }
`;

const CopyIcon = styled(CopyTextButton)`
  visibility: hidden;
  margin-left: 8px;
  color: #1890ff;
  cursor: pointer;
`;

function getLen(config: string | boolean | number) {
  if (typeof config === "number") {
    return (config + "").toString().length;
  }
  if (typeof config === "string" || typeof config === "boolean") {
    return config.toString().length;
  }
  return 0;
}

function safeStringify(obj: any, space = 2) {
  const cache = new Set();
  return JSON.stringify(obj, (key, value) => {
    if (typeof value === 'object' && value !== null) {
      if (cache.has(value)) {
        return '[Circular]';
      }
      cache.add(value);
    }
    return value;
  }, space);
}


function toDataView(value: any, name: string, desc?: ReactNode, modal?: boolean) {
  const str = typeof value === "function" ? "Function" : safeStringify(value);
  const descRecord: Record<string, ReactNode> = {};
  const shortenedString = modal === true ? (getLen(str) > 42 ? str.slice(0, 42) + "..." : str) : (getLen(str) > 20 ? str.slice(0, 20) + "..." : str);
  descRecord[name] = desc;
  if (Array.isArray(value)) {
    const dataChild: Record<string, any> = {};
    value.forEach((valueChild, index) => {
      dataChild[index] = valueChild;
    });
    return (
      <CollapseView name={name} desc={descRecord} data={dataChild} isArray={true} key={name} modal={modal} />
    );
  } else if (_.isPlainObject(value)) {
    return (
      <CollapseView name={name} desc={descRecord} data={value} key={name} modal={modal}/>
    );
  } else {
    return (
      <PadDiv 
        style={{marginLeft: "20px", borderBottom: "1px solid #f0f0f0", height: "32px", display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}
        key={name}
      >
        <Tooltip title={desc} placement={"right"}>
          <Label label={name} /> &#8203;
        </Tooltip>

        <div style={{ display: "flex", wordBreak: "break-all", textAlign: "right" }}>
          <span style={{marginRight: "10px"}}>{shortenedString}</span>
          {getLen(str) > 0 && 
            <CopyTextButton text={value} style={{ color: "#ccc", marginRight: "0px", marginTop: "4px" }} />
          }
        </div>
        
      </PadDiv>
    );
  }
}


export default toDataView;

function sliceArr(arr: string[]) {
  let preArr: string[] = [];
  let afterArr: string[] = [];
  arr.forEach((arrChild, index) => {
    if (index < 15) {
      preArr.push(arrChild);
    }
    if (index >= arr.length - 5 && index < arr.length) {
      afterArr.push(arrChild);
    }
  });
  return { preArr, afterArr } as const;
}

function toData(props: { data: Record<string, any>; desc?: Record<string, ReactNode>, modal?: boolean}) {
  const totalArr = Object.keys(props.data);
  const sliceFn = sliceArr;
  return (
    <div>
      {totalArr.length < 30 ? (
        totalArr.map((name) => {
          return toDataView(props.data[name], name, props.desc?.[name], props.modal);
        })
      ) : (
        <>
          {sliceFn(totalArr).preArr.map((name) => {
            return toDataView(props.data[name], name, props.desc?.[name], props.modal);
          })}
          <UnShow num={totalArr.length - 6} />
          {sliceFn(totalArr).afterArr.map((name) => {
            return toDataView(props.data[name], name, props.desc?.[name], props.modal);
          })}
        </>
      )}
    </div>
  );
}

const CollapseView = React.memo(
  (props: {
    name: string;
    desc?: Record<string, ReactNode>;
    data: Record<string, any>;
    isArray?: boolean;
    onClick?: (compName: string) => void;
    isSelected?: boolean;
    isOpen?: boolean;
    children?: React.ReactNode; // Accept children
    modal?: boolean;
  }) => {
    const { data = {} } = props;
    const onlyOne = Object.keys(data).length === 1;
    return (
      <Collapse
        isSelected={props.isSelected}
        isOpen={props.isOpen}
        config={[
          {
            key: props.name,
            title: (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Tooltip
                  title={props.desc?.[props.name]}
                  placement={"right"}
                >
                  <CollapseTitleWrapper onClick={() => props.onClick && props.onClick(props.name)}>
                    <Title
                      style={{
                        whiteSpace: "nowrap",
                        textOverflow: "ellipsis",
                        overflow: "hidden",
                      }}
                      label={props.name}
                      hasChild={Object.keys(data).length > 0}
                    />
                    <Title
                      style={{ flexShrink: 0 }}
                      color="#8B8FA3"
                      label={`${props.isArray ? "[]" : "{}"} ${trans(
                        props.isArray
                          ? onlyOne
                            ? "leftPanel.propTipArr"
                            : "leftPanel.propTipsArr"
                          : onlyOne
                          ? "leftPanel.propTip"
                          : "leftPanel.propTips",
                        {
                          num: Object.keys(data).length,
                        }
                      )}`}
                    />
                  </CollapseTitleWrapper>
                </Tooltip>
                {Object.keys(data).length > 0 && 
                  <CopyTextButton text={safeStringify(data)} style={{ color: "#aaa", marginRight: "8px"  }} />
                }
              </div>
            ),
            data: toData({ data, desc: props.desc, modal: props.modal}),
          },
        ]}
      />
    );
  }
);


interface LeftContentProps {
  uiComp: InstanceType<typeof UIComp>;
}

enum LeftTabKey {
  State = "state",
  ModuleSetting = "module-setting",
}

enum TreeUIKey {
  Components = "components",
  Modals = "modals",
}

type NodeItem = {
  key: string;
  title: string;
  type?: UICompType;
  children: NodeItem[];
};

type NodeInfo = {
  key: string;
  show: boolean;
  clientX?: number;
};

const LeftContentTabs = styled(Tabs)`
  .ant-tabs-nav {
    background-color: ${BackgroundColor};
    height: 40px;
    padding: 0 16px;
    margin: 0;

    .ant-tabs-tab {
      padding: 0;
      font-weight: 500;
    }
  }

  .ant-tabs-tabpane {
    height: calc(100vh - ${TopHeaderHeight} - 40px);
  }
`;
const LeftContentWrapper = styled.div`
  height: calc(100vh - ${TopHeaderHeight});
`;

export const LeftContent = (props: LeftContentProps) => {
  const { uiComp } = props;
  const editorState = useContext(EditorContext);
  const [expandedKeys, setExpandedKeys] = useState<Array<React.Key>>([]);
  const [showData, setShowData] = useState<NodeInfo[]>([]);

  const getTree = (tree: CompTree, result: NodeItem[], key?: string) => {
    const { items, children } = tree;
    if (Object.keys(items).length) {
      for (const i in items) {
        const info = {
          title: items[i].children.name.getView(),
          type: items[i].children.compType.getView() as UICompType,
          key: i,
          children: [],
        };
        if (key) {
          const parent = getTreeNodeByKey(result, key);
          parent?.children.push(info);
        } else {
          result.push(info);
        }
      }
      result = _.sortBy(result, [(x) => x.title]);
    }
    if (Object.keys(children).length) {
      for (const i in children) {
        getTree(children[i], result, i);
      }
    }
    return result;
  };

  const handleNodeClick = (
    e: React.MouseEvent<HTMLSpanElement, MouseEvent>,
    node: EventDataNode<DataNode>,
    uiCompInfos: CompInfo[]
  ) => {
    uiCollapseClick(node.title + "");
    const data = uiCompInfos.find((item) => item.name === node.title);
    if (!node.children?.length && data && Object.keys(data.data)?.length && node.selected) {
      // leaf and selected node, toggle showData
      const index = showData.findIndex((item) => item.key === node.key);
      let newData: NodeInfo[] = [];
      let clientX = e.currentTarget?.offsetLeft + 20;
      if (index > -1) {
        newData = showData.map((item) => {
          if (item.key === node.key) {
            return {
              key: item.key,
              show: !item.show,
              clientX,
            };
          }
          return item;
        });
      } else {
        newData = [
          ...showData,
          {
            key: node.key + "",
            show: true,
            clientX,
          },
        ];
      }
      setShowData(newData);
    }
  };

  const uiCollapseClick = useCallback(
    (compName: string) => {
      editorState.setSelectedCompNames(new Set([compName]), "leftPanel");
    },
    [editorState]
  );

  const handleBottomResItemClick = useCallback(
    (type: BottomResTypeEnum, name: string) => {
      editorState.setSelectedBottomRes(name, type);
    },
    [editorState]
  );

  const getTreeNode = (node: NodeItem, uiCompInfos: CompInfo[]) => {
    const info = showData.find((item) => item.key === node.key);
    const data = uiCompInfos.find((item) => item.name === node.title);

    const prepareData = (data: Record<string, any>, desc?: Record<string, ReactNode>) => {
      return (
        <div>
          {Object.keys(data).map((name) => {
            return toDataView(data[name], name, desc?.[name], true);
          })}
        </div>
      );
    };

    return (
      <Node key={node.key}>
        <span>
          <span>{node.title} </span>
          {data && !!Object.keys(data.data)?.length && (
            info?.show ? (
              <Tooltip
                placement="right"
                title={trans("leftPanel.collapseTip", { component: node.title })}
              >
                <div
                  title=""
                  className="show-data"
                  onClick={(e) => {
                    e.stopPropagation();
                    const newData = showData.map((item) => {
                      if (item.key === node.key) {
                        return {
                          key: item.key,
                          show: false,
                          clientX: undefined,
                        };
                      }
                      return item;
                    });
                    setShowData(newData);
                  }}
                >
         
                </div>
              </Tooltip>
            ) : (
              <Tooltip
                placement="right"
                title={trans("leftPanel.expandTip", { component: node.title })}
              >
                <div
                  title=""
                  className="no-data"
                  onClick={(e) => {
                    e.stopPropagation();
                    const index = showData.findIndex((item) => item.key === node.key);
                    let newData: NodeInfo[] = [];
                    const info = {
                      key: node.key,
                      show: true,
                      clientX: e.currentTarget.parentElement?.offsetLeft,
                    };
                    if (index > -1) {
                      newData = showData.map((item) => {
                        if (item.key === node.key) {
                          return info;
                        }
                        return item;
                      });
                    } else {
                      newData = [...showData, info];
                    }
                    setShowData(newData);
                  }}
                >
                  <LeftClose />
                </div>
              </Tooltip>
            )
          )}
        </span>
        {info?.show && data && (
          <Modal
            title={data.name}
            open={info.show}
            onOk={() => setShowData([])}
            cancelButtonProps={{ style: { display: 'none' } }}
            maskClosable={true} // Prevent closing on background click
          >
            <div
              style={{ whiteSpace: 'nowrap', wordWrap: 'normal', maxHeight: "calc(100vh - 400px)", overflow: "scroll" }}
              onClick={(e) => e.stopPropagation()} // Prevent closing on clicking inside the modal
            >
              {prepareData(data.data, data.dataDesc)}
            </div>
          </Modal>
        )}
      </Node>
    );
  };
  

  const getTreeUI = (type: TreeUIKey) => {
    const uiCompInfos = _.sortBy(editorState.uiCompInfoList(), [(x) => x.name]);
    const tree =
      type === TreeUIKey.Components
        ? editorState.getUIComp().getTree()
        : editorState.getHooksComp().getUITree();
    const explorerData: NodeItem[] = getTree(tree, []);
    let selectedKeys = [];
    if (editorState.selectedCompNames.size === 1) {
      const key = Object.keys(editorState.selectedComps())[0];
      const parentKeys = getParentNodeKeysByKey(explorerData, key);
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

    return (
      <DirectoryTreeStyle
        treeData={explorerData}
        icon={(props: any) => props.type && (
          <div style={{ margin: '16px 4px 0 -4px'}}> 
            {CompStateIcon[props.type as UICompType] || <LeftCommon />}
          </div>
        )}
        switcherIcon={(props: any) =>
          props.expanded ? <FoldedIcon /> : <UnfoldIcon />
        }
        expandedKeys={expandedKeys}
        onExpand={(keys) => setExpandedKeys(keys)}
        onClick={(e, node) => handleNodeClick(e, node, uiCompInfos)}
        selectedKeys={selectedKeys}
        titleRender={(nodeData) => getTreeNode(nodeData as NodeItem, uiCompInfos)}
      />
    );
  };

  const uiCollapse = useMemo(() => {
    if (isAggregationApp(editorState.getAppType())) {
      return;
    }
    return getTreeUI(TreeUIKey.Components);
  }, [editorState, uiCollapseClick, expandedKeys, showData]);

  const modalsCollapse = useMemo(() => {
    if (isAggregationApp(editorState.getAppType())) {
      return;
    }
    return getTreeUI(TreeUIKey.Modals);
  }, [editorState, uiCollapseClick, expandedKeys, showData]);

  const bottomResCollapse = useMemo(() => {
    return editorState
      .bottomResComInfoList()
      .map((item) => (
        <CollapseView
          key={item.name}
          name={item.name}
          desc={item.dataDesc}
          data={item.data}
          isSelected={editorState.selectedBottomResName === item.name}
          onClick={() => handleBottomResItemClick(item.type as BottomResTypeEnum, item.name)}
        />
      ));
  }, [editorState, handleBottomResItemClick]);

  const hookCompsCollapse = useMemo(() => {
    return _.sortBy(
      editorState.hooksCompInfoList().filter((info) => hookCompCategory(info.type) === "hook"),
      [(x) => x.name]
    ).map((item) => (
      <CollapseView
        key={item.name}
        name={item.name}
        desc={item.dataDesc}
        data={item.data}
        isSelected={false}
        onClick={_.noop}
      />
    ));
  }, [editorState]);

  const moduleLayoutComp = uiComp.getModuleLayoutComp();
  const stateContent = (
    <ScrollBar>
      <div style={{ paddingBottom: 80 }}>
        <BaseSection name={trans("leftPanel.components")} width={288} noMargin>
          <span className={leftCompListClassName}>{uiCollapse}</span>
        </BaseSection>
        <BaseSection name={trans("leftPanel.modals")} width={288} noMargin>
          <span>{modalsCollapse}</span>
        </BaseSection>
        <BaseSection name={trans("leftPanel.queries")} width={288} noMargin>
          <span>{bottomResCollapse}</span>
        </BaseSection>
        <BaseSection name={trans("leftPanel.globals")} width={288} noMargin>
          <span>{hookCompsCollapse}</span>
        </BaseSection>
      </div>
    </ScrollBar>
  );

  if (!moduleLayoutComp) {
    return <LeftContentWrapper className="cypress-left-content">{stateContent}</LeftContentWrapper>;
  }

  const tabItems = [
    {
      key: LeftTabKey.State,
      label: <TabTitle text={trans("leftPanel.stateTab")} />,
      children: <>{ stateContent }</>
    },
    {
      key: LeftTabKey.ModuleSetting,
      label: <TabTitle text={trans("leftPanel.settingsTab")} />,
      children: (
        <ScrollBar>
          <div style={{ paddingBottom: 80, paddingTop: 16 }}>
            <BaseSection width={288} noMargin>
              <span>{moduleLayoutComp.getConfigView()}</span>
            </BaseSection>
          </div>
        </ScrollBar>
      )
    }
  ]
  return (
    <LeftContentWrapper className="cypress-left-content">
      <LeftContentTabs
        defaultActiveKey={LeftTabKey.ModuleSetting}
        items={tabItems}
      >
      </LeftContentTabs>
    </LeftContentWrapper>
  );
};
