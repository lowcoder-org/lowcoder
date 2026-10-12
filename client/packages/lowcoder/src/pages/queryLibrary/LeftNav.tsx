import { Skeleton } from "antd";
import { AdminListError } from "components/layout/AdminListFeedback";
import { useEffect, useState } from "react";
import { useDebouncedValue } from "util/hooks";
import styled, { css } from "styled-components";
import {
  BluePlusIcon,
  CustomModal,
  EditPopover,
  EllipsisTextCss,
  PointIcon,
  ScrollBar,
  Search,
  TacoButton,
} from "lowcoder-design";
import { LibraryQuery } from "../../api/queryLibraryApi";
import { timestampToHumanReadable } from "../../util/dateTimeUtils";
import { useDispatch, useSelector } from "react-redux";
import { getDataSourceTypesMap } from "../../redux/selectors/datasourceSelectors";
import { deleteQueryLibrary } from "../../redux/reduxActions/queryLibraryActions";
import { EmptyContent } from "../../components/EmptyContent";
import { ReadOnlyMask } from "../common/styledComponent";
import { trans } from "i18n";
import { DatasourceType } from "@lowcoder-ee/constants/queryConstants";
import { saveAs } from "file-saver";
import DataSourceIcon from "components/DataSourceIcon";
import { AdminPagination } from "components/layout/AdminPagination";

const Wrapper = styled.div<{ $readOnly?: boolean }>`
  display: flex;
  flex-direction: column;
  width: 280px;
  flex: 0 0 280px;
  min-height: 0;
  height: 100%;
  border-right: 1px solid var(--admin-line);
  background: #fdfbfe;
  @media (max-width: 1000px) { width: 100%; flex: 0 0 300px; height: 300px; border-right: 0; border-bottom: 1px solid var(--admin-line); }
  ${(props) => {
    if (props.$readOnly) {
      return css`
        color: #8b8fa3;
      `;
    }
  }}
`;

const Header = styled.div`
  display: flex;
  gap: 8px;
  margin-top: 0;
  padding: 16px;
  height: 64px;
`;

const AddIcon = styled(BluePlusIcon)`
  height: 12px;
  width: 12px;
  margin-right: 2px;
`;
const CreateBtn = styled(TacoButton)<{ $readOnly?: boolean }>`
  min-height: 24px;
  width: 70px;
  padding: 4px 12px;
  display: flex;
  align-items: center;
  box-shadow: none;
  opacity: ${(props) => (props.$readOnly ? 0.5 : 1)};

  &:hover ${AddIcon} g {
    stroke: #315efb;
  }

  &:disabled,
  &:disabled:hover {
    ${AddIcon} g {
      stroke: #4965f230;
    }
  }
`;

const Body = styled.div`
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
`;

const Title = styled.div`
  font-weight: 500;
  font-size: 13px;
  color: #8b8fa3;
  line-height: 13px;
  padding: 0 16px;
  margin-bottom: 6px;
`;

const SelectListWrapper = styled.div`
  height: calc(100% - 19px);
`;
const SelectItem = styled.div<{ $selected: boolean; $readOnly?: boolean }>`
  height: 88px;
  margin: 4px 10px;
  border-radius: 10px;
  border: 1px solid transparent;
  &:focus-visible { outline: 2px solid #b480de; outline-offset: -2px; }
  padding: 0 16px;
  background-color: ${(props) =>
    props.$selected ? (props.$readOnly ? "#EFEFF1" : "#f0e5f7") : "unset"};
  cursor: pointer;

  &:hover {
    background-color: ${(props) => !props.$selected && "#f7f0fb"};
  }
`;

const Content = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  height: 100%;
  padding: 8px 0 12px;
  border-bottom: 1px solid #f5f5f6;
`;

const ContentTop = styled.div`
  display: flex;
  height: 20px;
  justify-content: space-between;
  align-items: center;
`;
const QueryType = styled.div`
  display: flex;
  align-items: center;
  color: #8b8fa3;
  font-size: 13px;
`;
const QueryName = styled.div`
  ${EllipsisTextCss};
  font-weight: 500;
  font-size: 13px;
`;
const QueryTime = styled.div`
  color: #b8b9bf;
  font-size: 13px;
  line-height: 13px;
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

export const LeftNav = (props: {
  queryList: LibraryQuery[];
  loading?: boolean;
  error?: boolean;
  onRetry?: () => void;
  selectedQuery?: string;
  addQuery: () => void;
  onSelect: (queryId: string) => void;
  readOnly?: boolean;
  setCurrentPage: (page: number) => void;
  setPageSize: (size: number) => void;
  currentPage: number;
  pageSize: number;
  total: number;
  setSearchValues: any;
  searchValues: string;
  setModify?: any;
  modify?: boolean;
}) => {
  const {currentPage, setCurrentPage, pageSize, setPageSize, total , setSearchValues, searchValues, modify, setModify} = props
  const dispatch = useDispatch();
  const [searchValue, setSearchValue] = useState("");
  const datasourceTypes = useSelector(getDataSourceTypesMap);

  const debouncedSearchValue = useDebouncedValue(searchValue, 500);

  useEffect(() => {
    if (debouncedSearchValue.trim().length > 0 || debouncedSearchValue === "") {
      setSearchValues(debouncedSearchValue.trim());
    }
  }, [debouncedSearchValue]);


  return (
    <ReadOnlyMask readOnly={!!props.readOnly}>
      <Wrapper $readOnly={props.readOnly}>
        <Header>
          <Search
            disabled={props.readOnly}
            placeholder={trans("queryLibrary.searchPlaceholder")}
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            style={{ width: "154px", height: "32px", margin: "0" }}
          />
          <CreateBtn buttonType={"blue"} onClick={props.addQuery} $readOnly={props.readOnly}>
            <AddIcon />
            {trans("newItem")}
          </CreateBtn>
        </Header>
        <Body aria-busy={props.loading}>
          <Title>{trans("queryLibrary.allQuery")}</Title>
          <SelectListWrapper>
            <ScrollBar>
              {props.loading ? <Skeleton active title={false} paragraph={{ rows: 4 }} style={{ padding: 16 }} /> : props.error ? <AdminListError retry={props.onRetry ?? (() => {})} /> : props.queryList.length > 0 ? (
                props.queryList
                  .filter((q) => {
                    let datasourceTypeName =
                      datasourceTypes[q.libraryQueryDSL?.query?.compType as DatasourceType]?.name ??
                      "";
                    return true;
                  })
                  .map((q) => (
                    <SelectItem
                      key={q.id}
                      role="button"
                      tabIndex={props.readOnly ? -1 : 0}
                      aria-pressed={q.id === props.selectedQuery}
                      onKeyDown={(event) => {
                        if (event.target === event.currentTarget && (event.key === "Enter" || event.key === " ")) { event.preventDefault(); props.onSelect(q.id); }
                      }}
                      $selected={q.id === props.selectedQuery}
                      $readOnly={props.readOnly}
                      onClick={() => props.onSelect(q.id)}
                    >
                      <Content>
                        <ContentTop>
                          <QueryType>
                            <DataSourceIcon
                              dataSourceType={q.libraryQueryDSL?.query?.compType}
                              size="large"
                              httpMethod={q.libraryQueryDSL?.query?.comp?.httpMethod}
                            />
                            {
                              datasourceTypes[q.libraryQueryDSL?.query?.compType as DatasourceType]
                                ?.name
                            }
                          </QueryType>
                          <EditPopover
                            items={[
                              {
                                text: trans("queryLibrary.export"),
                                onClick: () => {
                                  const blob = new Blob([JSON.stringify(q.libraryQueryDSL)], {
                                    type: "application/json;charset=utf-16",
                                  });
                                  return saveAs(blob, q.name, { autoBom: true });
                                },
                              },
                              {
                                text: trans("delete"),
                                onClick: () =>
                                  CustomModal.confirm({
                                    title: trans("queryLibrary.deleteQueryTitle"),
                                    content: trans("queryLibrary.deleteQueryContent"),
                                    onConfirm: () => {
                                      dispatch(deleteQueryLibrary({ queryLibraryId: q.id }))
                                      setTimeout(() => {
                                        setModify(!modify);
                                      }, 200);
                                    },
                                    confirmBtnType: "delete",
                                    okText: trans("delete"),
                                  }),
                                type: "delete",
                              },
                            ]}
                          >
                            <PopoverIcon tabIndex={-1} />
                          </EditPopover>
                        </ContentTop>
                        <QueryName>{q.name}</QueryName>
                        <QueryTime>
                          {timestampToHumanReadable(q.createTime, 30 * 24 * 60 * 60 * 1000)}
                        </QueryTime>
                      </Content>
                    </SelectItem>
                  ))
              ) : (
                <EmptyContent
                  style={{ margin: "10px 16px" }}
                  text={
                    <>
                      <div>{trans("query.noQueries")}</div>
                      <span
                        style={{ color: "#4965f2", cursor: "pointer", margin: "0 4px" }}
                        onClick={props.addQuery}
                      >
                        {trans("newItem")}
                      </span>
                    </>
                  }
                />
              )}
            </ScrollBar>
          </SelectListWrapper>
        </Body>
        <AdminPagination
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            pageSize={pageSize}
            setPageSize={setPageSize}
            total={total}
            simple={true}
        />
      </Wrapper>
    </ReadOnlyMask>
  );
};
