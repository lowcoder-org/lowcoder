import type { Page } from "@playwright/test";
import { createApp, publishApp, setPublicToAll } from "../../src/api/client";
import { NEGATIVE_EVENT_WINDOW_MS } from "../../src/constants";
import {
  appDsl,
  button,
  component,
  eventHandler,
  executeComp,
  jsQuery,
  recordedHookOf,
  setTempState,
  stackItems,
  tempState,
  text,
} from "../../src/dsl/builders";
import { expect, test } from "../../src/fixtures";
import { AppViewPage } from "../../src/pages/AppViewPage";

/**
 * S17 AI Chat, S18 chat controller, S20 chat box. The chat components are seeded from their recordings. None of them
 * needs a server of its own except the chat controller, which connects to the hocuspocus server of the app image through
 * the host name baked into the client (`scripts/build-e2e-image.sh`), so S18 runs only inside the run script's network.
 */
const CHAT_QUERY = "chatq";
const CHAT_TEST_ID = "e2e-chat";
const STATE_TEXT_TEST_ID = "e2e-state";
const ERROR_ANSWER = "Sorry, I encountered an error. Please try again.";
const CHAT_TEXTBOX_PLACEHOLDER = "Type your message here...";
const USER_MESSAGE = "hello ai";
const CANNED_ANSWER = "canned answer";
const CANNED_PARTS_ANSWER = "canned parts answer";
/** The first frame with `read-write` came 2.9 s after the load in the probe. */
const CONNECTION_FRAME_TIMEOUT_MS = 20_000;

interface AnswerShape {
  name: string;
  /** Body of the JS query the chat calls for the assistant's answer. */
  script: string;
  /** What the chat must show: the answer, or the error text. */
  shows: string;
  accepted: boolean;
}

/**
 * What a query may answer (`chatComp/utils/assistantMessages.ts`): a message of role `assistant` whose content is a string
 * or a list of text parts. A plain string and any other role end in the chat's error message.
 */
const ANSWER_SHAPES: AnswerShape[] = [
  { name: "an assistant message with a string", script: `return { role: "assistant", content: "${CANNED_ANSWER}" }`, shows: CANNED_ANSWER, accepted: true },
  {
    name: "an assistant message with text parts",
    script: `return { role: "assistant", content: [{ type: "text", text: "${CANNED_PARTS_ANSWER}" }] }`,
    shows: CANNED_PARTS_ANSWER,
    accepted: true,
  },
  { name: "a plain string", script: `return "${CANNED_ANSWER}"`, shows: ERROR_ANSWER, accepted: false },
  { name: "a message of role user", script: `return { role: "user", content: "${CANNED_ANSWER}" }`, shows: ERROR_ANSWER, accepted: false },
];

async function openApp(page: Page, orgId: string, name: string, dsl: object): Promise<AppViewPage> {
  const { appId } = await createApp(page.request, { orgId, name, dsl });
  await publishApp(page.request, appId);
  const view = new AppViewPage(page);
  await view.open(appId);
  return view;
}

test.describe("S17 AI Chat", () => {
  for (const shape of ANSWER_SHAPES) {
    test(`the chat answers with ${shape.name}: ${shape.accepted ? "shown" : "error message"}`, async ({ page, apiUser }) => {
      const stateText = text({
        id: "t1",
        name: "stateText",
        text: "s1={{state1.value}}|s2={{state2.value}}",
        testId: STATE_TEXT_TEST_ID,
      });
      const chat = component("chat", {
        id: "c1",
        testId: CHAT_TEST_ID,
        comp: { chatQuery: { value: CHAT_QUERY } },
        onEvent: [
          eventHandler("messageSent", setTempState("state1", "sent")),
          eventHandler("messageReceived", setTempState("state2", "received")),
        ],
      });
      const dsl = appDsl(stackItems([chat, stateText]), {
        queries: [jsQuery({ id: "q1", name: CHAT_QUERY, script: shape.script })],
        tempStates: [tempState({ id: "s1", name: "state1", value: "null" }), tempState({ id: "s2", name: "state2", value: "null" })],
      });
      const view = await openApp(page, apiUser.orgId, `e2e-chat-${shape.accepted ? "ok" : "error"}`, dsl);
      const chatView = view.byTestId(CHAT_TEST_ID);
      const messageBox = chatView.getByRole("textbox").first();
      await expect(messageBox, "the chat's message box").toBeVisible();
      await expect(messageBox).toHaveAttribute("placeholder", CHAT_TEXTBOX_PLACEHOLDER);

      await messageBox.fill(USER_MESSAGE);
      await page.keyboard.press("Enter");

      // The sent text shows twice (thread list and message), so the answer is asserted, not a count of the sent text.
      await expect(chatView.getByText(shape.shows).first(), `the chat shows: ${shape.shows}`).toBeVisible();
      if (shape.accepted) {
        await expect(view.byTestId(STATE_TEXT_TEST_ID), "both events fired after an accepted answer").toHaveText("s1=sent|s2=received");
      } else {
        // `messageSent` fires only when the answer succeeds (O-14); `messageReceived` fires either way.
        await expect(view.byTestId(STATE_TEXT_TEST_ID), "messageReceived fired").toHaveText("s1=|s2=received");
        await page.waitForTimeout(NEGATIVE_EVENT_WINDOW_MS);
        await expect(view.byTestId(STATE_TEXT_TEST_ID), "messageSent did not fire after a failed answer").toHaveText("s1=|s2=received");
      }
    });
  }
});

test.describe("S18 chat controller", () => {
  test("the chat controller connects to the image's hocuspocus server and is granted read-write", async ({
    page,
    apiUser,
    networkGuard,
    baseURL,
  }) => {
    const hocuspocusUrl = `ws://${new URL(baseURL!).host}/hocuspocus`;
    const opened: string[] = [];
    const received: string[] = [];
    page.on("websocket", (socket) => {
      opened.push(socket.url());
      socket.on("framereceived", (frame) => received.push(String(frame.payload)));
    });
    const dsl = appDsl(
      [text({ id: "t1", name: "status", text: "{{chatController1.connectionStatus}}", testId: STATE_TEXT_TEST_ID })],
      { hooks: [recordedHookOf("chatController")] },
    );

    const view = await openApp(page, apiUser.orgId, "e2e-chat-controller", dsl);
    await expect(view.byTestId(STATE_TEXT_TEST_ID), "the view loaded and the controller is bound").not.toHaveText("");

    // The bound `connectionStatus` reads `Online` at its first read (O-15), so a frame is the signal of the connection.
    await expect.poll(() => received.some((payload) => payload.includes("read-write")), {
      message: `a frame with read-write arrives from ${hocuspocusUrl} (sockets opened: ${opened.join(", ") || "none"})`,
      timeout: CONNECTION_FRAME_TIMEOUT_MS,
    }).toBe(true);
    expect(opened, "the page opened exactly the app's own hocuspocus socket").toEqual([hocuspocusUrl]);
    expect(
      networkGuard.blockedUrls.filter((url) => /^wss?:/.test(url)),
      "the network guard blocked no WebSocket",
    ).toEqual([]);
  });

  const SEND_A_TEST_ID = "e2e-chat-send-a";
  const SEND_B_TEST_ID = "e2e-chat-send-b";
  const SHARED_TEST_ID = "e2e-chat-shared";
  const READY_TEST_ID = "e2e-chat-ready";
  const MESSAGE_FROM_A = "hello from viewer A";
  const MESSAGE_FROM_B = "hello from viewer B";
  const EMPTY_SHARED_TEXT = "shared={}";

  /** A chat controller (default room, no `applicationId` override) with one share button per viewer and the room's state as text. */
  function twoWayRoomApp(): object {
    const controller = recordedHookOf("chatController");
    return appDsl(
      stackItems([
        button({
          id: "ba",
          name: "shareA",
          text: "Share A",
          testId: SEND_A_TEST_ID,
          onEvent: [eventHandler("click", executeComp("chatController1", "setSharedState", [{ name: "key", value: "fromA" }, { name: "value", value: MESSAGE_FROM_A }]))],
        }),
        button({
          id: "bb",
          name: "shareB",
          text: "Share B",
          testId: SEND_B_TEST_ID,
          onEvent: [eventHandler("click", executeComp("chatController1", "setSharedState", [{ name: "key", value: "fromB" }, { name: "value", value: MESSAGE_FROM_B }]))],
        }),
        text({ id: "tr", name: "ready", text: "ready={{chatController1.ready}}", testId: READY_TEST_ID }),
        text({ id: "ts", name: "shared", text: "shared={{JSON.stringify(chatController1.sharedState)}}", testId: SHARED_TEST_ID }),
      ]),
      { hooks: [controller] },
    );
  }

  test("two viewers in the same room: each one's share reaches the other", async ({ page, apiUser, newUserSession }) => {
    const { appId } = await createApp(page.request, { orgId: apiUser.orgId, name: "e2e-chat-two-way", dsl: twoWayRoomApp() });
    await publishApp(page.request, appId);
    // Viewer B is a second, independent session with no login of its own (`newUserSession`); the app must be public
    // for it to open the view at all (`apps/public-app.spec.ts`).
    await setPublicToAll(page.request, appId, true);

    const viewA = new AppViewPage(page);
    await viewA.open(appId);
    const sessionB = await newUserSession();
    const viewB = new AppViewPage(sessionB.page);
    await viewB.open(appId);

    // Same connection-establishment budget as "the chat controller connects..." above.
    await expect(viewA.byTestId(READY_TEST_ID), "before: A's controller is connected to the room").toHaveText("ready=true", { timeout: CONNECTION_FRAME_TIMEOUT_MS });
    await expect(viewB.byTestId(READY_TEST_ID), "before: B's controller is connected to the same room").toHaveText("ready=true", { timeout: CONNECTION_FRAME_TIMEOUT_MS });
    await expect(viewA.byTestId(SHARED_TEST_ID), "before: the room is empty for A").toHaveText(EMPTY_SHARED_TEXT);
    await expect(viewB.byTestId(SHARED_TEST_ID), "before: the room is empty for B").toHaveText(EMPTY_SHARED_TEXT);

    await viewA.buttonByTestId(SEND_A_TEST_ID).click();
    await expect(viewA.byTestId(SHARED_TEST_ID), "control: A's own view carries A's message").toContainText(MESSAGE_FROM_A);
    await expect(viewB.byTestId(SHARED_TEST_ID), "B receives A's message").toContainText(MESSAGE_FROM_A);

    await viewB.buttonByTestId(SEND_B_TEST_ID).click();
    await expect(viewB.byTestId(SHARED_TEST_ID), "control: B's own view carries B's message").toContainText(MESSAGE_FROM_B);
    await expect(viewA.byTestId(SHARED_TEST_ID), "A receives B's message").toContainText(MESSAGE_FROM_B);

    // Both messages coexist (the second share did not overwrite the first) on both sides.
    await expect(viewA.byTestId(SHARED_TEST_ID), "A still has A's own message after B's share").toContainText(MESSAGE_FROM_A);
    await expect(viewB.byTestId(SHARED_TEST_ID), "B still has A's message after sharing its own").toContainText(MESSAGE_FROM_A);
  });
});

test.describe("S20 chat box", () => {
  const BOX_TEST_ID = "e2e-chatbox";
  const ROOM_NAME = "e2e room";
  const SHORT_ROOM_NAME = "x";
  const ROOM_STATE_TEXT_TEST_ID = "e2e-room-state";
  const DIALOG_CLOSE_TIMEOUT_MS = 5_000;

  /** A chat box with texts bound to its room-creation properties and a `roomCreate` handler that sets `state1`. */
  function chatBoxApp(): object {
    const box = component("chatBox", {
      id: "b1",
      testId: BOX_TEST_ID,
      onEvent: [eventHandler("roomCreate", setTempState("state1", "created"))],
    });
    const texts = [
      text({ id: "t1", name: "roomName", text: "name={{chatBox1.newRoomName}}", testId: "e2e-room-name" }),
      text({ id: "t2", name: "roomType", text: "type={{chatBox1.newRoomType}}", testId: "e2e-room-type" }),
      text({ id: "t3", name: "roomState", text: "state={{state1.value}}", testId: ROOM_STATE_TEXT_TEST_ID }),
    ];
    return appDsl(stackItems([box, ...texts]), { tempStates: [tempState({ id: "s1", name: "state1", value: "null" })] });
  }

  test("creating a room sets the room name and type, fires roomCreate and closes the dialog", async ({ page, apiUser }) => {
    const sockets: string[] = [];
    page.on("websocket", (socket) => sockets.push(socket.url()));
    const view = await openApp(page, apiUser.orgId, "e2e-chatbox-create", chatBoxApp());
    const box = view.byTestId(BOX_TEST_ID);
    await expect(view.byTestId("e2e-room-type"), "a room is public by default").toHaveText("type=public");
    await expect(view.byTestId(ROOM_STATE_TEXT_TEST_ID), "no room was created yet").toHaveText("state=");

    await box.getByRole("button", { name: "plus" }).click();
    const dialog = page.getByRole("dialog");
    await dialog.getByRole("textbox", { name: "Room Name" }).fill(ROOM_NAME);
    await dialog.getByRole("radio", { name: "Private" }).check();
    await dialog.getByRole("button", { name: "Create Room" }).click();

    await expect(view.byTestId("e2e-room-name"), "the new room's name").toHaveText(`name=${ROOM_NAME}`);
    await expect(view.byTestId("e2e-room-type"), "the new room's type").toHaveText("type=private");
    await expect(view.byTestId(ROOM_STATE_TEXT_TEST_ID), "the roomCreate event fired").toHaveText("state=created");
    await expect(dialog, "the dialog closes after the room is created").toBeHidden({ timeout: DIALOG_CLOSE_TIMEOUT_MS });
    expect(sockets, "creating a room opens no WebSocket").toEqual([]);
  });

  test("a room name of one character is refused and nothing is created", async ({ page, apiUser }) => {
    const view = await openApp(page, apiUser.orgId, "e2e-chatbox-short-name", chatBoxApp());
    await view.byTestId(BOX_TEST_ID).getByRole("button", { name: "plus" }).click();
    const dialog = page.getByRole("dialog");

    await dialog.getByRole("textbox", { name: "Room Name" }).fill(SHORT_ROOM_NAME);
    await dialog.getByRole("button", { name: "Create Room" }).click();

    await expect(dialog.getByText("At least 2 characters"), "the form names the rule").toBeVisible();
    await expect(dialog, "the dialog stays open").toBeVisible();
    await expect(view.byTestId("e2e-room-name"), "the room name is unchanged").toHaveText("name=");
    await expect(view.byTestId(ROOM_STATE_TEXT_TEST_ID), "no roomCreate event fired").toHaveText("state=");
  });
});
