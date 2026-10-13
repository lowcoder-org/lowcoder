import { getBrandingSetting } from "redux/selectors/enterpriseSelectors";
import { FolderNavigator } from "./FolderNavigator";
import { User } from "constants/userConstants";
import { useSelector } from "react-redux";
import styled from "styled-components";
import { ApplicationMeta, FolderMeta } from "constants/applicationConstants";
import { ALL_APPLICATIONS_URL } from "constants/routesURL";
import history from "util/history";
import dayjs from "dayjs";
import { default as AntdBreadcrumb } from "antd/es/breadcrumb";
import { default as Select } from "antd/es/select";
import { default as Skeleton } from "antd/es/skeleton";
import { default as Empty } from "antd/es/empty";
import { Card, Button, Segmented } from "antd";
import { AdminPage, AdminCover } from "components/layout/adminTheme";
import { AdminListError } from "components/layout/AdminListFeedback";
import React, { useEffect, useState, useMemo, useCallback } from "react";
import {
  ArrowIcon,
  ArrowSolidIcon,
  HomeCardIcon,
  HomeEmptyIcon,
  HomeListIcon,
  Search,
} from "lowcoder-design";
import { canEditApp, canManageApp } from "../../util/permissionUtils";
import { HomeResKey, HomeResTypeEnum, NavigationTypes } from "../../types/homeRes";
import { HomeResInfo } from "../../util/homeResUtils";
import { getUser } from "../../redux/selectors/usersSelectors";
import { useLocation } from "react-router-dom";
import { TrashTableView } from "./TrashTableView";
import { HomepageTourV2 } from "../tutorials/HomeTutorialsV2";
import { HomeCardView } from "./HomeCardView";
import { getHomeLayout, HomeLayoutType, removeCollisionStatus, saveHomeLayout } from "../../util/localStorageUtil";
import { HomeTableView } from "./HomeTableView";
import { Layers } from "../../constants/Layers";
import { CreateDropdown } from "./CreateDropdown";
import { trans } from "../../i18n";
import { checkIsMobile } from "util/commonUtils";
import { default as Divider } from "antd/es/divider";
import { ApplicationCategoriesEnum } from "constants/applicationConstants";
import { Pagination } from 'antd';

const Wrapper = styled(AdminPage)`
  min-height: 100%;
`;

const HeaderWrapper = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 18px;
  min-width: 0;
`;

const OperationWrapper = styled.div`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  padding: 20px 24px;
  @media (max-width: 720px) { padding: 16px; }
`;

const ContentWrapper = styled.div`
  position: relative;
  min-height: 240px;
`;

const Breadcrumb = styled(AntdBreadcrumb)`
  font-size: 12px;
  color: var(--admin-muted);
  ol { flex-wrap: wrap; }
  li:last-child { color: var(--admin-ink); }
  .ant-breadcrumb-separator { display: flex; align-items: center; }
  a { color: var(--admin-muted); }
`;

const FilterDropdown = styled(Select)`
  min-width: 140px;
  max-width: 100%;
  .ant-select-selector { border-radius: 8px; font-size: 13px; }
`;

const FilterMenuItem = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
`;

const SkeletonStyle = styled(Skeleton)`
  padding: 32px;
`;

const EmptyView = styled.div`
  font-size: 14px;
  color: var(--admin-muted);
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 12px;
  padding: 56px 24px;
`;
const PaginationLayout = styled.div`
  display: flex;
  justify-content: flex-end;
  padding: 20px 24px;
  border-top: 1px solid var(--admin-line);
  @media (max-width: 720px) { justify-content: center; padding: 16px; }
`;

const HomeView = styled.div`
  min-width: 0;
  .admin-resource-surface { border: 1px solid var(--admin-line); border-radius: 16px; }
  .admin-resource-surface > .ant-card-body { padding: 0; }
`;

const StyleHomeCover = AdminCover;

const SearchWrapper = styled.div`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
  margin-left: auto;
  @media (max-width: 980px) { margin-left: 0; }
  @media (max-width: 520px) { width: 100%; > div:first-child { flex: 1; } }
`;

function showNewUserGuide(user: User) {
  return (
    user.orgDev &&
    !user.userStatus.newUserGuidance &&
    // registered in 7 days
    dayjs(user.createdTimeMs).add(7, "days").isAfter(dayjs())
  );
}

export interface HomeRes {
  key: string;
  id: string;
  name: string;
  title?: string;
  description?: string;
  category?: string;
  icon?: string;
  type: HomeResTypeEnum;
  creator: string;
  lastModifyTime: number;
  isEditable?: boolean;
  isManageable: boolean;
  isDeletable: boolean;
  isMarketplace?: boolean;
  isLocalMarketplace?: boolean;
}

export type HomeBreadcrumbType = { text: string; path: string };

export type HomeLayoutMode = "view" | "trash" | "module" | "folder" | "folders" | "marketplace";

export interface HomeLayoutProps {
  breadcrumb?: HomeBreadcrumbType[];
  title?: string;
  elements: Array<ApplicationMeta | FolderMeta>;
  localMarketplaceApps?: Array<ApplicationMeta>;
  globalMarketplaceApps?: Array<ApplicationMeta>;
  mode: HomeLayoutMode;
  setCurrentPage?: any;
  setPageSize?: any;
  currentPage?: number;
  pageSize?: number;
  total?: number;
  searchValue?: string;
  setSearchValue?: any;
  setTypeFilterPagination?: any;
  setCategoryFilterPagination?: any;
  setIsCreated?: any;
  isCreated?: boolean;
  setModify?: any;
  modify?: boolean;
  loading?: boolean;
  error?: boolean;
  onRetry?: () => void;
}

export function HomeLayout(props: HomeLayoutProps) {
  const brandName = useSelector(getBrandingSetting)?.config_set?.standardTitle || trans("productName");
  const { breadcrumb = [],
    title,
    elements = [],
    localMarketplaceApps = [],
    globalMarketplaceApps = [],
    mode,
    setCurrentPage,
    setPageSize,
    pageSize,
    currentPage,
    searchValue,
    setSearchValue,
    total,
    setTypeFilterPagination,
    setCategoryFilterPagination,
    setModify,
    modify,
    setIsCreated,
    isCreated,
    loading = false,
    error = false,
    onRetry = () => {}
  } = props;

  const user = useSelector(getUser);
  const isFetching = loading;
  const isSelfHost = window.location.host !== 'app.lowcoder.cloud';
  const [typeFilter, setTypeFilter] = useState<HomeResKey>("All");
  const [categoryFilter, setCategoryFilter] = useState<ApplicationCategoriesEnum | "All">("All");
  const visibility = mode === "view" || mode === "trash" || mode === "folder";
  const [layout, setLayout] = useState<HomeLayoutType>(
    checkIsMobile(window.innerWidth) ? "card" : getHomeLayout()
  );

  const handleTypeFilterChange = (value: any) => {
    setTypeFilter(value as HomeResKey);
    setTypeFilterPagination?.(HomeResTypeEnum[value]);
  };
  const handleCategoryFilterChange = (value: any) => {
    setCategoryFilter(value);
    setCategoryFilterPagination?.(value);
  };
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => setSearchValue?.(e.target.value);
  const hasFilters = Boolean(searchValue?.trim()) || typeFilter !== "All" || categoryFilter !== "All";
  const clearFilters = () => {
    setSearchValue?.("");
    handleTypeFilterChange("All");
    handleCategoryFilterChange("All");
  };

  useEffect(() => saveHomeLayout(layout), [layout]);

  useEffect(() => {
    // remove collision status from localstorage, as the next selected app may have another collision status
    removeCollisionStatus();
  }, []);

  const currentPath = useLocation().pathname;

  const displayElements = useMemo(() => {
    const sorted = [...elements].sort((a, b) => {
      if (a.folder && !b.folder) {
        return -1;
      } else if (!a.folder && b.folder) {
        return 1;
      } else {
        return 0;
      }
    });

    if (mode === "marketplace") {
      const markedLocalApps = localMarketplaceApps.map(app => ({ ...app, isLocalMarketplace: true }));
      if (isSelfHost) {
        const markedGlobalApps = globalMarketplaceApps.map(app => ({ ...app, isLocalMarketplace: false }));
        return [...markedLocalApps, ...markedGlobalApps];
      }
      return [...markedLocalApps];
    }
    return sorted;
  }, [elements, mode, localMarketplaceApps, globalMarketplaceApps, isSelfHost]);

  const resList = useMemo(() => {
    return displayElements
      .filter((e) => {
        if (!visibility) {
          if (searchValue) {
            const lowerCaseSearchValue = searchValue.toLocaleLowerCase();
            return e.name?.toLocaleLowerCase().includes(lowerCaseSearchValue) ||
                e.createBy?.toLocaleLowerCase().includes(lowerCaseSearchValue);
          }
          return true;
        }
        return true;
      })
      .filter((e) => {
        if(!visibility) {
          if (HomeResTypeEnum[typeFilter].valueOf() === HomeResTypeEnum.All) {
            return true;
          }
          if (e.folder) {
            return HomeResTypeEnum[typeFilter] === HomeResTypeEnum.Folder;
          } else {
            if (typeFilter === "Navigation") {
              return NavigationTypes.map((t) => t.valueOf()).includes(e.applicationType);
            }
            return HomeResTypeEnum[typeFilter].valueOf() === e.applicationType;
          }
        }
        return true;
      })
      .filter((e) => visibility || categoryFilter === "All" || (!e.folder && e.category === categoryFilter))
      .map((e) =>
        e.folder
          ? {
              key: e.folderId,
              id: e.folderId,
              name: e.name,
              type: HomeResTypeEnum.Folder,
              creator: e.createBy,
              lastModifyTime: e.createAt,
              isManageable: e.manageable,
              isDeletable: e.manageable && !e.subApplications?.length && !e.subFolders?.length,
            }
          : {
              key: e.applicationId,
              id: e.applicationId,
              name: e.name,
              title: e.title,
              description: e.description,
              category: e.category,
              icon: e.icon,
              type: HomeResTypeEnum[HomeResTypeEnum[e.applicationType] as HomeResKey],
              creator: e?.creatorEmail ?? e.createBy,
              lastModifyTime: e.lastModifyTime,
              isEditable: mode !== 'marketplace' && canEditApp(user, e),
              isManageable: mode !== 'marketplace' && canManageApp(user, e),
              isDeletable: mode !== 'marketplace' && canEditApp(user, e),
              isMarketplace: mode === 'marketplace',
              isLocalMarketplace: e.isLocalMarketplace,
            }
      );
  }, [displayElements, visibility, searchValue, typeFilter, categoryFilter, mode, user]);

  const getFilterMenuItem = useCallback((type: HomeResTypeEnum) => {
    const Icon = HomeResInfo[type].icon;
    return {
      label: (
        <FilterMenuItem>
          {Icon && <Icon style={{ width: "16px", height: "16px", marginRight: "4px" }} />}
          {HomeResInfo[type].name}
        </FilterMenuItem>
      ),
      value: HomeResTypeEnum[type],
    };
  }, []);

  const breadcrumbItems = useMemo(() => [
    {
      key: 0,
      title: trans("home.home"),
      onClick: () =>
        currentPath !== ALL_APPLICATIONS_URL && history.push(ALL_APPLICATIONS_URL),
    },
    ...breadcrumb.map((b, i) => ({
      key: i+1,
      title: b.text,
      onClick: () => currentPath !== b.path && history.push(b.path)
    }))
  ], [breadcrumb, currentPath]);

  const parentBreadcrumb = breadcrumb[breadcrumb.length - 2];
  const parentPath = parentBreadcrumb?.path || ALL_APPLICATIONS_URL;
  const parentLabel = parentBreadcrumb?.text || trans("home.home");
  const createRefreshSetter = mode === "folder" ? setModify : setIsCreated;
  const createRefreshValue = mode === "folder" ? modify : isCreated;

  const filterMenuItems = useMemo(() => [
    getFilterMenuItem(HomeResTypeEnum.All),
    getFilterMenuItem(HomeResTypeEnum.Application),
    getFilterMenuItem(HomeResTypeEnum.Module),
    ...(mode !== "marketplace" ? [getFilterMenuItem(HomeResTypeEnum.Navigation), getFilterMenuItem(HomeResTypeEnum.MobileTabLayout)] : []),
    ...(mode !== "trash" && mode !== "marketplace" ? [getFilterMenuItem(HomeResTypeEnum.Folder)] : []),
  ], [mode, getFilterMenuItem]);

  const localMarketplaceAppsList = useMemo(() => {
    return resList.filter(app => app.isLocalMarketplace)
  }, [resList]);

  const globalMarketplaceAppsList = useMemo(() => {
    return resList.filter(app => !app.isLocalMarketplace)
  }, [resList]);

  const categoryOptions = [
    { label: <FilterMenuItem>{trans("home.allCategories")}</FilterMenuItem>, value: 'All' },
    ...Object.entries(ApplicationCategoriesEnum).map(([key, value]) => ({
      label: (
        <FilterMenuItem>
          {value}
        </FilterMenuItem>
      ),
      value: key,
    })),
  ];

  // Move the conditional check after all hooks
  if (!user.currentOrgId) {
    return null;
  }

  return (
    <Wrapper data-testid="admin-resource-page">
      <HeaderWrapper>
        <Breadcrumb
          separator={<ArrowIcon />}
          items={breadcrumbItems}
          itemRender={(item) => {
            const isCurrent = item.key === breadcrumbItems[breadcrumbItems.length - 1]?.key;
            return (
              isCurrent ? <span aria-current="page">{item.title}</span> :
                <a href={item.key === 0 ? ALL_APPLICATIONS_URL : breadcrumb[Number(item.key) - 1]?.path}
                  onClick={(event) => { event.preventDefault(); item.onClick?.(event); }}>{item.title}</a>
            );
          }}
        >
        </Breadcrumb>
        {(mode === "view" || mode === "folder") && <FolderNavigator />}
      </HeaderWrapper>

      {showNewUserGuide(user) && <HomepageTourV2 />}

        <HomeView>
          <StyleHomeCover>
            <h1>
              {mode === "marketplace" && trans("home.appMarketplace")}
              {mode === "folders" && trans("home.allFolders")}
              {mode === "folder" && (title || trans("home.folder"))}
              {mode === "module" && trans("home.modules")}
              {mode === "trash" && trans("home.trash")}
              {mode === "view" && trans("home.allApplications")}
            </h1>
            <p>{trans(mode === "marketplace" ? "admin.marketplaceDescription" : mode === "trash" ? "admin.trashDescription" : mode === "folder" ? "admin.folderDescription" : "admin.appsDescription", { brandName })}</p>
          </StyleHomeCover>
          <Card className="admin-resource-surface">
            
            <OperationWrapper>
              {mode !== "folders" && mode !== "module" && (
                <FilterDropdown
                  aria-label={trans("home.type")}
                  variant="outlined"
                  value={typeFilter}
                  onChange={handleTypeFilterChange}
                  options={filterMenuItems}
                  getPopupContainer={(node: any) => node}
                  suffixIcon={<ArrowSolidIcon />} />
              )}
              {(mode === "view" || mode === "folder") &&
                <FilterDropdown
                    style={{ minWidth: "180px" }}
                    variant="outlined"
                    aria-label={trans("home.allCategories")}
                  value={categoryFilter}
                    onChange={handleCategoryFilterChange}
                    options={categoryOptions}
                    suffixIcon={<ArrowSolidIcon />}
                />}
              {mode === "marketplace" && (
                <FilterDropdown
                  style={{ minWidth: "180px" }}
                  variant="outlined"
                  aria-label={trans("home.allCategories")}
                  value={categoryFilter}
                  onChange={(value: any) => handleCategoryFilterChange(value as ApplicationCategoriesEnum)}
                  options={categoryOptions}
                  suffixIcon={<ArrowSolidIcon />} />
              )}

              {mode !== "trash" && <Segmented
                aria-label={trans("admin.viewMode")}
                value={layout}
                onChange={(value) => setLayout(value as HomeLayoutType)}
                options={[
                  { value: "list", label: <span title={trans("admin.listView")}><HomeListIcon aria-label={trans("admin.listView")} /></span> },
                  { value: "card", label: <span title={trans("admin.cardView")}><HomeCardIcon aria-label={trans("admin.cardView")} /></span> },
                ]}
              />}

              <SearchWrapper>
                <Search
                  aria-label={trans("search")}
                  placeholder={trans("search")}
                  value={searchValue || ""}
                  onChange={handleSearchChange}
                  style={{ width: "192px", height: "32px", margin: "0" }}
                />
              

              {mode !== "trash" && mode !== "marketplace" && user.orgDev && (
                <CreateDropdown 
                  defaultVisible={showNewUserGuide(user)} 
                  mode={mode} 
                  setModify={createRefreshSetter}
                  modify={createRefreshValue!} />
              )}
              </SearchWrapper>

            </OperationWrapper>

            {hasFilters && <div style={{ padding: "0 24px 16px" }}><Button size="small" onClick={clearFilters}>{trans("admin.clearFilters")}</Button></div>}
            <Divider style={{ margin: 0 }} />

            <ContentWrapper aria-busy={isFetching}>

              {error && <div style={{ padding: 24 }}><AdminListError retry={onRetry} /></div>}
              {isFetching ? (
                <SkeletonStyle active paragraph={{ rows: 6 }} title={false} />
              ) : (
                <>
                  {resList.length > 0 ? (
                    <>
                      {mode === "trash" ? (
                        <TrashTableView resources={resList} setModify={setModify} modify={modify!}/>
                      ) : (
                        <>
                          
                          {mode === "marketplace" && (
                            <>
                              {layout === "list" ? (
                                <>
                                  {isSelfHost ? (
                                    <>
                                      <h2 style={{ padding: "0 36px" }}>{trans("home.localMarketplaceTitle")}</h2>
                                      <HomeTableView resources={localMarketplaceAppsList} />
                                      <Divider style={{ padding: "0 36px", margin: "0 36px", width: "calc(100% - 72px) !important" }} />
                                      <h2 style={{ padding: "0 36px" }}>{trans("home.globalMarketplaceTitle")}</h2>
                                      <HomeTableView resources={globalMarketplaceAppsList} />
                                    </>
                                  ) : (
                                    <>
                                      <h2 style={{padding: "0 36px"}}>{trans("home.globalMarketplaceTitle")}</h2>
                                      <HomeTableView resources={localMarketplaceAppsList} />
                                    </> 
                                  )}
                                </>
                              ) : (
                                  <>
                                  {isSelfHost ? (
                                    <>
                                      <h2 style={{padding: "0 36px"}}>{trans("home.localMarketplaceTitle")}</h2>
                                      {Boolean(localMarketplaceAppsList?.length)
                                        ? <HomeCardView resources={localMarketplaceAppsList} />
                                        : <Empty description={trans("home.noMarketplaceApps")} image={<HomeEmptyIcon style={{ width: "90px", height: "120px" }} />}/>
                                      }
                                      <Divider style={{padding: "0 36px", margin: "24px 36px", width: "calc(100% - 72px) !important"}}/>
                                      <h2 style={{padding: "0 36px"}}>{trans("home.globalMarketplaceTitle")}</h2>
                                      <HomeCardView resources={globalMarketplaceAppsList} />
                                    </>
                                  ) : (
                                    <>
                                      <h2 style={{padding: "0 36px"}}>{trans("home.globalMarketplaceTitle")}</h2>
                                      {Boolean(localMarketplaceAppsList?.length)
                                        ? <HomeCardView resources={localMarketplaceAppsList} />
                                        : <Empty description={trans("home.noMarketplaceApps")} image={<HomeEmptyIcon style={{ width: "90px", height: "120px" }} />}/>
                                      }
                                    </>
                                  )}
                                </>
                              )}
                            </>
                          )}
                          {mode !== "marketplace" && (
                            <>
                              {layout === "list" ? (
                                <HomeTableView resources={resList} setModify={setModify} modify={modify!} mode={mode} parentPath={parentPath} parentLabel={parentLabel}/>
                              ) : (
                                <HomeCardView resources={resList} setModify={setModify} modify={modify!} mode={mode} parentPath={parentPath} parentLabel={parentLabel} />
                              )}
                            </>
                          )}

                        </>
                      )}
                    </>
                  ) : !error && (
                    <EmptyView>
                      <HomeEmptyIcon style={{ width: "90px", height: "120px" }} />
                      <div style={{ marginBottom: "16px" }}>
                        {hasFilters ? trans("admin.noResults") : mode === "trash"
                          ? trans("home.trashEmpty")
                          : mode === "marketplace"
                          ? trans("home.noMarketplaceApps")
                          : user.orgDev
                          ? trans("home.projectEmptyCanAdd")
                          : trans("home.projectEmpty")}
                      </div>
                      {!hasFilters && mode !== "trash" && mode !== "marketplace" && user.orgDev && <CreateDropdown mode={mode} setModify={createRefreshSetter} modify={createRefreshValue!}/>}
                    </EmptyView>
                  )}
                </>
              )}
            </ContentWrapper>
            {visibility && !error && (total ?? 0) > 0 ? <div>
              <PaginationLayout>
                <Pagination
                    current={currentPage}
                    pageSize={pageSize}
                    onChange={(page, size) => {
                      if (size !== pageSize) setPageSize?.(size);
                      else setCurrentPage?.(page);
                    }}
                    showTotal={(count, range) => trans("admin.resultCount", { start: range[0], end: range[1], total: count })}
                    responsive
                    total={total}
                    showSizeChanger
                />
              </PaginationLayout>
            </div> : null}
          </Card>  
          
        </HomeView>
      
    </Wrapper>
  );
}
