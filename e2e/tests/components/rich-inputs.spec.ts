import { appDsl, component, stackItems, text } from "../../src/dsl/builders";
import { expect, test } from "../../src/fixtures";
import { openSeededApp } from "../../src/simple-components/seed";

/**
 * S11 of client/E2E-TESTING-components-p3-simple-scenarios-plan.md: `file`, `signature`, `richTextEditor` and `custom`,
 * one test each. Each effect is made visible through a text bound to the component's exposed state. Probe:
 * probes/behaviour.spec.ts.
 */
const COMPONENT_ID = "e2e-component";
const STATE_TEXT_ID = "e2e-state";
const UPLOAD_FILE = { name: "a.txt", mimeType: "text/plain", buffer: Buffer.from("hi") } as const;
const STROKE_START = { x: 20, y: 20 } as const;
const STROKE_END = { x: 120, y: 60 } as const;
const STROKE_STEPS = 10;
const TYPED_WORDS = "hello rte";
/** How long the rich text editor needs to settle after it shows: its own remount fires after 500 ms (see the test). */
const RTE_REMOUNT_SETTLE_MS = 1_000;
const CUSTOM_MODEL_NAME = "Bob";
const CUSTOM_BUTTON_ID = "cb";
/**
 * A self-contained custom component: no CDN (every other origin is blocked by the network guard). `model` comes in,
 * `updateModel` writes `model.clicked` back to the app.
 */
const CUSTOM_CODE = `<div id="root"></div>
<script type="text/babel">
const MyComp = ({ model, updateModel }) => (
  <button id="${CUSTOM_BUTTON_ID}" onClick={() => updateModel({ clicked: "yes" })}>{"Hi " + model.name}</button>
);
const ConnectedComponent = Lowcoder.connect(MyComp);
const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<ConnectedComponent />);
</script>`;

/** The component under test (recorded default plus overrides) and the text bound to its state, in their own rows. */
function appOf(compType: string, stateExpression: string, comp: Record<string, unknown> = {}): object {
  const item = component(compType, { id: "c1", testId: COMPONENT_ID, comp });
  return appDsl(
    stackItems([
      item,
      text({ id: "t1", name: "tState", testId: STATE_TEXT_ID, text: stateExpression }),
    ]),
  );
}

test.describe("S11 file, signature, rich text and custom components", () => {
  test("file: an uploaded file appears in the component's files", async ({ page, apiUser }) => {
    const { view } = await openSeededApp(page, page.request, {
      orgId: apiUser.orgId,
      name: "e2e-s11-file",
      dsl: appOf("file", "files={{file1.files.length}}:{{file1.files[0]?.name}}"),
    });
    await expect(view.byTestId(STATE_TEXT_ID), "no file before the upload").toHaveText("files=0:");

    await view.byTestId(COMPONENT_ID).locator('input[type="file"]').setInputFiles(UPLOAD_FILE);

    await expect(view.byTestId(STATE_TEXT_ID), "the file's count and name").toHaveText(`files=1:${UPLOAD_FILE.name}`);
  });

  test("signature: a mouse stroke on its canvas sets its value", async ({ page, apiUser }) => {
    const { view } = await openSeededApp(page, page.request, {
      orgId: apiUser.orgId,
      name: "e2e-s11-signature",
      dsl: appOf("signature", "sign={{signature1.value ? 'set' : 'empty'}}"),
    });
    await expect(view.byTestId(STATE_TEXT_ID), "empty before the stroke").toHaveText("sign=empty");
    const canvas = view.byTestId(COMPONENT_ID).locator("canvas");
    await expect(canvas, "the signature canvas is shown").toBeVisible();
    const box = await canvas.boundingBox();
    if (!box) {
      throw new Error("the signature canvas has no bounding box");
    }

    await page.mouse.move(box.x + STROKE_START.x, box.y + STROKE_START.y);
    await page.mouse.down();
    await page.mouse.move(box.x + STROKE_END.x, box.y + STROKE_END.y, { steps: STROKE_STEPS });
    await page.mouse.up();

    await expect(view.byTestId(STATE_TEXT_ID), "the value is set after the stroke").toHaveText("sign=set");
  });

  test("richTextEditor: typed words reach its value", async ({ page, apiUser }) => {
    const { view } = await openSeededApp(page, page.request, {
      orgId: apiUser.orgId,
      name: "e2e-s11-rte",
      dsl: appOf("richTextEditor", "rte={{richTextEditor1.value}}"),
    });
    const editor = view.byTestId(COMPONENT_ID).locator(".ql-editor");
    await expect(editor, "the Quill editor is shown").toBeVisible();

    // The editor remounts itself once, 500 ms after the component mounts: `useDebounce(() => setKey(Math.random()), 500,
    // [props.placeholder])` also runs on mount (richTextEditorComp.tsx, "react-quill will not take effect after the
    // placeholder is updated"). Keystrokes typed before that go into a Quill that is thrown away: the value stayed empty
    // in 4 of 20 runs typed right after the editor showed, and marking the first editor element to wait for its
    // replacement missed the remount in 6 of 20 (it can happen before the editor is first seen). No page signal marks
    // the remount, so this is a fixed wait of twice the debounce.
    await page.waitForTimeout(RTE_REMOUNT_SETTLE_MS);

    // A `div` intercepts pointer events on `.ql-editor` (p2 section 2.3): focus it, then type.
    await editor.focus();
    await page.keyboard.type(TYPED_WORDS);

    await expect(view.byTestId(STATE_TEXT_ID), "the typed words are in the value").toContainText(TYPED_WORDS);
  });

  test("custom: its own code gets the model and writes back through updateModel", async ({ page, apiUser }) => {
    const { view } = await openSeededApp(page, page.request, {
      orgId: apiUser.orgId,
      name: "e2e-s11-custom",
      dsl: appOf("custom", "custom={{custom1.model.clicked}}", {
        model: JSON.stringify({ name: CUSTOM_MODEL_NAME }),
        code: CUSTOM_CODE,
      }),
    });
    const button = view.byTestId(COMPONENT_ID).frameLocator("iframe").locator(`#${CUSTOM_BUTTON_ID}`);
    await expect(button, "the model reached the component's code").toHaveText(`Hi ${CUSTOM_MODEL_NAME}`);
    await expect(view.byTestId(STATE_TEXT_ID), "nothing was written back before the click").toHaveText("custom=");

    await button.click();

    await expect(view.byTestId(STATE_TEXT_ID), "updateModel wrote the model back").toHaveText("custom=yes");
  });
});
