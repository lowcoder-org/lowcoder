/** `code` of every successful Lowcoder API response (ResponseView). */
export const API_OK = 1;

/** AppTypeEnum.Application in client/packages/lowcoder/src/constants/applicationConstants.ts. */
export const APP_TYPE_APPLICATION = 1;

/** Authentication source and id of the e-mail/password login, from GET /api/configs. */
export const AUTH_SOURCE_EMAIL = "EMAIL";
export const AUTH_ID_EMAIL = "EMAIL";

export const API_PATHS = {
  LOGIN: "/api/auth/form/login",
  CURRENT_USER: "/api/users/me",
  APPLICATIONS: "/api/applications",
  APPLICATION_LIST: "/api/applications/list",
  APPLICATION_RECYCLE_LIST: "/api/applications/recycle/list",
  INVITATION: "/api/invitation",
  MARK_USER_STATUS: "/api/users/mark-status",
  DATASOURCES: "/api/datasources",
} as const;

export function applicationPath(appId: string): string {
  return `${API_PATHS.APPLICATIONS}/${appId}`;
}

export function appViewPath(appId: string): string {
  return `${applicationPath(appId)}/view`;
}

export function appPermissionsPath(appId: string): string {
  return `${applicationPath(appId)}/permissions`;
}

export function publicToAllPath(appId: string): string {
  return `${applicationPath(appId)}/public-to-all`;
}

export function recyclePath(appId: string): string {
  return `${API_PATHS.APPLICATIONS}/recycle/${appId}`;
}

export function restorePath(appId: string): string {
  return `${API_PATHS.APPLICATIONS}/restore/${appId}`;
}

export function invitationAcceptPath(inviteCode: string): string {
  return `${API_PATHS.INVITATION}/${inviteCode}/invite`;
}

/** `code` of the API answer when the user may not view or edit the app (observed on the 3.0.0 image). */
export const API_CODE_APP_PERMISSION_DENIED = 5308;

export function publishPath(appId: string): string {
  return `${applicationPath(appId)}/publish`;
}

export const APP_PAGE = {
  EDIT: (appId: string) => `/apps/${appId}/edit`,
  VIEW: (appId: string) => `/apps/${appId}/view`,
} as const;

export const UI_PATHS = {
  REGISTER: "/user/auth/register",
  APP_LIST_PATH: "/apps",
  APP_LIST: /\/apps/,
  LOGIN: /\/user\/auth\/login/,
  /** Where a visitor who may not see an app lands: the sign-in page of the app's workspace. */
  LOGIN_IN_ORG: /\/org\/[^/]+\/auth\/login/,
} as const;

/** Meets the password rules of the sign-up form. */
export const TEST_PASSWORD = "Passw0rd-e2e";

/** User status flag that the new-user tour sets when it is finished (HomeTutorialsV2.tsx). */
export const NEW_USER_GUIDANCE_STATUS = "newUserGuidance";

/** The `example.test` domain cannot receive mail (RFC 2606). */
export const TEST_EMAIL_DOMAIN = "example.test";

export const TAGS = {
  SMOKE: "@smoke",
  CORE: "@core",
  SLOW: "@slow",
  QUARANTINE: "@quarantine",
  /** Components the browser loads from npm through the app's node-service; the app container needs internet access. */
  NPM: "@npm",
} as const;

/**
 * WORKAROUND for defect D-5 (client/E2E-TESTING-defects-report.md): a component dropped within about 0.5 s after
 * the editor reports ready gets the layout width 0 and is unusable. Measured on 3.0.0-e2e, 4 drops per delay:
 * 0 ms -> 4 of 4 had width 0, 500 ms -> 1 of 4, 1000 ms and more -> 0 of 4. Remove when the editor exposes a
 * signal for the layout being measured.
 */
export const GRID_SETTLE_MS = 1500;

export const SAVE_POLL_TIMEOUT_MS = 20_000;
export const INSERT_PANEL_TIMEOUT_MS = 30_000;
export const INSERT_PANEL_ATTEMPT_TIMEOUT_MS = 3_000;

/** Request failure reported by Chromium for a request that a Playwright route aborted with "blockedbyclient". */
export const BLOCKED_BY_CLIENT_ERROR = "net::ERR_BLOCKED_BY_CLIENT";

/** Origin the client reports to for subscriptions; the network guard has to block it. */
export const LOWCODER_CLOUD_FLOW_URL = "https://api-service.lowcoder.cloud/api/flow";

/**
 * The PostgreSQL sidecar that scripts/run-in-docker.sh starts on the run's network (see fixtures/sql/init.sql).
 * The run script passes its host name; the rest is fixed there.
 */
export const POSTGRES = {
  HOST_ENV: "E2E_POSTGRES_HOST",
  PORT: 5432,
  DATABASE: "shop",
  USERNAME: "postgres",
  PASSWORD: "e2e-postgres-password",
} as const;

export const SEEDED_ITEM_NAMES = ["alpha", "beta"] as const;

/** Component type, panel search text, drop position and generated name of the button the editor tests drop. */
export const BUTTON_COMP_TYPE = "button";
export const BUTTON_SEARCH_TEXT = "Button";
export const FIRST_BUTTON_NAME = "button1";
export const DROP_TARGET = { x: 120, y: 40 } as const;

/** A WebSocket endpoint on lowcoder.cloud, for the network guard test. */
export const LOWCODER_CLOUD_WS_URL = "wss://api-service.lowcoder.cloud/e2e-guard-check";

export const IMPORT_ATTEMPT_TIMEOUT_MS = 3_000;
export const IMPORT_TIMEOUT_MS = 20_000;
