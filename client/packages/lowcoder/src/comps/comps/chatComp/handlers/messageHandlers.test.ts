import { AIAssistantQueryHandler } from "./messageHandlers";
import { assertAiRobotAccess } from "util/assertAiRobotAccess";
import { getPromiseAfterDispatch } from "util/promiseUtils";

jest.mock("i18n", () => ({ trans: (key: string) => key }));
jest.mock("util/assertAiRobotAccess", () => ({ assertAiRobotAccess: jest.fn() }));
jest.mock("util/promiseUtils", () => ({ getPromiseAfterDispatch: jest.fn() }));
jest.mock("lowcoder-core", () => ({ routeByNameAction: jest.fn(), executeQueryAction: jest.fn() }));
jest.mock("../../preLoadComp/actions/automator", () => ({
  buildAutomatorPayload: () => ({ messages: [], tools: [], context: { components: [], queries: [] } }),
}));
jest.mock("../utils/assistantMessages", () => ({
  getTextFromThreadContent: () => "hello",
  toAssistantMessage: (result: unknown) => result,
}));

const guard = assertAiRobotAccess as jest.Mock;
const query = getPromiseAfterDispatch as jest.Mock;
const handler = () => new AIAssistantQueryHandler({
  chatQuery: "aiQuery",
  dispatch: jest.fn(),
  getEditorState: jest.fn(),
} as any);

test("an unsubscribed user cannot dispatch an Automator query", async () => {
  guard.mockImplementation(() => { throw new Error("Subscription required"); });
  await expect(handler().sendMessage({} as any, undefined, [])).rejects.toThrow("Subscription required");
  expect(query).not.toHaveBeenCalled();
});

test("a response is rejected if workspace access changed while the query was running", async () => {
  guard.mockReturnValueOnce("workspace-a").mockImplementationOnce(() => {
    throw new Error("Workspace changed");
  });
  query.mockResolvedValue({ role: "assistant", content: [] });
  await expect(handler().sendMessage({} as any, undefined, [])).rejects.toThrow("Workspace changed");
  expect(guard).toHaveBeenLastCalledWith("workspace-a");
});

test("a verified subscriber can receive the Automator response", async () => {
  guard.mockReturnValue("workspace-a");
  const response = { role: "assistant", content: [] };
  query.mockResolvedValue(response);
  await expect(handler().sendMessage({} as any, undefined, [])).resolves.toEqual(response);
});
