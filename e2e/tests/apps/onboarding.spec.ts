import { currentUser } from "../../src/api/client";
import { NEGATIVE_EVENT_WINDOW_MS, NEW_USER_GUIDANCE_STATUS, TEST_PASSWORD, UI_PATHS } from "../../src/constants";
import { expect, test, uniqueEmail } from "../../src/fixtures";
import { expectCountStays } from "../../src/logic/helpers";
import { AppListPage } from "../../src/pages/AppListPage";
import { AuthPage } from "../../src/pages/AuthPage";
import { lifecycleTestDetails } from "../../src/security/quarantine";

/**
 * The new-user tour (LC-OT01): react-joyride on the app list, one step, started 400 ms after the list mounts
 * (`pages/tutorials/HomeTutorialsV2.tsx`), shown while the user's `newUserGuidance` flag is unset. The suite's API
 * fixtures set the flag at once (`dismissNewUserGuidance`), so this test signs up through the UI.
 */

/** The tour starts 400 ms after mounting (`HomeTutorialsV2.tsx`); a check for its absence waits this long first. */
const TOUR_ABSENCE_WINDOW_MS = NEGATIVE_EVENT_WINDOW_MS * 2;

test.describe("lifecycle: onboarding", () => {
  test("LC-OT01 a new user sees the tour once and closing it keeps it away", lifecycleTestDetails("LC-OT01"), async ({ page }, testInfo) => {
    const auth = new AuthPage(page);
    const appList = new AppListPage(page);
    await auth.openRegister();
    await auth.signUp(uniqueEmail("tour", testInfo.workerIndex), TEST_PASSWORD);
    await expect(page, "after sign-up the user is on the app list").toHaveURL(UI_PATHS.APP_LIST);

    await expect(appList.tourText, "the tour opens on the new user's app list").toBeVisible();
    expect((await currentUser(page.request)).userStatus?.[NEW_USER_GUIDANCE_STATUS], "before: the flag is not set").toBeFalsy();

    await appList.tourClose.click();

    await expect(appList.tourDialog, "the tour closes").toHaveCount(0);
    await expect.poll(async () => (await currentUser(page.request)).userStatus?.[NEW_USER_GUIDANCE_STATUS], "closing stores the flag").toBe(true);
    await page.reload();
    await expect(appList.emptyState, "the app list has loaded again").toBeVisible();
    await expectCountStays(page, appList.tourDialog, 0, "the tour does not come back", { windowMs: TOUR_ABSENCE_WINDOW_MS });
  });
});
