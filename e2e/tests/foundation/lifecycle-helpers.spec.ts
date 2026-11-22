import { apiRaw, addGithubConfigRaw, createOrganization, currentUser, listAuthConfigs, removeAuthConfigRaw, deleteOrganizationRaw, deleteProfilePhoto, leaveOrganization, readProfilePhoto, registerRaw, signInRaw, updateProfile, uploadProfilePhoto } from "../../src/api/client";
import { API_ERRORS, API_OK, API_PATHS, SESSION_COOKIE_NAME, SET_COOKIE_HEADER, TEST_PASSWORD } from "../../src/constants";
import { randomPng } from "../../src/media";
import { createInvitation, acceptInvitation } from "../../src/api/client";

/** Joins `guest` to the workspace `orgId` that `owner` administers. */
async function joinWorkspaceOf(owner: { request: import("@playwright/test").APIRequestContext }, guest: { request: import("@playwright/test").APIRequestContext }, orgId: string): Promise<void> {
  await acceptInvitation(guest.request, await createInvitation(owner.request, orgId));
}
import { expect, test, uniqueEmail } from "../../src/fixtures";

/** Stack tests of the raw account helpers of the lifecycle specs (`registerRaw`, `signInRaw`). */
test.describe("lifecycle account helpers", () => {
  test("registerRaw answers a sign-up, and the second one with the same address is refused without a throw", async ({ newUserSession }, testInfo) => {
    const request = (await newUserSession()).page.request;
    const email = uniqueEmail("rawreg", testInfo.workerIndex);

    const first = await registerRaw(request, email, TEST_PASSWORD);
    const second = await registerRaw((await newUserSession()).page.request, email, TEST_PASSWORD);

    expect({ status: first.status, code: first.code }, "a fresh address").toEqual({ status: 200, code: API_OK });
    expect({ status: second.status, code: second.code }, "the same address again").toEqual(API_ERRORS.USER_LOGIN_ID_EXIST);
  });

  test("signInRaw answers a sign-in with its cookie and a wrong password without a throw and without a cookie", async ({ actor, newUserSession }) => {
    const user = await actor("rawsign");
    const request = (await newUserSession()).page.request;

    const ok = await signInRaw(request, user.email);
    const wrong = await signInRaw((await newUserSession()).page.request, user.email, `${TEST_PASSWORD}-wrong`);

    expect({ status: ok.status, code: ok.code }, "the right password").toEqual({ status: 200, code: API_OK });
    expect((ok.headers[SET_COOKIE_HEADER] ?? "").includes(SESSION_COOKIE_NAME), "sets the session cookie").toBe(true);
    expect(wrong.code, "a wrong password is not an API_OK answer").not.toBe(API_OK);
    expect((wrong.headers[SET_COOKIE_HEADER] ?? "").includes(SESSION_COOKIE_NAME), "and sets no session cookie").toBe(false);
  });

  test("updateProfile sets the display name, deleteProfilePhoto removes an avatar, apiRaw sends a multipart file", async ({ actor }) => {
    const user = await actor("rawprofile");
    const png = { name: "a.png", mimeType: "image/png", buffer: randomPng(8, 8) };

    await updateProfile(user.request, { name: "Raw Name", uiLanguage: "de" });
    const uploaded = await apiRaw(user.request, "POST", API_PATHS.USER_PHOTO, { multipart: { file: png } });

    const stored = await currentUser(user.request);
    expect(stored.username, "the name is stored").toBe("Raw Name");
    expect(stored.uiLanguage, "the language is stored").toBe("de");
    expect({ status: uploaded.status, code: uploaded.code }, "a generated PNG is accepted as an avatar").toEqual({ status: 200, code: API_OK });
    expect((await readProfilePhoto(user.request)).status, "the avatar is stored").toBe(200);

    await deleteProfilePhoto(user.request);

    expect((await readProfilePhoto(user.request)).status, "the avatar is gone").not.toBe(200);
    await uploadProfilePhoto(user.request, png);
    expect((await readProfilePhoto(user.request)).status, "and can be set again").toBe(200);
  });

  test("createOrganization makes a workspace the caller administers, leaveOrganization leaves one", async ({ actor }) => {
    const owner = await actor("rawlocal");
    const guest = await actor("rawguest");
    const orgId = await createOrganization(owner.request, "E2E Helper Workspace");
    expect((await currentUser(owner.request)).orgAndRoles.find((entry) => entry.org.id === orgId)?.role, "the creator administers it").toBe("admin");

    await joinWorkspaceOf(owner, guest, orgId);
    expect((await currentUser(guest.request)).orgAndRoles.map((entry) => entry.org.id), "before: the guest belongs to it").toContain(orgId);
    await leaveOrganization(guest.request, orgId);

    expect((await currentUser(guest.request)).orgAndRoles.map((entry) => entry.org.id), "after leaving").not.toContain(orgId);
  });

  test("randomPng builds a valid PNG of the size its dimensions give", () => {
    const png = randomPng(40, 30);

    expect(png.subarray(0, 8).toString("hex"), "the PNG signature").toBe("89504e470d0a1a0a");
    expect(png.readUInt32BE(16), "IHDR width").toBe(40);
    expect(png.readUInt32BE(20), "IHDR height").toBe(30);
    expect(png.length, "about 3 bytes a pixel plus the row filter bytes").toBeGreaterThan(40 * 30 * 3);
    expect(png.subarray(-8, -4).toString("ascii"), "ends with IEND").toBe("IEND");
  });

  test("deleteOrganizationRaw answers the deletion of a workspace the caller administers without a throw and the workspace leaves the list", async ({ actor }) => {
    const owner = await actor("rawdelete");
    const orgId = await createOrganization(owner.request, "raw-delete-org");
    expect((await currentUser(owner.request)).orgAndRoles.map((entry) => entry.org.id), "setup: the workspace exists").toContain(orgId);

    const deleted = await deleteOrganizationRaw(owner.request, orgId);

    expect({ status: deleted.status, code: deleted.code }, "the deletion").toEqual({ status: 200, code: API_OK });
    await expect.poll(async () => (await currentUser(owner.request)).orgAndRoles.map((entry) => entry.org.id)).not.toContain(orgId);
  });

  test("listAuthConfigs lists the e-mail configuration without its secret, addGithubConfigRaw and removeAuthConfigRaw answer without a throw", async ({ actor }) => {
    const admin = await actor("rawconfigs");
    expect(await listAuthConfigs(admin.request), "a new workspace has only e-mail sign-in").toEqual([{ id: "EMAIL", authType: "FORM", enable: true }]);
    const added = await addGithubConfigRaw(admin.request, { clientId: "raw-client", clientSecret: "raw-secret" });
    const github = (await listAuthConfigs(admin.request)).find((entry) => entry.authType === "GITHUB");
    const removed = await removeAuthConfigRaw(admin.request, github?.id ?? "missing", { remove: true });

    expect({ status: added.status, code: added.code }, "the GitHub configuration is added").toEqual({ status: 200, code: API_OK });
    expect(github?.enable, "and enabled").toBe(true);
    expect(Object.keys(github ?? {}).sort(), "an entry carries no secret").toEqual(["authType", "enable", "id"]);
    expect({ status: removed.status, code: removed.code }, "the GitHub configuration is deleted").toEqual({ status: 200, code: API_OK });
  });
});
