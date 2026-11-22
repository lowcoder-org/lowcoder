import { apiRaw, createApiKey, createApp, currentUser, grantAppPermission, switchOrganization } from "../../src/api/client";
import { API_ERRORS, API_KEYS_LIST_PATH, API_OK, API_PATHS, APP_TYPE_APPLICATION } from "../../src/constants";
import { expect, test } from "../../src/fixtures";
import { ApiKeysCard, MASKED_TOKEN_PATTERN } from "../../src/pages/ApiKeysCard";
import { ProfilePage } from "../../src/pages/ProfilePage";
import { joinWorkspace } from "../../src/security/actors";
import { expectAnswer } from "../../src/security/assertions";
import { lifecycleTestDetails } from "../../src/security/quarantine";
import { bearerHeader, issuedAtSecond } from "../../src/security/tokens";

/**
 * The API keys of a user in the profile page (LC-AK01 to LC-AK07). A token read from the page is compared as a boolean
 * only, never handed to a matcher, so a failure message cannot print it.
 */

const ALLOWED = { status: 200, code: API_OK } as const;
const KEY_NAME = "e2e-key";
const KEY_DESCRIPTION = "created in the UI";
/** Time a deleted key may keep working before the test fails (the server's own delay is not part of the oracle). */
const REVOCATION_TIMEOUT_MS = 30_000;
const REVOCATION_POLL_INTERVALS_MS = [250, 500, 1_000];
/** Attempts LC-AK08 makes to create two keys inside one second (each attempt takes a few tens of milliseconds). */
const COLLISION_ATTEMPTS = 20;

/** The number of API keys the list route returns for the caller. */
async function storedKeyCount(request: import("@playwright/test").APIRequestContext): Promise<number> {
  return ((await apiRaw(request, "GET", API_KEYS_LIST_PATH)).json as { data: unknown[] }).data.length;
}

/** `GET /api/organizations/myorg` with the token: 200 for a key that authenticates, 401 without a body for one that does not. */
async function answerWithKey(anonymous: import("@playwright/test").APIRequestContext, token: string) {
  return apiRaw(anonymous, "GET", API_PATHS.USER_MY_ORG, { headers: bearerHeader(token) });
}

/** The id `GET /api/users/me` reports for the caller of the token (an anonymous caller gets another id). */
async function userIdOfKey(anonymous: import("@playwright/test").APIRequestContext, token: string): Promise<string | undefined> {
  const answer = await apiRaw(anonymous, "GET", API_PATHS.CURRENT_USER, { headers: bearerHeader(token) });
  return (answer.json as { data?: { id?: string } } | undefined)?.data?.id;
}

test.describe("lifecycle: API keys", () => {
  test("LC-AK01 a developer creates a key in the UI and the shown token authenticates", lifecycleTestDetails("LC-AK01"), async ({ actor, newUserSession }) => {
    const user = await actor("keyowner");
    const profile = new ProfilePage(user.session.page);
    const keys = new ApiKeysCard(user.session.page);
    await profile.open();
    await expect(keys.title, "the card is shown to the owner of a workspace").toBeVisible();

    await keys.create(KEY_NAME, KEY_DESCRIPTION);

    await expect(keys.newKeyAlert, "the page tells the user to copy the key now").toBeVisible();
    await expect(keys.rowOf(KEY_NAME), "the key is listed").toBeVisible();
    const token = await keys.tokenOf(KEY_NAME);
    expect(token.length, "the row shows a full token").toBeGreaterThan(MASKED_TOKEN_PATTERN.source.length);
    const anonymous = (await newUserSession()).page.request;
    expectAnswer(await answerWithKey(anonymous, token), ALLOWED, "an anonymous caller with the shown token");
    expect(await userIdOfKey(anonymous, token) === user.userId, "the token authenticates as the user who created it").toBe(true);
  });

  test("LC-AK02 the full token is shown once", lifecycleTestDetails("LC-AK02"), async ({ actor }) => {
    const user = await actor("keyonce");
    const profile = new ProfilePage(user.session.page);
    const keys = new ApiKeysCard(user.session.page);
    await profile.open();
    await keys.create(KEY_NAME);
    await expect(keys.rowOf(KEY_NAME)).toBeVisible();
    const token = await keys.tokenOf(KEY_NAME);

    await user.session.page.reload();

    await expect(keys.rowOf(KEY_NAME), "after a reload the key is still listed").toBeVisible();
    await expect(keys.newKeyAlert, "without the copy-now alert").toHaveCount(0);
    const shown = await keys.tokenOf(KEY_NAME);
    expect(MASKED_TOKEN_PATTERN.test(shown), "the row shows a masked token").toBe(true);
    expect(shown.includes(token), "not the full one").toBe(false);
    const listed = await apiRaw(user.request, "GET", API_KEYS_LIST_PATH);
    expect(listed.body.includes(token), "the list route does not return the full token either").toBe(false);
  });

  test("LC-AK03 a key deleted in the UI stops working while another key remains", lifecycleTestDetails("LC-AK03"), async ({ actor, newUserSession }, testInfo) => {
    const user = await actor("keytwo");
    const profile = new ProfilePage(user.session.page);
    const keys = new ApiKeysCard(user.session.page);
    await profile.open();
    await keys.create("e2e-key-one");
    await expect(keys.rowOf("e2e-key-one")).toBeVisible();
    const first = await keys.tokenOf("e2e-key-one");
    // A token is the user id and the second of its creation (no unique id): a key created in the same second has the
    // same token, and deleting one of them cannot revoke it (LC-AK08). So the second key is created in a later second.
    await expect.poll(() => Math.floor(Date.now() / 1000), "wait for the next second").toBeGreaterThan(issuedAtSecond(first));
    await keys.create("e2e-key-two");
    await expect(keys.rowOf("e2e-key-two")).toBeVisible();
    const second = await keys.tokenOf("e2e-key-two");
    expect(first === second, "the two keys have different tokens").toBe(false);
    const anonymous = (await newUserSession()).page.request;
    expectAnswer(await answerWithKey(anonymous, first), ALLOWED, "before: the first key works");
    expectAnswer(await answerWithKey(anonymous, second), ALLOWED, "before: the second key works");

    await keys.deleteKey("e2e-key-one");

    await expect(keys.rowOf("e2e-key-one"), "the deleted key leaves the list").toHaveCount(0);
    await expect(keys.rowOf("e2e-key-two"), "the other key stays").toBeVisible();
    const deletedAt = Date.now();
    await expect
      .poll(async () => (await answerWithKey(anonymous, first)).status, { message: "after: the deleted key stops working", timeout: REVOCATION_TIMEOUT_MS, intervals: REVOCATION_POLL_INTERVALS_MS })
      .toBe(API_ERRORS.UNAUTHENTICATED.status);
    testInfo.annotations.push({ type: "revocation delay", description: `${Date.now() - deletedAt} ms after the UI confirmed the delete` });
    expectAnswer(await answerWithKey(anonymous, second), ALLOWED, "after: the other key still works");
  });

  test("LC-AK04 deleting the last key in the UI removes it", lifecycleTestDetails("LC-AK04"), async ({ actor, newUserSession }) => {
    const user = await actor("keylast");
    const profile = new ProfilePage(user.session.page);
    const keys = new ApiKeysCard(user.session.page);
    await profile.open();
    await keys.create(KEY_NAME);
    await expect(keys.rowOf(KEY_NAME)).toBeVisible();
    const token = await keys.tokenOf(KEY_NAME);
    const anonymous = (await newUserSession()).page.request;
    expectAnswer(await answerWithKey(anonymous, token), ALLOWED, "before: the key works");

    await keys.deleteKey(KEY_NAME);
    await user.session.page.reload();

    await expect(keys.title, "the card is back after the reload").toBeVisible();
    await expect(keys.rowOf(KEY_NAME), "the key is gone from the list").toHaveCount(0);
    await expect
      .poll(async () => (await answerWithKey(anonymous, token)).status, { message: "after: the deleted key stops working", timeout: REVOCATION_TIMEOUT_MS, intervals: REVOCATION_POLL_INTERVALS_MS })
      .toBe(API_ERRORS.UNAUTHENTICATED.status);
  });

  test("LC-AK05 a plain member gets no key card in the UI (client gate, characterisation)", lifecycleTestDetails("LC-AK05"), async ({ actor }) => {
    const owner = await actor("keyadmin");
    const member = await actor("keymember");
    await joinWorkspace(owner, member);
    const membership = (await currentUser(member.request)).orgAndRoles.find((entry) => entry.org.id === owner.orgId);
    expect(membership?.role, "the user is a plain member of the owner's workspace").toBe("member");
    const profile = new ProfilePage(member.session.page);
    await profile.open();
    await expect(profile.languageLabel, "the profile page of the member has loaded").toBeVisible();

    await expect(new ApiKeysCard(member.session.page).title, "no key card for a plain member").toHaveCount(0);

    const created = await apiRaw(member.request, "POST", API_PATHS.API_KEYS, { data: { name: KEY_NAME } });
    expectAnswer(created, ALLOWED, "the server has no role check: the same member creates a key through the API");
  });

  test("LC-AK06 the create form requires a name", lifecycleTestDetails("LC-AK06"), async ({ actor }) => {
    const user = await actor("keyname");
    const profile = new ProfilePage(user.session.page);
    const keys = new ApiKeysCard(user.session.page);
    await profile.open();
    await expect(keys.title).toBeVisible();
    expect((await apiRaw(user.request, "GET", API_KEYS_LIST_PATH)).body.includes(`"name"`), "before: the user has no key").toBe(false);

    await keys.create("");

    await expect(keys.nameRequiredMessage, "the form asks for a name").toBeVisible();
    await expect(keys.rows.filter({ hasText: KEY_NAME }), "no row was added").toHaveCount(0);
    expect((await apiRaw(user.request, "GET", API_KEYS_LIST_PATH)).body.includes(`"name"`), "and no key was stored").toBe(false);
  });

  test("LC-AK07 a key follows the user's current workspace (characterisation)", lifecycleTestDetails("LC-AK07"), async ({ actor, newUserSession }) => {
    const other = await actor("keyorg");
    const user = await actor("keyfollow");
    const { appId: sharedAppId } = await createApp(other.request, { orgId: other.orgId, name: "e2e-key-app-a" });
    await joinWorkspace(other, user);
    await grantAppPermission(other.request, sharedAppId, { role: "viewer", userIds: [user.userId] });
    await switchOrganization(user.request, user.orgId);
    await createApp(user.request, { orgId: user.orgId, name: "e2e-key-app-u" });
    const key = await createApiKey(user.request, KEY_NAME);
    const anonymous = (await newUserSession()).page.request;
    const listNames = async () => {
      const answer = await apiRaw(anonymous, "GET", API_PATHS.APPLICATION_LIST, { params: { applicationType: APP_TYPE_APPLICATION }, headers: bearerHeader(key.token) });
      return ((answer.json as { data?: { name: string }[] } | undefined)?.data ?? []).map((app) => app.name);
    };

    expect(await listNames(), "in the user's own workspace the key lists its own app, not the other workspace's").toEqual(["e2e-key-app-u"]);

    await switchOrganization(user.request, other.orgId);

    expect(await listNames(), "after switching, the same key lists the other workspace's app").toEqual(["e2e-key-app-a"]);
  });
  test("LC-AK08 keys created in the same second have different tokens", lifecycleTestDetails("LC-AK08"), async ({ actor }) => {
    const user = await actor("keyunique");
    let pairs = 0;
    const sameToken: string[] = [];

    for (let attempt = 0; attempt < COLLISION_ATTEMPTS && pairs === 0; attempt += 1) {
      const first = await createApiKey(user.request, `e2e-key-${attempt}-a`);
      const second = await createApiKey(user.request, `e2e-key-${attempt}-b`);
      if (issuedAtSecond(first.token) === issuedAtSecond(second.token)) {
        pairs += 1;
        if (first.token === second.token) {
          sameToken.push(`pair ${attempt}`);
        }
      }
    }

    expect(pairs, "the test created two keys in the same second").toBeGreaterThan(0);
    expect(sameToken, "keys created in the same second that got the same token").toEqual([]);
  });
});

