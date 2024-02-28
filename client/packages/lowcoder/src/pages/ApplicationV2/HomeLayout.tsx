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
import { useLocation } from "react-use";
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
import MarketplaceHeaderImage from "assets/images/marketplaceHeaderImage.jpg";
import { Divider } from "antd";
import { Margin } from "../setting/theme/styledComponents"; 

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
  @media screen and (max-width: 500px) {
    padding: 0 24px;
  }
`;

const OperationWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  height: 32px;
  padding: 0 36px;
  margin: 8px 0 20px 0;
  @media screen and (max-width: 500px) {
    padding: 0 24px;
  }
`;

const MarketplaceHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  height: 200px;
  padding: 0 36px;
  margin: 8px 0 20px 0;
  @media screen and (max-width: 500px) {
    padding: 0 24px;
  }
  > img { 
    width: 100%;
    object-fit: cover;
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
`;

const OperationRightWrapper = styled.div`
  display: flex;
  align-items: center;
  flex-shrink: 0;
  margin-left: auto;
  @media screen and (max-width: 500px) {
    > Button {
      display: none;
    }
  }
`;

const FilterDropdown = styled(Select)`
  .ant-select-selector {
    padding: 0 11px 0 0 !important;
  }

  .ant-select-selector > .ant-select-selection-item {
    svg {
      display: none;
    }

    font-size: 16px !important;
    font-weight: 500;
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
  align-items: center;
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

const LayoutSwitcher = styled.div`
  position: absolute;
  right: 36px;
  top: 6px;
  cursor: pointer;
  width: 24px;
  height: 24px;
  border-radius: 4px;
  z-index: ${Layers.homeLayoutSwitcher};
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    background-color: #f5f5f6;
  }

  @media screen and (max-width: 500px) {
    display: none;
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
}

export function HomeLayout(props: HomeLayoutProps) {
  const { breadcrumb = [], elements = [], localMarketplaceApps = [], globalMarketplaceApps = [],mode } = props;
  const user = useSelector(getUser);
  const isFetching = useSelector(isFetchingFolderElements);
  const isSelfHost = window.location.host !== 'app.lowcoder.cloud';
  const [filterBy, setFilterBy] = useState<HomeResKey>("All");
  const [searchValue, setSearchValue] = useState("");
  const [layout, setLayout] = useState<HomeLayoutType>(
    checkIsMobile(window.innerWidth) ? "card" : getHomeLayout()
  );

  useEffect(() => saveHomeLayout(layout), [layout]);

  useEffect(() => {
    // remove collision status from localstorage
    removeCollisionStatus();
  }, []);

  const currentPath = useLocation().pathname;

  if (!user.currentOrgId) {
    return null;
  }

  var displayElements = elements;
  if (mode === "marketplace" && isSelfHost) {
    const markedLocalApps = localMarketplaceApps.map(app => ({ ...app, isLocalMarketplace: true }));
    const markedGlobalApps = globalMarketplaceApps.map(app => ({ ...app, isLocalMarketplace: false }));
    // Merge local and global apps into the elements array
    displayElements = [...markedLocalApps, ...markedGlobalApps];
  }
  else if (mode === "marketplace") {
    const markedLocalApps = localMarketplaceApps.map(app => ({ ...app, isLocalMarketplace: true }));
    displayElements = [...markedLocalApps];
  }

  const resList: HomeRes[] = displayElements
    .filter((e) =>
      searchValue
        ? e.name.toLocaleLowerCase().includes(searchValue) ||
          e.createBy.toLocaleLowerCase().includes(searchValue)
        : true
    )
    .filter((e) => {
      if (HomeResTypeEnum[filterBy].valueOf() === HomeResTypeEnum.All) {
        return true;
      }
      if (e.folder) {
        return HomeResTypeEnum[filterBy] === HomeResTypeEnum.Folder;
      } else {
        if (filterBy === "Navigation") {
          return NavigationTypes.map((t) => t.valueOf()).includes(e.applicationType);
        }
        return HomeResTypeEnum[filterBy].valueOf() === e.applicationType;
      }
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
      {/*<HomepageTourV2 />*/}

      {mode === "marketplace" && (
       <MarketplaceHeader><img src={MarketplaceHeaderImage} alt="Lowcoder Application Marketplace"/></MarketplaceHeader>
      )}

      <OperationWrapper>
        {mode !== "folders" && mode !== "module" && (
          <FilterDropdown
            variant="borderless"
            value={filterBy}
            onChange={(value: any) => setFilterBy(value as HomeResKey)}
            options={[
              getFilterMenuItem(HomeResTypeEnum.All),
              getFilterMenuItem(HomeResTypeEnum.Application),
              getFilterMenuItem(HomeResTypeEnum.Module),
              ...(mode !== "marketplace" ? [getFilterMenuItem(HomeResTypeEnum.Navigation)] : []),
              ...(mode !== "trash" && mode !== "marketplace" ? [getFilterMenuItem(HomeResTypeEnum.Folder)] : []),
  
            ]}
            getPopupContainer={(node: any) => node}
            suffixIcon={<ArrowSolidIcon />}
          />
        )}

        <OperationRightWrapper>
          <Search
            placeholder={trans("search")}
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            style={{ width: "192px", height: "32px", margin: "0" }}
          />
          {mode !== "trash" && mode !== "marketplace" && user.orgDev && (
            <CreateDropdown defaultVisible={showNewUserGuide(user)} mode={mode} />
          )}
        </OperationRightWrapper>
      </OperationWrapper>

      <ContentWrapper>

        {isFetching && resList.length === 0 ? (
          <SkeletonStyle active paragraph={{ rows: 8, width: 648 }} title={false} />
        ) : (
          <>
            {resList.length > 0 ? (
              <>
                {mode === "trash" ? (
                  <TrashTableView resources={resList} />
                ) : (
                  <>
                    <LayoutSwitcher onClick={() => setLayout(layout === "list" ? "card" : "list")}>
                      {layout === "list" ? <HomeCardIcon /> : <HomeListIcon />}
                    </LayoutSwitcher>
                  
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
                          <HomeTableView resources={resList} />
                        ) : (
                          <HomeCardView resources={resList} />
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
                {mode !== "trash" && mode !== "marketplace" && user.orgDev && <CreateDropdown mode={mode} />}
              </EmptyView>
            )}
          </>
        )}
      </ContentWrapper>
    </Wrapper>
  );
}
