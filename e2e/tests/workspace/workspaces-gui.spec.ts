import { createApp, createOrganization, currentUser, grantAppPermission } from "../../src/api/client";
import { SETTING_PATHS, UI_PATHS } from "../../src/constants";
import { expect, test } from "../../src/fixtures";
import { AppListPage } from "../../src/pages/AppListPage";
import { UserMenu } from "../../src/pages/UserMenu";
import { WorkspacesPage } from "../../src/pages/WorkspacesPage";
import { joinWorkspace } from "../../src/security/actors";
import { lifecycleTestDetails } from "../../src/security/quarantine";

/** The workspaces of a user in the UI (LC-WM08 to LC-WM11): create, switch, rename and delete. */

const DEFAULT_NAME_PREFIX = "New Workspace";
const RENAMED = "E2E Renamed Workspace";
const SECOND_WORKSPACE = "E2E Second Workspace";

/** The names of the user's workspaces, by id. */
async function workspaces(request: import("@playwright/test").APIRequestContext): Promise<{ id: string; name?: string; role?: string }[]> {
  return (await currentUser(request)).orgAndRoles.map((entry) => ({ id: entry.org.id, name: entry.org.name, role: entry.role }));
}

test.describe("lifecycle: workspaces", () => {
  test("LC-WM08 Create Workspace in the avatar menu creates a workspace the user administers", lifecycleTestDetails("LC-WM08"), async ({ actor }) => {
    const user = await actor("wmcreate");
    const page = user.session.page;
    await page.goto(UI_PATHS.APP_LIST_PATH);
    const before = await workspaces(user.request);
    const currentBefore = (await currentUser(user.request)).currentOrgId;

    await new UserMenu(page).createWorkspace(user.email);

    await expect(page, "the app opens the workspace list").toHaveURL(SETTING_PATHS.WORKSPACES);
    await expect.poll(async () => (await workspaces(user.request)).length, "a second workspace exists").toBe(before.length + 1);
    const created = (await workspaces(user.request)).find((entry) => !before.some((known) => known.id === entry.id));
    expect(created?.role, "the user administers it").toBe("admin");
    expect(created?.name?.startsWith(DEFAULT_NAME_PREFIX), "it has the default name").toBe(true);
    expect((await currentUser(user.request)).currentOrgId, "creating does not switch the current workspace").toBe(currentBefore);
  });

  test("LC-WM09 switching the workspace in the avatar menu changes the app list", lifecycleTestDetails("LC-WM09"), async ({ actor }) => {
    const host = await actor("wmhost");
    const user = await actor("wmswitch");
    const { appId } = await createApp(host.request, { orgId: host.orgId, name: "e2e-wm-app-host" });
    await joinWorkspace(host, user);
    await grantAppPermission(host.request, appId, { role: "viewer", userIds: [user.userId] });
    const page = user.session.page;
    const appList = new AppListPage(page);
    await appList.open();
    await expect(appList.appNamed("e2e-wm-app-host"), "the joined workspace is current: its app is listed").toBeVisible();
    const ownName = (await workspaces(user.request)).find((entry) => entry.id === user.orgId)?.name;
    expect(ownName, "the user's own workspace has a name").toBeTruthy();

    await new UserMenu(page).switchWorkspace(user.email, ownName!);

    await expect.poll(async () => (await currentUser(user.request)).currentOrgId, "the server switched").toBe(user.orgId);
    await expect(appList.title, "the app list of the new workspace has loaded").toBeVisible();
    await expect(appList.appNamed("e2e-wm-app-host"), "the host's app is no longer listed").toHaveCount(0);
  });

  test("LC-WM10 an admin renames the workspace", lifecycleTestDetails("LC-WM10"), async ({ actor }) => {
    const admin = await actor("wmrename");
    const page = admin.session.page;
    const list = new WorkspacesPage(page);
    await list.open();
    const ownName = (await workspaces(admin.request)).find((entry) => entry.id === admin.orgId)?.name;
    await expect(list.row(ownName!), "the list shows the workspace").toBeVisible();
    await list.edit(ownName!);

    await list.nameInput.fill(RENAMED);
    await list.nameInput.press("Enter");

    await expect.poll(async () => (await workspaces(admin.request)).find((entry) => entry.id === admin.orgId)?.name, "the server stores the new name").toBe(RENAMED);
    await list.open();
    await expect(list.row(RENAMED), "the list shows it after a reload").toBeVisible();
  });

  test("LC-WM11 deleting a workspace needs its exact name and is offered only to an admin of two workspaces", lifecycleTestDetails("LC-WM11"), async ({ actor }) => {
    const admin = await actor("wmdelete");
    const page = admin.session.page;
    const list = new WorkspacesPage(page);
    await list.open();
    const ownName = (await workspaces(admin.request)).find((entry) => entry.id === admin.orgId)?.name;
    await expect(list.row(ownName!), "the list shows the only workspace").toBeVisible();
    await expect(list.menuIconOf(ownName!), "an admin of one workspace gets no delete menu").toHaveCount(0);
    const extraId = await createOrganization(admin.request, SECOND_WORKSPACE);
    await list.open();
    await expect(list.row(SECOND_WORKSPACE), "the second workspace is listed").toBeVisible();
    await expect(list.menuIconOf(ownName!), "an admin of two workspaces gets the delete menu").toHaveCount(1);

    await list.openDelete(SECOND_WORKSPACE);
    await list.confirmDelete("not the name");

    await expect(list.wrongNameMessage, "a wrong name is refused").toBeVisible();
    expect((await workspaces(admin.request)).some((entry) => entry.id === extraId), "the workspace still exists").toBe(true);

    await list.confirmDelete(SECOND_WORKSPACE);

    await expect(list.row(SECOND_WORKSPACE), "the exact name deletes it").toHaveCount(0);
    await expect.poll(async () => (await workspaces(admin.request)).some((entry) => entry.id === extraId), "and it leaves the user's workspaces").toBe(false);
  });
});
