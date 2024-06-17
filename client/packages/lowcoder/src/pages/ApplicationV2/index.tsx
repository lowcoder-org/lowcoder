import {
  USER_PROFILE_URL,
  ALL_APPLICATIONS_URL,
  DATASOURCE_URL,
  FOLDER_URL,
  FOLDER_URL_PREFIX,
  FOLDERS_URL,
  MARKETPLACE_URL,
  MODULE_APPLICATIONS_URL,
  QUERY_LIBRARY_URL,
  SETTING,
  TRASH_URL,
  API_DOCS_URL,
  // ADMIN_APP_URL,
  NEWS_URL,
  ORG_HOME_URL,
} from "constants/routesURL";
import { getUser, isFetchingUser } from "redux/selectors/usersSelectors";
import { useDispatch, useSelector } from "react-redux";
import {
  EditPopover,
  EllipsisTextCss,
  FolderIcon,
  HomeDataSourceIcon,
  HomeIcon,
  NewsIcon,
  WorkspacesIcon,
  HomeModuleIcon,
  HomeQueryLibraryIcon,
  HomeSettingIcon,
  InviteUserIcon,
  PlusIcon,
  PointIcon,
  RecyclerIcon,
  MarketplaceIcon,
  AppsIcon,
  EnterpriseIcon,
  UserIcon,
  APIDocsIcon,
} from "lowcoder-design";
import React, { useEffect, useState } from "react";
import { fetchAllApplications, fetchHomeData } from "redux/reduxActions/applicationActions";
import { getHomeOrg, normalAppListSelector } from "redux/selectors/applicationSelector";
import { DatasourceHome } from "../datasource";
import { clearStyleEval, evalStyle } from "lowcoder-core";
import { QueryLibraryEditor } from "../queryLibrary/QueryLibraryEditor";
import { ProductLoading } from "components/ProductLoading";
import { Layout } from "../../components/layout/Layout";
import { HomeView } from "./HomeView";
import { UserProfileView } from "./UserProfileView";
import { NewsView } from "./NewsView";
// import { ApiDocView } from "./ApiDocView";
import { OrgView } from "./OrgView";
import styled, { css } from "styled-components";
import history from "../../util/history";
import { FolderView } from "./FolderView";
import { TrashView } from "./TrashView";
import { MarketplaceView } from "./MarketplaceView";
import { SideBarItemType } from "../../components/layout/SideBarSection";
import { RootFolderListView } from "./RootFolderListView";
import InviteDialog from "../common/inviteDialog";
import { fetchFolderElements, updateFolder } from "../../redux/reduxActions/folderActions";
import { ModuleView } from "./ModuleView";
import { useCreateFolder } from "./useCreateFolder";
import { trans } from "../../i18n";
import { foldersSelector } from "../../redux/selectors/folderSelector";
import Setting from "pages/setting";
import { TypographyText } from "../../components/TypographyText";
import { messageInstance } from "lowcoder-design/src/components/GlobalInstances";
import { isEE } from "util/envUtils";

// adding App Editor, so we can show Apps inside the Admin Area
import AppEditor from "../editor/AppEditor";

const TabLabel = styled.div`
  font-weight: 500;
`;

const FolderSectionLabel = styled.div`
  display: flex;
  align-items: center;
  font-weight: 500;
  font-size: 14px;
  line-height: 14px;
  padding: 0 8px 0 26px;
  height: 30px;
`;

const FolderCountLabel = styled.span`
  margin-left: 8px;
  font-size: 14px;
  line-height: 14px;
  color: #b8b9bf;
`;

const FolderNameWrapper = styled.div<{ $selected: boolean }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-grow: 1;
  ${EllipsisTextCss};
  height: 100%;

  ${(props) => {
    if (props.$selected) {
      return css`
        font-weight: 500;

        svg {
          display: inline-block;
        }
      `;
    }
  }}
  .ant-typography {
    max-width: 138px;
    line-height: 16px;
  }

  &:hover {
    svg {
      display: inline-block;
    }
  }

`;

const FolderName = (props: { id: string; name: string }) => {
  const dispatch = useDispatch();
  const [folderNameEditing, setFolderNameEditing] = useState(false);

  return (
    <>
      <TypographyText
        value={props.name}
        editing={folderNameEditing}
        onChange={(value) => {
          if (!value.trim()) {
            messageInstance.warning(trans("home.nameCheckMessage"));
            return;
          }
          dispatch(updateFolder({ id: props.id, name: value }));
          setFolderNameEditing(false);
        }}
      />
      <EditPopover items={[
          { text: trans("rename"), onClick: () => setFolderNameEditing(true) },
          // Falk: TODO: Implement delete for Folders
        ]}>
        <PopoverIcon tabIndex={-1} />
      </EditPopover>
    </>
  );
};

const MoreFoldersWrapper = styled.div<{ $selected: boolean }>`
  ${(props) => {
    if (props.$selected) {
      return css`
        font-weight: 500;
      `;
    }
  }}
`;

const MoreFoldersIcon = styled(PointIcon)<{ $selected: boolean }>`
  cursor: pointer;
  flex-shrink: 0;

  g {
    fill: ${(props) => (props.$selected ? "#4965f2" : "#8b8fa3")};
  }
`;

const PopoverIcon = styled(PointIcon)`
  cursor: pointer;
  flex-shrink: 0;
  display: none;

  g {
    fill: #8b8fa3;
  }

  &:hover {
    background-color: #e1e3eb;
    border-radius: 4px;
    cursor: pointer;

    g {
      fill: #3377ff;
    }
  }
`;

const InviteUser = styled.div`
  position: absolute;
  display: flex;
  align-items: center;
  left: 10px;
  top: calc(100vh - 60px);
  padding: 12px 26px;
  font-size: 14px;
  cursor: pointer;
  width: 219px;

  &:hover {
    color: #315efb;

    svg g g {
      stroke: #315efb;
    }
  }
`;

const CreateFolderIcon = styled.div`
  margin-left: auto;
  cursor: pointer;
  height: 20px;
  width: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;

  &:hover {
    g {
      stroke: #315efb;
    }

    background-color: #e1e3eb;
  }
`;

const DivStyled = styled.div`
  @media screen and (max-width: 500px) {
    .ant-layout-sider {
      visibility: hidden;
      padding: 0;
      max-width: 0 !important;
      min-width: 0 !important;
    }

    > div {
      display: none;
    }

    .ant-layout > div {
      display: none;
    }
  }
`;

export default function ApplicationHome() {
  const dispatch = useDispatch();
  const [isPreloadCompleted, setIsPreloadCompleted] = useState(false);
  const fetchingUser = useSelector(isFetchingUser);
  const allApplications = useSelector(normalAppListSelector);
  const allFolders = useSelector(foldersSelector);
  const user = useSelector(getUser);
  const org = useSelector(getHomeOrg);
  const allAppCount = allApplications.length;
  const allFoldersCount = allFolders.length;
  const orgHomeId = "root";
  const isSelfHost = window.location.host !== 'app.lowcoder.cloud';

  const handleFolderCreate = useCreateFolder();
  
  const isOrgAdmin = org?.createdBy == user.id ? true : false;

  useEffect(() => {
    dispatch(fetchHomeData({}));
  }, [user.currentOrgId]);

  useEffect(() => {
    if (!org) {
      return;
    }
    const { applyPreloadCSSToHomePage, preloadCSS } = org.commonSettings || {};
    if (applyPreloadCSSToHomePage && preloadCSS) {
      evalStyle(orgHomeId, [preloadCSS]);
    } else {
      clearStyleEval();
    }
    setIsPreloadCompleted(true);
  }, [org, orgHomeId]);

  useEffect(() => {
    if (allAppCount !== 0) {
      return;
    }
    user.currentOrgId && dispatch(fetchAllApplications({}));
  }, [dispatch, allAppCount, user.currentOrgId]);

  useEffect(() => {
    if (allFoldersCount !== 0) {
      return;
    }
    user.currentOrgId && dispatch(fetchFolderElements({}));
  }, [dispatch, allFoldersCount, user.currentOrgId]);

  if (fetchingUser || !isPreloadCompleted) {
    return <ProductLoading />;
  }

  let folderItems: SideBarItemType[] = allFolders
    .sort((a, b) => {
      if (a.createAt === b.createAt) {
        return 0;
      }
      return a.createAt < b.createAt ? 1 : -1;
    })
    .slice(0, 5)
    .map((folder) => {
      const path = FOLDER_URL_PREFIX + `/${folder.folderId}`;
      return {
        onSelected: (_, currentPath) => currentPath === path,
        text: (props: { selected?: boolean }) => (
          <FolderNameWrapper $selected={Boolean(props.selected)}>
            <FolderName name={folder.name} id={folder.folderId} />
          </FolderNameWrapper>
        ),
        routePath: FOLDER_URL,
        routePathExact: false,
        routeComp: FolderView,
        icon: FolderIcon,
        size: "small",
        onClick: (currentPath) => currentPath !== path && history.push(path),
      };
    });

  if (allFolders.length > 1) {
    folderItems = [
      ...folderItems,
      {
        text: (props: { selected?: boolean }) => (
          <MoreFoldersWrapper $selected={Boolean(props.selected)}>{trans("home.allFolders")}</MoreFoldersWrapper>
        ),
        routePath: FOLDERS_URL,
        routeComp: RootFolderListView,
        icon: MoreFoldersIcon,
        size: "small",
      },
    ];
  }

  if (folderItems.length > 0) {
    folderItems[folderItems.length - 1] = {
      ...folderItems[folderItems.length - 1],
      style: { marginBottom: "4px" },
    };
  }

  return (
    <DivStyled>
      <Layout
        sections={[
          {
            items: [
              {
                text: <TabLabel>{trans("home.profile")}</TabLabel>,
                routePath: USER_PROFILE_URL,
                routeComp: UserProfileView,
                icon: ({ selected, ...otherProps }) => selected ? <UserIcon {...otherProps} width={"24px"}/> : <UserIcon {...otherProps} width={"24px"}/>,
              },
              {
                text: <TabLabel>{trans("home.news")}</TabLabel>,
                routePath: NEWS_URL,
                routeComp: NewsView,
                icon: ({ selected, ...otherProps }) => selected ? <NewsIcon {...otherProps} width={"24px"}/> : <NewsIcon {...otherProps} width={"24px"}/>,
                visible: ({ user }) => user.orgDev,
                style: { color: "red" },
              },
              {
                text: <TabLabel>{trans("home.orgHome")}</TabLabel>,
                routePath: ORG_HOME_URL,
                routePathExact: false,
                routeComp: OrgView,
                icon: ({ selected, ...otherProps }) => selected ? <WorkspacesIcon {...otherProps} width={"24px"}/> : <WorkspacesIcon {...otherProps} width={"24px"}/>,
                visible: ({ user }) => !user.orgDev,
              },
              {
                text: <TabLabel>{trans("home.marketplace")}</TabLabel>,
                routePath: MARKETPLACE_URL,
                routePathExact: false,
                routeComp: MarketplaceView,
                icon: ({ selected, ...otherProps }) => selected ? <MarketplaceIcon {...otherProps} width={"24px"}/> : <MarketplaceIcon {...otherProps} width={"24px"}/>,
              },
            ]
          },

          {
            items: [
              {
                text: <TabLabel>{trans("home.allApplications")}</TabLabel>,
                routePath: ALL_APPLICATIONS_URL,
                routeComp: HomeView,
                icon: ({ selected, ...otherProps }) => selected ? <AppsIcon {...otherProps} width={"24px"}/> : <AppsIcon {...otherProps} width={"24px"}/>,
              },
              {
                text: <TabLabel>{trans("home.allModules")}</TabLabel>,
                routePath: MODULE_APPLICATIONS_URL,
                routeComp: ModuleView,
                icon: ({ selected, ...otherProps }) => selected ? <HomeModuleIcon {...otherProps} width={"24px"}/> : <HomeModuleIcon {...otherProps} width={"24px"}/>,
                visible: ({ user }) => isOrgAdmin,
              },
              
            ],
          },

          allFolders.length > 0
            ? {
                title: (
                  <FolderSectionLabel>
                    {trans("home.yourFolders")}
                    <FolderCountLabel>{`(${allFolders.length})`}</FolderCountLabel>
                    {user.orgDev && (
                      <CreateFolderIcon onClick={handleFolderCreate}>
                        <PlusIcon />
                      </CreateFolderIcon>
                    )}
                  </FolderSectionLabel>
                ),
                items: folderItems,
                style: { marginTop: "8px" },
              }
            : { items: [] },
          
          {
            items: [
              
              {
                text: <TabLabel>{trans("home.queryLibrary")}</TabLabel>,
                routePath: QUERY_LIBRARY_URL,
                routeComp: QueryLibraryEditor,
                icon: ({ selected, ...otherProps }) => selected ? <HomeQueryLibraryIcon {...otherProps} width={"24px"}/> : <HomeQueryLibraryIcon {...otherProps} width={"24px"}/>,
                visible: ({ user }) => user.orgDev,
              },
              {
                text: <TabLabel>{trans("home.datasource")}</TabLabel>,
                routePath: DATASOURCE_URL,
                routePathExact: false,
                routeComp: DatasourceHome,
                icon: ({ selected, ...otherProps }) => selected ? <HomeDataSourceIcon {...otherProps} width={"24px"}/> : <HomeDataSourceIcon {...otherProps} width={"24px"}/>,
                visible: ({ user }) => user.orgDev,
                onSelected: (_, currentPath) => currentPath.split("/")[1] === "datasource",
              },
              // {
              //   text: <TabLabel>{trans("home.api")}</TabLabel>,
              //   routePath: API_DOCS_URL,
              //   routeComp: ApiDocView,
              //   icon: ({ selected, ...otherProps }) => selected ? <APIDocsIcon {...otherProps} width={"24px"}/> : <APIDocsIcon {...otherProps} width={"24px"}/>,
              //   visible: ({ user }) => user.orgDev,
              // }
            ],
          },
          isEE() ? {
            items: [
              {
                text: <TabLabel>{trans("settings.AppUsage")}</TabLabel>,
                routePath: "/ee/6600ae8724a23f365ba2ed4c/admin",
                routePathExact: false,
                routeComp: AppEditor,
                icon: ({ selected, ...otherProps }) => selected ? ( <EnterpriseIcon {...otherProps} width={"24px"}/> ) : ( <EnterpriseIcon {...otherProps} width={"24px"}/> ),
                visible: ({ user }) => user.orgDev,
              },
            ],
          } : { items: [] },

          {
            items: [
              {
                text: <TabLabel>{trans("settings.title")}</TabLabel>,
                routePath: SETTING,
                routePathExact: false,
                routeComp: Setting,
                icon: ({ selected, ...otherProps }) => selected ? <HomeSettingIcon {...otherProps} width={"24px"}/> : <HomeSettingIcon {...otherProps} width={"24px"}/>,
                visible: ({ user }) => user.orgDev,
                onSelected: (_, currentPath) => currentPath.split("/")[1] === "setting",
              },
            ]
          },

          {
            items: [
              {
                text: <TabLabel>{trans("home.trash")}</TabLabel>,
                routePath: TRASH_URL,
                routeComp: TrashView,
                icon: ({ selected, ...otherProps }) => selected ? <RecyclerIcon {...otherProps} width={"24px"}/> : <RecyclerIcon {...otherProps} width={"24px"}/>,
                visible: ({ user }) => user.orgDev,
              },
            ],
          },

        ]}
      />
      {user.orgDev && (
        <InviteDialog
          trigger={
            <InviteUser>
              <InviteUserIcon style={{ marginRight: "8px" }} />
              {trans("home.inviteUser")}
            </InviteUser>
          }
          style={{ marginLeft: "auto" }}
        />
      )}
    </DivStyled>
  );
}
