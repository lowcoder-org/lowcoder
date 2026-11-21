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

/**
 * Annotation type of a test that lost an editor save (defect D-3) and redid its steps on a fresh app (p7 section 1). The
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
} as const;

/** Environment variables that widen the run beyond the default selection (read by playwright.config.ts). */
export const RUN_FLAGS = {
  INCLUDE_QUARANTINE: "E2E_INCLUDE_QUARANTINE",
  INCLUDE_INSERT_ALL: "E2E_INCLUDE_INSERT_ALL",
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
