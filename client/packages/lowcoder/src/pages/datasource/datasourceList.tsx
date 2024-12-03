import styled from "styled-components";
import { EditPopover, PointIcon, Search, TacoButton } from "lowcoder-design";
import React, {useEffect, useState} from "react";
import { useDispatch, useSelector } from "react-redux";
import { getDataSource, getDataSourceLoading, getDataSourceTypesMap } from "../../redux/selectors/datasourceSelectors";
import { deleteDatasource } from "../../redux/reduxActions/datasourceActions";
import { isEmpty } from "lodash";
import history from "../../util/history";
import { buildDatasourceCreateUrl, buildDatasourceEditUrl } from "../../constants/routesURL";
import { timestampToHumanReadable } from "../../util/dateTimeUtils";
import { DataSourceModalTitle } from "./datasourceModal";
import StepModal from "../../components/StepModal";
import { PluginPanel } from "./pluginPanel";
import { Table } from "../../components/Table";
import { trans } from "../../i18n";
import { DatasourcePermissionDialog } from "../../components/PermissionDialog/DatasourcePermissionDialog";
import DataSourceIcon from "components/DataSourceIcon";
import { Helmet } from "react-helmet";
import LoadingOutlined from "@ant-design/icons/LoadingOutlined";
import PaginationComp from "@lowcoder-ee/util/pagination/Pagination";
import {DatasourceInfo} from "@lowcoder-ee/api/datasourceApi";
import {fetchDatasourcePagination} from "@lowcoder-ee/util/pagination/axios";
import {getUser} from "@lowcoder-ee/redux/selectors/usersSelectors";

const DatasourceWrapper = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
`;

const HeaderWrapper = styled.div`
  display: flex;
  align-items: center;
  height: 92px;
  padding: 28px 36px;
  width: 100%;
`;

const Title = styled.div`
  font-weight: 500;
  font-size: 18px;
  color: #222222;
  line-height: 18px;
  flex-grow: 1;
`;

const AddBtn = styled(TacoButton)`
  min-width: 96px;
  width: fit-content;
  height: 32px;
`;

const EditBtn = styled(TacoButton)`
  opacity: 0;
  width: 52px;
  height: 24px;
`;

const BodyWrapper = styled.div`
  width: 100%;
  flex-grow: 1;
  padding: 0 24px;
`;

const DatasourceName = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
`;

const OperationWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const PopoverIcon = styled(PointIcon)`
  cursor: pointer;
  flex-shrink: 0;

  g {
    fill: #8b8fa3;
  }

  &:hover {
    background: #eef0f3;
    border-radius: 4px;
    cursor: pointer;

    g {
      fill: #3377ff;
    }
  }
`;

const SubColumnCell = styled.div`
  color: #8b8fa3;
`;

const StyledTable = styled(Table)`
  .datasource-can-not-edit {
    cursor: default;
  }
`;

export const DatasourceList = () => {
  const dispatch = useDispatch();
  const [searchValue, setSearchValue] = useState("");
  const [searchValues, setSearchValues] = useState("");
  const [isCreateFormShow, showCreateForm] = useState(false);
  const [shareDatasourceId, setShareDatasourceId] = useState<string | undefined>(undefined);
  const [modify, setModify] = useState(false);
  const currentUser = useSelector(getUser);
  const orgId = currentUser.currentOrgId;
  const datasourceLoading = useSelector(getDataSourceLoading);
  const plugins = useSelector(getDataSourceTypesMap);
  interface ElementsState {
    elements: DatasourceInfo[];
    total: number;
  }

  const [elements, setElements] = useState<ElementsState>({ elements: [], total: 0 });
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(()=> {
    const timer = setTimeout(() => {
      if (searchValue.length > 2 || searchValue === "")
        setSearchValues(searchValue)
    }, 500);
    return () => clearTimeout(timer);
  }, [searchValue])

  useEffect( () => {
    fetchDatasourcePagination(
      {
        orgId: orgId,
        pageNum: currentPage,
        pageSize: pageSize,
        name: searchValues
      }
    ).then((result: any) => {
      if (result.success){
        setElements({elements: result.data || [], total: result.total || 1})
      }
      else
        console.error("ERROR: fetchFolderElements", result.error)
    })
  }, [currentPage, pageSize, searchValues, modify]
  )

  useEffect( () => {
        if (searchValues !== "")
          setCurrentPage(1);
      }, [searchValues]
  );

  return (
    <>
      <Helmet>{<title>{trans("home.datasource")}</title>}</Helmet>
      <DatasourceWrapper>
        <StepModal
          open={isCreateFormShow}
          onCancel={() => showCreateForm(false)}
          activeStepKey={"type"}
          destroyOnClose={true}
          width="888px"
          steps={[
            {
              key: "type",
              titleRender: () => <DataSourceModalTitle title={trans("home.selectDatasourceType")} />,
              bodyRender: () => (
                <PluginPanel
                  onSelect={(typeInfo) => {
                    history.push(buildDatasourceCreateUrl(typeInfo.id));
                    showCreateForm(false);
                  } } />
              ),
              footerRender: () => null,
            },
          ]} />

        <HeaderWrapper>
          <Title>{trans("home.datasource")}</Title>
          <Search
            placeholder={trans("search")}
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            style={{ width: "192px", height: "32px", margin: "0 12px 0 0" }} />
          <AddBtn buttonType={"primary"} onClick={() => showCreateForm(true)}>
            {trans("home.newDatasource")}
          </AddBtn>
        </HeaderWrapper>
        <BodyWrapper>
          <StyledTable
            loading={{
              spinning: datasourceLoading,
              indicator: <LoadingOutlined spin style={{ fontSize: 30 }} />
            }}
            rowClassName={(record: any) => (!record.edit ? "datasource-can-not-edit" : "")}
            tableLayout={"auto"}
            scroll={{ x: "100%" }}
            pagination={false}
            onRow={(record: any) => ({
              onClick: () => record.edit && history.push(buildDatasourceEditUrl(record.id)),
            })}
            columns={[
              {
                title: trans("home.datasourceName"),
                dataIndex: "name",
                ellipsis: true,
                sorter: (a: any, b: any) => {
                  if (a.name === b.name) {
                    return 0;
                  }
                  return a.name > b.name ? 1 : -1;
                },
              },
              {
                title: trans("home.type"),
                dataIndex: "type",
                ellipsis: true,
                width: "192px",
                sorter: (a: any, b: any) => {
                  if (a.type === b.type) {
                    return 0;
                  }
                  return a.type > b.type ? 1 : -1;
                },
                render: (text) => <SubColumnCell>{text}</SubColumnCell>,
              },
              {
                title: trans("home.databaseName"),
                dataIndex: "database",
                ellipsis: true,
                sorter: (a: any, b: any) => {
                  if (a.database === b.database) {
                    return 0;
                  }
                  return a.database > b.database ? 1 : -1;
                },
                render: (text) => (
                  <SubColumnCell>
                    {isEmpty(text) ? <span style={{ color: "#8B8FA3" }}>--</span> : text}
                  </SubColumnCell>
                ),
              },
              {
                title: trans("home.creator"),
                dataIndex: "creator",
                ellipsis: true,
                width: "192px",
                sorter: (a: any, b: any) => {
                  if (a.creator === b.creator) {
                    return 0;
                  }
                  return a.type > b.type ? 1 : -1;
                },
                render: (text) => <SubColumnCell>{text}</SubColumnCell>,
              },
              {
                title: trans("home.createTime"),
                dataIndex: "createTime",
                ellipsis: true,
                width: "192px",
                sorter: (a: any, b: any) => {
                  if (a.createTime === b.createTime) {
                    return 0;
                  }
                  return a.createTime > b.createTime ? 1 : -1;
                },
                render: (text) => (
                  <SubColumnCell>
                    {timestampToHumanReadable(text, 30 * 24 * 60 * 60 * 1000)}
                  </SubColumnCell>
                ),
              },
              {
                title: " ",
                dataIndex: "operation",
                width: "152px",
                render: (_, record: any) => (
                  <>
                    {record.edit && (
                      <OperationWrapper>
                        {<EditBtn
                          className={"home-datasource-edit-button"}
                          buttonType={"primary"}
                          onClick={() => history.push(buildDatasourceEditUrl(record.id))}
                        >
                          {trans("edit")}
                        </EditBtn>}
                        <EditPopover
                          items={[
                            {
                              text: trans("accessControl"),
                              onClick: () => setShareDatasourceId(record.id),
                            },
                            {
                              text: trans("delete"),
                              onClick: () => {
                                dispatch(deleteDatasource({ datasourceId: record.id }));
                                setTimeout(() => {
                                  setModify(!modify);
                                }, 500);

                              },
                              type: "delete",
                            },
                          ]}
                        >
                          <PopoverIcon tabIndex={-1} />
                        </EditPopover>
                      </OperationWrapper>
                    )}
                  </>
                ),
              },
            ]}
            dataSource={elements.elements
              .map((info, i) => ({
                key: i,
                id: info.datasource.id,
                name: (
                  <DatasourceName>
                    <DataSourceIcon dataSourceType={info.datasource.type} />
                    {info.datasource.name}
                  </DatasourceName>
                ),
                type: plugins[info.datasource.type]?.name,
                database: (info.datasource.datasourceConfig as any)?.database ??
                  (info.datasource.datasourceConfig as any)?.serviceName,
                createTime: info.datasource.createTime,
                creator: info.creatorName,
                edit: info.edit,
              }))} />
          { !!elements.elements.length ? <PaginationComp
            currentPage={currentPage}
            pageSize={pageSize}
            setPageSize={setPageSize}
            setCurrentPage={setCurrentPage}
            total={elements.total}
          /> : <></>}
        </BodyWrapper>
        {shareDatasourceId && (
          <DatasourcePermissionDialog
            datasourceId={shareDatasourceId}
            visible={!!shareDatasourceId}
            onVisibleChange={(visible) => {
              !visible && setShareDatasourceId(undefined);
            } } />
        )}
      </DatasourceWrapper>

    </>
  );
};
