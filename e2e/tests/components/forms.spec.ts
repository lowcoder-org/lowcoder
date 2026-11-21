import {
  appDsl,
  component,
  containerOf,
  eventHandler,
  input,
  setTempState,
  stackItems,
  tempState,
  text,
} from "../../src/dsl/builders";
import { expect, test } from "../../src/fixtures";
import { expectTextStays } from "../../src/logic/helpers";
import { containerWithChildren, openSeededApp } from "../../src/simple-components/seed";

/**
 * S10 of client/E2E-TESTING-components-p3-simple-scenarios-plan.md: `form` and `jsonSchemaForm`, three tests, each on its
 * own fresh app so that no case starts with a state another case set. The oracle is the temporary state the `submit`
 * handler sets, not the exposed `data` (which follows each input).
 */
const FORM_ID = "e2e-form";
const FORM_NAME = "form1";
const FORM_INPUT_NAME = "formInput1";
const FORM_INPUT_ID = "e2e-form-input";
const SUBMITTED_ID = "e2e-submitted";
const TYPED_ID = "e2e-typed";
const SCHEMA_FORM_ID = "e2e-schema-form";
const SCHEMA_FORM_NAME = "jsonSchemaForm1";
const FORM_INPUT_VALUE = "e2e form";
const SCHEMA_NAME_VALUE = "e2e";
const SHORT_PHONE = "123";
/**
 * What the form shows for a failed rule: no message text of its own (the design expected @rjsf's "fewer than 11
 * characters", which never appeared), but @rjsf marks the field's group `has-error` (a string field's group is
 * `.field-string`), which also turns the recorded help text of the field (`ui:help` "at least 11 characters") red.
 * The recorded `errorSchema` puts the whole form's root object into the error state from the start, so the root is no
 * oracle: only the string field's own group is looked at.
 */
const ERROR_FIELD = ".field-string.has-error";
const PHONE_HELP_TEXT = "at least 11 characters";
const SUBMIT_BUTTON = "Submit";

test.describe("S10 forms", () => {
  test("form submits the data of its inputs to the submit handler", async ({ page, apiUser }) => {
    const dsl = appDsl(
      stackItems([
        component("form", {
          id: "f1",
          testId: FORM_ID,
          name: FORM_NAME,
          onEvent: [eventHandler("submit", setTempState("state1", `{{${FORM_NAME}.data}}`))],
          comp: {
            container: containerWithChildren("form", {
              body: containerOf([input({ id: "i1", name: FORM_INPUT_NAME, testId: FORM_INPUT_ID })]),
            }),
          },
        }),
        text({ id: "t1", name: "tSubmitted", testId: SUBMITTED_ID, text: "{{JSON.stringify(state1.value)}}" }),
        text({ id: "t2", name: "tTyped", testId: TYPED_ID, text: `typed={{${FORM_INPUT_NAME}.value}}` }),
      ]),
      { tempStates: [tempState({ id: "s1", name: "state1", value: "null" })] },
    );
    const { view } = await openSeededApp(page, page.request, { orgId: apiUser.orgId, name: "e2e-s10-form", dsl });
    const form = view.byTestId(FORM_ID);
    await expect(view.byTestId(SUBMITTED_ID), "nothing is submitted before the click").toHaveText("null");

    await form.getByTestId(FORM_INPUT_ID).getByRole("textbox").fill(FORM_INPUT_VALUE);
    // The app evaluates its expressions after the input event: a click straight after `fill` submitted the empty value.
    await expect(view.byTestId(TYPED_ID), "the app has taken the typed value over").toHaveText(`typed=${FORM_INPUT_VALUE}`);
    await form.getByRole("button", { name: SUBMIT_BUTTON }).click();

    await expect(view.byTestId(SUBMITTED_ID), "the submitted data holds the typed value under the input's name").toContainText(
      `"${FORM_INPUT_NAME}":"${FORM_INPUT_VALUE}"`,
    );
  });

  /** A jsonSchemaForm on its recording (schema `User Information`, `data` filled) whose `submit` sets `state2`. */
  function schemaFormApp(): object {
    return appDsl(
      stackItems([
        component("jsonSchemaForm", {
          id: "f1",
          testId: SCHEMA_FORM_ID,
          name: SCHEMA_FORM_NAME,
          onEvent: [eventHandler("submit", setTempState("state2", `{{${SCHEMA_FORM_NAME}.data}}`))],
        }),
        // `state2` starts as an empty object so that `.name` reads a missing field (empty text) instead of dereferencing null
        text({ id: "t1", name: "tSubmitted", testId: SUBMITTED_ID, text: "{{state2.value.name}}" }),
      ]),
      { tempStates: [tempState({ id: "s2", name: "state2", value: "{}" })] },
    );
  }

  test("jsonSchemaForm with valid data runs its submit handler", async ({ page, apiUser }) => {
    const { view } = await openSeededApp(page, page.request, {
      orgId: apiUser.orgId,
      name: "e2e-s10-schema-valid",
      dsl: schemaFormApp(),
    });
    const form = view.byTestId(SCHEMA_FORM_ID);
    await expect(view.byTestId(SUBMITTED_ID), "the handler has not run on load").toHaveText("");

    await form.getByRole("textbox", { name: /Name/ }).fill(SCHEMA_NAME_VALUE);
    await expect(view.byTestId(SUBMITTED_ID), "typing alone does not run the submit handler").toHaveText("");
    await form.getByRole("button", { name: SUBMIT_BUTTON }).click();

    await expect(view.byTestId(SUBMITTED_ID), "the handler stored the submitted name").toHaveText(SCHEMA_NAME_VALUE);
  });

  test("jsonSchemaForm with a too short phone shows a message and does not run its submit handler", async ({ page, apiUser }) => {
    const { view } = await openSeededApp(page, page.request, {
      orgId: apiUser.orgId,
      name: "e2e-s10-schema-invalid",
      dsl: schemaFormApp(),
    });
    const form = view.byTestId(SCHEMA_FORM_ID);
    await expect(view.byTestId(SUBMITTED_ID), "the handler has not run on load").toHaveText("");

    const phoneItem = form.locator(ERROR_FIELD).filter({ has: page.getByRole("textbox", { name: /Phone/ }) });
    await form.getByRole("textbox", { name: /Phone/ }).fill(SHORT_PHONE);
    await expect(phoneItem, "typing alone does not validate (liveValidate is off)").toHaveCount(0);
    await form.getByRole("button", { name: SUBMIT_BUTTON }).click();

    await expect(phoneItem, "the Phone field is in its error state after the invalid submission").toHaveCount(1);
    await expect(phoneItem.getByText(PHONE_HELP_TEXT), "the field's help text is shown under it").toBeVisible();
    await expectTextStays(page, view.byTestId(SUBMITTED_ID), "", "an invalid submission does not run the handler");
  });
});
