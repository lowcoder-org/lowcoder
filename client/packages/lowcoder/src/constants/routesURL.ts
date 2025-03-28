import { AppViewMode, MarketplaceType } from "constants/applicationConstants";
import { LocationDescriptor } from "history";
import { UserGuideLocationState } from "pages/tutorials/tutorialsConstant";
import { DatasourceType } from "@lowcoder-ee/constants/queryConstants";

export const BASE_URL = "/";
export const ADMIN_AUTH_URL = "/admin/login";
export const USER_AUTH_URL = "/user/auth";
export const USER_PROFILE_URL = "/user/profile";
export const NEWS_URL = "/news";
export const ORG_HOME_URL = "/org/home";
export const COMPONENT_DOC_URL = "/components";
export const SETTING_URL = "/setting";
export const SUPPORT_URL = "/support";
export const PERMISSION_SETTING = "/setting/permission";
export const ORGANIZATION_SETTING = "/setting/organization";
export const SUBSCRIPTION_SETTING = "/setting/subscription";
export const ENVIRONMENT_SETTING = "/setting/environments";
export const ENVIRONMENT_DETAIL = `${ENVIRONMENT_SETTING}/:environmentId`;
export const ENVIRONMENT_WORKSPACE_DETAIL = `${ENVIRONMENT_DETAIL}/workspaces/:workspaceId`;
export const THEME_SETTING = "/setting/theme";
export const PLUGINS_SETTING = "/setting/plugins";
export const THEME_DETAIL = "/setting/theme/detail";
export const THEME_DETAIL_URL = `${THEME_DETAIL}/:themeId`;
export const AUDIT_LOG_DASHBOARD = "/setting/audit";
export const AUDIT_LOG_DETAIL = "/setting/audit/:eventId/detail";
export const APP_USAGE_DASHBOARD = "/setting/app-usage";
export const APP_USAGE_DETAIL = "/setting/app-usage/:eventId/detail";

export const OAUTH_PROVIDER_SETTING = "/setting/oauth-provider";
export const OAUTH_PROVIDER_DETAIL = "/setting/oauth-provider/detail";

export const PERMISSION_SETTING_DETAIL = `${PERMISSION_SETTING}/:groupId`;
export const ORGANIZATION_SETTING_DETAIL = `${ORGANIZATION_SETTING}/:orgId`;

export const SUBSCRIPTION_SUCCESS = `${SUBSCRIPTION_SETTING}/success`;
export const SUBSCRIPTION_CANCEL = `${SUBSCRIPTION_SETTING}/cancel`;
export const SUBSCRIPTION_ERROR = `${SUBSCRIPTION_SETTING}/error`;
export const SUBSCRIPTION_DETAIL = `${SUBSCRIPTION_SETTING}/details/:subscriptionId/:productId`;
export const SUBSCRIPTION_INFO = `${SUBSCRIPTION_SETTING}/info/:productId`;

export const SUPPORT_DETAIL = `${SUPPORT_URL}/details/:ticketId`;

export const ALL_APPLICATIONS_URL = "/apps";
export const ADMIN_APP_URL = "/ee/:applicationId/:viewMode";
export const APPLICATION_MARKETPLACE_URL = `https://app.lowcoder.cloud/apps`;
export const MODULE_APPLICATIONS_URL = "/apps/module";
export const MARKETPLACE_URL = `/marketplace`;
export const DATASOURCE_URL = `/datasource`;
export const DATASOURCE_CREATE_URL = `${DATASOURCE_URL}/new/:datasourceType`;
export const DATASOURCE_EDIT_URL = `${DATASOURCE_URL}/:datasourceId`;
export const QUERY_LIBRARY_URL = `/query-library`;
export const FOLDER_URL_PREFIX = `/folder`;
export const FOLDER_URL = `${FOLDER_URL_PREFIX}/:folderId`;
export const FOLDERS_URL = `/folders`;
export const TRASH_URL = `/trash`;
export const IMPORT_APP_FROM_TEMPLATE_URL = `${ALL_APPLICATIONS_URL}/template-import/:templateId`;
export const APP_EDITOR_URL = `${ALL_APPLICATIONS_URL}/:applicationId/:viewMode/:appPageId?`;
export const PUBLIC_APP_EDITOR_URL = `/editor/public`;

export const AUTH_BIND_URL = `${USER_AUTH_URL}/bind`;
export const AUTH_LOGIN_URL = `${USER_AUTH_URL}/login`;
export const AUTH_REGISTER_URL = `${USER_AUTH_URL}/register`;
export const AUTH_FORGOT_PASSWORD_URL = `${USER_AUTH_URL}/forgot-password`;
export const AUTH_RESET_PASSWORD_URL = `${USER_AUTH_URL}/lost-password`;
export const QR_CODE_OAUTH_URL = `${USER_AUTH_URL}/oauth/qrcode`;
export const OAUTH_REDIRECT = `${USER_AUTH_URL}/oauth/redirect`;
export const CAS_AUTH_REDIRECT = `${USER_AUTH_URL}/cas/redirect`;
export const LDAP_AUTH_LOGIN_URL = `${USER_AUTH_URL}/ldap/login`;
export const INVITE_LANDING_URL = "/invite/:invitationId";
export const ORG_AUTH_LOGIN_URL = `/org/:orgId/auth/login`;
export const ORG_AUTH_REGISTER_URL = `/org/:orgId/auth/register`;
export const ORG_AUTH_FORGOT_PASSWORD_URL = `/org/:orgId/auth/forgot-password`;
export const ORG_AUTH_RESET_PASSWORD_URL = `/org/:orgId/auth/lost-password`;
export const MARKETPLACE_TYPE_URL = `${MARKETPLACE_URL}/:marketplaceType`;

export const APPLICATION_VIEW_URL = (appId: string, viewMode: AppViewMode) =>
  `${ALL_APPLICATIONS_URL}/${appId}/${viewMode}`;

export const APPLICATION_MARKETPLACE_VIEW_URL = (appId: string, viewMode: AppViewMode) =>
`${APPLICATION_MARKETPLACE_URL}/${appId}/${viewMode}`;

export const MARKETPLACE_URL_BY_TYPE = (type: MarketplaceType) =>
  `${MARKETPLACE_URL}/${type}`;

export const isAuthUnRequired = (pathname: string): boolean => {
  return (
    pathname.startsWith("/invite/") ||
    pathname.startsWith(USER_AUTH_URL) ||
    pathname.endsWith('/auth/login') ||
    pathname.endsWith('/auth/register') ||
    pathname.startsWith(COMPONENT_DOC_URL)
  );
};

export const buildDatasourceCreateUrl = (datasourceType: DatasourceType) =>
  `${DATASOURCE_URL}/new/${datasourceType}`;
export const buildDatasourceEditUrl = (datasourceId: string) => `${DATASOURCE_URL}/${datasourceId}`;

export const buildFolderUrl = (folderId: string) => `${FOLDER_URL_PREFIX}/${folderId}`;

export const buildAppRouteWithState = (
  appId: string,
  showGuide: boolean
): LocationDescriptor<UserGuideLocationState> => {
  return {
    pathname: APPLICATION_VIEW_URL(appId, "edit"),
    state: {
      showNewUserGuide: showGuide,
    },
  };
};

export function preview(applicationId: string) {
  window.open(APPLICATION_VIEW_URL(applicationId, "preview"));
}

export const buildGroupId = (groupId: string) => `${PERMISSION_SETTING}/${groupId}`;

export const buildOrgId = (orgId: string) => `${ORGANIZATION_SETTING}/${orgId}`;

export const buildSubscriptionSettingsLink = (subscriptionId: string, productId : string) => `${SUBSCRIPTION_SETTING}/details/${subscriptionId}/${productId}`;
export const buildSubscriptionInfoLink = (productId: string) => `${SUBSCRIPTION_SETTING}/info/${productId}`;

export const buildSupportTicketLink = (ticketId: string) => `${SUPPORT_URL}/details/${ticketId}`;

export const buildEnvironmentId = (environmentId: string) => `${ENVIRONMENT_SETTING}/${environmentId}`;
export const buildEnvironmentWorkspaceId = (environmentId: string, workspaceId: string) => 
  `${ENVIRONMENT_SETTING}/${environmentId}/workspaces/${workspaceId}`;