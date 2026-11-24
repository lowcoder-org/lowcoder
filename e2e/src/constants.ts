/** `code` of every successful Lowcoder API response (ResponseView). */
export const API_OK = 1;

/** AppTypeEnum.Application in client/packages/lowcoder/src/constants/applicationConstants.ts. */
export const APP_TYPE_APPLICATION = 1;

/** AppTypeEnum.Module in the same file: a module is an app of this type that other apps embed. */
export const APP_TYPE_MODULE = 2;

/** The DSL a module has when it is created without one (recorded from the editor's "Create Module"). */
export const EMPTY_MODULE_DSL = { ui: { compType: "module", comp: {} } } as const;

/** The version tag of the second publication of an app (the first is FIRST_VERSION_TAG in api/client.ts). */
export const SECOND_VERSION_TAG = "2.0.0";

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
  /** `POST /api/datasources/test`: the connection test of a data source body (`DatasourceEndpoints.java`, `@PostMapping("/test")`). */
  DATASOURCE_TEST: "/api/datasources/test",
  /** `POST /api/datasources/getPluginDynamicConfig`: the dynamic form parameters of a node plugin (`DatasourceEndpoints.java`, `@PostMapping("/getPluginDynamicConfig")`). */
  PLUGIN_DYNAMIC_CONFIG: "/api/datasources/getPluginDynamicConfig",
  // Routes of the security helpers and scenarios (tests/security/):
  APPLICATION_RECORDS: "/api/application-records",
  APPLICATION_HISTORY_SNAPSHOTS: "/api/application/history-snapshots",
  BUNDLES: "/api/bundles",
  BUNDLE_LIST: "/api/bundles/list",
  FOLDERS: "/api/folders",
  FOLDER_ELEMENTS: "/api/folders/elements",
  ORGANIZATIONS: "/api/organizations",
  GROUPS: "/api/groups",
  GROUP_LIST: "/api/groups/list",
  USERS: "/api/users",
  USER_MY_ORG: "/api/users/myorg",
  USER_PHOTO: "/api/users/photo",
  USER_PASSWORD: "/api/users/password",
  USER_RESET_PASSWORD: "/api/users/reset-password",
  USER_LOST_PASSWORD: "/api/users/lost-password",
  AUTH_TP_LOGIN: "/api/auth/tp/login",
  AUTH_EMAIL_BIND: "/api/auth/email/bind",
  USER_RESET_LOST_PASSWORD: "/api/users/reset-lost-password",
  INVITATION_EMAIL: "/api/invitation/email/invite",
  AUTH_LOGOUT: "/api/auth/logout",
  AUTH_CONFIG: "/api/auth/config",
  AUTH_CONFIGS: "/api/auth/configs",
  API_KEYS: "/api/auth/api-key",
  QUERY_EXECUTE: "/api/query/execute",
  QUERY_EXECUTE_FROM_NODE: "/api/query/execute-from-node",
  LIBRARY_QUERIES: "/api/library-queries",
  CONFIGS: "/api/configs",
  META: "/api/meta/",
  STATUS_PROMETHEUS: "/api/status/prometheus",
  STATUS_METRICS: "/api/status/metrics",
  /** The registry proxy of the app: `<this>/<applicationId>/<package path>` (api/npm/PrivateNpmRegistryEndpoint.java). */
  NPM_REGISTRY: "/api/npm/registry",
  /** The package-asset proxy of the app: `<this>/<applicationId>/<package path>` (api/npm/PrivateNpmRegistryEndpoint.java). */
  NPM_PACKAGE: "/api/npm/package",
} as const;

/** `GET` path of the registry proxy for a package of the app; the proxy is open to anonymous callers (D-35). */
export function npmRegistryPath(appId: string, packageName: string): string {
  return `${API_PATHS.NPM_REGISTRY}/${appId}/${packageName}`;
}

/** Key of the organisation common setting that holds the npm registry entries (`PUT /api/organizations/{orgId}/common-settings`). */
export const NPM_REGISTRIES_SETTING_KEY = "npmRegistries";

/**
 * The HTTP echo sidecar that scripts/run-in-docker.sh starts on the run's network (scripts/echo-server.js): the target of
 * requests the SERVER makes inside the app container. `ECHO_ENV` names the variable the run script sets to its base URL.
 */
export const ECHO_ENV = "E2E_ECHO_URL";

/**
 * The variable the run script sets to the echo sidecar's IP address on the run network. A test whose plugin derives a host name
 * from the endpoint (an S3 virtual-host address `<bucket>.<host>`) points the endpoint at this address instead of the
 * `e2e-echo` alias, because a derived name is not covered by the alias mapping and may resolve outside the run network.
 */
export const ECHO_IP_ENV = "E2E_ECHO_IP";

/** The control routes of the echo sidecar; every other path is recorded and answered `{}`. */
export const ECHO_PATHS = { HEALTH: "/__e2e/health", REQUESTS: "/__e2e/requests", MAILS: "/__e2e/mails", ANSWERS: "/__e2e/answers" } as const;

/** Path prefix of the echo targets: a test's own target is `<ECHO_TARGET_PREFIX><worker>-<unique id>`, so parallel tests never read each other's records. */
export const ECHO_TARGET_PREFIX = "/t/";

/** Subjects of the mails the server sends (EmailCommunicationServiceImpl): a mail is told apart by its subject. */
export const MAIL_SUBJECTS = { PASSWORD_RESET: "Reset Your Lost Password", INVITATION: "You've been invited!" } as const;

/** The page a reset link opens (client routesURL.ts), and the query parameter that carries the token. */
export const RESET_PASSWORD_PAGE = "/user/auth/lost-password";
export const RESET_TOKEN_PARAM = "token";
/** The path of an invitation link in a mail, followed by the invitation code. */
export const INVITE_LINK_PATH = "/invite/";

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
  /** The classic one-step e-mail and password form, "for super admin" by its comment, open to anyone (`loginAdmin.tsx`). */
  ADMIN_LOGIN: "/admin/login",
} as const;

/** Meets the password rules of the sign-up form. */
export const TEST_PASSWORD = "Passw0rd-e2e";

/** User status flag of the pop-up for older non-developer users (`UserStatusType.java`). */
export const USER_STATUS_OLDER_NON_DEV_POPUP = "olderUserNonDevPopup";

/** User status flag that the new-user tour sets when it is finished (HomeTutorialsV2.tsx). */
export const NEW_USER_GUIDANCE_STATUS = "newUserGuidance";

/** The `example.test` domain cannot receive mail (RFC 2606). */
export const TEST_EMAIL_DOMAIN = "example.test";

/**
 * Annotation type of a test that lost an editor save (defect D-3) and redid its steps on a fresh app. The
 * D-3 threshold reporter counts the tests that carry it (src/reporters/d3-threshold-reporter.ts).
 */
export const D3_RETRY_ANNOTATION = "D-3 retry";

export const TAGS = {
  SMOKE: "@smoke",
  CORE: "@core",
  SLOW: "@slow",
  QUARANTINE: "@quarantine",
  /** Components the browser loads from npm through the app's node-service; the app container needs internet access. */
  NPM: "@npm",
  /**
   * The insert-every-component smoke test (S1, 112 tests): out of the default run, in only with
   * E2E_INCLUDE_INSERT_ALL (see src/run-selection.ts).
   */
  INSERT_ALL: "@insert-all",
  /** Access-control tests of tests/security/ (permission matrix, cross-workspace, abuse); see src/security/quarantine.ts. */
  SECURITY: "@security",
  /** A user-lifecycle test (sign-up to deletion), ids `LC-<area><nn>`; in the default run (see src/security/quarantine.ts). */
  LIFECYCLE: "@lifecycle",
  /**
   * The tests of the instance super admin (SEC-R16a to SEC-R16d): out of the default run and of the @security and @core
   * gate runs, in only with E2E_INCLUDE_SUPERADMIN (see src/run-selection.ts). On the 3.0.0 image the super admin is a
   * member of every workspace and its requests time out once the stack holds more than about 420 workspaces (defect
   * D-47), a size that repeated security runs reach. (SEC-R16c and SEC-R16d were quarantined until 3.0.1-e2e; they need only this flag now.)
   */
  SUPERADMIN: "@superadmin",
  /**
   * The tests of the second stack in ENTERPRISE workspace mode (SEC-E01 to SEC-E07b, tests/security/enterprise*.spec.ts):
   * out of every run on the default stack, the only ones of a run with E2E_STACK_PROFILE=enterprise (see
   * src/run-selection.ts). SEC-E05 also carries @quarantine (open defect D-40) and @superadmin.
   */
  ENTERPRISE: "@enterprise",
  /**
   * SEC-E05 alone: it resets the instance super admin's password, which breaks every later super-admin sign-in of its stack,
   * so it must never share a stack with another test. Out of every run unless E2E_INCLUDE_ENTERPRISE_TAKEOVER is set, and
   * then the ONLY test of the run (enterprise profile only; see src/run-selection.ts). It also carries @enterprise and @quarantine.
   */
  ENTERPRISE_TAKEOVER: "@enterprise-takeover",
  /**
   * The tests of the third stack, with the deployment setting LOWCODER_EMAIL_SIGNUP_ENABLED=false (tests/auth/signup-disabled.spec.ts):
   * out of every run on the other stacks, the only ones of a run with E2E_STACK_PROFILE=signup-disabled (see src/run-selection.ts).
   * Every fixture that makes a user signs up, so no other test can run on that stack.
   */
  SIGNUP_DISABLED: "@signup-disabled",
  /**
   * The tests of the data sources that run in node-service (the node plugins: the catalogue of the image, DuckDB, the
   * plugins pointed at the echo sidecar) and the stack-free unit spec of their helpers. A selection tag
   * (`--grep @node-service`), not an opt-in one: these tests stay in the default run.
   */
  NODE_SERVICE: "@node-service",
} as const;

/** Environment variables that widen the run beyond the default selection (read by playwright.config.ts). */
export const RUN_FLAGS = {
  INCLUDE_QUARANTINE: "E2E_INCLUDE_QUARANTINE",
  INCLUDE_INSERT_ALL: "E2E_INCLUDE_INSERT_ALL",
  INCLUDE_SUPERADMIN: "E2E_INCLUDE_SUPERADMIN",
  /** Enterprise profile only: run SEC-E05 (`@enterprise-takeover`) and nothing else. */
  INCLUDE_ENTERPRISE_TAKEOVER: "E2E_INCLUDE_ENTERPRISE_TAKEOVER",
} as const;

/** Environment variable that picks the stack a run is made for; `run-in-docker.sh` sets it for the runner (read by playwright.config.ts). */
export const STACK_PROFILE_ENV = "E2E_STACK_PROFILE";

/**
 * The stacks `run-in-docker.sh` starts: `default` is the all-in-one image in its SAAS workspace mode, `enterprise` the same
 * image with LOWCODER_WORKSPACE_MODE=ENTERPRISE (one workspace shared by all users). A missing variable means `default`.
 */
export const STACK_PROFILES = { DEFAULT: "default", ENTERPRISE: "enterprise", SIGNUP_DISABLED: "signup-disabled" } as const;
export type StackProfile = (typeof STACK_PROFILES)[keyof typeof STACK_PROFILES];

/**
 * Names (only the names: the values are never in the code) of the environment variables that carry the instance super
 * admin of the stack. `e2e/scripts/run-in-docker.sh` sets both for each run, with a new random password, and passes them
 * to the runner by name (`docker run -e NAME`). Read by `superAdminCredentials` (src/security/super-admin.ts).
 */
export const SUPER_ADMIN_ENV = {
  USERNAME: "E2E_SUPERUSER_USERNAME",
  PASSWORD: "E2E_SUPERUSER_PASSWORD",
} as const;

/**
 * WORKAROUND for defect D-5: a component dropped within about 0.5 s after
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

/** The browser local-storage key under which an app's `localStorage` component keeps its values. */
export const LOCAL_STORAGE_NAMESPACE = "lowcoder_app_local_storage";

/**
 * How long a test reads a text that must NOT change after a click that should deliver nothing (a module event
 * without a handler). The probes waited this long; the window bounds a late event, it does not exclude one.
 */
export const NEGATIVE_EVENT_WINDOW_MS = 1_000;

/** Labels the table component shows (toolbar and header filter), as the 3.0.0 client renders them. */
export const TABLE_LABELS = {
  /** Toolbar button that appears only while an edited cell has not been saved. */
  SAVE_CHANGES: "Save Changes",
  /** Confirmation button of a column filter menu. */
  FILTER_CONFIRM: "OK",
} as const;

/** The table component's default page size (recorded `pagination`, fixtures/dsl/table.json). */
export const TABLE_DEFAULT_PAGE_SIZE = 5;

/**
 * The read-only `products` table of fixtures/sql/init.sql, which the SQL generates. Keep both in step.
 * `FIRST_FIVE_STOCK` is `stock` of ids 1 to 5, the oracle D1 reads through `slice(0, 5)`.
 */
export const PRODUCTS = {
  ROW_COUNT: 25,
  FIRST_NAME: "product-01",
  LAST_NAME: "product-25",
  CATEGORY_COUNTS: { tools: 8, books: 9, games: 8 },
  FIRST_FIVE_STOCK: [3, 6, 9, 12, 15],
  COLUMNS: ["id", "name", "category", "price", "stock"],
} as const;

/** Labels of the editor's Extensions panel (Insert tab) and its two "add npm package" dialogs. */
export const EXTENSIONS_LABELS = {
  PANEL: "Extensions",
  INSERT_TAB: "Insert",
  ADD_PLUGIN: "Add npm Plugin",
  ADD_TEMPLATE: "Add npm Template",
  /** Titles of the two lists; each list's tiles sit in the element that follows its title. */
  PLUGIN_LIST_TITLE: "Plugins",
  TEMPLATE_LIST_TITLE: "Templates",
  EMPTY_PLUGINS: "No plugins added yet.",
  EMPTY_TEMPLATES: "No templates added yet.",
} as const;

/** Test id prefix of a tile of the insert panel; an npm package's tile id is `insert-comp-remote#npm#<pkg>@<version>#<type>`. */
export const INSERT_TILE_TEST_ID_PREFIX = "insert-comp-";
export const NPM_TILE_TEST_ID_PREFIX = `${INSERT_TILE_TEST_ID_PREFIX}remote#npm#`;
/** Test id of every module tile of the Extensions panel (the tile shows the module's name). */
export const MODULE_TILE_TEST_ID = `${INSERT_TILE_TEST_ID_PREFIX}module`;

/** How long an npm package takes to become a tile (the app's node-service fetches it from the registry; 1.2 s measured). */
export const NPM_PACKAGE_TILE_TIMEOUT_MS = 90_000;
/** How long the editor takes to show a dropped module instance in the component list. */
export const MODULE_INSTANCE_TIMEOUT_MS = 15_000;

/** Labels of the property panel's event handler list and of the action popover (3.0.0 client, English). */
export const EVENT_HANDLER_LABELS = {
  ADD: "Add",
  /** The action a new handler starts with. */
  DEFAULT_ACTION: "Run a Data Query",
  SET_TEMP_STATE_ACTION: "Set a Temporary State value",
  /** Row label of the state select in the "Set a Temporary State value" popover. */
  STATE_FIELD: "State",
  /** Row label of the value field of that popover. */
  VALUE_FIELD: "value",
} as const;

/** Positions of the `.ant-select`s in the action popover (recorded: the action type, the State, the Debounce select). */
export const ACTION_POPOVER_SELECT_INDEX = { ACTION_TYPE: 0, STATE: 1 } as const;

/** How long one step of the action popover waits for its element before the handler setup is retried. */
export const ACTION_STEP_TIMEOUT_MS = 10_000;

/** How long a re-entered handler popover is given to show its State row, which tells that the action is already set. */
export const ACTION_REENTRY_PROBE_MS = 2_000;

// ---------------------------------------------------------------------------------------------------------------
// Security tests (tests/security/, helpers in src/security/ and the security helpers of src/api/client.ts)
// ---------------------------------------------------------------------------------------------------------------

/** `MemberRole` of an organisation member or group member (domain/organization/model/MemberRole.java:9-11). */
export const ORG_ROLES = { ADMIN: "admin", MEMBER: "member", SUPER_ADMIN: "super_admin" } as const;
export type OrgRole = (typeof ORG_ROLES)[keyof typeof ORG_ROLES];

/** `ResourceRole` of an app, datasource, folder or bundle grant (domain/permission/model/ResourceRole.java:20-22). */
export const APP_ROLES = { VIEWER: "viewer", EDITOR: "editor", OWNER: "owner" } as const;
export type AppRole = (typeof APP_ROLES)[keyof typeof APP_ROLES];

/** What a denied or failed call answers: the HTTP status and the `code` of the `ResponseView` body. */
export interface ApiError {
  status: number;
  /** `undefined` when the answer has no JSON body (the entry point of an unauthenticated call sets only the status). */
  code: number | undefined;
}

/**
 * `{ status, code }` of the `BizError` constants the security tests expect, copied from
 * server/api-service/lowcoder-sdk/src/main/java/org/lowcoder/sdk/exception/BizError.java (unchanged since 3.0.0).
 * A test asserts both fields. The line numbers of the file are in the comments.
 */
export const API_ERRORS = {
  /** An authenticated route called without a session: the entry point answers the status only, no body
   *  (api/framework/security/AuthenticationEntryPoint.java:17-21). */
  UNAUTHENTICATED: { status: 401, code: undefined },
  INTERNAL_SERVER_ERROR: { status: 500, code: 5000 }, // :13
  NOT_AUTHORIZED: { status: 401, code: 5001 }, // :14
  INVALID_PARAMETER: { status: 500, code: 5002 }, // :15
  UNSUPPORTED_OPERATION: { status: 400, code: 5003 }, // :16
  NO_RESOURCE_FOUND: { status: 500, code: 5005 }, // :18
  INVALID_ORG_ID: { status: 500, code: 5100 }, // :28
  LAST_ADMIN_CANNOT_LEAVE_ORG: { status: 500, code: 5102 }, // :30
  UNABLE_TO_FIND_VALID_ORG: { status: 500, code: 5105 }, // :33
  INVALID_GROUP_ID: { status: 500, code: 5150 }, // :38
  /** The last admin of a group leaving it (`BizError.java`). */
  CANNOT_LEAVE_GROUP: { status: 500, code: 5152 }, // :40
  /** Deleting the all-users or the developers group. */
  CANNOT_DELETE_SYSTEM_GROUP: { status: 500, code: 5154 }, // :42
  NEED_DEV_TO_CREATE_RESOURCE: { status: 500, code: 5155 }, // :44
  INVALID_INVITATION_CODE: { status: 400, code: 5200 }, // :47
  QUERY_NOT_FOUND: { status: 500, code: 5300 }, // :55
  ILLEGAL_APPLICATION_PERMISSION_ID: { status: 500, code: 5302 }, // :57
  NO_PERMISSION_TO_VIEW: { status: 403, code: 5304 }, // :59
  INVALID_HISTORY_SNAPSHOT: { status: 500, code: 5307 }, // :63
  /** Equal to API_CODE_APP_PERMISSION_DENIED, which stays for the existing tests. */
  NO_PERMISSION_TO_REQUEST_APP: { status: 403, code: 5308 }, // :65
  APPLICATION_AND_ORG_NOT_MATCH: { status: 400, code: 5309 }, // :66
  DATASOURCE_NOT_FOUND: { status: 500, code: 5500 }, // :69
  DATASOURCE_AND_APP_ORG_NOT_MATCH: { status: 500, code: 5510 }, // :80
  USER_NOT_SIGNED_IN: { status: 401, code: 5600 }, // :85
  /** An upload above the configured limit (`avatarMaxSizeInKb`, 300; read in the code, not measured: 3.0.0 accepts it). */
  PAYLOAD_TOO_LARGE: { status: 413, code: 5700 },
  /** `PUT /api/users/mark-status` with a type that is not a user status (`UserController.java`; `BizError` INVALID_USER_STATUS). */
  INVALID_USER_STATUS: { status: 500, code: 6200 }, // :135
  /** The form sign-up of an address that is registered, in any casing (`FormAuthRequest.java`). */
  USER_LOGIN_ID_EXIST: { status: 403, code: 5607 }, // :107
  /** The form login of a wrong password, an unknown address and (ENTERPRISE mode, measured) a user deleted by a removal. */
  INVALID_PASSWORD: { status: 403, code: 5608 }, // :92
  /** A second sign-in configuration of a provider type that already has one (`AuthenticationApiServiceImpl.java` [3.0.0] `:308-323`; NOT enforced on the image, D-61). */
  DUPLICATE_AUTH_CONFIG_ADDITION: { status: 400, code: 5621 },
  /** A provider sign-in whose user the workspace's configuration may not create ("Allow Registration" off). */
  USER_NOT_EXIST: { status: 400, code: 5618 },
  /** A provider sign-in whose token or user-info call failed (`Failed to get OIDC information`; measured for an `invalid_grant` token answer). */
  OIDC_INFORMATION_FAILED: { status: 500, code: 5601 },
  /** Disabling or deleting the last enabled sign-in configuration of a workspace (measured). */
  DISABLE_AUTH_CONFIG_FORBIDDEN: { status: 403, code: 5617 },
  /** The form sign-up of an address that does not look like an e-mail address (`FormAuthRequest.java`). */
  INVALID_EMAIL_FORMAT: { status: 400, code: 5623 }, // :91
  LIBRARY_QUERY_AND_ORG_NOT_MATCH: { status: 400, code: 6103 }, // :131
  LIBRARY_QUERY_NOT_FOUND: { status: 400, code: 6104 }, // :132
  USER_BANNED: { status: 500, code: 6201 }, // :136
  FOLDER_OPERATE_NO_PERMISSION: { status: 500, code: 6301 }, // :143
  ILLEGAL_FOLDER_PERMISSION_ID: { status: 500, code: 6304 }, // :146
  BUNDLE_OPERATE_NO_PERMISSION: { status: 500, code: 6401 }, // :152
  ILLEGAL_BUNDLE_PERMISSION_ID: { status: 500, code: 6404 }, // :155
  ORGANIZATION_NOT_FOUND: { status: 400, code: 6701 }, // :165
} as const satisfies Record<string, ApiError>;

/**
 * The published default of LOWCODER_API_KEY_SECRET (deploy/docker/default.env:100). Only SEC-A01 uses it, to forge
 * an API-key token and prove the server refuses one signed with a public value. It is documented public text, not a
 * credential of this throw-away stack; whether the image runs with it does not change A01's expected result.
 */
export const PUBLIC_DEFAULT_API_KEY_SECRET = "5a41b090758b39b226603177ef48d73ae9839dd458ccb7e66f7e7cc028d5a50b";

/**
 * Name of the session cookie (LOWCODER_COOKIE_NAME, deploy/docker/default.env:59). The helper unit test reads it from
 * the `Set-Cookie` of a registration, which tells whether the image overrides it.
 */
export const SESSION_COOKIE_NAME = "LOWCODER_CE_SELFHOST_TOKEN";

export function appSlugPath(appId: string): string {
  return `${applicationPath(appId)}/slug`;
}

export function appPermissionPath(appId: string, permissionId: string): string {
  return `${appPermissionsPath(appId)}/${permissionId}`;
}

export function appRecordsByAppPath(): string {
  return `${API_PATHS.APPLICATION_RECORDS}/listByApplicationId`;
}

export function snapshotsPath(appId: string): string {
  return `${API_PATHS.APPLICATION_HISTORY_SNAPSHOTS}/${appId}`;
}

export function snapshotPath(appId: string, snapshotId: string): string {
  return `${snapshotsPath(appId)}/${snapshotId}`;
}

export function bundlePath(bundleId: string): string {
  return `${API_PATHS.BUNDLES}/${bundleId}`;
}

export function bundleRecyclePath(bundleId: string): string {
  return `${API_PATHS.BUNDLES}/recycle/${bundleId}`;
}

export function bundleViewPath(bundleId: string): string {
  return `${bundlePath(bundleId)}/view`;
}

export function bundleElementsPath(bundleId: string): string {
  return `${bundlePath(bundleId)}/elements`;
}

/** `PUT /api/bundles/addApp/{appId}?toBundleId=`: the bundle goes in the query. */
export function bundleAddAppPath(appId: string): string {
  return `${API_PATHS.BUNDLES}/addApp/${appId}`;
}

export function bundleReorderPath(bundleId: string): string {
  return `${bundlePath(bundleId)}/reorder`;
}

export function bundlePermissionsPath(bundleId: string): string {
  return `${bundlePath(bundleId)}/permissions`;
}

export function bundlePublishPath(bundleId: string): string {
  return `${bundlePath(bundleId)}/publish`;
}

export function bundlePublicToAllPath(bundleId: string): string {
  return `${bundlePath(bundleId)}/public-to-all`;
}

export function datasourcePath(datasourceId: string): string {
  return `${API_PATHS.DATASOURCES}/${datasourceId}`;
}

export function datasourceStructurePath(datasourceId: string): string {
  return `${datasourcePath(datasourceId)}/structure`;
}

export function datasourcePermissionsPath(datasourceId: string): string {
  return `${datasourcePath(datasourceId)}/permissions`;
}

/** The route of one datasource permission row; it has no datasource id (the server finds it from the row). */
export function datasourcePermissionPath(permissionId: string): string {
  return `${API_PATHS.DATASOURCES}/permissions/${permissionId}`;
}

export function folderPermissionsPath(folderId: string): string {
  return `${API_PATHS.FOLDERS}/${folderId}/permissions`;
}

export function folderPermissionPath(folderId: string, permissionId: string): string {
  return `${folderPermissionsPath(folderId)}/${permissionId}`;
}

/** `PUT /api/folders/move/{appId}?targetFolderId=`: the target folder goes in the query. */
export function folderMovePath(appId: string): string {
  return `${API_PATHS.FOLDERS}/move/${appId}`;
}

export function orgPath(orgId: string): string {
  return `${API_PATHS.ORGANIZATIONS}/${orgId}`;
}

export function orgMembersPath(orgId: string): string {
  return `${orgPath(orgId)}/members`;
}

export function orgCommonSettingsPath(orgId: string): string {
  return `${orgPath(orgId)}/common-settings`;
}

export function orgSlugPath(orgId: string): string {
  return `${orgPath(orgId)}/slug`;
}

export function orgUpdatePath(orgId: string): string {
  return `${orgPath(orgId)}/update`;
}

export function orgRolePath(orgId: string): string {
  return `${orgPath(orgId)}/role`;
}

/** `DELETE /api/organizations/{orgId}/remove?userId=`: the user goes in the query. */
export function orgRemoveMemberPath(orgId: string): string {
  return `${orgPath(orgId)}/remove`;
}

export function orgLeavePath(orgId: string): string {
  return `${orgPath(orgId)}/leave`;
}

export function switchOrgPath(orgId: string): string {
  return `${API_PATHS.ORGANIZATIONS}/switchOrganization/${orgId}`;
}

export function orgsByUserPath(email: string): string {
  return `${API_PATHS.ORGANIZATIONS}/byuser/${encodeURIComponent(email)}`;
}

export function groupMembersPath(groupId: string): string {
  return `${API_PATHS.GROUPS}/${groupId}/members`;
}

export function groupPotentialMembersPath(groupId: string): string {
  return `${API_PATHS.GROUPS}/${groupId}/potential-members`;
}

/** `DELETE /api/groups/{id}`: deletes a group (a system group answers `API_ERRORS.CANNOT_DELETE_SYSTEM_GROUP`). */
export function groupPath(groupId: string): string {
  return `${API_PATHS.GROUPS}/${groupId}`;
}

/** `PUT /api/groups/{id}/update`: renames a group. */
export function groupUpdatePath(groupId: string): string {
  return `${groupPath(groupId)}/update`;
}

/** `DELETE /api/groups/{id}/leave`: the caller leaves the group (the last group admin cannot). */
export function groupLeavePath(groupId: string): string {
  return `${groupPath(groupId)}/leave`;
}

export function groupAddMemberPath(groupId: string): string {
  return `${API_PATHS.GROUPS}/${groupId}/addMember`;
}

/** `DELETE /api/groups/{groupId}/remove?userId=`: the user goes in the query. */
export function groupRemoveMemberPath(groupId: string): string {
  return `${API_PATHS.GROUPS}/${groupId}/remove`;
}

export function groupRolePath(groupId: string): string {
  return `${API_PATHS.GROUPS}/${groupId}/role`;
}

/** `PUT /api/users/{orgId}/{userId}`: rename a user (server: admin of the path organisation). */
export function userProfilePath(orgId: string, userId: string): string {
  return `${API_PATHS.USERS}/${orgId}/${userId}`;
}

export function userPhotoPath(orgId: string, userId: string): string {
  return `${API_PATHS.USERS}/photo/${orgId}/${userId}`;
}

/** `POST /api/users/new/{orgId}`: an admin of the organisation creates a user with an e-mail and a password and adds it as a member. */
export function createUserInOrgPath(orgId: string): string {
  return `${API_PATHS.USERS}/new/${orgId}`;
}

export function apiKeyPath(apiKeyId: string): string {
  return `${API_PATHS.API_KEYS}/${apiKeyId}`;
}

export function libraryQueryPath(libraryQueryId: string): string {
  return `${API_PATHS.LIBRARY_QUERIES}/${libraryQueryId}`;
}

export function configPath(key: string): string {
  return `${API_PATHS.CONFIGS}/${key}`;
}

/** `authType` of the OAuth configuration `seedOAuthConfig` stores: GitHub, which is only stored and never contacted. */
export const OAUTH_AUTH_TYPE = "GITHUB";

/** `clientId` of that configuration: a placeholder, nothing is ever sent to GitHub with it. */
export const OAUTH_DUMMY_CLIENT_ID = "e2e-dummy-client-id";

/**
 * Heading of the error page a signed-in user of ANOTHER workspace gets for an app's editor or published view (measured
 * on the 3.0.0 client: the denial 403 / 5308 of that user shows this, not the "no permission to view/edit" text a
 * member of the workspace gets). The page has no test id.
 */
export const NOT_IN_WORKSPACE_MESSAGE = "Insufficient permissions: you are not in the workspace, please contact admin of this workspace.";

/** `ApplicationStatus` of an app as the API reports it (domain/application/model/ApplicationStatus.java). */
export const APP_STATUS = { NORMAL: "NORMAL", RECYCLED: "RECYCLED" } as const;

/** Header and scheme of an API-key token (api/authentication/util/JWTUtils.java: `Authorization: Bearer <token>`). */
export const AUTHORIZATION_HEADER = "Authorization";
export const BEARER_PREFIX = "Bearer ";

/** Request header that carries a session cookie when a test replays a cookie value in a context that has none. */
export const COOKIE_HEADER = "Cookie";

// ---------------------------------------------------------------------------------------------------------------
// Constants of the role and abuse scenarios
// ---------------------------------------------------------------------------------------------------------------

/** `PUT /api/applications/{id}/public-to-marketplace` (body `{ publicToMarketplace }`). */
export function publicToMarketplacePath(appId: string): string {
  return `${applicationPath(appId)}/public-to-marketplace`;
}

/** `GET /api/datasources/listByOrg?orgId=`: the datasources of a workspace that the caller may USE. */
export function datasourcesByOrgPath(): string {
  return `${API_PATHS.DATASOURCES}/listByOrg`;
}

/** `GET /api/organizations/{orgId}/datasourceTypes`: the Java-native types plus every node plugin with its `definition` (`OrganizationEndpoints.java`, `@GetMapping("/{orgId}/datasourceTypes")`). */
export function orgDatasourceTypesPath(orgId: string): string {
  return `${orgPath(orgId)}/datasourceTypes`;
}

/** `GET /api/bundles/recycle/list`: the trash of bundles. */
export const BUNDLE_RECYCLE_LIST_PATH = "/api/bundles/recycle/list";

/**
 * The common-settings key that holds the password-reset e-mail template of a workspace
 * (domain/organization/model/Organization.java sanitiser, SF-20 / D-25): it must never reach an anonymous visitor.
 */
export const PASSWORD_RESET_EMAIL_TEMPLATE_KEY = "PASSWORD_RESET_EMAIL_TEMPLATE";

/** An origin that is not the app's, sent as `Origin` to read the server's CORS answer (SEC-A12). Never contacted. */
export const FOREIGN_ORIGIN = "https://evil.example.test";

/** Header names read by the CORS and forwarding scenarios. */
export const ORIGIN_HEADER = "Origin";
export const FORWARDED_FOR_HEADER = "X-Forwarded-For";
export const REAL_IP_HEADER = "X-Real-IP";
export const CORS_ALLOW_ORIGIN_HEADER = "access-control-allow-origin";
export const CORS_ALLOW_CREDENTIALS_HEADER = "access-control-allow-credentials";
export const SET_COOKIE_HEADER = "set-cookie";
/** The loopback address the node-service gate of `POST /api/query/execute-from-node` trusts (SEC-A05). */
export const LOOPBACK_ADDRESS = "127.0.0.1";

/** `GET /api/auth/api-keys`: the API keys of the signed-in user. */
export const API_KEYS_LIST_PATH = "/api/auth/api-keys";

/** Query parameter of `POST /api/users/password`, the route that sets a password with no old one ("Set Password"). */
export const USER_SET_PASSWORD_PARAM = "password";

/**
 * The messages of the two token refusals of `reset-lost-password` (both answer 500 / 5002, `INVALID_PARAMETER`): a token that is
 * stored but does not match, and an account with no live token (never requested, already used, or expired). Read from the
 * answer body of the 3.0.0 image (`UserServiceImpl.java` [3.0.0] `:448-455`).
 */
export const RESET_TOKEN_MESSAGES = {
  INVALID: "Invalid token received for password reset request",
  EXPIRED: "Token to reset the password has expired",
} as const;

/** The message of the server's password-rule refusal (INVALID_PASSWORD 403 / 5608, key PASSWORD_TOO_WEAK in `locale_en.properties`; D-48). */
export const PASSWORD_TOO_WEAK_MESSAGE = "The password must be at least 8 characters long, contain a letter and a digit, and contain no whitespace.";

/**
 * How long a test polls for the clean-up a removal, a leave or a workspace deletion starts (a listener on its own scheduler,
 * `OrganizationEventListener` [3.0.0]). Measured on the image: the rows of the user's groups and apps, and the memberships of a
 * deleted workspace, were gone within 40 ms; the bound leaves room for a loaded runner.
 */
export const MEMBERSHIP_CLEANUP_TIMEOUT_MS = 10_000;

/** The path of a workspace's own sign-in page, which lists its enabled providers. */
export function orgLoginPath(orgId: string): string {
  return `/org/${orgId}/auth/login`;
}

/** The notice the provider page shows for the last enabled configuration (`detail/index.tsx`; measured text). */
export const LAST_PROVIDER_NOTICE = "You can't disable/delete config as this is the only enabled configuration.";

/** The password a scenario changes to (meets the password rules like TEST_PASSWORD, differs from it). */
export const CHANGED_PASSWORD = "Passw0rd-e2e-changed";

/** Attributes the session cookie must carry (`CookieHelper.java:49-57`) and the one it must not (plain http stack). */
export const COOKIE_HTTP_ONLY = "HttpOnly";
export const COOKIE_SAME_SITE_LAX = "SameSite=Lax";
export const COOKIE_SECURE = "Secure";

/** Client routes of the settings and the data source pages (3.0.0 client; they are mounted for every user, the client redirects). */
export const SETTING_PATHS = {
  HOME: "/setting",
  /** The members of the "All Users" group: user name, joining time, role select. */
  MEMBERS: "/setting/permission/users",
  OAUTH_PROVIDER: "/setting/oauth-provider",
  /** The user groups: the group list with "Create Group" and "Invite Members". */
  GROUPS: "/setting/permission",
  /** The workspaces of the user: create, switch, edit, delete. */
  WORKSPACES: "/setting/organization",
} as const;
export const DATASOURCE_PAGE_PATH = "/datasource";
