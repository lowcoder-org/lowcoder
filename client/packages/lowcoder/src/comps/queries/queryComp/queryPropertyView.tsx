import { OLD_LOWCODER_DATASOURCE } from "@lowcoder-ee/constants/datasourceConstants";
import { manualTriggerResource, ResourceType } from "@lowcoder-ee/constants/queryConstants";
import { PreparedStatementConfig } from "api/datasourceApi";
import { isCompWithPropertyView } from "comps/utils/propertyUtils";
import {
  QUICK_GRAPHQL_ID,
  QUICK_REST_API_ID,
} from "constants/datasourceConstants";
import { PageType } from "constants/pageConstants";
import { trans } from "i18n";
import { includes, mapValues } from "lodash";
import { deferAction, executeQueryAction, wrapActionExtraInfo } from "lowcoder-core";
import {
  CustomModal,
  Dropdown,
  QueryConfigItemWrapper,
  QueryConfigLabel,
  QueryConfigWrapper,
  QueryPropertyViewWrapper,
  QuerySectionWrapper,
  TriggerTypeStyled,
} from "lowcoder-design";
import { BottomTabs } from "pages/editor/bottom/BottomTabs";
import { useContext, useMemo } from "react";
import { useSelector } from "react-redux";
import { getDataSource, getDataSourceTypes } from "redux/selectors/datasourceSelectors";
import { BottomResTypeEnum } from "types/bottomRes";
import { EditorContext } from "../../editorState";
import { JSTriggerTypeOptions, QueryComp, TriggerType, TriggerTypeOptions } from "../queryComp";
import { ResourceDropdown } from "../resourceDropdown";
import { NOT_SUPPORT_GUI_SQL_QUERY, SQLQuery } from "../sqlQuery/SQLQuery";
import { StreamQuery } from "../httpQuery/streamQuery";
import SupaDemoDisplay from "../../utils/supademoDisplay";
import _ from "lodash";
import React from "react";
import styled from "styled-components";
import { DataSourceButton } from "pages/datasource/pluginPanel";
import { Tooltip, Divider } from "antd";
import { uiCompRegistry } from "comps/uiCompRegistry";
import { InputTypeEnum } from "@lowcoder-ee/comps/comps/moduleContainerComp/ioComp/inputListItemComp";

const Wrapper = styled.div`
  width: 100%;
  padding: 16px;
  background-color: white;

  .section-title {
    font-size: 13px;
    line-height: 1.5;
    color: grey;
    margin-bottom: 12px;
  }

  .section {
    margin-bottom: 12px;

    &:last-child {
      margin-bottom: 0px;
    }
  }
`;

const ComponentListWrapper = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`;

export function QueryPropertyView(props: { comp: InstanceType<typeof QueryComp> }) {
  const { comp } = props;

  const editorState = useContext(EditorContext);
  const datasource = useSelector(getDataSource);

  const children = comp.children;
  const dispatch = comp.dispatch;
  const datasourceId = children.datasourceId.getView();
  const datasourceType = children.compType.getView();
  const datasourceConfig = datasource.find((d) => d.datasource.id === datasourceId)?.datasource
    .datasourceConfig;

  const datasourceStatus = useDatasourceStatus(datasourceId, datasourceType);
  const isStreamQuery  = children.compType.getView() === 'streamApi';

  return (
    <BottomTabs
      type={BottomResTypeEnum.Query}
      tabsConfig={
        [
          {
            key: "general",
            title: trans("query.generalTab"),
            children: <QueryGeneralPropertyView comp={comp} />,
          },
          {
            key: "notification",
            title: trans("query.notificationTab"),
            children: children.notification.propertyView(children.triggerType.getView()),
          },
          {
            key: "advanced",
            title: trans("query.advancedTab"),
            children: (
              <QueryPropertyViewWrapper>
                {datasourceConfig &&
                  (datasourceConfig as PreparedStatementConfig).enableTurnOffPreparedStatement && (
                    <QuerySectionWrapper>
                      <QueryConfigWrapper style={{ alignItems: "center" }}>
                        <QueryConfigLabel>SQL</QueryConfigLabel>
                        <QueryConfigItemWrapper>
                          {(children.comp.children as any).disablePreparedStatement.propertyView({
                            label: trans("query.disablePreparedStatement"),
                            type: "checkbox",
                            tooltip: trans("query.disablePreparedStatementTooltip"),
                          })}
                        </QueryConfigItemWrapper>
                      </QueryConfigWrapper>
                    </QuerySectionWrapper>
                  )}

                {children.triggerType.getView() === "manual" && (
                  <QuerySectionWrapper>
                    {children.confirmationModal.getPropertyView()}
                  </QuerySectionWrapper>
                )}

                <QuerySectionWrapper>
                  {children.timeout.propertyView({
                    label: trans("query.timeout"),
                    placeholder: "10s",
                    tooltip: trans("query.timeoutTooltip", { maxSeconds: 3600, defaultSeconds: 10 }),
                    placement: "bottom",
                  })}
                </QuerySectionWrapper>

                <QuerySectionWrapper>
                  {children.triggerType.getView() === "automatic" && (
                    <>
                      {children.periodic.propertyView({
                        label: trans("query.periodic"),
                        type: "checkbox",
                        placement: "bottom",
                      })}
                      {children.periodic.getView() &&
                        children.periodicTime.propertyView({
                          placement: "bottom",
                          label: trans("query.periodicTime"),
                          placeholder: "5s",
                          tooltip: trans("query.periodicTimeTooltip"),
                        })}
                    </>
                  )}
                </QuerySectionWrapper>

                <QuerySectionWrapper>
                  <>
                    {children.cancelPrevious.propertyView({
                      label: trans("query.cancelPrevious"),
                      type: "checkbox",
                      placement: "bottom",
                      tooltip: trans("query.cancelPreviousTooltip"),
                    })}
                  </>
                </QuerySectionWrapper>

                <QuerySectionWrapper>
                  <QueryUsagePropertyView comp={comp} />
                </QuerySectionWrapper>


              </QueryPropertyViewWrapper>
            ),
          },
        ] as const
      }
      tabTitle={children.name.getView()}
      onRunBtnClick={() =>
        dispatch(
          executeQueryAction({
            afterExecFunc: () => editorState.setShowResultCompName(children.name.getView()),
          })
        )
      }
      btnLoading={children.isFetching.getView()}
      status={datasourceStatus}
      message={datasourceStatus === "error" ? trans("query.dataSourceStatusError") : undefined}
      isStreamQuery={isStreamQuery}
      isSocketConnected={
        isStreamQuery
          ? (children.comp as StreamQuery).children.isSocketConnected.getView()
          : false
      }
      disconnectSocket={() => {
        const streamQueryComp = comp.children.comp as StreamQuery;
        streamQueryComp?.destroy();
      }}
    />
  );
}

export const QueryGeneralPropertyView = (props: {
  comp: InstanceType<typeof QueryComp>;
  placement?: PageType;
}) => {
  const { comp, placement = "editor" } = props;
  const editorState = useContext(EditorContext);
  const datasource = useSelector(getDataSource);

  const children = comp.children;
  const dispatch = comp.dispatch;
  let datasourceId = children.datasourceId.getView();
  let datasourceType = children.compType.getView();
  const datasourceConfig = datasource.find((d) => d.datasource.id === datasourceId)?.datasource
    .datasourceConfig;

  const datasourceStatus = useDatasourceStatus(datasourceId, datasourceType);

  // transfer old quick REST API datasource to new
  const oldQuickRestId = useMemo(
    () =>
      datasource.find((d) => d.datasource.creationSource === 2 && d.datasource.type === "restApi")
        ?.datasource.id,
    [datasource]
  );
  if (datasourceId === oldQuickRestId) {
    datasourceId = QUICK_REST_API_ID;
    comp.children.datasourceId.dispatchChangeValueAction(QUICK_REST_API_ID);
  }

  const triggerOptions = useMemo(() => {
    if (datasourceType === "js" || datasourceType === "streamApi") {
      return JSTriggerTypeOptions;
    }
    return TriggerTypeOptions;
  }, [datasourceType]);

  const getQueryOptions = useMemo(() => {
    const options: { label: string; value: string }[] =
      editorState
        ?.queryCompInfoList()
        .map((info) => ({
          label: info.name,
          value: info.name,
        }))
        .filter((option) => {
          // Filter out the current query under query
          if (editorState.selectedBottomResType === BottomResTypeEnum.Query) {
            return option.value !== editorState.selectedBottomResName;
          }
          return true;
        }) || [];

    // input queries
    editorState
      ?.getModuleLayoutComp()
      ?.getInputs()
      .forEach((i) => {
        const { name, type } = i.getView();
        if (type === InputTypeEnum.Query) {
          options.push({ label: name, value: name });
        }
      });
    return options;
  }, [editorState]);

  return (
    <QueryPropertyViewWrapper>
      <QuerySectionWrapper>
        <QueryConfigWrapper style={{ alignItems: "center" }}>
          <QueryConfigLabel>{trans("query.chooseDataSource")}</QueryConfigLabel>
          <QueryConfigItemWrapper direction={"row"}>
            <ResourceDropdown
              selectedResource={{ id: datasourceId, type: datasourceType }}
              changeResource={(newDatasourceId: string, newDatasourceType: string) => {
                // brute-force modify json
                dispatch(
                  wrapActionExtraInfo(
                    comp.changeValueAction({
                      ...comp.toJsonValue(),
                      triggerType:
                        newDatasourceType === children.compType.getView()
                          ? children.triggerType.getView() // Switching data sources of the same type retains the original trigger type
                          : includes(manualTriggerResource, newDatasourceType)
                          ? "manual"
                          : "automatic",
                      lastQueryStartTime: children.lastQueryStartTime.getView(),
                      datasourceId: newDatasourceId,
                      compType: newDatasourceType,
                      comp:
                        newDatasourceType === children.compType.getView()
                          ? children.comp.toJsonValue() // The data source type remains unchanged, and the query information is retained
                          : {},
                    } as any),
                    {
                      compInfos: [
                        {
                          type: "modify",
                          compName: children.name.getView(),
                          compType: newDatasourceType,
                        },
                      ],
                    }
                  )
                );

                if (datasourceStatus === "error") {
                  const queries = editorState
                    .getQueriesComp()
                    .getView()
                    .filter(
                      (q) =>
                        q.children.datasourceId.getView() === datasourceId &&
                        q.children.id.getView() !== children.id.getView()
                    );
                  queries.length > 0 &&
                    CustomModal.confirm({
                      title: trans("query.updateExceptionDataSourceTitle"),
                      content: (
                        <>
                          {trans("query.updateExceptionDataSourceContent")}
                          {queries.map((q) => (
                            <div style={{ fontWeight: "600" }}>{q.children.name.getView()}</div>
                          ))}
                        </>
                      ),
                      bodyStyle: { marginTop: "20px" },
                      onConfirm: () => {
                        queries.forEach((q) => {
                          q.dispatch(
                            deferAction(
                              wrapActionExtraInfo(
                                q.changeValueAction({
                                  ...mapValues(q.children, (c) => c.toJsonValue()),
                                  datasourceId: newDatasourceId,
                                  compType: newDatasourceType,
                                } as any),
                                {
                                  compInfos: [
                                    {
                                      type: "modify",
                                      compName: q.children.name.getView(),
                                      compType: newDatasourceType,
                                    },
                                  ],
                                }
                              )
                            )
                          );
                        });
                      },
                      confirmBtnType: "primary",
                      okText: trans("query.update"),
                    });
                }
              }}
              status={datasourceStatus}
            />
            {children.comp instanceof SQLQuery &&
              !NOT_SUPPORT_GUI_SQL_QUERY.includes(children.compType.getView()) && (
                <div style={{ width: "104px", marginLeft: "8px", flexShrink: 0 }}>
                  {/* query comp should not aware of specific queryType  */}
                  {(children.comp.children as any).mode.propertyView({})}
                </div>
              )}
          </QueryConfigItemWrapper>
        </QueryConfigWrapper>

        {placement === "editor" && (
          <>
            <TriggerTypeStyled>
              <Dropdown
                placement={"bottom"}
                label={trans("query.triggerType")}
                options={triggerOptions}
                value={children.triggerType.getView()}
                onChange={(value) => children.triggerType.dispatchChangeValueAction(value as TriggerType)}
              />
            </TriggerTypeStyled>
            {children.triggerType.getView() === 'onQueryExecution' && (
              <TriggerTypeStyled>
                <Dropdown
                  showSearch={true}
                  placement={"bottom"}
                  value={children.depQueryName.getView()}
                  options={getQueryOptions}
                  label={trans("eventHandler.selectQuery")}
                  onChange={(value) => children.depQueryName.dispatchChangeValueAction(value)}
                />
              </TriggerTypeStyled>
            )}
            {children.triggerType.getView() === 'onTimeout' && (
              <TriggerTypeStyled>
                {children.delayTime.propertyView({
                  label: trans("query.delayTime"),
                  placeholder: "5s",
                  placement: "bottom",
                })}
              </TriggerTypeStyled>
            )}
          </>
        )}
      </QuerySectionWrapper>

      <QuerySectionWrapper>
        {isCompWithPropertyView(children.comp)
          ? children.comp.propertyView({
              datasourceId: datasourceId,
            })
          : children.comp.getPropertyView()}
      </QuerySectionWrapper>

      {placement === "queryLibrary" &&
        datasourceConfig &&
        (datasourceConfig as PreparedStatementConfig).enableTurnOffPreparedStatement && (
          <>
            {(children.comp.children as any).disablePreparedStatement.propertyView({
              label: trans("query.disablePreparedStatement"),
              type: "checkbox",
              tooltip: trans("query.disablePreparedStatementTooltip"),
            })}
          </>
        )}

      {placement === "editor" && (
        <QuerySectionWrapper>
          <QueryConfigWrapper>
            <QueryConfigLabel labelHeight="auto">
              {trans("eventHandler.eventHandlers")}
            </QueryConfigLabel>
            {children.onEvent.getPropertyView()}
          </QueryConfigWrapper>

          <br/>    
          
          {["postgres", "mysql", "mssql", "oracle", "mariadb"].includes(datasourceType) && (
            <SupaDemoDisplay
              url={trans("supademos.dataquery2table")}
              modalWidth="80%"
              modalTop="20px"
            />
          )}
          {datasourceType === "restApi" && (
            <SupaDemoDisplay
              url={trans("supademos.restApiQuery")}
              modalWidth="80%"
              modalTop="20px"
            />
          )}
          {/* {datasourceType === "js" && (
            <SupaDemoDisplay
              url={trans("supademos.jsQuery")}
              modalWidth="80%"
              modalTop="20px"
            />
          )}
          {datasourceType === "streamApi" && (
            <SupaDemoDisplay
            url={trans("supademos.streamApiQuery")}
              modalWidth="80%"
              modalTop="20px"
            />
          )}
          {datasourceType === "mongodb" && (
            <SupaDemoDisplay
              url={trans("supademos.mongodbQuery")}
              modalWidth="80%"
              modalTop="20px"
            />
          )}
          {datasourceType === "libraryQuery" && (
            <SupaDemoDisplay
              url={trans("supademos.libraryQuery")}
              modalWidth="80%"
              modalTop="20px"
            />
          )}
          {datasourceType === "googleSheets" && (
            <SupaDemoDisplay
              url={trans("supademos.googleSheets")}
              modalWidth="80%"
              modalTop="20px"
            />
          )}
          {datasourceType === "graphql" && (
            <SupaDemoDisplay
              url={trans("supademos.graphqlQuery")}
              modalWidth="80%"
              modalTop="20px"
            />
          )}
          {datasourceType === "snowflake" && (
            <SupaDemoDisplay
              url={trans("supademos.snowflakeQuery")}
              modalWidth="80%"
              modalTop="20px"
            />
          )} */}
        </QuerySectionWrapper>
      )}
    </QueryPropertyViewWrapper>
  );
};

function findQueryInNestedStructure(
  structure: any,
  queryName: string,
  visited = new Set()
) : boolean {
  if (typeof structure === "object" && structure !== null) {
    if (visited.has(structure)) {
      return false;
    }
    visited.add(structure);
  }

  if (typeof structure === "string") {
    // Regex to match query name in handlebar-like expressions
    const regex = new RegExp(
      `{{\\s*[!?]?(\\s*${queryName}\\b(\\.[^}\\s]*)?\\s*)(\\?[^}:]*:[^}]*)?\\s*}}`
    );
    return regex.test(structure);
  }

  if (typeof structure === "object" && structure !== null) {
    // Recursively check all properties of the object
    return Object.values(structure).some((value) =>
      findQueryInNestedStructure(value, queryName, visited)
    );
  }
  return false;
}

function collectComponentsUsingQuery(comps: any, queryName: string) {

  // Select all active components
  const components = Object.values(comps);

  // Filter components that reference the query by name
  const componentsUsingQuery = components.filter((component: any) => {
    return findQueryInNestedStructure(component.children, queryName);
  });

  return componentsUsingQuery;
}

// this function we use to gather informations of the places where a Data Query is used.
function collectQueryUsageDetails(component: any, queryName: string): any[] {
  const results: any[] = [];
  const visited = new WeakSet(); // Track visited objects to avoid circular references

  function traverse(node: any, path: string[] = []): boolean {

    if (!node || typeof node !== "object") { return false; }
    // Avoid circular references
    if ( visited.has(node)) { return false; }
    else { visited.add(node); }

    // Check all properties of the current node
    for (const [key, value] of Object.entries(node)) {
      const currentPath = [...path, key];
      if (typeof value === "string" && !key.includes("__") && key != "exposingValues" && key != "ref" && key != "version" && key != "prevContextVal") {
        // Check if the string contains the query
        const regex = new RegExp(`{{\\s*[!?]?(\\s*${queryName}\\b(\\.[^}\\s]*)?\\s*)(\\?[^}:]*:[^}]*)?\\s*}}`);
        const entriesToRemove = ["children", "comp", "unevaledValue", "value"];
        if (regex.test(value)) {
          console.log("tester",component.children);
          results.push({
            componentType: component.children.compType?.value || "Unknown Component",
            componentName: component.children.name?.value || "Unknown Component",
            path: currentPath.filter(entry => !entriesToRemove.includes(entry)).join(" > "),
            value,
          });
          return true; // Stop traversal of this branch
        }
      } else if (typeof value === "object" && !key.includes("__") && key != "exposingValues" && key != "ref" && key != "version" && key != "prevContextVal") {
        // Traverse deeper only through selected properties.
        traverse(value, currentPath);
      }
    }
    return false; // Continue traversal if no match is found
  }

  traverse(component);
  return results;
}

function buildQueryUsageDataset(components: any[], queryName: string): any[] {
  const dataset: any[] = [];
  const visitedComponents = new WeakSet(); // Prevent revisiting components
  for (const component of components) {
    if (visitedComponents.has(component.children.name)) {
      continue;
    }
    visitedComponents.add(component.children.name);
    const usageDetails = collectQueryUsageDetails(component, queryName);
    dataset.push(...usageDetails);
  }

  return dataset;
}


const ComponentButton = (props: {   
  componentType: string;
  componentName: string;
  path: string;
  value: string;
  onSelect: (componentType: string, componentName: string, path: string) => void;
}) => {
  const handleClick = () => {
    props.onSelect(props.componentType, props.componentName, props.path);
  };

  // Retrieve the component's icon from the registry
  const Icon = uiCompRegistry[props.componentType]?.icon;

  return (
    <Tooltip title={props.path} placement="top">
      <DataSourceButton onClick={handleClick}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: "0px", width: "100%"}}>
          <div style={{ flex: 1}}>
            {Icon && (
              <Icon style={{ margin: "6px 0px 0 -38px", width: "28px" }} />
            )}
          </div>
          <div style={{ flex: 2, textAlign: "left", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginLeft: "-30px" }}>
            <div
              style={{
                marginTop: "11px",
                marginLeft: "0px",
                fontSize: "12px",
                fontWeight: "bold",
                maxWidth: "100%",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
              title={props.componentName} // Tooltip to show full name on hover
            >
              {props.componentName?.length > 100
                ? `${props.componentName.slice(0, 100)}...`
                : props.componentName}
            </div>
            <div
              style={{
                fontSize: "11px",
                fontWeight: "400",
                maxWidth: "100%",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
              title={props.componentType} // Tooltip for type too
            >
              {props.componentType?.length > 100
                ? `${props.componentType.slice(0, 100)}...`
                : props.componentType}
            </div>
          </div>
        </div>
      </DataSourceButton>
    </Tooltip>
  );
};

export function ComponentUsagePanel(props: {
  components: { componentType: string, componentName: string; path: string; value: string }[];
  onSelect: (componentType: string, componentName: string, path: string) => void;
}) {
  const { components, onSelect } = props;

  return (
    <Wrapper>
      <div className="section-title">{trans("query.componentsUsingQuery")}</div>
      <div className="section">
        <ComponentListWrapper>
          {components.map((component, idx) => (
            <ComponentButton
              componentType={component.componentType}
              componentName={component.componentName}
              path={component.path}
              value={component.value}
              onSelect={onSelect}
            />
          ))}
        </ComponentListWrapper>
      </div>
    </Wrapper>
  );
}

// a usage display to show which components make use of this query
export const QueryUsagePropertyView = (props: {
  comp: InstanceType<typeof QueryComp>;
  placement?: PageType;
}) => {
  const { comp, placement = "editor" } = props;
  const editorState = useContext(EditorContext);
  const queryName = comp.children.name.getView();
  const componentsUsingQuery = collectComponentsUsingQuery(editorState.getAllUICompMap(), queryName);
  
  const usageObjects = buildQueryUsageDataset(componentsUsingQuery, queryName);

  const handleSelect = (componentType: string,componentName: string, path: string) => {
    editorState.setSelectedCompNames(new Set([componentName]));
    // console.log(`Selected Component: ${componentName}, Path: ${path}`);
  };

  if (usageObjects.length > 0) {
    return (
      <>
        <Divider />
        <QuerySectionWrapper>
          <QueryConfigWrapper>
            <QueryConfigLabel>{trans("query.componentsUsingQueryTitle")}</QueryConfigLabel>
            <ComponentUsagePanel components={usageObjects} onSelect={handleSelect} />
          </QueryConfigWrapper>
        </QuerySectionWrapper>
      </>
    );
  } else {
    return <div></div>;
  }
  
};


function useDatasourceStatus(datasourceId: string, datasourceType: ResourceType) {
  const datasource = useSelector(getDataSource);
  const datasourceTypes = useSelector(getDataSourceTypes);

  return useMemo(() => {
    if (
      datasourceType === "js" ||
      datasourceType === "streamApi" ||
      datasourceType === "libraryQuery" ||
      datasourceType === "alasql" ||
      datasourceId === QUICK_REST_API_ID ||
      datasourceId === QUICK_GRAPHQL_ID
    ) {
      return "";
    }
    if (
      datasource.find((info) => info.datasource.id === datasourceId) &&
      datasourceTypes.find((type) => type.id === datasourceType)
    ) {
      return "";
    }
    return "error";
  }, [datasource, datasourceTypes, datasourceId, datasourceType]);
}
