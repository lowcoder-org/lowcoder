import { currentUser } from "../../src/api/client";
import { UI_PATHS } from "../../src/constants";
import { expect, test } from "../../src/fixtures";
import { ProfileModal } from "../../src/pages/ProfileModal";
import { ProfilePage } from "../../src/pages/ProfilePage";
import { UserMenu } from "../../src/pages/UserMenu";

/** Unit tests of the page objects of the lifecycle specs: each is run where it must work, as the owner. */
test.describe("lifecycle page objects", () => {
  test("ProfilePage opens the page, holds the name, saves a new one and lists the languages", async ({ actor }) => {
    const user = await actor("pgprofile");
    const profile = new ProfilePage(user.session.page);

    await profile.open();
    await expect(profile.aboutText).toBeVisible();
    await expect(profile.nameInput).toHaveValue(user.email);
    await expect(profile.languageLabel).toBeVisible();
    await expect(profile.avatarFileInput, "exactly one upload input").toHaveCount(1);
    await profile.setName("Page Object Name");

    await expect.poll(async () => (await currentUser(user.request)).username).toBe("Page Object Name");
  });

  test("UserMenu.openProfile opens the modal, ProfileModal reaches the password fields", async ({ actor }) => {
    const user = await actor("pgmodal");
    const page = user.session.page;
    await page.goto(UI_PATHS.APP_LIST_PATH);

    await new UserMenu(page).openProfile(user.email);
    const modal = new ProfileModal(page);
    await expect(modal.title).toBeVisible();
    await expect(modal.nameInput).toHaveValue(user.email);
    await modal.modifyPasswordButton.click();
    await modal.fillPasswordChange("Old-pass-1", "New-pass-1");

    await expect(modal.passwordFields, "old, new and confirmation").toHaveCount(3);
    await expect(modal.submitButton).toBeEnabled();
  });
});
