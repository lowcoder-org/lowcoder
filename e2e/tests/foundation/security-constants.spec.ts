import { expect, test } from "@playwright/test";
import {
  API_CODE_APP_PERMISSION_DENIED,
  API_ERRORS,
  API_PATHS,
  APP_ROLES,
  ORG_ROLES,
  TAGS,
  appPermissionPath,
  appRecordsByAppPath,
  appSlugPath,
  apiKeyPath,
  API_KEYS_LIST_PATH,
  BUNDLE_RECYCLE_LIST_PATH,
  datasourcesByOrgPath,
  publicToMarketplacePath,
  bundleAddAppPath,
  bundleElementsPath,
  bundlePath,
  bundlePermissionsPath,
  bundlePublishPath,
  bundleRecyclePath,
  bundleReorderPath,
  bundleViewPath,
  configPath,
  datasourcePath,
  datasourcePermissionPath,
  datasourcePermissionsPath,
  datasourceStructurePath,
  folderMovePath,
  folderPermissionPath,
  folderPermissionsPath,
  groupAddMemberPath,
  groupMembersPath,
  groupPotentialMembersPath,
  groupRemoveMemberPath,
  groupRolePath,
  libraryQueryPath,
  orgCommonSettingsPath,
  orgLeavePath,
  orgMembersPath,
  orgPath,
  orgRemoveMemberPath,
  orgRolePath,
  orgSlugPath,
  orgUpdatePath,
  orgsByUserPath,
  snapshotPath,
  snapshotsPath,
  switchOrgPath,
  userPhotoPath,
  userProfilePath,
} from "../../src/constants";

const ID = "i1";
const OTHER_ID = "i2";

test.describe("security constants", () => {
  test("roles are the strings of the server's enums", () => {
    expect(ORG_ROLES).toEqual({ ADMIN: "admin", MEMBER: "member", SUPER_ADMIN: "super_admin" });
    expect(APP_ROLES).toEqual({ VIEWER: "viewer", EDITOR: "editor", OWNER: "owner" });
    expect(TAGS.SECURITY).toBe("@security");
  });

  test("every API_ERRORS entry has an integer HTTP status and, except UNAUTHENTICATED, an integer code, and codes are unique", () => {
    const codes: number[] = [];
    for (const [name, error] of Object.entries(API_ERRORS)) {
      expect(Number.isInteger(error.status), `${name} status`).toBe(true);
      if (name === "UNAUTHENTICATED") {
        expect(error.code, "the entry point sends no body").toBeUndefined();
        continue;
      }
      expect(Number.isInteger(error.code), `${name} code`).toBe(true);
      codes.push(error.code as number);
    }
    expect(new Set(codes).size, "no two entries share a BizError code").toBe(codes.length);
  });

  test("the entries the first scenarios assert, and the existing denial constant, agree", () => {
    expect(API_ERRORS.NO_PERMISSION_TO_REQUEST_APP).toEqual({ status: 403, code: 5308 });
    expect(API_ERRORS.NO_PERMISSION_TO_REQUEST_APP.code, "equal to the constant the base suite uses").toBe(API_CODE_APP_PERMISSION_DENIED);
    expect(API_ERRORS.NOT_AUTHORIZED).toEqual({ status: 401, code: 5001 });
    expect(API_ERRORS.UNAUTHENTICATED).toEqual({ status: 401, code: undefined });
    expect(API_ERRORS.NEED_DEV_TO_CREATE_RESOURCE).toEqual({ status: 500, code: 5155 });
  });

  test("path builders put the ids where the routes have them", () => {
    const built: Record<string, string> = {
      appSlugPath: appSlugPath(ID),
      appPermissionPath: appPermissionPath(ID, OTHER_ID),
      appRecordsByAppPath: appRecordsByAppPath(),
      snapshotsPath: snapshotsPath(ID),
      snapshotPath: snapshotPath(ID, OTHER_ID),
      bundlePath: bundlePath(ID),
      bundleRecyclePath: bundleRecyclePath(ID),
      bundleViewPath: bundleViewPath(ID),
      bundleElementsPath: bundleElementsPath(ID),
      bundleAddAppPath: bundleAddAppPath(ID),
      bundleReorderPath: bundleReorderPath(ID),
      bundlePermissionsPath: bundlePermissionsPath(ID),
      bundlePublishPath: bundlePublishPath(ID),
      datasourcePath: datasourcePath(ID),
      datasourceStructurePath: datasourceStructurePath(ID),
      datasourcePermissionsPath: datasourcePermissionsPath(ID),
      datasourcePermissionPath: datasourcePermissionPath(ID),
      folderPermissionsPath: folderPermissionsPath(ID),
      folderPermissionPath: folderPermissionPath(ID, OTHER_ID),
      folderMovePath: folderMovePath(ID),
      orgPath: orgPath(ID),
      orgMembersPath: orgMembersPath(ID),
      orgCommonSettingsPath: orgCommonSettingsPath(ID),
      orgSlugPath: orgSlugPath(ID),
      orgUpdatePath: orgUpdatePath(ID),
      orgRolePath: orgRolePath(ID),
      orgRemoveMemberPath: orgRemoveMemberPath(ID),
      orgLeavePath: orgLeavePath(ID),
      switchOrgPath: switchOrgPath(ID),
      orgsByUserPath: orgsByUserPath("a+b@example.test"),
      groupMembersPath: groupMembersPath(ID),
      groupPotentialMembersPath: groupPotentialMembersPath(ID),
      groupAddMemberPath: groupAddMemberPath(ID),
      groupRemoveMemberPath: groupRemoveMemberPath(ID),
      groupRolePath: groupRolePath(ID),
      userProfilePath: userProfilePath(ID, OTHER_ID),
      userPhotoPath: userPhotoPath(ID, OTHER_ID),
      apiKeyPath: apiKeyPath(ID),
      libraryQueryPath: libraryQueryPath(ID),
      configPath: configPath("k"),
    };

    expect(built).toEqual({
      appSlugPath: "/api/applications/i1/slug",
      appPermissionPath: "/api/applications/i1/permissions/i2",
      appRecordsByAppPath: "/api/application-records/listByApplicationId",
      snapshotsPath: "/api/application/history-snapshots/i1",
      snapshotPath: "/api/application/history-snapshots/i1/i2",
      bundlePath: "/api/bundles/i1",
      bundleRecyclePath: "/api/bundles/recycle/i1",
      bundleViewPath: "/api/bundles/i1/view",
      bundleElementsPath: "/api/bundles/i1/elements",
      bundleAddAppPath: "/api/bundles/addApp/i1",
      bundleReorderPath: "/api/bundles/i1/reorder",
      bundlePermissionsPath: "/api/bundles/i1/permissions",
      bundlePublishPath: "/api/bundles/i1/publish",
      datasourcePath: "/api/datasources/i1",
      datasourceStructurePath: "/api/datasources/i1/structure",
      datasourcePermissionsPath: "/api/datasources/i1/permissions",
      datasourcePermissionPath: "/api/datasources/permissions/i1",
      folderPermissionsPath: "/api/folders/i1/permissions",
      folderPermissionPath: "/api/folders/i1/permissions/i2",
      folderMovePath: "/api/folders/move/i1",
      orgPath: "/api/organizations/i1",
      orgMembersPath: "/api/organizations/i1/members",
      orgCommonSettingsPath: "/api/organizations/i1/common-settings",
      orgSlugPath: "/api/organizations/i1/slug",
      orgUpdatePath: "/api/organizations/i1/update",
      orgRolePath: "/api/organizations/i1/role",
      orgRemoveMemberPath: "/api/organizations/i1/remove",
      orgLeavePath: "/api/organizations/i1/leave",
      switchOrgPath: "/api/organizations/switchOrganization/i1",
      orgsByUserPath: "/api/organizations/byuser/a%2Bb%40example.test",
      groupMembersPath: "/api/groups/i1/members",
      groupPotentialMembersPath: "/api/groups/i1/potential-members",
      groupAddMemberPath: "/api/groups/i1/addMember",
      groupRemoveMemberPath: "/api/groups/i1/remove",
      groupRolePath: "/api/groups/i1/role",
      userProfilePath: "/api/users/i1/i2",
      userPhotoPath: "/api/users/photo/i1/i2",
      apiKeyPath: "/api/auth/api-key/i1",
      libraryQueryPath: "/api/library-queries/i1",
      configPath: "/api/configs/k",
    });
  });

  test("every API_PATHS base is an /api/ route", () => {
    for (const [name, path] of Object.entries(API_PATHS)) {
      expect(path, name).toMatch(/^\/api\//);
    }
  });

  test("the role and abuse scenario path helpers build the routes of the server", () => {
    expect(publicToMarketplacePath(ID)).toBe("/api/applications/i1/public-to-marketplace");
    expect(datasourcesByOrgPath()).toBe("/api/datasources/listByOrg");
    expect(BUNDLE_RECYCLE_LIST_PATH, "equals the recycle builder with the segment list").toBe(bundleRecyclePath("list"));
    expect(API_KEYS_LIST_PATH).toBe(`${API_PATHS.API_KEYS}s`);
  });
});
