import type { APIRequestContext, APIResponse } from "@playwright/test";
import { recordedN8nDatasource } from "../dsl/recorded";
import {
  API_ERRORS,
  API_OK,
  API_PATHS,
  APP_TYPE_APPLICATION,
  APP_TYPE_MODULE,
  appPermissionPath,
  appPermissionsPath,
  applicationPath,
  appViewPath,
  AUTH_ID_EMAIL,
  AUTH_SOURCE_EMAIL,
  appRecordsByAppPath,
  bundleAddAppPath,
  bundleElementsPath,
  bundlePath,
  bundlePermissionsPath,
  bundleRecyclePath,
  bundleViewPath,
  datasourcePermissionPath,
  datasourcePermissionsPath,
  EMPTY_MODULE_DSL,
  folderMovePath,
  folderPermissionPath,
  folderPermissionsPath,
  groupAddMemberPath,
  groupMembersPath,
  groupRemoveMemberPath,
  groupRolePath,
  invitationAcceptPath,
  NEW_USER_GUIDANCE_STATUS,
  NPM_REGISTRIES_SETTING_KEY,
  orgCommonSettingsPath,
  orgMembersPath,
  orgRemoveMemberPath,
  orgRolePath,
  publicToAllPath,
  publishPath,
  recyclePath,
  restorePath,
  snapshotsPath,
  orgLeavePath,
  switchOrgPath,
  TEST_PASSWORD,
  apiKeyPath,
  OAUTH_AUTH_TYPE,
  OAUTH_DUMMY_CLIENT_ID,
  type AppRole,
  type OrgRole,
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
  /** Display name of the user (`GET /api/users/me`). */
  name?: string;
  /** The name the app shows for the user (measured: the e-mail address until the user sets a nickname). */
  username?: string;
  /** UI language code (`en`, `de`...). */
  uiLanguage?: string;
  /** The avatar's URL; `null` or absent without an avatar. */
  avatarUrl?: string | null;
  /** Flags set through `PUT /api/users/mark-status`. */
  userStatus?: Record<string, boolean>;
  orgAndRoles: { org: { id: string; name?: string }; role?: string }[];
  /** The workspace the user's routes act in (a flag on the membership row, not on the session). */
  currentOrgId?: string;
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
 * The form sign-up of `registerUser` as a raw answer (no unwrap), for the call under test: the answer of a refused
 * sign-up is the subject. The request context keeps the session cookie when the sign-up works.
 */
export async function registerRaw(request: APIRequestContext, email: string, password: string): Promise<RawAnswer> {
  return apiRaw(request, "POST", API_PATHS.LOGIN, {
    data: { loginId: email, password, register: true, source: AUTH_SOURCE_EMAIL, authId: AUTH_ID_EMAIL },
  });
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
  /** The app's gid (`applicationGid` of the answer): the second id an app is addressable by (SEC-C01b). */
  appGid?: string;
}

interface CreateAppData {
  applicationInfoView: { applicationId: string; applicationGid?: string };
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
  return { appId: data.applicationInfoView.applicationId, appGid: data.applicationInfoView.applicationGid };
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
  params: { role: AppRole; userIds: string[]; groupIds?: string[] },
): Promise<void> {
  await unwrap<unknown>(
    `grant ${params.role} on ${appId}`,
    await request.put(appPermissionsPath(appId), {
      data: { role: params.role, userIds: params.userIds, groupIds: params.groupIds ?? [] },
    }),
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

// ---------------------------------------------------------------------------------------------------------------
// Security helpers. The call under test of a security test goes through `apiRaw`; the setup calls
// below unwrap and throw. None of them creates a request context: the caller passes its own (fixture-owned) one.
// ---------------------------------------------------------------------------------------------------------------

export type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";

/** The answer of `apiRaw`: nothing is unwrapped and nothing throws on a failure status. */
export interface RawAnswer {
  status: number;
  /** `code` of the `ResponseView` body; `undefined` when the body is not JSON or has no numeric `code`. */
  code: number | undefined;
  /** The body text exactly as received (empty for an answer without a body). */
  body: string;
  /** The body parsed as JSON, `undefined` when it is not JSON. */
  json: unknown;
  /** Response headers, names in lower case; a header sent several times (`set-cookie`) is joined with a newline. */
  headers: Record<string, string>;
}

export interface RawRequestOptions {
  /** JSON body (an object or array), or a string sent as it is. */
  data?: unknown;
  params?: Record<string, string | number | boolean>;
  headers?: Record<string, string>;
  /** A multipart form body (a file upload); sent instead of `data`. */
  multipart?: Record<string, { name: string; mimeType: string; buffer: Buffer }>;
}

/**
 * Sends one request and returns status, `code` and body without unwrapping. Use it for the call under test of every
 * security test: `unwrap` throws on any failure, which would turn a correct denial into a test error. Generalises
 * `viewAppRaw` / `editAppRaw`, which stay.
 */
export async function apiRaw(
  request: APIRequestContext,
  method: HttpMethod,
  path: string,
  options: RawRequestOptions = {},
): Promise<RawAnswer> {
  const response = await request.fetch(path, {
    method,
    data: options.data,
    multipart: options.multipart,
    params: options.params,
    headers: options.headers,
  });
  const body = await response.text();
  let json: unknown;
  try {
    json = JSON.parse(body);
  } catch {
    json = undefined;
  }
  const code = typeof json === "object" && json !== null ? (json as { code?: unknown }).code : undefined;
  return { status: response.status(), code: typeof code === "number" ? code : undefined, body, json, headers: response.headers() };
}

/** Makes the organisation the user's current one (the flag is on the membership row, not on the session). */
export async function switchOrganization(request: APIRequestContext, orgId: string): Promise<void> {
  await unwrap<unknown>(`switch to organisation ${orgId}`, await request.put(switchOrgPath(orgId)));
}

export async function updateMemberRole(
  request: APIRequestContext,
  orgId: string,
  userId: string,
  role: OrgRole,
): Promise<void> {
  await unwrap<unknown>(
    `set role ${role} of ${userId} in ${orgId}`,
    await request.put(orgRolePath(orgId), { data: { userId, role } }),
  );
}

/** One row of the member list of a workspace (`GET /api/organizations/{orgId}/members`, measured). */
export interface OrgMember {
  userId: string;
  name: string;
  /** `admin`, `member` or `super_admin`. */
  role: string;
}

/** The members of a workspace, the instance super admin included (`role` `super_admin`). Needs membership. */
export async function listOrgMembers(request: APIRequestContext, orgId: string): Promise<OrgMember[]> {
  const data = await unwrap<{ members: OrgMember[] }>(`list members of ${orgId}`, await request.get(orgMembersPath(orgId)));
  return data.members;
}

export async function removeOrgMember(request: APIRequestContext, orgId: string, userId: string): Promise<void> {
  await unwrap<unknown>(
    `remove ${userId} from ${orgId}`,
    await request.delete(orgRemoveMemberPath(orgId), { params: { userId } }),
  );
}

/**
 * One group of the current organisation as `GET /api/groups/list` reports it (measured on the 3.0.0 image: Jackson names
 * the Lombok booleans `devGroup` and `allUsersGroup`; the group has no `type` field, so the developer group is found by
 * the flag, not by the type `dev` of domain/group/util/SystemGroups.java:13).
 */
export interface GroupSummary {
  groupId: string;
  groupName: string;
  /** True for the system group of the workspace's developers (`isDevGroup` of `GroupView`). */
  devGroup: boolean;
  /** True for the system group every member belongs to. */
  allUsersGroup: boolean;
}

/** The groups of the user's current organisation. */
export async function listGroups(request: APIRequestContext): Promise<GroupSummary[]> {
  return unwrap<GroupSummary[]>("list groups", await request.get(API_PATHS.GROUP_LIST));
}

/** Creates a group in the user's current organisation; returns its id. */
export async function createGroup(request: APIRequestContext, name: string): Promise<string> {
  const data = await unwrap<{ groupId: string }>(
    `create group ${name}`,
    await request.post(API_PATHS.GROUPS, { data: { name } }),
  );
  return data.groupId;
}

export async function addGroupMember(
  request: APIRequestContext,
  groupId: string,
  userId: string,
  role: OrgRole,
): Promise<void> {
  await unwrap<unknown>(
    `add ${userId} to group ${groupId} as ${role}`,
    await request.post(groupAddMemberPath(groupId), { data: { userId, role } }),
  );
}

export async function removeGroupMember(request: APIRequestContext, groupId: string, userId: string): Promise<void> {
  await unwrap<unknown>(
    `remove ${userId} from group ${groupId}`,
    await request.delete(groupRemoveMemberPath(groupId), { params: { userId } }),
  );
}

export async function updateGroupMemberRole(
  request: APIRequestContext,
  groupId: string,
  userId: string,
  role: OrgRole,
): Promise<void> {
  await unwrap<unknown>(
    `set role ${role} of ${userId} in group ${groupId}`,
    await request.put(groupRolePath(groupId), { data: { userId, role } }),
  );
}

/** One row of a permission list (`PermissionItemView`): `permissionId` is what update and remove take. */
export interface PermissionItem {
  permissionId: string;
  /** `USER` or `GROUP`. */
  type: string;
  /** Id of the user or group the row is for. */
  id: string;
  name: string;
  role: string;
}

/** The permission list of an app, folder or datasource (`CommonPermissionView`, plus the app's public flags). */
export interface PermissionView {
  creatorId: string;
  groupPermissions: PermissionItem[];
  userPermissions: PermissionItem[];
  publicToAll?: boolean;
}

export async function listAppPermissions(request: APIRequestContext, appId: string): Promise<PermissionView> {
  return unwrap<PermissionView>(`list permissions of ${appId}`, await request.get(appPermissionsPath(appId)));
}

export async function updateAppPermission(
  request: APIRequestContext,
  appId: string,
  permissionId: string,
  role: AppRole,
): Promise<void> {
  await unwrap<unknown>(
    `set role ${role} of permission ${permissionId} on ${appId}`,
    await request.put(appPermissionPath(appId, permissionId), { data: { role } }),
  );
}

export async function removeAppPermission(request: APIRequestContext, appId: string, permissionId: string): Promise<void> {
  await unwrap<unknown>(
    `remove permission ${permissionId} of ${appId}`,
    await request.delete(appPermissionPath(appId, permissionId)),
  );
}

/** Creates a folder at the root of the user's current organisation; returns its id. */
export async function createFolder(request: APIRequestContext, name: string): Promise<string> {
  const data = await unwrap<{ folderId: string }>(
    `create folder ${name}`,
    await request.post(API_PATHS.FOLDERS, { data: { name } }),
  );
  return data.folderId;
}

/** Moves an app into the folder. */
export async function moveToFolder(request: APIRequestContext, appId: string, folderId: string): Promise<void> {
  await unwrap<unknown>(
    `move ${appId} to folder ${folderId}`,
    await request.put(folderMovePath(appId), { params: { targetFolderId: folderId } }),
  );
}

export interface PermissionGrant {
  role: AppRole;
  userIds?: string[];
  groupIds?: string[];
}

export async function grantFolderPermission(request: APIRequestContext, folderId: string, grant: PermissionGrant): Promise<void> {
  await unwrap<unknown>(
    `grant ${grant.role} on folder ${folderId}`,
    await request.post(folderPermissionsPath(folderId), {
      data: { role: grant.role, userIds: grant.userIds ?? [], groupIds: grant.groupIds ?? [] },
    }),
  );
}

export async function listFolderPermissions(request: APIRequestContext, folderId: string): Promise<PermissionView> {
  return unwrap<PermissionView>(`list permissions of folder ${folderId}`, await request.get(folderPermissionsPath(folderId)));
}

export async function updateFolderPermission(
  request: APIRequestContext,
  folderId: string,
  permissionId: string,
  role: AppRole,
): Promise<void> {
  await unwrap<unknown>(
    `set role ${role} of permission ${permissionId} on folder ${folderId}`,
    await request.put(folderPermissionPath(folderId, permissionId), { data: { role } }),
  );
}

export async function removeFolderPermission(
  request: APIRequestContext,
  folderId: string,
  permissionId: string,
): Promise<void> {
  await unwrap<unknown>(
    `remove permission ${permissionId} of folder ${folderId}`,
    await request.delete(folderPermissionPath(folderId, permissionId)),
  );
}

export async function grantDatasourcePermission(
  request: APIRequestContext,
  datasourceId: string,
  grant: PermissionGrant,
): Promise<void> {
  await unwrap<unknown>(
    `grant ${grant.role} on datasource ${datasourceId}`,
    await request.put(datasourcePermissionsPath(datasourceId), {
      data: { role: grant.role, userIds: grant.userIds ?? [], groupIds: grant.groupIds ?? [] },
    }),
  );
}

export async function listDatasourcePermissions(request: APIRequestContext, datasourceId: string): Promise<PermissionView> {
  return unwrap<PermissionView>(
    `list permissions of datasource ${datasourceId}`,
    await request.get(datasourcePermissionsPath(datasourceId)),
  );
}

export async function updateDatasourcePermission(
  request: APIRequestContext,
  permissionId: string,
  role: AppRole,
): Promise<void> {
  await unwrap<unknown>(
    `set role ${role} of datasource permission ${permissionId}`,
    await request.put(datasourcePermissionPath(permissionId), { data: { role } }),
  );
}

export async function removeDatasourcePermission(request: APIRequestContext, permissionId: string): Promise<void> {
  await unwrap<unknown>(
    `remove datasource permission ${permissionId}`,
    await request.delete(datasourcePermissionPath(permissionId)),
  );
}

/** Creates an API key of the signed-in user; the answer carries the token, which is shown only here. */
export async function createApiKey(request: APIRequestContext, name: string): Promise<{ id: string; token: string }> {
  return unwrap<{ id: string; token: string }>(
    `create API key ${name}`,
    await request.post(API_PATHS.API_KEYS, { data: { name } }),
  );
}

export async function deleteApiKey(request: APIRequestContext, apiKeyId: string): Promise<void> {
  await unwrap<unknown>(`delete API key ${apiKeyId}`, await request.delete(apiKeyPath(apiKeyId)));
}

/** Ends the session of the request context on the server (the cookie stays in the context, but is dead). */
export async function logout(request: APIRequestContext): Promise<void> {
  await unwrap<unknown>("log out", await request.post(API_PATHS.AUTH_LOGOUT));
}

/** Runs an app query as `POST /api/query/execute` does; `viewMode: true` runs the published version. Raw answer. */
export async function executeAppQueryRaw(
  request: APIRequestContext,
  params: { applicationId: string; queryId: string; viewMode: boolean },
): Promise<RawAnswer> {
  return apiRaw(request, "POST", API_PATHS.QUERY_EXECUTE, { data: { ...params, params: [] } });
}

/** Creates a library query in the organisation; `query` is its `libraryQueryDSL`. Returns its id. */
export async function createLibraryQuery(
  request: APIRequestContext,
  params: { orgId: string; name: string; query: object },
): Promise<string> {
  const data = await unwrap<{ id: string }>(
    `create library query ${params.name}`,
    await request.post(API_PATHS.LIBRARY_QUERIES, {
      data: { organizationId: params.orgId, name: params.name, libraryQueryDSL: params.query },
    }),
  );
  return data.id;
}

/** Saves a history snapshot of the app (the route answers a Boolean, no id: read it back with `listSnapshots`). */
export async function createSnapshot(request: APIRequestContext, appId: string, dsl: object): Promise<void> {
  await unwrap<unknown>(
    `create snapshot of ${appId}`,
    await request.post(API_PATHS.APPLICATION_HISTORY_SNAPSHOTS, { data: { applicationId: appId, dsl, context: {} } }),
  );
}

/** Ids of the app's history snapshots, newest first as the server lists them. */
export async function listSnapshots(request: APIRequestContext, appId: string): Promise<{ snapshotId: string }[]> {
  const data = await unwrap<{ list: { snapshotId: string }[] }>(
    `list snapshots of ${appId}`,
    await request.get(snapshotsPath(appId)),
  );
  return data.list;
}

/** Creates a bundle in the organisation; returns its id. */
export async function createBundle(request: APIRequestContext, params: { orgId: string; name: string }): Promise<string> {
  const data = await unwrap<{ bundleId: string }>(
    `create bundle ${params.name}`,
    await request.post(API_PATHS.BUNDLES, { data: { orgId: params.orgId, name: params.name } }),
  );
  return data.bundleId;
}

export async function addAppToBundle(request: APIRequestContext, appId: string, bundleId: string): Promise<void> {
  await unwrap<unknown>(
    `add ${appId} to bundle ${bundleId}`,
    await request.put(bundleAddAppPath(appId), { params: { toBundleId: bundleId } }),
  );
}

/** The raw answer of `GET /api/bundles/{id}/elements` (the call under test of SEC-C23 and SEC-R17). */
export async function bundleElementsRaw(request: APIRequestContext, bundleId: string): Promise<RawAnswer> {
  return apiRaw(request, "GET", bundleElementsPath(bundleId));
}

export async function grantBundlePermission(request: APIRequestContext, bundleId: string, grant: PermissionGrant): Promise<void> {
  await unwrap<unknown>(
    `grant ${grant.role} on bundle ${bundleId}`,
    await request.post(bundlePermissionsPath(bundleId), {
      data: { role: grant.role, userIds: grant.userIds ?? [], groupIds: grant.groupIds ?? [] },
    }),
  );
}

/**
 * Recycles a bundle. The 3.0.0 server sets the status and THEN answers HTTP 500 / 5005 "Cannot find this application"
 * (measured: the bundle is recycled, `GET /api/bundles/{id}/view` answers 400 / 5003 afterwards, and the recycled bundle
 * can be deleted; D-46). A setup helper must work on that image, so an answer
 * of exactly that shape counts as success when the view confirms the bundle is no longer the normal one; any other
 * failure throws. The call under test of a security test goes through `apiRaw`, not through this.
 */
export async function recycleBundle(request: APIRequestContext, bundleId: string): Promise<void> {
  const answer = await apiRaw(request, "PUT", bundleRecyclePath(bundleId));
  if (answer.status === 200 && answer.code === API_OK) {
    return;
  }
  const view = await apiRaw(request, "GET", bundleViewPath(bundleId));
  const failedAfterRecycling =
    answer.status === API_ERRORS.NO_RESOURCE_FOUND.status &&
    answer.code === API_ERRORS.NO_RESOURCE_FOUND.code &&
    view.code === API_ERRORS.UNSUPPORTED_OPERATION.code;
  if (!failedAfterRecycling) {
    throw new LowcoderApiError(`recycle bundle ${bundleId}`, answer.status, answer.body);
  }
}

/** Deletes a bundle; the server wants it recycled first. */
export async function deleteBundle(request: APIRequestContext, bundleId: string): Promise<void> {
  await unwrap<unknown>(`delete bundle ${bundleId}`, await request.delete(bundlePath(bundleId)));
}

/**
 * Stores a GitHub sign-in configuration with the given client secret in the workspace of the (admin) caller. GitHub
 * configs are only stored; nothing contacts GitHub. Used to prove whether the secret leaks to other callers (SEC-R07d).
 */
export async function seedOAuthConfig(request: APIRequestContext, params: { clientSecret: string; clientId?: string }): Promise<void> {
  await unwrap<unknown>(
    "seed OAuth config",
    await request.post(API_PATHS.AUTH_CONFIG, {
      data: {
        authType: OAUTH_AUTH_TYPE,
        clientId: params.clientId ?? OAUTH_DUMMY_CLIENT_ID,
        clientSecret: params.clientSecret,
        enable: true,
      },
    }),
  );
}

/**
 * Signs in an existing user with e-mail and password (the form login of `registerUser` without `register`). The request
 * context keeps the session cookie: a second `signIn` of the same user in another context is a second, independent
 * session. The action label names the e-mail only; the password never reaches an error message.
 */
export async function signIn(request: APIRequestContext, email: string, password: string = TEST_PASSWORD): Promise<void> {
  await unwrap<unknown>(
    `sign in ${email}`,
    await request.post(API_PATHS.LOGIN, {
      data: { loginId: email, password, register: false, source: AUTH_SOURCE_EMAIL, authId: AUTH_ID_EMAIL },
    }),
  );
}

/**
 * The form sign-in of `signIn` as a raw answer (no unwrap, no throw on a refusal), for a test that measures the answer
 * or reads its headers. Like `signIn`, the password never reaches a label or message.
 */
export async function signInRaw(request: APIRequestContext, email: string, password: string = TEST_PASSWORD): Promise<RawAnswer> {
  return apiRaw(request, "POST", API_PATHS.LOGIN, {
    data: { loginId: email, password, register: false, source: AUTH_SOURCE_EMAIL, authId: AUTH_ID_EMAIL },
  });
}

/** `POST /api/users/lost-password`: asks for a reset mail for an address (anonymous route; the answer is empty whatever the address). */
export async function requestPasswordReset(request: APIRequestContext, address: string): Promise<RawAnswer> {
  return apiRaw(request, "POST", API_PATHS.USER_LOST_PASSWORD, { data: { userEmail: address } });
}

/** `POST /api/users/reset-lost-password`: sets a new password from a mailed token (anonymous route). The call under test, so raw. */
export async function resetLostPasswordRaw(
  request: APIRequestContext,
  credentials: { address: string; token: string; password: string },
): Promise<RawAnswer> {
  return apiRaw(request, "POST", API_PATHS.USER_RESET_LOST_PASSWORD, {
    data: { userEmail: credentials.address, token: credentials.token, newPassword: credentials.password },
  });
}

/** `POST /api/invitation/email/invite`: creates an invitation of a workspace and mails its link to the addresses. */
export async function sendInvitationEmails(request: APIRequestContext, orgId: string, addresses: string[]): Promise<RawAnswer> {
  return apiRaw(request, "POST", API_PATHS.INVITATION_EMAIL, { data: { emails: addresses, orgId } });
}

/** `DELETE /api/organizations/{id}/leave`: the caller leaves the workspace (a plain member has no UI control for it). */
export async function leaveOrganization(request: APIRequestContext, orgId: string): Promise<void> {
  await unwrap<unknown>(`leave organisation ${orgId}`, await request.delete(orgLeavePath(orgId)));
}

/** `POST /api/organizations`: creates a workspace the caller administers (SAAS mode only); returns its id. */
export async function createOrganization(request: APIRequestContext, name: string): Promise<string> {
  const org = await unwrap<{ orgId: string }>(`create organisation ${name}`, await request.post(API_PATHS.ORGANIZATIONS, { data: { name } }));
  return org.orgId;
}

/** `PUT /api/users`: sets the caller's display name (`username` in the profile answer) and UI language; a blank value is skipped. */
export async function updateProfile(request: APIRequestContext, fields: { name?: string; uiLanguage?: string }): Promise<void> {
  await unwrap<unknown>("update profile", await request.put(API_PATHS.USERS, { data: fields }));
}

/** `DELETE /api/users/photo`: removes the caller's avatar (answers 200 with an empty body, measured; 500 / 5000 without an avatar). */
export async function deleteProfilePhoto(request: APIRequestContext): Promise<void> {
  const response = await request.delete(API_PATHS.USER_PHOTO);
  if (!response.ok()) {
    throw new LowcoderApiError("delete profile photo", response.status(), await response.text());
  }
}

/** What `GET /api/applications/{id}` (the editing view) reports about an app: the fields security tests compare. */
export interface AppDetails {
  name: string;
  /** Workspace the app belongs to. */
  orgId: string;
  /** Creator, as the API reports it (an id). */
  createBy: string;
  /** `NORMAL` or `RECYCLED` (`APP_STATUS`). */
  applicationStatus: string;
  publicToAll: boolean;
  /** The draft DSL. */
  dsl: unknown;
}

/** Reads an app through its editing view; needs the EDIT right (a denial throws, use `apiRaw` for the call under test). */
export async function getApp(request: APIRequestContext, appId: string): Promise<AppDetails> {
  const data = await unwrap<{
    applicationInfoView: { name: string; orgId: string; createBy: string; applicationStatus: string; publicToAll: boolean };
    applicationDSL: unknown;
  }>(`read app ${appId}`, await request.get(applicationPath(appId)));
  const { name, orgId, createBy, applicationStatus, publicToAll } = data.applicationInfoView;
  return { name, orgId, createBy, applicationStatus, publicToAll, dsl: data.applicationDSL };
}

/** One published version of an app as `GET /api/application-records/listByApplicationId` lists it (`ApplicationRecordMetaView`). */
export interface AppVersion {
  tag: string;
}

/** The published versions of an app, as the owner reads them; `unwrap` throws for a caller without the right. */
export async function listAppVersions(request: APIRequestContext, appId: string): Promise<AppVersion[]> {
  return unwrap<AppVersion[]>(
    `list versions of ${appId}`,
    await request.get(appRecordsByAppPath(), { params: { applicationId: appId } }),
  );
}

/** Uploads the signed-in user's profile photo (`POST /api/users/photo`, multipart field `file`). */
export async function uploadProfilePhoto(request: APIRequestContext, photo: { name: string; mimeType: string; buffer: Buffer }): Promise<void> {
  await unwrap<unknown>("upload profile photo", await request.post(API_PATHS.USER_PHOTO, { multipart: { file: photo } }));
}

/** The signed-in user's profile photo as the server returns it (`GET /api/users/photo`): status and the exact bytes. */
export async function readProfilePhoto(request: APIRequestContext): Promise<{ status: number; bytes: Buffer }> {
  const response = await request.get(API_PATHS.USER_PHOTO);
  return { status: response.status(), bytes: await response.body() };
}

/** One member row of `GET /api/groups/{id}/members` (measured: `data.members[]` with `userId` and `role`). */
export interface GroupMemberRow {
  userId: string;
  role: string;
}

/** The members of a group. Needs the right to list them (org admin or group member); a denial throws. */
export async function listGroupMembers(request: APIRequestContext, groupId: string): Promise<GroupMemberRow[]> {
  const data = await unwrap<{ members: GroupMemberRow[] }>(`list members of group ${groupId}`, await request.get(groupMembersPath(groupId)));
  return data.members;
}

/**
 * Points the workspace's npm registry (a global entry, bearer token) at `url`: `PUT /api/organizations/{orgId}/common-settings`
 * with the key `npmRegistries` and one entry (shape of node-service's `NpmRegistryConfigEntry`). The caller must be an admin of
 * the workspace. It REPLACES the list, so the workspace has exactly this one registry afterwards.
 */
export async function setNpmRegistry(
  request: APIRequestContext,
  orgId: string,
  registry: { url: string; token: string },
): Promise<void> {
  const entry = { scope: { type: "global" }, registry: { url: registry.url, auth: { type: "bearer", credentials: registry.token } } };
  await unwrap<unknown>(
    `set the npm registry of ${orgId}`,
    await request.put(orgCommonSettingsPath(orgId), { data: { key: NPM_REGISTRIES_SETTING_KEY, value: [entry] } }),
  );
}

/** The `POST /api/datasources` body of an n8n data source: the recorded form body with the workspace, the target and the key set. */
export function n8nDatasourceBody(
  params: { orgId: string; name?: string; serverURL: string; apiKey: string; forwardAllCookies?: boolean },
): object {
  const recorded = recordedN8nDatasource();
  return {
    ...recorded,
    name: params.name ?? recorded.name,
    organizationId: params.orgId,
    datasourceConfig: {
      ...recorded.datasourceConfig,
      serverURL: params.serverURL,
      apiKey: params.apiKey,
      ...(params.forwardAllCookies === undefined ? {} : { forwardAllCookies: params.forwardAllCookies }),
    },
  };
}

/** Creates an n8n data source (spec v1.1.1) whose `serverURL` is `params.serverURL` (a test's echo target); returns its id. */
export async function createN8nDatasource(
  request: APIRequestContext,
  params: { orgId: string; name?: string; serverURL: string; apiKey: string; forwardAllCookies?: boolean },
): Promise<string> {
  const data = await unwrap<{ id: string }>(
    "create n8n datasource",
    await request.post(API_PATHS.DATASOURCES, { data: n8nDatasourceBody(params) }),
  );
  return data.id;
}
