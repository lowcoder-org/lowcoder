import { loadComps } from "bootstrap/view";
import { initApp } from "util/commonUtils";
import { connect, Provider } from "react-redux";
import { createRoot } from "react-dom/client";
import type {AppState} from "@lowcoder-ee/redux/reducers";
import {isFetchUserFinished} from "@lowcoder-ee/redux/selectors/usersSelectors";
import {getIsCommonSettingFetched} from "@lowcoder-ee/redux/selectors/commonSettingSelectors";
import {getBrandingConfig} from "@lowcoder-ee/redux/selectors/configSelectors";
import {buildMaterialPreviewURL} from "@lowcoder-ee/util/materialUtils";
import {favicon} from "@lowcoder-ee/assets/images";
import {trans} from "@lowcoder-ee/i18n";
import {fetchUserAction} from "@lowcoder-ee/redux/reduxActions/userActions";
import {fetchConfigAction} from "@lowcoder-ee/redux/reduxActions/configActions";
import {fetchHomeData} from "@lowcoder-ee/redux/reduxActions/applicationActions";
import {packageMetaReadyAction, setLowcoderCompsLoading} from "@lowcoder-ee/redux/reduxActions/npmPluginActions";
import {getNpmPackageMeta} from "@lowcoder-ee/comps/utils/remote";
import { reduxStore } from "redux/store/store";
import React from "react";
import {hasQueryParam} from "@lowcoder-ee/util/urlUtils";
import history from "@lowcoder-ee/util/history";
import {
    APP_EDITOR_URL,
    isAuthUnRequired,
} from "@lowcoder-ee/constants/routesURL";
import {ProductLoading} from "@lowcoder-ee/components/ProductLoading";
import {Helmet} from "react-helmet";
import {SystemWarning} from "@lowcoder-ee/components/SystemWarning";
import {Router, Switch} from "react-router-dom";
import LazyRoute from "@lowcoder-ee/components/LazyRoute";
import {default as ConfigProvider} from "antd/es/config-provider";
import {getAntdLocale} from "@lowcoder-ee/i18n/antdLocale";
import {default as App} from "antd/es/app";
import GlobalInstances from "components/GlobalInstances";
const LazyAppEditor = React.lazy(() => import("pages/editor/AppEditor"));



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
    brandName: getBrandingConfig(state)?.brandName ?? trans("productName"),
    uiLanguage: state.ui.users.user.uiLanguage,
});


const mapDispatchToProps = (dispatch: any) => ({
    getCurrentUser: () => {
        dispatch(fetchUserAction());
    },
    fetchConfig: (orgId?: string) => dispatch(fetchConfigAction(orgId)),
    fetchHomeData: (currentUserAnonymous: boolean | undefined) => {
        dispatch(fetchHomeData({}));
    },
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
});

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
    getIsCommonSettingFetched: boolean;
    currentOrgId?: string;
    currentUserId: string;
    currentUserAnonymous: boolean;
    orgDev: boolean;
    defaultHomePage: string | null | undefined;
    fetchHomeDataFinished: boolean;
    fetchConfig: (orgId?: string) => void;
    fetchHomeData: (currentUserAnonymous?: boolean | undefined) => void;
    fetchLowcoderCompVersions: () => void;
    getCurrentUser: () => void;
    favicon: string;
    brandName: string;
    uiLanguage: string;
};

class AppIndex extends React.Component<AppIndexProps, any> {
    componentDidMount() {
        this.props.getCurrentUser();
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
            }
        }
    }
    render() {
        const isTemplate = hasQueryParam('template');
        const pathname = history.location.pathname;

        // we check if we are on the public cloud
        const isLowCoderDomain = window.location.hostname === 'app.lowcoder.cloud';
        const isLocalhost = window.location.hostname === 'localhost';

        /* if (isLocalhost || isLowCoderDomain) {
          posthog.init('phc_lD36OXeppUehLgI33YFhioTpXqThZ5QqR8IWeKvXP7f', { api_host: 'https://eu.i.posthog.com', person_profiles: 'always' });
        } */

        // make sure all users in this app have checked login info
        if (!this.props.isFetchUserFinished || (this.props.currentUserId && !this.props.fetchHomeDataFinished)) {
            const hideLoadingHeader = isTemplate || isAuthUnRequired(pathname);
            return <ProductLoading hideHeader={hideLoadingHeader} />;
        }
        else {
            // if the user just logged in, we send the event to posthog
            if (isLocalhost || isLowCoderDomain) {
                if (sessionStorage.getItem('_just_logged_in_')) {
                    // posthog.identify(this.props.currentUserId);
                    sessionStorage.removeItem('_just_logged_in_');
                }
            }
        }

        return (
            <Wrapper language={this.props.uiLanguage}>
                <Helmet>
                    {<title>{this.props.brandName}</title>}
                    {<link rel="icon" href={this.props.favicon} />}
                    <meta name="description" content={trans('productDesc')} />
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
                        content={trans('productDesc')}
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
                        content={trans('productDesc')}
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
                            content={trans('productDesc')}
                        />,
                        <link
                            key="iframely"
                            rel="iframely"
                            type="text/html"
                            href={window.location.href}
                            media="(aspect-ratio: 1280/720)"
                        />,

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
                        />,
                        // adding Clearbit Support for Analytics
                        <script
                            key="clearbit-script"
                            src="https://tag.clearbitscripts.com/v1/pk_dfbc0aeefb28dc63475b67134facf127/tags.js"
                            referrerPolicy="strict-origin-when-cross-origin"
                            type="text/javascript"
                        ></script>,
                    ]}
                </Helmet>
                <SystemWarning />
                <Router history={history}>
                    <Switch>
                        <LazyRoute
                            fallback="layout"
                            path={APP_EDITOR_URL}
                            component={LazyAppEditor}
                        />
                    </Switch>
                </Router>
            </Wrapper>
        );
    }
}

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
