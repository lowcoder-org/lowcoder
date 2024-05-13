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
  FOLDER_URL,
  FOLDERS_URL,
  IMPORT_APP_FROM_TEMPLATE_URL,
  INVITE_LANDING_URL,
  isAuthUnRequired,
  MARKETPLACE_URL,
  ORG_AUTH_LOGIN_URL,
  ORG_AUTH_REGISTER_URL,
  QUERY_LIBRARY_URL,
  SETTING,
  TRASH_URL,
  USER_AUTH_URL,
  ADMIN_APP_URL,
  ORG_AUTH_FORGOT_PASSWORD_URL,
  ORG_AUTH_RESET_PASSWORD_URL,
} from "constants/routesURL";

import React from "react";
import { createRoot } from "react-dom/client";
import { Helmet } from "react-helmet";
import { connect, Provider } from "react-redux";
import { Redirect, Router, Switch } from "react-router-dom";
import type { AppState } from "redux/reducers";
import { fetchConfigAction } from "redux/reduxActions/configActions";
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
import { isFetchUserFinished } from "redux/selectors/usersSelectors"; // getCurrentUser, 
import { SystemWarning } from "./components/SystemWarning";
import { getBrandingConfig } from "./redux/selectors/configSelectors";
import { buildMaterialPreviewURL } from "./util/materialUtils";
import GlobalInstances from 'components/GlobalInstances';

const LazyUserAuthComp = React.lazy(() => import("pages/userAuth"));
const LazyInviteLanding = React.lazy(() => import("pages/common/inviteLanding"));
const LazyComponentDoc = React.lazy(() => import("pages/ComponentDoc"));
const LazyComponentPlayground = React.lazy(() => import("pages/ComponentPlayground"));
const LazyAppEditor = React.lazy(() => import("pages/editor/AppEditor"));
const LazyAppFromTemplate = React.lazy(() => import("pages/ApplicationV2/AppFromTemplate"));
const LazyApplicationHome = React.lazy(() => import("pages/ApplicationV2"));
const LazyDebugComp = React.lazy(() => import("./debug"));
const LazyDebugNewComp = React.lazy(() => import("./debugNew"));

const Wrapper = (props: { children: React.ReactNode, language: string }) => (
  <ConfigProvider
    theme={{ hashed: false }}
    locale={getAntdLocale(props.language)}
  >
    <App>
      <GlobalInstances />
      {props.children}
    </App>
  </ConfigProvider>
);

type AppIndexProps = {
  isFetchUserFinished: boolean;
  currentOrgId?: string;
  orgDev: boolean;
  defaultHomePage: string | null | undefined;
  fetchConfig: (orgId?: string) => void;
  getCurrentUser: () => void;
  favicon: string;
  brandName: string;
  uiLanguage: string;
};

class AppIndex extends React.Component<AppIndexProps, any> {
  componentDidMount() {
    this.props.getCurrentUser();
  }

  componentDidUpdate(prevProps: AppIndexProps) {
    if(prevProps.currentOrgId !== this.props.currentOrgId && this.props.currentOrgId !== '') {
      this.props.fetchConfig(this.props.currentOrgId);
    }
  }

  render() {
    const isTemplate = hasQueryParam("template");
    const pathname = history.location.pathname;

    // we check if we are on the public cloud
    const isLowCoderDomain = window.location.hostname === 'app.lowcoder.cloud';

    // make sure all users in this app have checked login info
    if (!this.props.isFetchUserFinished) {
      const hideLoadingHeader = isTemplate || isAuthUnRequired(pathname);
      return <ProductLoading hideHeader={hideLoadingHeader} />;
    }

    // persisting the language in local storage
    localStorage.setItem('lowcoder_uiLanguage', this.props.uiLanguage);

    // console.log("this.props.defaultHomePage: ", this.props.defaultHomePage)

    return (
      <Wrapper language={this.props.uiLanguage}>
        <Helmet>
          {<title>{this.props.brandName}</title>}
          {<link rel="icon" href={this.props.favicon} />}
          <meta name="description" content={trans("productDesc")} />
          {isLowCoderDomain && [
            // Adding Support for iframely to be able to embedd the component explorer in the docu
            <meta key="iframely:title" property="iframely:title" content="Lowcoder" />,
            <meta key="iframely:description" property="iframely:description" content="Lowcoder | rapid App & VideoMeeting builder for everyone." />,
            <link key="preconnect-googleapis" rel="preconnect" href="https://fonts.googleapis.com" />,
            <link key="preconnect-gstatic" rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />,
            <link key="font-ubuntu" href="https://fonts.googleapis.com/css2?family=Ubuntu:ital,wght@0,300;0,400;0,700;1,400&display=swap" rel="stylesheet" />,
            // adding Clearbit Support for Analytics
            <script key="clearbit-script" src="https://tag.clearbitscripts.com/v1/pk_dfbc0aeefb28dc63475b67134facf127/tags.js" referrerPolicy="strict-origin-when-cross-origin" type="text/javascript"></script>
          ]}
        </Helmet>
        <SystemWarning />
        <Router history={history}>
          <Switch>
            
            {/* 
              // we decided to show the org homepage in a own navigation page
              {!this.props.orgDev && !!this.props.defaultHomePage ? (
              <Redirect exact from={BASE_URL} to={APPLICATION_VIEW_URL(this.props.defaultHomePage, "view")}
              />
            ) : (
              <Redirect exact from={BASE_URL} to={USER_PROFILE_URL} />
            )}
            {!this.props.orgDev && !!this.props.defaultHomePage && (
              <Redirect exact from={ALL_APPLICATIONS_URL} to={APPLICATION_VIEW_URL(this.props.defaultHomePage, "view")}
              />
            )} */}

            {!this.props.orgDev ? (
              <Redirect exact from={BASE_URL} to={ORG_HOME_URL} />
            ) : (
              <Redirect exact from={BASE_URL} to={ALL_APPLICATIONS_URL} />
            )}
            
            <LazyRoute exact path={IMPORT_APP_FROM_TEMPLATE_URL} component={LazyAppFromTemplate} />
            <LazyRoute fallback="layout" path={APP_EDITOR_URL} component={LazyAppEditor} />
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
                QUERY_LIBRARY_URL,
                FOLDERS_URL,
                FOLDER_URL,
                TRASH_URL,
                SETTING,
                MARKETPLACE_URL,
                ADMIN_APP_URL,
              ]}
              // component={ApplicationListPage}
              component={LazyApplicationHome}
            />
            <LazyRoute path={USER_AUTH_URL} component={LazyUserAuthComp} />
            <LazyRoute path={ORG_AUTH_LOGIN_URL} component={LazyUserAuthComp} />
            <LazyRoute path={ORG_AUTH_REGISTER_URL} component={LazyUserAuthComp} />
            <LazyRoute path={ORG_AUTH_FORGOT_PASSWORD_URL} component={LazyUserAuthComp} />
            <LazyRoute path={ORG_AUTH_RESET_PASSWORD_URL} component={LazyUserAuthComp} />
            <LazyRoute path={INVITE_LANDING_URL} component={LazyInviteLanding} />
            <LazyRoute path={`${COMPONENT_DOC_URL}/:name`} component={LazyComponentDoc} />
            <LazyRoute path={`/playground/:name/:dsl`} component={LazyComponentPlayground} />
            <Redirect to={`${COMPONENT_DOC_URL}/input`} path="/components" />

            {developEnv() && (
              <>
                <LazyRoute path="/debug_comp/:name" component={LazyDebugComp} />
                <LazyRoute exact path="/debug_comp" component={LazyDebugComp} />
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
  orgDev: state.ui.users.user.orgDev,
  currentOrgId: state.ui.users.user.currentOrgId,
  defaultHomePage: state.ui.application.homeOrg?.commonSettings.defaultHomePage,
  favicon: getBrandingConfig(state)?.favicon
    ? buildMaterialPreviewURL(getBrandingConfig(state)?.favicon!)
    : favicon,
  brandName: getBrandingConfig(state)?.brandName ?? trans("productName"),
  uiLanguage: state.ui.users.user.uiLanguage,
});

const mapDispatchToProps = (dispatch: any) => ({
  getCurrentUser: () => {
    dispatch(fetchUserAction());
  },
  fetchConfig: (orgId?: string) => dispatch(fetchConfigAction(orgId)),
});

const AppIndexWithProps = connect(mapStateToProps, mapDispatchToProps)(AppIndex);

export function bootstrap() {
  initApp();
  loadComps();

  const container = document.getElementById("root");
  const root = createRoot(container!);
  root.render(
    <Provider store={reduxStore}>
      <AppIndexWithProps />
    </Provider>
  );
}
