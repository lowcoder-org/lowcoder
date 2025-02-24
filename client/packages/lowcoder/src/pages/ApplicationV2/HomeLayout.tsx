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
import { Card } from "antd";
import React, { useEffect, useState } from "react";
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
import { isFetchingFolderElements } from "../../redux/selectors/folderSelector";
import { checkIsMobile } from "util/commonUtils";
import { default as Divider } from "antd/es/divider";
import { ApplicationCategoriesEnum } from "constants/applicationConstants";
import { Pagination } from 'antd';

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
`;

const HeaderWrapper = styled.div`
  height: 84px;
  width: 100%;
  display: flex;
  padding: 0 36px;
  align-items: center;
  flex-shrink: 0;
  @media screen and (max-width: 720px) {
    padding: 0 24px;
  }
`;

const OperationWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  height: auto;
  padding: 0 36px;
  margin: 8px 0 20px 0;
  @media screen and (max-width: 850px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }
`;

const ContentWrapper = styled.div`
  position: relative;
`;

const Breadcrumb = styled(AntdBreadcrumb)`
  font-size: 20px;

  li:not(:last-child) {
    color: #8b8fa3;
  }

  li:last-child {
    font-weight: 500;
    color: #222222;
  }

  li.ant-breadcrumb-separator {
    display: flex;
    flex-direction: column;
    justify-content: center;
  }

  @media screen and (max-width: 720px) {
    display:none
  }
`;

const FilterDropdown = styled(Select)`
  .ant-select-selector {
    padding: 0 11px 0 0 !important;
  }

  .ant-select-selector > .ant-select-selection-item {
    font-size: 16px !important;
    font-weight: 500;
  }

  .ant-select-selector .ant-select-selection-item svg {
    margin-top: 7px !important;
  }

  .ant-select-item-option-content {
    font-size: 13px;
    line-height: 13px;
  }

  &:is(.ant-select-open) {
    .ant-select-selection-item {
      color: #315efb;
    }
  }

  .ant-select-item-option-active:not(.ant-select-item-option-disabled) {
    background-color: #f2f7fc;
  }

  .ant-select-dropdown {
    padding: 8px;
    border-radius: 8px;
    width: fit-content !important;
  }

  .ant-select-item {
    height: 29px;
    min-height: 0;
    padding: 0 8px;
    border-radius: 4px;
  }

  .ant-select-item-option-selected:not(.ant-select-item-option-disabled) {
    font-weight: 400;
    color: #4965f2;
    background-color: white;
  }
`;

const FilterMenuItem = styled.div`
  display: flex;
  align-items: left;
  height: 29px;
  width: 100%;
`;

const BreadcrumbItem = styled.div`
  cursor: pointer;
`;

const SkeletonStyle = styled(Skeleton)`
  margin: 80px 36px;

  .ant-skeleton-content .ant-skeleton-paragraph > li {
    width: 504px;
    display: inline-block;

    &:nth-of-type(2n + 1) {
      margin-right: 120px;
    }
  }

  @media screen and (max-width: 500px) {
    .ant-skeleton-content .ant-skeleton-paragraph > li {
      max-width: calc(100vw - 72px);
      min-width: calc(100vw - 72px);
      margin-right: 0;
    }
  }
`;

const EmptyView = styled.div`
  font-size: 14px;
  color: #8b8fa3;
  display: flex;
  flex-direction: column;
  align-items: center;
  flex-grow: 1;
  padding-top: 120px;
  @media screen and (max-width: 500px) {
    > div,
    > button {
      display: none;
    }
  }
`;
const PaginationLayout = styled.div`
  display: flex;
  justify-content: center;
  margin-top: 20px;
  margin-bottom: 20px;  
`

const LayoutSwitcher = styled.div`
  position: absolute;
  left: 20px;
  top: 40px;
  cursor: pointer;
  width: 32px;
  height: 16px;
  border-radius: 4px;
  z-index: ${Layers.homeLayoutSwitcher};
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    background-color: #f5f5f6;
  }
`;

const HomeView = styled.div`
  font-size: 14px;
  color: #8b8fa3;
  flex-grow: 1;
  padding-top: 0px;
  padding-left: 40px;
  max-width: 95%;
`;

const StyleHomeCover = styled.div`
    background: rgb(2,0,36);
    background: -moz-linear-gradient(121deg, rgba(2,0,36,1) 0%, rgba(23,102,167,1) 42%, rgba(243,130,244,1) 100%);
    background: -webkit-linear-gradient(121deg, rgba(2,0,36,1) 0%, rgba(23,102,167,1) 42%, rgba(243,130,244,1) 100%);
    background: linear-gradient(121deg, rgba(2,0,36,1) 0%, rgba(23,102,167,1) 42%, rgba(243,130,244,1) 100%);
    filter: progid:DXImageTransform.Microsoft.gradient(startColorstr="#020024",endColorstr="#f382f4",GradientType=1);
    padding: 25px;
    height: 120px;
    border-radius:10px 10px 0 0;
`;

const SearchWrapper = styled.div`
  width: auto;

  display: flex;
  align-items: center;
  flex-shrink: 0;
  margin-left: auto;

  @media screen and (max-width: 980px) {
    width: 100%;
    > Button {
      display: none;
    }
  }
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
}

export function HomeLayout(props: HomeLayoutProps) {
  const { breadcrumb = [],
    elements = [],
    localMarketplaceApps = [],
    globalMarketplaceApps = [],
    mode ,
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
    isCreated

  } = props;


  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (current: number, size: number) => {
    setPageSize(size);
  };

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

  const user = useSelector(getUser);
  const isFetching = useSelector(isFetchingFolderElements);
  const isSelfHost = window.location.host !== 'app.lowcoder.cloud';
  const [typeFilter, setTypeFilter] = useState<HomeResKey>("All");
  const [categoryFilter, setCategoryFilter] = useState<ApplicationCategoriesEnum | "All">("All");
  const [visibility, setVisibility] = useState(mode === "view" || mode === "trash" || mode === "folder");
  const [layout, setLayout] = useState<HomeLayoutType>(
    checkIsMobile(window.innerWidth) ? "card" : getHomeLayout()
  );

  useEffect(() => saveHomeLayout(layout), [layout]);

  useEffect(() => {
    // remove collision status from localstorage, as the next selected app may have another collision status
    removeCollisionStatus();
  }, []);

  const currentPath = useLocation().pathname;

  if (!user.currentOrgId) {
    return null;
  }

  var displayElements = elements.sort((a, b) => {
    if (a.folder && !b.folder) {
      return -1;
    } else if (!a.folder && b.folder) {
      return 1;
    } else {
      return 0;
    }
  });

  if (mode === "marketplace" && isSelfHost) {
    const markedLocalApps = localMarketplaceApps.map(app => ({ ...app, isLocalMarketplace: true }));
    const markedGlobalApps = globalMarketplaceApps.map(app => ({ ...app, isLocalMarketplace: false }));
    // Merge local and global apps into the elements array
    displayElements = [...markedLocalApps, ...markedGlobalApps];
  }
  else if (mode === "marketplace" && !isSelfHost) {
    const markedLocalApps = localMarketplaceApps.map(app => ({ ...app, isLocalMarketplace: true }));
    displayElements = [...markedLocalApps];
  }
  const resList: HomeRes[] = displayElements
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
            icon: e.image,
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

  const getFilterMenuItem = (type: HomeResTypeEnum) => {
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
  };

  const breadcrumbItems = [
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
  ]

  return (
    <Wrapper>
      <HeaderWrapper>
        <Breadcrumb
          separator={<ArrowIcon />}
          items={breadcrumbItems}
          itemRender={(item) => (
            <BreadcrumbItem
              key={item.key}
              onClick={item.onClick}
            >
              {item.title}
            </BreadcrumbItem>
          )}
        >
        </Breadcrumb>
      </HeaderWrapper>

      {showNewUserGuide(user) && <HomepageTourV2 />}

        <HomeView>
          <StyleHomeCover>
            <h1 style={{color: "#ffffff", marginTop : "12px"}}>
              {mode === "marketplace" && trans("home.appMarketplace")}
              {mode === "folders" && trans("home.allFolders")}
              {mode === "folder" && trans("home.folder")}
              {mode === "module" && trans("home.modules")}
              {mode === "trash" && trans("home.trash")}
              {mode === "view" && trans("home.allApplications")}
            </h1>
          </StyleHomeCover>
          <Card style={{ marginBottom: "20px" }}>
            
            <OperationWrapper>
              {mode !== "folders" && mode !== "module" && (
                <FilterDropdown
                  variant="borderless"
                  value={typeFilter}
                  onChange={(value: any) => {
                    setTypeFilter(value as HomeResKey);
                    if(visibility)
                      setTypeFilterPagination(HomeResTypeEnum[value])
                  }
                  }
                  options={[
                    getFilterMenuItem(HomeResTypeEnum.All),
                    getFilterMenuItem(HomeResTypeEnum.Application),
                    getFilterMenuItem(HomeResTypeEnum.Module),
                    ...(mode !== "marketplace" ? [getFilterMenuItem(HomeResTypeEnum.Navigation), getFilterMenuItem(HomeResTypeEnum.MobileTabLayout)] : []),
                    ...(mode !== "trash" && mode !== "marketplace" && mode !== "folder" ? [getFilterMenuItem(HomeResTypeEnum.Folder)] : []),
                  ]}
                  getPopupContainer={(node: any) => node}
                  suffixIcon={<ArrowSolidIcon />} />
              )}
              {(mode === "view" || mode === "folder") &&
                <FilterDropdown
                    style={{ minWidth: "220px" }}
                    variant="borderless"
                    value={categoryFilter}
                    onChange={(value: any) => {
                      setCategoryFilter(value as ApplicationCategoriesEnum)
                      setCategoryFilterPagination(value as ApplicationCategoriesEnum);
                      }

                    }
                    options={categoryOptions}
                  // getPopupContainer={(node) => node}
                    suffixIcon={<ArrowSolidIcon />}
                />}
              {mode === "marketplace" && (
                <FilterDropdown
                  style={{ minWidth: "220px" }}
                  variant="borderless"
                  value={categoryFilter}
                  onChange={(value: any) => setCategoryFilter(value as ApplicationCategoriesEnum)}
                  options={categoryOptions}
                  // getPopupContainer={(node) => node}
                  suffixIcon={<ArrowSolidIcon />} />
              )}

              <LayoutSwitcher onClick={() => setLayout(layout === "list" ? "card" : "list")}>
                {layout === "list" ? <HomeCardIcon/> : <HomeListIcon/>}
              </LayoutSwitcher>

              <SearchWrapper>
                <Search
                  placeholder={trans("search")}
                  value={searchValue || ""}
                  onChange={(e) => setSearchValue(e.target.value)}
                  style={{ width: "192px", height: "32px", margin: "0" }}
                />
              

              {mode !== "trash" && mode !== "marketplace" && user.orgDev && (
                <CreateDropdown 
                  defaultVisible={showNewUserGuide(user)} 
                  mode={mode} 
                  setModify={setIsCreated} 
                  modify={isCreated!} />
              )}
              </SearchWrapper>

            </OperationWrapper>

            <Divider />

            <ContentWrapper>

              {isFetching && resList.length === 0 ? (
                <SkeletonStyle active paragraph={{ rows: 8, width: 648 }} title={false} />
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
                                      <HomeTableView resources={resList.filter(app => app.isLocalMarketplace)} />
                                      <Divider style={{ padding: "0 36px", margin: "0 36px", width: "calc(100% - 72px) !important" }} />
                                      <h2 style={{ padding: "0 36px" }}>{trans("home.globalMarketplaceTitle")}</h2>
                                      <HomeTableView resources={resList.filter(app => !app.isLocalMarketplace)} />
                                    </>
                                  ) : (
                                    <>
                                      <h2 style={{padding: "0 36px"}}>{trans("home.globalMarketplaceTitle")}</h2>
                                      <HomeTableView resources={resList.filter(app => app.isLocalMarketplace)} />
                                    </> 
                                  )}
                                </>
                              ) : (
                                  <>
                                  {isSelfHost ? (
                                    <>
                                      <h2 style={{padding: "0 36px"}}>{trans("home.localMarketplaceTitle")}</h2>
                                      <HomeCardView resources={resList.filter(app => app.isLocalMarketplace)} />
                                      <Divider style={{padding: "0 36px", margin: "12px 36px", width: "calc(100% - 72px) !important"}}/>
                                      <h2 style={{padding: "0 36px"}}>{trans("home.globalMarketplaceTitle")}</h2>
                                      <HomeCardView resources={resList.filter(app => !app.isLocalMarketplace)} />
                                    </>
                                  ) : (
                                    <>
                                      <h2 style={{padding: "0 36px"}}>{trans("home.globalMarketplaceTitle")}</h2>
                                      <HomeCardView resources={resList.filter(app => app.isLocalMarketplace)} />
                                    </>
                                  )}
                                </>
                              )}
                            </>
                          )}
                          {mode !== "marketplace" && (
                            <>
                              {layout === "list" ? (
                                <HomeTableView resources={resList} setModify={setModify} modify={modify!} mode={mode}/>
                              ) : (
                                <HomeCardView resources={resList} setModify={setModify} modify={modify!} mode={mode} />
                              )}
                            </>
                          )}

                        </>
                      )}
                    </>
                  ) : (
                    <EmptyView>
                      <HomeEmptyIcon style={{ width: "90px", height: "120px" }} />
                      <div style={{ marginBottom: "16px" }}>
                        {mode === "trash"
                          ? trans("home.trashEmpty")
                          : mode === "marketplace"
                          ? trans("home.noMarketplaceApps")
                          : user.orgDev
                          ? trans("home.projectEmptyCanAdd")
                          : trans("home.projectEmpty")}
                      </div>
                      {mode !== "trash" && mode !== "marketplace" && user.orgDev && <CreateDropdown mode={mode} setModify={setIsCreated} modify={isCreated!}/>}
                    </EmptyView>
                  )}
                </>
              )}
            </ContentWrapper>
            {visibility && resList.length ? <div>
              <PaginationLayout>
                <Pagination
                    current={currentPage}
                    pageSize={pageSize}
                    onChange={handlePageChange}
                    onShowSizeChange={handlePageSizeChange}
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
