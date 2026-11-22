/**
 * Helpers of the S8-S14 scenarios: seeding a published app
 * from a DSL, and the container child shapes the recordings leave empty (S8). Each helper works on the recorded
 * defaults of `fixtures/dsl/<type>.json` (`recordedItem`), so a seeded container keeps every property the editor writes.
 */
import type { APIRequestContext, Page } from "@playwright/test";
import { createApp, publishApp } from "../api/client";
import { containerOf, text, type DslItem } from "../dsl/builders";
import { recordedItem } from "../dsl/recorded";
import { AppViewPage } from "../pages/AppViewPage";

/** A text child of a container slot spans the full 24-column grid of the slot and five rows (the probe's shape). */
const SLOT_CHILD_SIZE = { w: 24, h: 5 } as const;
/** The grid key of the container's own children ("body" slot `"0"` holds `{ view: <children> }`). */
const BODY_SLOT_KEY = "0";

/** A `{ layout, items }` pair: the children of one container slot (`containers["<key>"]`, `body["0"].view`, `header`). */
export type SlotChildren = ReturnType<typeof containerOf>;

/** A recorded container's `container` object, whose `header` and `body` hold the slot children. */
interface ContainerBody {
  header: { items: Record<string, { compType: string; comp: Record<string, unknown> }> };
  body: Record<string, { view: SlotChildren }>;
  [key: string]: unknown;
}

/** A recording or builder output that does not have the shape a helper needs. The message names the type. */
export class SeedShapeError extends Error {
  constructor(compType: string, reason: string) {
    super(`cannot seed ${compType}: ${reason}`);
    this.name = "SeedShapeError";
  }
}

/** One text child for a container slot, with the given layout id, component name, text and test id. */
export function slotChild(params: { id: string; name: string; text: string; testId: string }): SlotChildren {
  const item: DslItem = { ...text(params), layout: { x: 0, y: 0, ...SLOT_CHILD_SIZE } };
  return containerOf([item]);
}

/** The `container` property of a recorded container type (`container`, `floatTextContainer`, ...), as a fresh copy. */
function recordedContainer(compType: string): ContainerBody {
  const container = recordedItem(compType).comp.container as ContainerBody | undefined;
  if (!container?.header || !container.body?.[BODY_SLOT_KEY]) {
    throw new SeedShapeError(compType, `its recording has no container with a header and body slot "${BODY_SLOT_KEY}"`);
  }
  return container;
}

/**
 * The `container` override of a recorded container type with `body` in its body slot and, when `header` is given,
 * the text of its header's `text` child replaced (the header child keeps its recorded id and name; it gets the test
 * id). Pass it as `comp: { container }` to `component()`. Throws SeedShapeError when the header has no text child.
 */
export function containerWithChildren(
  compType: string,
  params: { body: SlotChildren; header?: { text: string; testId: string } },
): ContainerBody {
  const container = recordedContainer(compType);
  if (params.header) {
    const headerText = Object.values(container.header.items).find((child) => child.compType === "text");
    if (!headerText) {
      throw new SeedShapeError(compType, "its header has no text child");
    }
    headerText.comp.text = params.header.text;
    headerText.comp.dataTestId = params.header.testId;
  }
  container.body[BODY_SLOT_KEY] = { view: params.body };
  return container;
}

/** The `containers` override of a slot-based layout (`tabbedContainer`, `responsiveLayout`, `columnLayout`, `splitLayout`): one child set per slot key. */
export function slotContainers(slots: Record<string, SlotChildren>): Record<string, SlotChildren> {
  return { ...slots };
}

/** The seeded app, opened in the published view. */
export interface SeededApp {
  appId: string;
  view: AppViewPage;
}

/** Creates an app of `dsl` for the organisation, publishes it and opens its published view. */
export async function openSeededApp(
  page: Page,
  request: APIRequestContext,
  params: { orgId: string; name: string; dsl: object },
): Promise<SeededApp> {
  const { appId } = await createApp(request, params);
  await publishApp(request, appId);
  const view = new AppViewPage(page);
  await view.open(appId);
  return { appId, view };
}
