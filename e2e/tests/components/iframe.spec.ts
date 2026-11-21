import { createApp, publishApp } from "../../src/api/client";
import { appDsl, component, stackItems } from "../../src/dsl/builders";
import { expect, test } from "../../src/fixtures";
import { AppViewPage } from "../../src/pages/AppViewPage";

/**
 * S18 iframe: the `url` property decides the frame's `src` attribute. An empty `url` and any URL that is neither an
 * http(s) URL nor a same-origin relative path give `about:blank` (`iframeComp.tsx`: `getIframeSrc`). The framed content
 * is not asserted (the app refuses to be framed). The `src` attribute is asserted, not the property, which is the
 * resolved absolute URL.
 */
const BLANK_SRC = "about:blank";
const IFRAME_HEIGHT_ROWS = 10;

interface IframeCase {
  name: string;
  /** `undefined`: the recording unchanged, which has no `url`. */
  url?: string;
  src: string;
}

const CASES: IframeCase[] = [
  { name: "no url", src: BLANK_SRC },
  { name: "a same-origin relative path", url: "/user/auth/login", src: "/user/auth/login" },
  { name: "a javascript: URL", url: "javascript:alert(1)", src: BLANK_SRC },
  { name: "a scheme-less host that is not a relative path", url: "example.test/x", src: BLANK_SRC },
];

test("S18 iframe: the url property decides the src attribute", async ({ page, apiUser }) => {
  const items = CASES.map((entry, index) =>
    component("iframe", {
      id: `f${index}`,
      name: `iframe${index + 1}`,
      testId: `e2e-iframe-${index}`,
      h: IFRAME_HEIGHT_ROWS,
      comp: entry.url === undefined ? {} : { url: entry.url },
    }),
  );
  const { appId } = await createApp(page.request, { orgId: apiUser.orgId, name: "e2e-iframe-src", dsl: appDsl(stackItems(items)) });
  await publishApp(page.request, appId);
  const view = new AppViewPage(page);

  await view.open(appId);

  for (const [index, entry] of CASES.entries()) {
    const frame = view.byTestId(`e2e-iframe-${index}`).locator("iframe");
    await expect(frame, `${entry.name}: exactly one iframe`).toHaveCount(1);
    await expect(frame, `${entry.name}: the src attribute`).toHaveAttribute("src", entry.src);
  }
});
