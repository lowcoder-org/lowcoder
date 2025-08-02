import React, { useEffect, useMemo, useState } from "react";
import {
  fetchDatasource,
  fetchDataSourceTypes,
} from "../../redux/reduxActions/datasourceActions";
import { useDispatch, useSelector } from "react-redux";
import { getUser } from "../../redux/selectors/usersSelectors";
import {
  createQueryLibrary,
  createQueryLibraryRecord,
  fetchQueryLibrary,
  fetchQueryLibraryRecord,
  updateQueryLibrary,
} from "../../redux/reduxActions/queryLibraryActions";
import {
  getQueryLibrary,
  getQueryLibraryRecords,
} from "../../redux/selectors/queryLibrarySelectors";
import styled from "styled-components";
import { LeftNav } from "./LeftNav";
import { ResCreatePanel } from "../../components/ResCreatePanel";
import { EmptyQueryWithoutTab } from "../editor/bottom/BottomContent";
import { BottomResTypeEnum } from "../../types/bottomRes";
import { useCompInstance } from "../../comps/utils/useCompInstance";
import { QueryLibraryComp } from "../../comps/comps/queryLibrary/queryLibraryComp";
import { useSearchParam, useThrottle } from "react-use";
import { Comp } from "lowcoder-core";
import { LibraryQuery } from "../../api/queryLibraryApi";
import { NameGenerator } from "../../comps/utils";
import { QueryLibraryHistoryView } from "./QueryLibraryHistoryView";
import { default as Form } from "antd/es/form";
import {
  CustomModal,
  DatasourceForm,
  FormInputItem,
  FormRadioItem,
  FormSection,
  TacoButton,
} from "lowcoder-design";
import { CheckboxOptionType } from "antd/es/checkbox/Group";
import { trans } from "i18n";
import { getDataSource } from "../../redux/selectors/datasourceSelectors";
import {
  apiPluginsForQueryLibrary,
  databasePlugins,
  Datasource,
} from "@lowcoder-ee/constants/datasourceConstants";
import { importQueryLibrary } from "./importQueryLibrary";
import { registryDataSourcePlugin } from "constants/queryConstants";
import { messageInstance } from "lowcoder-design/src/components/GlobalInstances";
import { Helmet } from "react-helmet";
import { fetchQLPaginationByOrg } from "@lowcoder-ee/util/pagination/axios";
import { isEmpty } from "lodash";
import { getVersionOptions } from "@lowcoder-ee/util/versionOptions";
import { VersionDataForm } from "../common/versionDataForm";
import { processCurlData } from "../../util/curlUtils";

const Wrapper = styled.div`
  display: flex;
  height: 100%;
`;

const RightContent = styled.div`
  min-width: 0;
  display: flex;
  flex-grow: 1;
  position: relative;
`;

interface ElementsState {
  elements: LibraryQuery[];
  total: number;
}

function transformData(input: LibraryQuery[]) {
  const output: any = {};
  input.forEach((item) => {
    output[item.id] = item;
  });
  return output;
}

export const QueryLibraryEditor = () => {
  const dispatch = useDispatch();
  const queryLibraryRecords = useSelector(getQueryLibraryRecords);
  const originDatasourceInfo = useSelector(getDataSource);
  const currentUser = useSelector(getUser);
  const orgId = currentUser.currentOrgId;

  const forwardQueryId = useSearchParam("forwardQueryId");

  const [isCreatePanelShow, showCreatePanel] = useState(false);
  const [selectedQuery, setSelectedQuery] = useState<string>(
    forwardQueryId ?? ""
  );
  const [publishModalVisible, setPublishModalVisible] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [isDataSourceReady, setIsDataSourceReady] = useState(false);
  const [elements, setElements] = useState<ElementsState>({
    elements: [],
    total: 0,
  });
  const [queryLibrary, setQueryLibrary] = useState<any>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchValues, setSearchValues] = useState("");
  const [modify, setModify] = useState(false);

  const selectedRecords = queryLibraryRecords[selectedQuery] ?? {};
  const libraryQuery = queryLibrary[selectedQuery];
  const dsl = libraryQuery?.libraryQueryDSL;

  const params = useMemo(
    () => ({
      Comp: QueryLibraryComp,
      initialValue: isDataSourceReady
        ? {
            ...dsl,
            query: {
              ...dsl?.query,
              id: libraryQuery?.id,
              name: libraryQuery?.name,
            },
          }
        : null,
    }),
    [isDataSourceReady, libraryQuery?.id, libraryQuery?.name]
  );
  const [comp, container] = useCompInstance(params);
  useSaveQueryLibrary(libraryQuery, comp);

  useEffect(() => {
    try {
      fetchQLPaginationByOrg({
        name: searchValues,
        pageNum: currentPage,
        pageSize: pageSize,
      }).then((result) => {
        if (result.success) {
          setElements({
            elements: result.data || [],
            total: result.total || 1,
          });
          setQueryLibrary(transformData(result.data || []));
        }
      });
    } catch (error) {
      console.error(error);
    }
  }, [currentPage, pageSize, searchValues, modify]);

  useEffect(() => {
    if (searchValues !== "") setCurrentPage(1);
  }, [searchValues]);

  useEffect(() => {
    if (orgId) {
      dispatch(fetchDataSourceTypes({ organizationId: orgId }));
      dispatch(
        fetchDatasource({
          organizationId: orgId,
          onSuccess: (dataSources) => {
            dataSources.forEach((di) => {
              const dataSource = di.datasource;
              if (dataSource.pluginDefinition) {
                registryDataSourcePlugin(
                  dataSource.type,
                  dataSource.id,
                  dataSource.pluginDefinition
                );
              }
            });
            setIsDataSourceReady(true);
          },
        })
      );
    }
  }, [dispatch, orgId]);

  useEffect(() => {
    if (!forwardQueryId && !queryLibrary[selectedQuery]) {
      // @ts-ignore
      setSelectedQuery(Object.values(queryLibrary)?.[0]?.id);
    }
  }, [dispatch, Object.keys(queryLibrary).length]);

  useEffect(() => {
    Object.values(selectedRecords).length === 0 &&
      selectedQuery &&
      dispatch(fetchQueryLibraryRecord({ libraryQueryId: selectedQuery }));
  }, [selectedQuery]);

  const datasource = originDatasourceInfo
    .filter((t) => {
      return (
        !!t.datasource.pluginDefinition ||
        apiPluginsForQueryLibrary.includes(t.datasource.type) ||
        databasePlugins.includes(t.datasource.type)
      );
    })
    .map((info) => info.datasource);

  const recentlyUsed = Object.values(queryLibrary)
    .map((i: any) => i.libraryQueryDSL?.query.datasourceId)
    .map((id) => datasource.find((d) => d.id === id))
    .filter((i) => !!i) as Datasource[];

  const nameGenerator = new NameGenerator();
  nameGenerator.init(Object.values(queryLibrary).map((t: any) => t.name));
  const newName = nameGenerator.genItemName(trans("queryLibrary.unnamed"));

  const handleAdd = (type: BottomResTypeEnum, extraInfo?: any) => {
    // Build basic query DSL
    let queryDSL: any = {
      triggerType: "manual",
      datasourceId: extraInfo?.dataSourceId,
      compType: extraInfo?.compType,
    };

    // If it is a REST API created from cURL, pre-populate the HTTP query fields
    if (extraInfo?.compType === "restApi" && extraInfo?.curlData) {
      const curlConfig = processCurlData(extraInfo.curlData);
      if (curlConfig) {
        queryDSL = {
          ...queryDSL,
          comp: {
            httpMethod: curlConfig.method,
            path: curlConfig.url,
            headers: curlConfig.headers,
            params: curlConfig.params,
            bodyType: curlConfig.bodyType,
            body: curlConfig.body,
            bodyFormData: curlConfig.bodyFormData,
          },
        };
      }
    }

    dispatch(
      createQueryLibrary(
        {
          name: newName,
          organizationId: orgId,
          libraryQueryDSL: {
            query: queryDSL,
          },
        },
        (resp) => {
          setSelectedQuery(resp.data.data.id);
          setTimeout(() => {
            setModify(!modify);
          }, 200);
          setCurrentPage(Math.ceil(elements.total / pageSize));
        },
        () => {}
      )
    );
    showCreatePanel(false);
  };

  return (
    <>
      <Helmet>{<title>{trans("home.queryLibrary")}</title>}</Helmet>
      <Wrapper>
        <LeftNav
          selectedQuery={isCreatePanelShow ? undefined : selectedQuery}
          queryList={Object.values(queryLibrary)}
          addQuery={() => showCreatePanel(true)}
          onSelect={(id) => {
            setSelectedQuery(id);
            showCreatePanel(false);
          }}
          setCurrentPage={setCurrentPage}
          setPageSize={setPageSize}
          currentPage={currentPage}
          pageSize={pageSize}
          total={elements.total}
          setSearchValues={setSearchValues}
          searchValues={searchValues}
          setModify={setModify}
          modify={modify}
        />
        <RightContent>
          {!selectedQuery || !comp?.children.query.children.id.getView() ? (
            EmptyQueryWithoutTab
          ) : showHistory ? (
            <QueryLibraryHistoryView
              libraryQueryId={selectedQuery}
              compContainer={container}
              onClose={() => setShowHistory(false)}
            />
          ) : (
            comp.propertyView({
              onPublish: () => setPublishModalVisible(true),
              onHistoryShow: () => setShowHistory(true),
              setModify: setModify,
              modify: modify,
            })
          )}

          {isCreatePanelShow && (
            <ResCreatePanel
              recentlyUsed={recentlyUsed}
              datasource={datasource.filter((d) => d.creationSource !== 2)}
              onSelect={handleAdd}
              onClose={() => showCreatePanel(false)}
              placement={"queryLibrary"}
              onImport={(options) =>
                importQueryLibrary({
                  dispatch: dispatch,
                  options: options,
                  orgId: orgId,
                  onSuccess: (resp) => {
                    setSelectedQuery(resp.data.data.id);
                    showCreatePanel(false);
                    setTimeout(() => {
                      setModify(!modify);
                    }, 200);
                    setCurrentPage(Math.ceil(elements.total / pageSize));
                  },
                })
              }
            />
          )}
        </RightContent>
        <PublishModal
          libraryQueryId={comp?.children.query.children.id.getView() || ""}
          visible={publishModalVisible}
          onClose={() => setPublishModalVisible(false)}
          latestVersion={Object.values(selectedRecords)?.[0]?.tag}
        />
      </Wrapper>
    </>
  );
};

const PublishModal = (props: {
  libraryQueryId: string;
  visible: boolean;
  onClose: () => void;
  latestVersion: string;
}) => {
  const [form] = Form.useForm();

  const [loading, setLoading] = useState<boolean>(false);

  const dispatch = useDispatch();

  const versionOptions = getVersionOptions(props.latestVersion);

  return (
    <CustomModal
      open={props.visible}
      onCancel={props.onClose}
      destroyOnHidden={true}
      width="600px"
      title={trans("queryLibrary.publishNewVersion")}
      footer={
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            padding: "16px 16px 0",
          }}
        >
          <TacoButton
            buttonType="primary"
            loading={loading}
            onClick={() => {
              form.validateFields().then(() => {
                setLoading(true);
                dispatch(
                  createQueryLibraryRecord({
                    libraryQueryId: props.libraryQueryId,
                    request: form.getFieldsValue(),
                    onSuccessCallback: () => {
                      props.onClose();
                      setLoading(false);
                      messageInstance.success(
                        trans("queryLibrary.publishSuccess")
                      );
                    },
                    onErrorCallback: () => setLoading(false),
                  })
                );
              });
            }}
          >
            {trans("queryLibrary.publish")}
          </TacoButton>
        </div>
      }
    >
      <VersionDataForm form={form} preserve={false} latestVersion={props?.latestVersion} />
    </CustomModal>
  );
};

function useSaveQueryLibrary(
  query: LibraryQuery,
  instance: InstanceType<typeof QueryLibraryComp> | null
) {
  // throttle comp change
  const comp = useThrottle(instance, 1000);
  const dispatch = useDispatch();
  const [prevComp, setPrevComp] = useState<Comp>();
  const [prevJsonStr, setPrevJsonStr] = useState<string>();
  const [prevQueryId, setPrevQueryId] = useState<string>();
  const queryId = query?.id;

  useEffect(() => {
    if (!comp || comp === prevComp) {
      return;
    }

    const curJson = comp.toJsonValue();
    const curJsonStr = JSON.stringify(curJson);

    if (isEmpty(curJson?.query?.comp)) {
      return;
    }
    if (!Boolean(prevQueryId) && Boolean(queryId)) {
      setPrevComp(comp);
      setPrevJsonStr(curJsonStr);
      return setPrevQueryId(queryId);
    }
    if (prevQueryId !== queryId) {
      setPrevComp(comp);
      setPrevJsonStr(curJsonStr);
      return setPrevQueryId(queryId);
    }
    if (!Boolean(prevJsonStr) && Boolean(curJsonStr)) {
      setPrevComp(comp);
      return setPrevJsonStr(curJsonStr);
    }
    if (prevJsonStr === curJsonStr) {
      return;
    }

    // the first time is a normal change, the latter is the manual update
    if (prevComp) {
      query.name = comp.children.query.children.name.getView();
      query.libraryQueryDSL = curJson;
      dispatch(updateQueryLibrary(query));
    }
    setPrevComp(comp);
    setPrevJsonStr(curJsonStr);
    setPrevQueryId(queryId);
  }, [comp, queryId, dispatch]);
}
