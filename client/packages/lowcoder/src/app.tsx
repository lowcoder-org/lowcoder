import { default as App } from "antd/es/app";
import { default as ConfigProvider } from "antd/es/config-provider";
import {
  USER_PROFILE_URL,
  NEWS_URL,
  ORG_HOME_URL,
  ALL_APPLICATIONS_URL,
  APP_EDITOR_URL,
  APPLICATION_VIEW_URL,
  BASE_URL,
  COMPONENT_DOC_URL,
  DATASOURCE_CREATE_URL,
  DATASOURCE_EDIT_URL,
  DATASOURCE_URL,
  SUPPORT_URL,
  FOLDER_URL,
  FOLDERS_URL,
  IMPORT_APP_FROM_TEMPLATE_URL,
  INVITE_LANDING_URL,
  isAuthUnRequired,
  MARKETPLACE_URL,
  ORG_AUTH_LOGIN_URL,
  ORG_AUTH_REGISTER_URL,
  QUERY_LIBRARY_URL,
  SETTING_URL,
  TRASH_URL,
  USER_AUTH_URL,
  ADMIN_APP_URL,
  ORG_AUTH_FORGOT_PASSWORD_URL,
  ORG_AUTH_RESET_PASSWORD_URL,
  ADMIN_AUTH_URL,
  PUBLIC_APP_EDITOR_URL,
} from "constants/routesURL";
import React, { useEffect, useMemo } from "react";
import { createRoot } from "react-dom/client";
import { Helmet } from "react-helmet";
import { connect, Provider, useDispatch, useSelector } from "react-redux";
import { Redirect, Route, Router, Switch } from "react-router-dom";
import type { AppState } from "redux/reducers";
import { fetchConfigAction, fetchDeploymentIdAction } from "redux/reduxActions/configActions";
import { fetchUserAction } from "redux/reduxActions/userActions";
import { reduxStore } from "redux/store/store";
import { developEnv } from "util/envUtils";
import history from "util/history";
import LazyRoute from "components/LazyRoute";
import { getAntdLocale } from "i18n/antdLocale";
import { ProductLoading } from "components/ProductLoading";
import { trans } from "i18n"; // language
import { loadComps } from "comps";
import { initApp } from "util/commonUtils";
import { favicon } from "assets/images";
import { hasQueryParam } from "util/urlUtils";
import { getUser, isFetchUserFinished } from "redux/selectors/usersSelectors"; // getCurrentUser, 
import { getIsCommonSettingFetched } from "redux/selectors/commonSettingSelectors";
import { SystemWarning } from "./components/SystemWarning";
import { getBrandingConfig, getDeploymentId } from "./redux/selectors/configSelectors";
import { buildMaterialPreviewURL } from "./util/materialUtils";
import GlobalInstances from 'components/GlobalInstances';
// import posthog from 'posthog-js'
import { fetchHomeData, fetchServerSettingsAction } from "./redux/reduxActions/applicationActions";
import { getNpmPackageMeta } from "./comps/utils/remote";
import { packageMetaReadyAction, setLowcoderCompsLoading } from "./redux/reduxActions/npmPluginActions";
import { fetchBrandingSetting } from "./redux/reduxActions/enterpriseActions";
import { EnterpriseProvider } from "./util/context/EnterpriseContext";
import { SimpleSubscriptionContextProvider } from "./util/context/SimpleSubscriptionContext";
import { getBrandingSetting } from "./redux/selectors/enterpriseSelectors";
import { fetchSubscriptionsAction } from "./redux/reduxActions/subscriptionActions";

const LazyUserAuthComp = React.lazy(() => import("pages/userAuth"));
const LazyInviteLanding = React.lazy(() => import("pages/common/inviteLanding"));
const LazyComponentDoc = React.lazy(() => import("pages/ComponentDoc"));
const LazyComponentPlayground = React.lazy(() => import("pages/ComponentPlayground"));
const LazyAppEditor = React.lazy(() => import("pages/editor/AppEditor"));
const LazyPublicAppEditor = React.lazy(() => import("pages/editor/AppEditorPublic"));
const LazyAppFromTemplate = React.lazy(() => import("pages/ApplicationV2/AppFromTemplate"));
const LazyApplicationHome = React.lazy(() => import("pages/ApplicationV2"));
const LazyDebugComp = React.lazy(() => import("./debug"));
const LazyDebugNewComp = React.lazy(() => import("./debugNew"));

const Wrapper = React.memo((props: {
  children: React.ReactNode,
  language: string,
  fontFamily?: string
}) => {
  const deploymentId = useSelector(getDeploymentId);
  const user = useSelector(getUser);
  const dispatch = useDispatch();
  
  useEffect(() => {
    if (user.currentOrgId) {
      dispatch(fetchDeploymentIdAction());
    }
  }, [user.currentOrgId]);

  useEffect(() => {
    if(Boolean(deploymentId)) {
      dispatch(fetchSubscriptionsAction())
    }
  }, [deploymentId]);
  
  const theme = useMemo(() => {
    return {
      hashed: false,
      token: {
        fontFamily: `${
          props.fontFamily
          ? props.fontFamily.split('+').join(' ')
          : `-apple-system, BlinkMacSystemFont, "Helvetica Neue", Arial, "Segoe UI", "PingFang SC",
            "Microsoft Yahei", "Hiragino Sans GB", sans-serif, "Apple Color Emoji", "Segoe UI Emoji",
            "Segoe UI Symbol", "Noto Color Emoji"`
        }, sans-serif`,
      },
    }
  }, [props.fontFamily]);

  return (
    <ConfigProvider
      theme={theme}
      wave={{ disabled: true }}
      locale={getAntdLocale(props.language)}
    >
      <App>
        <GlobalInstances />
        {props.children}
      </App>
    </ConfigProvider>
  );
});

type AppIndexProps = {
  isFetchUserFinished: boolean;
  getIsCommonSettingFetched: boolean;
  currentOrgId?: string;
  currentUserId: string;
  currentUserAnonymous: boolean;
  orgDev: boolean;
  defaultHomePage: string | null | undefined;
  fetchHomeDataFinished: boolean;
  fetchConfig: (orgId?: string) => void;
  fetchBrandingSetting: (orgId?: string) => void;
  fetchHomeData: (currentUserAnonymous?: boolean | undefined) => void;
  fetchLowcoderCompVersions: () => void;
  getCurrentUser: () => void;
  fetchServerSettings: () => void;
  favicon: string;
  brandName: string;
  brandDescription: string;
  uiLanguage: string;
  brandingFontFamily?: string;
};

class AppIndex extends React.Component<AppIndexProps, any> {
  componentDidMount() {
    this.props.getCurrentUser();
    this.props.fetchServerSettings();
    // if (!this.props.currentUserAnonymous) {
    //   this.props.fetchHomeData(this.props.currentUserAnonymous);
    // }
  }

  componentDidUpdate(prevProps: AppIndexProps) {
    if (
      prevProps.currentOrgId !== this.props.currentOrgId &&
      this.props.currentOrgId !== ''
    ) {
      this.props.fetchConfig(this.props.currentOrgId);
      if (!this.props.currentUserAnonymous) {
        this.props.fetchHomeData(this.props.currentUserAnonymous);
        this.props.fetchLowcoderCompVersions();
        this.props.fetchBrandingSetting(this.props.currentOrgId);
      }
    }
  }
  render() {
    const isTemplate = hasQueryParam('template');
    const pathname = history.location.pathname;

    // we check if we are on the public cloud
    const isLowCoderDomain = window.location.hostname === 'app.lowcoder.cloud';
    const isLocalhost = window.location.hostname === 'localhost';

    // make sure all users in this app have checked login info
    if (!this.props.isFetchUserFinished || (this.props.currentUserId && !this.props.fetchHomeDataFinished)) {
      const hideLoadingHeader = isTemplate || isAuthUnRequired(pathname);
      return <ProductLoading hideHeader={hideLoadingHeader} />;
    }
    else {
      // if the user just logged in, we send the event to posthog
      if (isLocalhost || isLowCoderDomain) {
        if (sessionStorage.getItem('_just_logged_in_')) {
          sessionStorage.removeItem('_just_logged_in_');
        }
      }
    }

    // persisting the language in local storage
    localStorage.setItem('lowcoder_uiLanguage', this.props.uiLanguage);

    return (
      <Wrapper language={this.props.uiLanguage} fontFamily={this.props.brandingFontFamily}>
        <Helmet>
          {<title>{this.props.brandName}</title>}
          {<link rel="icon" href={this.props.favicon} />}
          <meta name="description" content={this.props.brandDescription} />
          <meta
            name="keywords"
            content="Lowcoder, Applications, App Builder, Internal Applications, Websites, Dashboards, Data Visualization, Customer Applications, CRM, ERP, eCommerce, VideoMeeting, Rapid Development"
          />
          <meta name="author" content="Lowcoder Software LTD" />
          <meta name="robots" content="index, follow" />

          <meta
            key="og:title"
            property="og:title"
            content={this.props.brandName}
          />
          <meta
            key="og:description"
            property="og:description"
            content={this.props.brandDescription}
          />
          <meta
            key="og:image"
            property="og:image"
            content="https://raw.githubusercontent.com/lowcoder-org/lowcoder-media-assets/main/images/App%20Editor%20%7C%20Main%20Screeen%20clean%20v2.4.0.png"
          />
          <meta key="og:url" property="og:url" content={window.location.href} />
          <meta key="og:type" property="og:type" content="website" />

          <meta
            key="twitter:card"
            name="twitter:card"
            content="summary_large_image"
          />
          <meta
            key="twitter:title"
            name="twitter:title"
            content={this.props.brandName}
          />
          <meta
            key="twitter:description"
            name="twitter:description"
            content={this.props.brandDescription}
          />
          <meta
            key="twitter:image"
            name="twitter:image"
            content="https://raw.githubusercontent.com/lowcoder-org/lowcoder-media-assets/main/images/App%20Editor%20%7C%20Main%20Screeen%20clean%20v2.4.0.png"
          />

          <meta
            key="viewport"
            name="viewport"
            content="width=device-width, initial-scale=1, shrink-to-fit=no"
          />
          <meta
            key="mobile-web-app-capable"
            name="mobile-web-app-capable"
            content="yes"
          />
          <meta key="theme-color" name="theme-color" content="#b480de" />

          <meta
            key="apple-mobile-web-app-capable"
            name="apple-mobile-web-app-capable"
            content="yes"
          />
          <meta
            key="apple-mobile-web-app-status-bar-style"
            name="apple-mobile-web-app-status-bar-style"
            content="black-translucent"
          />
          <meta
            key="apple-mobile-web-app-title"
            name="apple-mobile-web-app-title"
            content={this.props.brandName}
          />
          <link
            key="apple-touch-icon"
            rel="apple-touch-icon"
            href="https://raw.githubusercontent.com/lowcoder-org/lowcoder-media-assets/main/images/Lowcoder%20Logo%20512.png"
          />
          <link
            key="apple-touch-startup-image"
            rel="apple-touch-startup-image"
            href="https://raw.githubusercontent.com/lowcoder-org/lowcoder-media-assets/main/images/Lowcoder%20Logo%20512.png"
          />
          <meta
            key="application-name"
            name="application-name"
            content={this.props.brandName}
          />
          <meta
            key="msapplication-TileColor"
            name="msapplication-TileColor"
            content="#b480de"
          />
          <meta
            key="msapplication-TileImage"
            name="msapplication-TileImage"
            content="https://raw.githubusercontent.com/lowcoder-org/lowcoder-media-assets/main/images/Lowcoder%20Logo%20150.png"
          />
          {/* }<meta key="msapplication-config" name="msapplication-config" content="https://www.yourdomain.com/path/to/browserconfig.xml" />, */}

          <link rel="canonical" href={window.location.href} />
          {isLowCoderDomain || isLocalhost && [
            // Adding Support for iframely to be able to embedd the component explorer in the docu
            <meta
              key="iframely:title"
              property="iframely:title"
              content={this.props.brandName}
            />,
            <meta
              key="iframely:description"
              property="iframely:description"
              content={this.props.brandDescription}
            />,
            <link
              key="iframely"
              rel="iframely"
              type="text/html"
              href={window.location.href}
              media="(aspect-ratio: 1280/720)"
            />,
          ]}
          {((isLowCoderDomain || isLocalhost) && !Boolean(this.props.brandingFontFamily)) && [
            <link
              key="preconnect-googleapis"
              rel="preconnect"
              href="https://fonts.googleapis.com"
            />,
            <link
              key="preconnect-gstatic"
              rel="preconnect"
              href="https://fonts.gstatic.com"
              crossOrigin="anonymous"
            />,
            <link
              key="font-ubuntu"
              href="https://fonts.googleapis.com/css2?family=Ubuntu:ital,wght@0,300;0,400;0,700;1,400&display=swap"
              rel="stylesheet"
            />
          ]}
          {Boolean(this.props.brandingFontFamily) && [
            <link
              key="preconnect-googleapis"
              rel="preconnect"
              href="https://fonts.googleapis.com"
            />,
            <link
              key="preconnect-gstatic"
              rel="preconnect"
              href="https://fonts.gstatic.com"
              crossOrigin="anonymous"
            />,
            <link
              key={this.props.brandingFontFamily}
              href={`https://fonts.googleapis.com/css2?family=${this.props.brandingFontFamily}&display=swap`}
              rel="stylesheet"
            />
          ]}
        </Helmet>
        <SystemWarning />
          <Router history={history}>
            <Switch>
              <LazyRoute
                exact
                path={IMPORT_APP_FROM_TEMPLATE_URL}
                component={LazyAppFromTemplate}
              />

              <LazyRoute
                exact
                fallback="layout"
                path={PUBLIC_APP_EDITOR_URL}
                component={LazyPublicAppEditor}
              />

              <Route
                path={
                  [
                    APP_EDITOR_URL,
                    USER_PROFILE_URL,
                    NEWS_URL,
                    ORG_HOME_URL,
                    ALL_APPLICATIONS_URL,
                    DATASOURCE_CREATE_URL,
                    DATASOURCE_EDIT_URL,
                    DATASOURCE_URL,
                    SUPPORT_URL,
                    QUERY_LIBRARY_URL,
                    FOLDERS_URL,
                    FOLDER_URL,
                    TRASH_URL,
                    SETTING_URL,
                    MARKETPLACE_URL,
                    ADMIN_APP_URL
                  ]
                }
              >
                <SimpleSubscriptionContextProvider>
                  <Switch>
                    <LazyRoute
                      fallback="layout"
                      path={APP_EDITOR_URL}
                      component={LazyAppEditor}
                    />
                    <LazyRoute
                      fallback="layout"
                      path={[
                        USER_PROFILE_URL,
                        NEWS_URL,
                        ORG_HOME_URL,
                        ALL_APPLICATIONS_URL,
                        DATASOURCE_CREATE_URL,
                        DATASOURCE_EDIT_URL,
                        DATASOURCE_URL,
                        SUPPORT_URL,
                        QUERY_LIBRARY_URL,
                        FOLDERS_URL,
                        FOLDER_URL,
                        TRASH_URL,
                        SETTING_URL,
                        MARKETPLACE_URL,
                        ADMIN_APP_URL
                      ]}
                      // component={ApplicationListPage}
                      component={LazyApplicationHome}
                    />
                  </Switch>
                </SimpleSubscriptionContextProvider>
              </Route>
              <LazyRoute exact path={ADMIN_AUTH_URL} component={LazyUserAuthComp} />
              <LazyRoute path={USER_AUTH_URL} component={LazyUserAuthComp} />
              <LazyRoute
                path={ORG_AUTH_LOGIN_URL}
                component={LazyUserAuthComp}
              />
              <LazyRoute
                path={ORG_AUTH_REGISTER_URL}
                component={LazyUserAuthComp}
              />
              <LazyRoute
                path={ORG_AUTH_FORGOT_PASSWORD_URL}
                component={LazyUserAuthComp}
              />
              <LazyRoute
                path={ORG_AUTH_RESET_PASSWORD_URL}
                component={LazyUserAuthComp}
              />
              <LazyRoute
                path={INVITE_LANDING_URL}
                component={LazyInviteLanding}
              />
              <LazyRoute
                path={`${COMPONENT_DOC_URL}/:name`}
                component={LazyComponentDoc}
              />
              <LazyRoute
                path={`/playground/:name/:dsl`}
                component={LazyComponentPlayground}
              />

              {this.props.isFetchUserFinished && this.props.defaultHomePage? (
                !this.props.orgDev ? ( 
                  <Redirect exact from={BASE_URL} to={APPLICATION_VIEW_URL(this.props.defaultHomePage || "", "view")}/>
                ) : (
                  <Redirect exact from={BASE_URL} to={ORG_HOME_URL} />
                )
              ) : (
                <Redirect exact from={BASE_URL} to={ALL_APPLICATIONS_URL} />
              )}

              <Redirect to={`${COMPONENT_DOC_URL}/input`} path="/components" />

              {developEnv() && (
                <>
                  <LazyRoute
                    path="/debug_comp/:name"
                    component={LazyDebugComp}
                  />
                  <LazyRoute
                    exact
                    path="/debug_comp"
                    component={LazyDebugComp}
                  />
                  <LazyRoute path="/debug_editor" component={LazyAppEditor} />
                  <LazyRoute path="/debug_new" component={LazyDebugNewComp} />
                </>
              )}
            </Switch>
          </Router>
      </Wrapper>
    );
  }
}

const mapStateToProps = (state: AppState) => ({
  isFetchUserFinished: isFetchUserFinished(state),
  getIsCommonSettingFetched: getIsCommonSettingFetched(state),
  orgDev: state.ui.users.user.orgDev,
  currentUserId: state.ui.users.currentUser.id,
  currentUserAnonymous: state.ui.users.user.isAnonymous,
  currentOrgId: state.ui.users.user.currentOrgId,
  defaultHomePage: state.ui.application.homeOrg?.commonSettings.defaultHomePage,
  fetchHomeDataFinished: Boolean(state.ui.application.homeOrg?.commonSettings),
  favicon: getBrandingConfig(state)?.favicon
    ? buildMaterialPreviewURL(getBrandingConfig(state)?.favicon!)
    : favicon,
  brandName: getBrandingSetting(state)?.config_set?.standardTitle ?? trans("productName"),
  brandDescription: getBrandingSetting(state)?.config_set?.standardDescription ?? trans('productDesc'),
  uiLanguage: state.ui.users.user.uiLanguage,
  brandingFontFamily: getBrandingSetting(state)?.config_set?.font,
});

const mapDispatchToProps = (dispatch: any) => ({
  getCurrentUser: () => {
    dispatch(fetchUserAction());
  },
  fetchConfig: (orgId?: string) => dispatch(fetchConfigAction(orgId)),
  fetchHomeData: (currentUserAnonymous: boolean | undefined) => {
    dispatch(fetchHomeData({}));
  },
  fetchBrandingSetting: (orgId?: string) => dispatch(fetchBrandingSetting({ orgId, fallbackToGlobal: true })),
  fetchLowcoderCompVersions: async () => {
    try {
      dispatch(setLowcoderCompsLoading(true));
      const packageMeta = await getNpmPackageMeta('lowcoder-comps');
      if (packageMeta?.versions) {
        dispatch(packageMetaReadyAction('lowcoder-comps', packageMeta));
      }
      dispatch(setLowcoderCompsLoading(false));
    } catch (_) {
      dispatch(setLowcoderCompsLoading(false));
    }
  },
  fetchServerSettings: () => {
    dispatch(fetchServerSettingsAction());
  }
});

const AppIndexWithProps = connect(mapStateToProps, mapDispatchToProps)(AppIndex);

export function bootstrap() {
  initApp();
  loadComps();

  const container = document.getElementById("root");
  const root = createRoot(container!);
  root.render(
    <Provider store={reduxStore}>
      <EnterpriseProvider>
        <AppIndexWithProps />
      </EnterpriseProvider>
    </Provider>
  );
}
