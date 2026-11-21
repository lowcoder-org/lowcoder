/**
 * Helpers shared by the component scenarios S2-S7 (client/E2E-TESTING-components-p3-simple-scenarios-plan.md): a
 * seeded published view in which each behaviour is made visible through a text bound to the component's exposed
 * state (plan section 1, rules 1 and 2).
 */
import type { Page } from "@playwright/test";
import { appDsl, text, type AppParts, type DslItem } from "../dsl/builders";
import type { AppViewPage } from "../pages/AppViewPage";
import { openSeededApp } from "../simple-components/seed";

/** Raised when a path of a recorded component does not exist, so a nested override cannot be placed silently. */
export class ComponentPathError extends Error {
  constructor(path: readonly (string | number)[], reason: string) {
    super(`cannot set ${path.join(".")}: ${reason}`);
    this.name = "ComponentPathError";
  }
}

/** Prefix of the test id the S2-S7 scenarios give a component: the component `<name>` has the test id `e2e-<name>`. */
export const COMPONENT_TEST_ID_PREFIX = "e2e-";

export function testIdOf(name: string): string {
  return `${COMPONENT_TEST_ID_PREFIX}${name}`;
}

/** Prefix of the test id of a bound text: the text that shows component `<name>` has the test id `t-<name>`. */
export const BOUND_TEXT_TEST_ID_PREFIX = "t-";

/** Grid height (rows) of a bound text. */
export const BOUND_TEXT_ROWS = 4;

export function boundTextTestId(name: string): string {
  return `${BOUND_TEXT_TEST_ID_PREFIX}${name}`;
}

/** A text that shows `expression` (e.g. `{{input1.value}}`), addressable as `boundTextTestId(name)`. */
export function boundText(params: { id: string; name: string; expression: string }): DslItem {
  const item = text({
    id: `tx-${params.id}`,
    name: `t_${params.name}`,
    text: params.expression,
    testId: boundTextTestId(params.name),
  });
  return { ...item, layout: { ...item.layout, h: BOUND_TEXT_ROWS } };
}

/**
 * Returns a deep copy of `comp` with `value` set at `path` (object keys and array indexes). Every step of the path
 * but the last must exist, so a typo in a nested handler path fails here and not as a silently ignored property.
 */
export function withValueAt(
  comp: Record<string, unknown>,
  path: readonly (string | number)[],
  value: unknown,
): Record<string, unknown> {
  if (path.length === 0) {
    throw new ComponentPathError(path, "the path is empty");
  }
  const copy = structuredClone(comp);
  let cursor: unknown = copy;
  path.forEach((step, index) => {
    const isLast = index === path.length - 1;
    if (cursor === null || typeof cursor !== "object") {
      throw new ComponentPathError(path, `${path.slice(0, index).join(".")} is not an object or array`);
    }
    const container = cursor as Record<string | number, unknown>;
    if (isLast) {
      container[step] = value;
      return;
    }
    if (!(step in container)) {
      throw new ComponentPathError(path, `${path.slice(0, index + 1).join(".")} does not exist`);
    }
    cursor = container[step];
  });
  return copy;
}

/**
 * Creates and publishes an app holding `items` and opens its published view. The app belongs to the test's own user
 * (`apiUser.orgId`), so no test shares state with another. Only builds the DSL; the workflow is `openSeededApp`.
 */
export async function openSeededView(
  page: Page,
  orgId: string,
  appName: string,
  items: DslItem[],
  parts: AppParts = {},
): Promise<AppViewPage> {
  const { view } = await openSeededApp(page, page.request, { orgId, name: appName, dsl: appDsl(items, parts) });
  return view;
}
