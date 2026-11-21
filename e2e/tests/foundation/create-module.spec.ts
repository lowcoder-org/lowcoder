import type { APIRequestContext } from "@playwright/test";
import { expect, test } from "@playwright/test";
import { createApp, createModule, LowcoderApiError } from "../../src/api/client";
import { API_OK, API_PATHS, APP_TYPE_APPLICATION, APP_TYPE_MODULE, EMPTY_MODULE_DSL } from "../../src/constants";
import { moduleApp } from "../../src/dsl/builders";

const ORG_ID = "org-1";
const NEW_ID = "app-123";

interface RecordedPost {
  url: string;
  body: Record<string, unknown>;
}

/** A request context that records its POSTs and answers like POST /api/applications; nothing leaves the process. */
function fakeRequest(answer: { code: number; status: number }): { request: APIRequestContext; posts: RecordedPost[] } {
  const posts: RecordedPost[] = [];
  const request = {
    post: async (url: string, options: { data: Record<string, unknown> }) => {
      posts.push({ url, body: options.data });
      const body = JSON.stringify({ code: answer.code, data: { applicationInfoView: { applicationId: NEW_ID } } });
      return { text: async () => body, status: () => answer.status, ok: () => answer.status < 400 };
    },
  } as unknown as APIRequestContext;
  return { request, posts };
}

test.describe("createModule request shape", () => {
  test("posts applicationType 2 with the given DSL to /api/applications and returns the new id", async () => {
    const { request, posts } = fakeRequest({ code: API_OK, status: 200 });
    const dsl = moduleApp({ events: ["event1"] });

    const created = await createModule(request, { orgId: ORG_ID, name: "m", dsl });

    expect(created, "the module id").toEqual({ appId: NEW_ID });
    expect(posts, "one POST").toEqual([
      {
        url: API_PATHS.APPLICATIONS,
        body: { orgId: ORG_ID, name: "m", applicationType: APP_TYPE_MODULE, editingApplicationDSL: dsl },
      },
    ]);
    expect(APP_TYPE_MODULE, "AppTypeEnum.Module").toBe(2);
  });

  test("without a DSL it posts the empty module the editor's Create Module posts", async () => {
    const { request, posts } = fakeRequest({ code: API_OK, status: 200 });

    await createModule(request, { orgId: ORG_ID, name: "empty" });

    expect(posts[0]?.body.editingApplicationDSL, "default module DSL").toEqual({ ui: { compType: "module", comp: {} } });
    expect(posts[0]?.body.editingApplicationDSL, "the constant is that DSL").toEqual(EMPTY_MODULE_DSL);
  });

  test("createApp still posts applicationType 1 and an empty DSL by default", async () => {
    const { request, posts } = fakeRequest({ code: API_OK, status: 200 });

    await createApp(request, { orgId: ORG_ID, name: "a" });

    expect(posts[0]?.body, "app request body").toEqual({
      orgId: ORG_ID,
      name: "a",
      applicationType: APP_TYPE_APPLICATION,
      editingApplicationDSL: {},
    });
  });

  test("an answer with an error code throws LowcoderApiError naming the module", async () => {
    const { request } = fakeRequest({ code: 5000, status: 200 });

    const failure = await createModule(request, { orgId: ORG_ID, name: "broken" }).then(
      () => undefined,
      (error: unknown) => error,
    );

    expect(failure, "the error type").toBeInstanceOf(LowcoderApiError);
    expect((failure as Error).message, "the message names the action").toContain("create module broken failed");
  });
});
