import {
  USER_PROFILE_URL,
  ALL_APPLICATIONS_URL,
  DATASOURCE_URL,
  FOLDER_URL,
  MARKETPLACE_URL,
  QUERY_LIBRARY_URL,
  SETTING_URL,
  SUPPORT_URL,
  TRASH_URL,
  NEWS_URL,
  ORG_HOME_URL,
} from "constants/routesURL";
import { getUser, isFetchingUser } from "redux/selectors/usersSelectors";
import { useDispatch, useSelector } from "react-redux";
import {
  EllipsisTextCss,
  FolderIcon,
  // EditPopover,
  HomeDataSourceIcon,
  NewsIcon,
  WorkspacesIcon,
  HomeQueryLibraryIcon,
  HomeSettingIcon,
  SupportIcon,
  RecyclerIcon,
  MarketplaceIcon,
  AppsIcon,
  EnterpriseIcon,
  UserIcon,
} from "lowcoder-design";
import React, { useCallback, useEffect, useState, useMemo } from "react";
import { fetchAllApplications, fetchHomeData } from "redux/reduxActions/applicationActions";
import { fetchSubscriptionsAction } from "redux/reduxActions/subscriptionActions";
import { getHomeOrg, normalAppListSelector } from "redux/selectors/applicationSelector";
import { DatasourceHome } from "../datasource";
import { clearStyleEval, evalStyle } from "lowcoder-core";
import { QueryLibraryEditor } from "../queryLibrary/QueryLibraryEditor";
import { ProductLoading } from "components/ProductLoading";
import { Layout } from "../../components/layout/Layout";
import { HomeView } from "./HomeView";
import { UserProfileView } from "./UserProfileView";
import { NewsView } from "./NewsView";
import { OrgView } from "./OrgView";
import styled, { css } from "styled-components";
import { FolderView } from "./FolderView";
import { TrashView } from "./TrashView";
import { MarketplaceView } from "./MarketplaceView";
import { fetchFolderElements, updateFolder } from "../../redux/reduxActions/folderActions";
import { trans } from "../../i18n";
import { foldersSelector } from "../../redux/selectors/folderSelector";
import Setting from "pages/setting";
import { Support } from "pages/support";
import { getSubscriptions } from 'redux/selectors/subscriptionSelectors';
import { SubscriptionProductsEnum } from '@lowcoder-ee/constants/subscriptionConstants';
import { EnterpriseProvider } from "@lowcoder-ee/util/context/EnterpriseContext";
import { selectIsLicenseActive } from "redux/selectors/enterpriseSelectors";


// adding App Editor, so we can show Apps inside the Admin Area
import AppEditor from "../editor/AppEditor";
import { fetchDeploymentIdAction } from "@lowcoder-ee/redux/reduxActions/configActions";
import { getDeploymentId } from "@lowcoder-ee/redux/selectors/configSelectors";
import { SimpleSubscriptionContextProvider } from '@lowcoder-ee/util/context/SimpleSubscriptionContext';
import {LoadingBarHideTrigger} from "@lowcoder-ee/util/hideLoading";

const TabLabel = styled.div`
  font-weight: 500;
`;

const DivStyled = styled.div`
  @media screen and (max-width: 500px) {
    .ant-layout-sider {
      visibility: hidden;
      padding: 0;
      max-width: 0 !important;
      min-width: 0 !important;
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
  const subscriptions = useSelector(getSubscriptions);
  const deploymentId = useSelector(getDeploymentId);

  const isOrgAdmin = org?.createdBy == user.id ? true : false;
  const isLicenseActive = useSelector(selectIsLicenseActive);

  useEffect(() => {
    if (user.currentOrgId) {
      dispatch(fetchDeploymentIdAction());
    }
    dispatch(fetchHomeData({}));
  }, [user.currentOrgId]);

  useEffect(() => {
    if(Boolean(deploymentId)) {
      dispatch(fetchSubscriptionsAction())
    }
  }, [deploymentId]);

  const supportSubscription = useMemo(() => {
    return subscriptions.some(
      sub => sub.product === SubscriptionProductsEnum.SUPPORT && sub.status === 'active'
    );
  }, [subscriptions])

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

  return (
    <DivStyled>
      <LoadingBarHideTrigger />
      <EnterpriseProvider>
        <SimpleSubscriptionContextProvider>
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
                ],
              },
      
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
                ],
              },
              /* isLicenseActive ? {
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
              } : { items: [] }, */

              supportSubscription && user.orgDev ? {
                items: [
                  {
                    text: <TabLabel>{trans("home.support")}</TabLabel>,
                    routePath: SUPPORT_URL,
                    routeComp: Support,
                    routePathExact: false,
                    icon: ({ selected, ...otherProps }) => selected ? <SupportIcon {...otherProps} width={"24px"}/> : <SupportIcon {...otherProps} width={"24px"}/>,
                  },
                ],
              } : { items: [] },

              {
                items: [
                  {
                    text: <TabLabel>{trans("settings.title")}</TabLabel>,
                    routePath: SETTING_URL,
                    routePathExact: false,
                    routeComp: Setting,
                    icon: ({ selected, ...otherProps }) => selected ? <HomeSettingIcon {...otherProps} width={"24px"}/> : <HomeSettingIcon {...otherProps} width={"24px"}/>,
                    visible: ({ user }) => user.orgDev,
                    onSelected: (_, currentPath) => currentPath.split("/")[1] === "setting",
                  }
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

              // this we need to show the Folders view in the Admin Area
              {
                items: [
                  {
                    text: "",
                    routePath: FOLDER_URL,
                    routeComp: FolderView,
                    visible: () => false,
                  }
                ]
              }

            ]}
          />
        </SimpleSubscriptionContextProvider>
      </EnterpriseProvider>
    </DivStyled>
  );
}
