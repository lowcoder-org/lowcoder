import { appDsl, component } from "../../src/dsl/builders";
import { expect, test } from "../../src/fixtures";
import { containerWithChildren, openSeededApp, slotChild, slotContainers } from "../../src/simple-components/seed";

/**
 * S8 of client/E2E-TESTING-components-p3-simple-scenarios-plan.md: the eight container types, one test each. A container's
 * recording holds no body child (and, for the layouts, no slot child), so each test seeds one text child per slot in the
 * shape of the recorded header child and asserts that the published view shows it. Probe: probes/p3g-containers.spec.ts.
 */
const CONTAINER_ID = "e2e-container";
const HEADER_ID = "e2e-kid-header";
const BODY_ID = "e2e-kid-body";
const SLOT_0_ID = "e2e-kid-0";
const SLOT_1_ID = "e2e-kid-1";
const VIEW_TIMEOUT_MS = 15_000;

type BodyContainerType = "container" | "floatTextContainer";
const BODY_CONTAINER_TYPES: BodyContainerType[] = ["container", "floatTextContainer"];

test.describe("S8 containers", () => {
  for (const compType of BODY_CONTAINER_TYPES) {
    test(`${compType} shows its header text and its body child`, async ({ page, apiUser }) => {
      const headerText = `HeaderChild-${compType}`;
      const bodyText = `BodyChild-${compType}`;
      const dsl = appDsl([
        component(compType, {
          id: "c1",
          testId: CONTAINER_ID,
          comp: {
            container: containerWithChildren(compType, {
              header: { text: headerText, testId: HEADER_ID },
              body: slotChild({ id: "b1", name: "bodyText1", text: bodyText, testId: BODY_ID }),
            }),
          },
        }),
      ]);
      const { view } = await openSeededApp(page, page.request, { orgId: apiUser.orgId, name: `e2e-s8-${compType}`, dsl });

      await expect(view.byTestId(HEADER_ID), "the header text is shown").toHaveText(headerText, { timeout: VIEW_TIMEOUT_MS });
      await expect(view.byTestId(BODY_ID), "the body child is shown").toHaveText(bodyText);
      await expect(view.byTestId(CONTAINER_ID).getByTestId(BODY_ID), "the body child is inside the container").toBeVisible();
    });
  }

  test("collapsibleContainer removes its body child when its toggle is clicked and keeps the header", async ({ page, apiUser }) => {
    const compType = "collapsibleContainer";
    const dsl = appDsl([
      component(compType, {
        id: "c1",
        testId: CONTAINER_ID,
        comp: {
          container: containerWithChildren(compType, {
            header: { text: "HeaderChild-collapsible", testId: HEADER_ID },
            body: slotChild({ id: "b1", name: "bodyText1", text: "BodyChild-collapsible", testId: BODY_ID }),
          }),
        },
      }),
    ]);
    const { view } = await openSeededApp(page, page.request, { orgId: apiUser.orgId, name: "e2e-s8-collapsible", dsl });
    await expect(view.byTestId(HEADER_ID), "the header text is shown").toHaveText("HeaderChild-collapsible", { timeout: VIEW_TIMEOUT_MS });
    await expect(view.byTestId(BODY_ID), "the body child is shown before the click").toHaveText("BodyChild-collapsible");

    // Its recorded `showBody` is `{{collapsibleToggle1.value}}`: the toggle button is the only way to collapse it.
    await view.byCompName("collapsibleToggle1").getByRole("button").click();

    await expect(view.byTestId(BODY_ID), "the collapsed body child is hidden").toBeHidden();
    await expect(view.byTestId(BODY_ID), "the collapsed body child is unmounted, not only hidden").toHaveCount(0);
    await expect(view.byTestId(HEADER_ID), "the header stays visible").toBeVisible();
  });

  test("pageLayout shows its navigation item Home and its body child", async ({ page, apiUser }) => {
    const compType = "pageLayout";
    const container = containerWithChildren(compType, {
      body: slotChild({ id: "b1", name: "bodyText1", text: "BodyChild-pageLayout", testId: BODY_ID }),
    });
    const dsl = appDsl([component(compType, { id: "c1", testId: CONTAINER_ID, comp: { container } })]);
    const { view } = await openSeededApp(page, page.request, { orgId: apiUser.orgId, name: "e2e-s8-pageLayout", dsl });

    await expect(view.byTestId(BODY_ID), "the body child is shown").toHaveText("BodyChild-pageLayout", { timeout: VIEW_TIMEOUT_MS });
    // The recorded navigation `pageNavigation1` has the one item `Home`.
    await expect(page.getByText("Home", { exact: true }), "the navigation item Home is shown once").toHaveCount(1);
    await expect(page.getByText("Home", { exact: true })).toBeVisible();
  });

  for (const compType of ["responsiveLayout", "columnLayout", "splitLayout"]) {
    test(`${compType} shows a child in each of its two slots`, async ({ page, apiUser }) => {
      const dsl = appDsl([
        component(compType, {
          id: "c1",
          testId: CONTAINER_ID,
          comp: {
            containers: slotContainers({
              "0": slotChild({ id: "k0", name: "kidText0", text: `Kid0-${compType}`, testId: SLOT_0_ID }),
              "1": slotChild({ id: "k1", name: "kidText1", text: `Kid1-${compType}`, testId: SLOT_1_ID }),
            }),
          },
        }),
      ]);
      const { view } = await openSeededApp(page, page.request, { orgId: apiUser.orgId, name: `e2e-s8-${compType}`, dsl });

      await expect(view.byTestId(SLOT_0_ID), "the child of slot 0 is shown").toHaveText(`Kid0-${compType}`, { timeout: VIEW_TIMEOUT_MS });
      await expect(view.byTestId(SLOT_1_ID), "the child of slot 1 is shown").toHaveText(`Kid1-${compType}`);
      if (compType === "splitLayout") {
        // The class-A oracle of p2 section 1: its splitter bar, by presence only (dragging it is not part of S8).
        await expect(
          view.byTestId(CONTAINER_ID).getByRole("separator").first(),
          "the splitter bar (role separator) is inside the split layout",
        ).toBeAttached();
      }
    });
  }

  test("tabbedContainer mounts the child of the second tab only after Tab2 is clicked", async ({ page, apiUser }) => {
    const dsl = appDsl([
      component("tabbedContainer", {
        id: "c1",
        testId: CONTAINER_ID,
        comp: {
          // keyed by the tab `id` (0 and 1), not by the label
          containers: slotContainers({
            "0": slotChild({ id: "k0", name: "kidText0", text: "Kid0-tabbed", testId: SLOT_0_ID }),
            "1": slotChild({ id: "k1", name: "kidText1", text: "Kid1-tabbed", testId: SLOT_1_ID }),
          }),
        },
      }),
    ]);
    const { view } = await openSeededApp(page, page.request, { orgId: apiUser.orgId, name: "e2e-s8-tabbed", dsl });
    await expect(view.byTestId(SLOT_0_ID), "the first tab's child is shown").toHaveText("Kid0-tabbed", { timeout: VIEW_TIMEOUT_MS });
    await expect(view.byTestId(SLOT_1_ID), "the second tab's child is not mounted before its tab is opened").toHaveCount(0);

    await page.getByRole("tab", { name: "Tab2" }).click();

    await expect(view.byTestId(SLOT_1_ID), "the second tab's child is shown after Tab2").toHaveText("Kid1-tabbed");
    await expect(view.byTestId(SLOT_0_ID), "the first tab's child is hidden after Tab2").toBeHidden();
  });
});
