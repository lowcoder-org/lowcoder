import { apiRaw, currentUser, deleteProfilePhoto, readProfilePhoto, uploadProfilePhoto } from "../../src/api/client";
import { API_ERRORS, API_PATHS, UI_PATHS, USER_STATUS_OLDER_NON_DEV_POPUP } from "../../src/constants";
import { PNG_RED, randomPng } from "../../src/media";
import { expect, test } from "../../src/fixtures";
import { ProfileModal } from "../../src/pages/ProfileModal";
import { ProfilePage } from "../../src/pages/ProfilePage";
import { UserMenu } from "../../src/pages/UserMenu";
import { lifecycleTestDetails } from "../../src/security/quarantine";

/**
 * The profile of a user: display name, avatar, UI language and status flags (LC-PR01 to LC-PR08, LC-PR15). The user's
 * name is `username` in the API answer (the e-mail address until the user sets one).
 */

const NEW_NAME = "E2E Display Name";
const MODAL_NAME = "E2E Modal Name";
const PNG = { name: "avatar.png", mimeType: "image/png", buffer: Buffer.from(PNG_RED.split(",")[1] ?? "", "base64") };
const SVG = { name: "avatar.svg", mimeType: "image/svg+xml", buffer: Buffer.from("<svg xmlns='http://www.w3.org/2000/svg' width='8' height='8'/>") };
/** A real PNG of about 1 MB: above the 300 KB limit of `avatarMaxSizeInKb`; 3.0.0 accepts even 6.7 MB (measured). */
const LARGE_PNG = { name: "large.png", mimeType: "image/png", buffer: randomPng(600, 600) };
const GERMAN = { option: "Deutsch", code: "de", languageLabel: "UI-Sprache" } as const;
/** `GET /api/users/photo` of a user without an avatar answers 500 on 3.0.0 (the code reads a 404; measured). */
const NO_AVATAR_STATUS = 500;
const UNKNOWN_STATUS_TYPE = "e2e-unknown";

test.describe("lifecycle: profile", () => {
  test("LC-PR01 the profile page shows who the user is and saves a new display name", lifecycleTestDetails("LC-PR01"), async ({ actor }) => {
    const user = await actor("profile");
    const profile = new ProfilePage(user.session.page);
    await profile.open();
    await expect(profile.aboutText, "the About card renders").toBeVisible();
    await expect(user.session.page.getByText(user.userId), "it shows the user id").toBeVisible();
    const workspaceName = (await currentUser(user.request)).orgAndRoles.find((entry) => entry.org.id === user.orgId)?.org.name;
    expect(workspaceName, "the user's workspace has a name").toBeTruthy();
    await expect(user.session.page.getByText(workspaceName!), "and the current workspace").toBeVisible();
    await expect(profile.nameInput, "a new user's name is the e-mail address").toHaveValue(user.email);

    await profile.setName(NEW_NAME);

    await expect.poll(async () => (await currentUser(user.request)).username, "the server stores the new name").toBe(NEW_NAME);
    await user.session.page.reload();
    await expect(profile.nameInput, "the field shows it after a reload").toHaveValue(NEW_NAME);
    await expect(user.session.page.getByTitle(NEW_NAME).first(), "and so does the avatar in the header").toBeVisible();
  });

  test("LC-PR02 an empty display name is refused on the profile page", lifecycleTestDetails("LC-PR02"), async ({ actor }) => {
    const user = await actor("emptyname");
    const profile = new ProfilePage(user.session.page);
    await profile.open();
    await expect(profile.nameInput).toHaveValue(user.email);
    const saves: string[] = [];
    user.session.page.on("request", (request) => {
      if (request.method() === "PUT" && request.url().endsWith(API_PATHS.USERS)) {
        saves.push(request.url());
      }
    });

    await profile.nameInput.fill("");
    await profile.nameInput.blur();

    await expect(profile.emptyNameMessage, "the page refuses an empty name").toBeVisible();
    expect(saves, "the page sent no save request").toEqual([]);
    expect((await currentUser(user.request)).username, "the stored name is unchanged").toBe(user.email);
  });

  test("LC-PR03 the My Profile modal saves a new display name", lifecycleTestDetails("LC-PR03"), async ({ actor }) => {
    const user = await actor("modalname");
    const page = user.session.page;
    await page.goto(UI_PATHS.APP_LIST_PATH);
    await new UserMenu(page).openProfile(user.email);
    const modal = new ProfileModal(page);
    await expect(modal.title, "the modal opens").toBeVisible();

    await modal.nameInput.fill(MODAL_NAME);
    await modal.nameInput.press("Enter");

    await expect.poll(async () => (await currentUser(user.request)).username, "the server stores the new name").toBe(MODAL_NAME);
    await page.goto(UI_PATHS.APP_LIST_PATH);
    await expect(page.getByTitle(MODAL_NAME).first(), "after a reload the avatar menu carries the new name").toBeVisible();
  });

  test("LC-PR04 an uploaded avatar is stored", lifecycleTestDetails("LC-PR04"), async ({ actor }) => {
    const user = await actor("avatar");
    expect((await readProfilePhoto(user.request)).status, "before: the user has no avatar (measured: 500, not 404)").toBe(NO_AVATAR_STATUS);
    const profile = new ProfilePage(user.session.page);
    await profile.open();
    await expect(profile.aboutText).toBeVisible();

    await profile.avatarFileInput.setInputFiles(PNG);

    await expect.poll(async () => (await readProfilePhoto(user.request)).status, "the server holds the avatar").toBe(200);
    expect((await readProfilePhoto(user.request)).bytes.length, "and it has content").toBeGreaterThan(0);
    expect((await currentUser(user.request)).avatarUrl, "the profile points to it").toBeTruthy();
  });

  test("LC-PR05 an SVG avatar is refused", lifecycleTestDetails("LC-PR05"), async ({ actor }) => {
    const user = await actor("svg");
    await uploadProfilePhoto(user.request, PNG);
    const before = await readProfilePhoto(user.request);
    expect(before.status, "control: a PNG avatar is stored").toBe(200);

    const answer = await apiRaw(user.request, "POST", API_PATHS.USER_PHOTO, { multipart: { file: SVG } });

    expect({ status: answer.status, code: answer.code }, "the SVG upload").toEqual(API_ERRORS.INVALID_PARAMETER);
    const after = await readProfilePhoto(user.request);
    expect(after.bytes.equals(before.bytes), "the earlier avatar is unchanged").toBe(true);
  });

  test("LC-PR06 an avatar above 300 KB is refused", lifecycleTestDetails("LC-PR06"), async ({ actor }) => {
    const user = await actor("large");
    await uploadProfilePhoto(user.request, PNG);
    const before = await readProfilePhoto(user.request);
    expect(before.status, "control: a small PNG avatar is stored").toBe(200);
    expect(LARGE_PNG.buffer.length, "the test image is above the limit").toBeGreaterThan(300 * 1024);

    const answer = await apiRaw(user.request, "POST", API_PATHS.USER_PHOTO, { multipart: { file: LARGE_PNG } });

    expect({ status: answer.status, code: answer.code }, "the oversized upload is refused").toEqual(API_ERRORS.PAYLOAD_TOO_LARGE);
    const after = await readProfilePhoto(user.request);
    expect(after.bytes.equals(before.bytes), "the earlier avatar is unchanged").toBe(true);
  });

  test("LC-PR07 a deleted avatar is gone (the UI has no delete control)", lifecycleTestDetails("LC-PR07"), async ({ actor }) => {
    const user = await actor("delavatar");
    await uploadProfilePhoto(user.request, PNG);
    expect((await readProfilePhoto(user.request)).status, "control: the avatar is stored").toBe(200);

    await deleteProfilePhoto(user.request);

    expect((await readProfilePhoto(user.request)).status, "the avatar is gone").toBe(NO_AVATAR_STATUS);
    expect((await currentUser(user.request)).avatarUrl, "the profile no longer points to one").toBeFalsy();
    const profile = new ProfilePage(user.session.page);
    await profile.open();
    await expect(profile.nameInput, "the profile page loads without it").toHaveValue(user.email);
  });

  test("LC-PR08 the UI language follows the user", lifecycleTestDetails("LC-PR08"), async ({ actor }) => {
    const user = await actor("language");
    const profile = new ProfilePage(user.session.page);
    await profile.open();
    await expect(profile.languageLabel, "the page is in English").toBeVisible();

    await profile.chooseLanguage(GERMAN.option);

    await expect(user.session.page.getByText(GERMAN.languageLabel), "the page reloads in German").toBeVisible();
    expect((await currentUser(user.request)).uiLanguage, "the server stores the language").toBe(GERMAN.code);
  });

  test("LC-PR15 a known status flag is stored and an unknown type is refused", lifecycleTestDetails("LC-PR15"), async ({ actor }) => {
    const user = await actor("status");
    expect((await currentUser(user.request)).userStatus?.[USER_STATUS_OLDER_NON_DEV_POPUP], "before: the flag is not set").toBeUndefined();

    const known = await apiRaw(user.request, "PUT", API_PATHS.MARK_USER_STATUS, { data: { type: USER_STATUS_OLDER_NON_DEV_POPUP, value: true } });
    const unknown = await apiRaw(user.request, "PUT", API_PATHS.MARK_USER_STATUS, { data: { type: UNKNOWN_STATUS_TYPE, value: true } });

    expect({ status: known.status, code: known.code }, "a known flag").toEqual({ status: 200, code: 1 });
    expect((await currentUser(user.request)).userStatus?.[USER_STATUS_OLDER_NON_DEV_POPUP], "the flag is stored").toBe(true);
    expect({ status: unknown.status, code: unknown.code }, "an unknown flag type").toEqual(API_ERRORS.INVALID_USER_STATUS);
  });
});

