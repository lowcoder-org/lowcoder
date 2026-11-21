import type { APIRequestContext, APIResponse } from "@playwright/test";
import {
  API_OK,
  API_PATHS,
  APP_TYPE_APPLICATION,
  APP_TYPE_MODULE,
  appPermissionsPath,
  applicationPath,
  appViewPath,
  AUTH_ID_EMAIL,
  AUTH_SOURCE_EMAIL,
  EMPTY_MODULE_DSL,
  invitationAcceptPath,
  NEW_USER_GUIDANCE_STATUS,
  publicToAllPath,
  publishPath,
  recyclePath,
  restorePath,
  TEST_PASSWORD,
} from "../constants";

/** A Lowcoder API call that did not answer with `code === API_OK`. The message carries the response body. */
export class LowcoderApiError extends Error {
  constructor(action: string, status: number, body: string) {
    super(`${action} failed: HTTP ${status}, body: ${body}`);
    this.name = "LowcoderApiError";
  }
}

interface ApiEnvelope<T> {
  code: number;
  message?: string;
  data: T;
}

async function unwrap<T>(action: string, response: APIResponse): Promise<T> {
  const text = await response.text();
  let envelope: ApiEnvelope<T>;
  try {
    envelope = JSON.parse(text) as ApiEnvelope<T>;
  } catch {
    throw new LowcoderApiError(action, response.status(), text);
  }
  if (!response.ok() || envelope.code !== API_OK) {
    throw new LowcoderApiError(action, response.status(), text);
  }
  return envelope.data;
}

export interface RegisteredUser {
  email: string;
  orgId: string;
}

interface CurrentUserData {
  orgAndRoles: { org: { id: string } }[];
}

/**
 * Registers a user with e-mail and password. The request context keeps the session cookie, so when it is the
 * `page.request` of a browser context the page is logged in as well.
 */
export async function registerUser(request: APIRequestContext, email: string): Promise<RegisteredUser> {
  await unwrap<unknown>(
    `register ${email}`,
    await request.post(API_PATHS.LOGIN, {
      data: {
        loginId: email,
        password: TEST_PASSWORD,
        register: true,
        source: AUTH_SOURCE_EMAIL,
        authId: AUTH_ID_EMAIL,
      },
    }),
  );
  await dismissNewUserGuidance(request);
  const me = await currentUser(request);
  const org = me.orgAndRoles[0];
  if (!org) {
    throw new LowcoderApiError(`register ${email}`, 200, "the new user has no workspace");
  }
  return { email, orgId: org.org.id };
}

/**
 * Marks the new-user tour as done. Otherwise the tour (react-joyride) opens on the first visit of the app list
 * and its overlay intercepts clicks. The tests that are about the tour itself do not exist yet.
 */
export async function dismissNewUserGuidance(request: APIRequestContext): Promise<void> {
  await unwrap<unknown>(
    "dismiss new user guidance",
    await request.put(API_PATHS.MARK_USER_STATUS, { data: { type: NEW_USER_GUIDANCE_STATUS, value: true } }),
  );
}

export async function currentUser(request: APIRequestContext): Promise<CurrentUserData> {
  return unwrap<CurrentUserData>("current user", await request.get(API_PATHS.CURRENT_USER));
}

export interface CreatedApp {
  appId: string;
}

interface CreateAppData {
  applicationInfoView: { applicationId: string };
}

/** POST /api/applications: the body differs between an app and a module only in `applicationType` and the default DSL. */
async function createApplication(
  action: string,
  request: APIRequestContext,
  params: { orgId: string; name: string; applicationType: number; dsl: object },
): Promise<CreatedApp> {
  const data = await unwrap<CreateAppData>(
    action,
    await request.post(API_PATHS.APPLICATIONS, {
      data: {
        orgId: params.orgId,
        name: params.name,
        applicationType: params.applicationType,
        editingApplicationDSL: params.dsl,
      },
    }),
  );
  return { appId: data.applicationInfoView.applicationId };
}

export async function createApp(
  request: APIRequestContext,
  params: { orgId: string; name: string; dsl?: object },
): Promise<CreatedApp> {
  return createApplication(`create app ${params.name}`, request, {
    ...params,
    applicationType: APP_TYPE_APPLICATION,
    dsl: params.dsl ?? {},
  });
}

/**
 * Creates a module (an app of type APP_TYPE_MODULE that other apps embed as a `module` component). `appId` of the
 * result is the module id a host's `moduleInstance` names. Without `dsl` the module is the empty one the editor's
 * "Create Module" posts (EMPTY_MODULE_DSL); build a filled one with `moduleApp`. A module is published like an app
 * (`publishApp`); a host uses its latest published version and, while it has none, its draft.
 */
export async function createModule(
  request: APIRequestContext,
  params: { orgId: string; name: string; dsl?: object },
): Promise<CreatedApp> {
  return createApplication(`create module ${params.name}`, request, {
    ...params,
    applicationType: APP_TYPE_MODULE,
    dsl: params.dsl ?? EMPTY_MODULE_DSL,
  });
}

export const FIRST_VERSION_TAG = "1.0.0";

/**
 * Publishes the draft as version `tag`, like the editor's publish dialog (which sends a commit message and a
 * version tag). A publish with an empty body works once; a second one with an empty body answered HTTP 500
 * "Service is busy" on the 3.0.0 image, so every publish names its version.
 */
export async function publishApp(
  request: APIRequestContext,
  appId: string,
  tag: string = FIRST_VERSION_TAG,
): Promise<void> {
  await unwrap<unknown>(
    `publish app ${appId} as ${tag}`,
    await request.post(publishPath(appId), { data: { commitMessage: `e2e ${tag}`, tag } }),
  );
}

interface AppData {
  /** The draft (editing) DSL: what GET /api/applications/{id} returns for the editor. */
  applicationDSL: unknown;
}

/** The stored draft DSL of an app, as the editor saved it. */
export async function getAppDsl(request: APIRequestContext, appId: string): Promise<AppData> {
  return unwrap<AppData>(`read app ${appId}`, await request.get(applicationPath(appId)));
}

export async function updateApp(
  request: APIRequestContext,
  appId: string,
  changes: { name?: string; dsl?: object },
): Promise<void> {
  await unwrap<unknown>(
    `update app ${appId}`,
    await request.put(applicationPath(appId), {
      data: {
        ...(changes.name === undefined ? {} : { name: changes.name }),
        ...(changes.dsl === undefined ? {} : { editingApplicationDSL: changes.dsl }),
      },
    }),
  );
}

export async function setPublicToAll(request: APIRequestContext, appId: string, publicToAll: boolean): Promise<void> {
  await unwrap<unknown>(
    `set public-to-all of ${appId}`,
    await request.put(publicToAllPath(appId), { data: { publicToAll } }),
  );
}

export interface AppSummary {
  applicationId: string;
  name: string;
  applicationStatus: string;
}

/** Names of the apps in the current workspace's list (not the trash). */
export async function listAppNames(request: APIRequestContext): Promise<string[]> {
  const apps = await unwrap<{ name: string }[]>(
    "list apps",
    await request.get(API_PATHS.APPLICATION_LIST, { params: { applicationType: APP_TYPE_APPLICATION } }),
  );
  return apps.map((app) => app.name);
}

export async function listRecycledApps(request: APIRequestContext): Promise<AppSummary[]> {
  return unwrap<AppSummary[]>("list recycled apps", await request.get(API_PATHS.APPLICATION_RECYCLE_LIST));
}

export async function recycleApp(request: APIRequestContext, appId: string): Promise<void> {
  await unwrap<unknown>(`recycle app ${appId}`, await request.put(recyclePath(appId)));
}

export async function restoreApp(request: APIRequestContext, appId: string): Promise<void> {
  await unwrap<unknown>(`restore app ${appId}`, await request.put(restorePath(appId)));
}

interface InviteData {
  inviteCode: string;
}

/** Creates an invitation link of a workspace; returns its code. */
export async function createInvitation(request: APIRequestContext, orgId: string): Promise<string> {
  const data = await unwrap<InviteData>(
    `invite to ${orgId}`,
    await request.post(API_PATHS.INVITATION, { params: { orgId } }),
  );
  return data.inviteCode;
}

export async function acceptInvitation(request: APIRequestContext, inviteCode: string): Promise<void> {
  await unwrap<unknown>(`accept invitation ${inviteCode}`, await request.get(invitationAcceptPath(inviteCode)));
}

export async function currentUserId(request: APIRequestContext): Promise<string> {
  const me = await unwrap<{ id: string }>("current user id", await request.get(API_PATHS.CURRENT_USER));
  return me.id;
}

export async function grantAppPermission(
  request: APIRequestContext,
  appId: string,
  params: { role: "viewer" | "editor"; userIds: string[] },
): Promise<void> {
  await unwrap<unknown>(
    `grant ${params.role} on ${appId}`,
    await request.put(appPermissionsPath(appId), { data: { role: params.role, userIds: params.userIds, groupIds: [] } }),
  );
}

/**
 * The raw answer of GET /api/applications/{id}/view (the published app). Not unwrapped: tests also need the
 * failure answers (permission denied) and compare their `code`.
 */
export async function viewAppRaw(request: APIRequestContext, appId: string): Promise<{ status: number; code: number }> {
  const response = await request.get(appViewPath(appId));
  const body = (await response.json()) as { code: number };
  return { status: response.status(), code: body.code };
}

/** The raw answer of GET /api/applications/{id} (the editable app), see viewAppRaw. */
export async function editAppRaw(request: APIRequestContext, appId: string): Promise<{ status: number; code: number }> {
  const response = await request.get(applicationPath(appId));
  const body = (await response.json()) as { code: number };
  return { status: response.status(), code: body.code };
}

export interface PostgresConnection {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
}

/** Creates a PostgreSQL data source in the workspace; returns its id. */
export async function createPostgresDatasource(
  request: APIRequestContext,
  params: { orgId: string; name: string; connection: PostgresConnection },
): Promise<string> {
  const data = await unwrap<{ id: string }>(
    `create datasource ${params.name}`,
    await request.post(API_PATHS.DATASOURCES, {
      data: {
        name: params.name,
        type: "postgres",
        organizationId: params.orgId,
        // extParams is a map; a list is rejected as an illegal configuration
        datasourceConfig: { ...params.connection, usingSsl: false, extParams: {} },
      },
    }),
  );
  return data.id;
}
