import { createApp, publishApp, updateApp } from "../../src/api/client";
import { appDsl, button, eventHandler, executeComp, recordedHookOf, stackItems, text } from "../../src/dsl/builders";
import { expect, test } from "../../src/fixtures";
import { expectTextStays } from "../../src/logic/helpers";
import { AppViewPage } from "../../src/pages/AppViewPage";
import { adminOfApiUser } from "../../src/security/actors";
import { securityTestDetails } from "../../src/security/quarantine";

/**
 * Collaboration rooms (A11): the chat controller joins the hocuspocus room `signal_<applicationId>` with the
 * `applicationId` PROPERTY it is given, and the server never asks whether the user may see that app (SF-31). A (the
 * `apiUser`) shares a value in the room of its private app; B, an outsider with its own app in its own workspace, points
 * its chat controller at A's app id. The room is the image's own hocuspocus behind the app's nginx, as in
 * tests/components/chat.spec.ts; nothing leaves the run's network.
 */

const SEND_TEST_ID = "e2e-sec-send";
const READY_TEST_ID = "e2e-sec-ready";
const SHARED_TEST_ID = "e2e-sec-shared";
const SECRET_KEY = "e2e-sec-secret-key";
const SECRET_VALUE = "e2e-sec-secret-value-of-a";
const EMPTY_SHARED_TEXT = "shared={}";
const ONLINE_TEST_ID = "e2e-sec-online";
/** `onlineUsers` is a list of the OTHER users present in the room (presence), separate from `sharedState`. */
const NOBODY_ONLINE_TEXT = "online=[]";
/** The first frame of a room arrives about 3 s after the load in the chat probe; the room's state is pushed at connect. */
const ROOM_SYNC_WINDOW_MS = 6_000;
const CONNECTION_TIMEOUT_MS = 20_000;

/** An app whose chat controller joins the room of `roomAppId`, a button that shares a value there, and the room's state as text. */
function roomApp(roomAppId: string, userId: string): object {
  const controller = recordedHookOf("chatController", { applicationId: roomAppId, userId, userName: userId });
  return appDsl(
    stackItems([
      button({
        id: "b1",
        name: "share",
        text: "Share",
        testId: SEND_TEST_ID,
        onEvent: [eventHandler("click", executeComp("chatController1", "setSharedState", [{ name: "key", value: SECRET_KEY }, { name: "value", value: SECRET_VALUE }]))],
      }),
      text({ id: "t1", name: "ready", text: "ready={{chatController1.ready}}", testId: READY_TEST_ID }),
      text({ id: "t2", name: "shared", text: "shared={{JSON.stringify(chatController1.sharedState)}}", testId: SHARED_TEST_ID }),
      text({ id: "t3", name: "online", text: "online={{JSON.stringify(chatController1.onlineUsers)}}", testId: ONLINE_TEST_ID }),
    ]),
    { hooks: [controller] },
  );
}

test.describe("security: collaboration rooms", () => {
  test("SEC-A11 a chat controller of another workspace does not receive the room of a private app", securityTestDetails("SEC-A11"), async ({ page, apiUser, actor }) => {
    const a = await adminOfApiUser(page.request, apiUser);
    const b = await actor("attacker");
    const { appId: appOfA } = await createApp(a.request, { orgId: a.orgId, name: "e2e-sec-room-a" });
    await updateApp(a.request, appOfA, { dsl: roomApp(appOfA, "user-a") });
    await publishApp(a.request, appOfA);
    const viewOfA = new AppViewPage(page);
    await viewOfA.open(appOfA);
    await expect(viewOfA.byTestId(READY_TEST_ID), "before: A's controller is connected to its room").toHaveText("ready=true", { timeout: CONNECTION_TIMEOUT_MS });
    await expect(viewOfA.byTestId(SHARED_TEST_ID), "before: A's room is empty").toHaveText(EMPTY_SHARED_TEXT);
    await expect(viewOfA.byTestId(ONLINE_TEST_ID), "before: nobody else is present in A's room").toHaveText(NOBODY_ONLINE_TEXT);
    await viewOfA.buttonByTestId(SEND_TEST_ID).click();
    await expect(viewOfA.byTestId(SHARED_TEST_ID), "control: the room carries A's value for A").toContainText(SECRET_VALUE);
    const { appId: appOfB } = await createApp(b.request, {
      orgId: b.orgId,
      name: "e2e-sec-room-b",
      dsl: roomApp(appOfA, "user-b"),
    });
    await publishApp(b.request, appOfB);

    const viewOfB = new AppViewPage(b.session.page);
    await viewOfB.open(appOfB);

    await expect(viewOfB.byTestId(READY_TEST_ID), "B's controller connects (to the room of A's app id)").toHaveText("ready=true", { timeout: CONNECTION_TIMEOUT_MS });
    // Desired: B never receives A's room state. Open on 3.0.0 and HEAD: the room name is built from the property alone (SF-31).
    await expectTextStays(b.session.page, viewOfB.byTestId(SHARED_TEST_ID), EMPTY_SHARED_TEXT, "B's view of A's room", { windowMs: ROOM_SYNC_WINDOW_MS });
    // The presence half: B must not see A as present, and A must not see B (the room has the same name for both).
    await expectTextStays(b.session.page, viewOfB.byTestId(ONLINE_TEST_ID), NOBODY_ONLINE_TEXT, "B's view of who is present in A's room", { windowMs: ROOM_SYNC_WINDOW_MS });
    await expectTextStays(page, viewOfA.byTestId(ONLINE_TEST_ID), NOBODY_ONLINE_TEXT, "A's view of who is present in its own room", { windowMs: ROOM_SYNC_WINDOW_MS });
  });
});
