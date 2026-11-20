import { createApp, getAppDsl } from "../../src/api/client";
import { SAVE_POLL_TIMEOUT_MS, TAGS } from "../../src/constants";
import { expect, test } from "../../src/fixtures";
import { EditorPage } from "../../src/pages/EditorPage";
import { QueryPanel } from "../../src/pages/QueryPanel";

const QUERY_NAME = "query1";
const SCRIPT = "return 21 * 2";
const RESULT = "42";

test("a JavaScript query written in the editor runs and shows its result", { tag: TAGS.CORE }, async ({
  page,
  apiUser,
}) => {
  const { appId } = await createApp(page.request, { orgId: apiUser.orgId, name: "e2e-js-query-editor" });
  const editor = new EditorPage(page);
  const queries = new QueryPanel(page);

  await editor.open(appId);
  await queries.createJavaScript();
  await queries.setCode(SCRIPT);
  // The editor hands the typed code to the query a moment after typing; the saved app holding it shows that
  // the query has it, and only then does a run use it.
  await expect
    .poll(async () => JSON.stringify((await getAppDsl(page.request, appId)).applicationDSL), {
      timeout: SAVE_POLL_TIMEOUT_MS,
      message: "the saved app holds the script",
    })
    .toContain(SCRIPT);
  await queries.run();

  await expect(queries.runSuccessful(QUERY_NAME), "the query ran").toBeVisible();
  await expect(page.getByText(RESULT, { exact: true }), "the result is shown").toBeVisible();
});
