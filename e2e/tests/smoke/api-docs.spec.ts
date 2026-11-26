import { API_DOCS_PATHS, API_DOCS_TITLE, TAGS } from "../../src/constants";
import { expect, test } from "../../src/fixtures";

/** The HTTP methods of an OpenAPI path item that Swagger UI renders as one operation block each. */
const OPERATION_METHODS = ["get", "put", "post", "delete", "options", "head", "patch", "trace"];

/** Major version of the OpenAPI specification the document declares (its `openapi` field). */
const OPENAPI_VERSION_PREFIX = "3.";

/** The page springdoc redirects the Swagger UI path to. */
const DOCS_INDEX_URL = /\/api\/docs\/.*index\.html/;

interface OpenApiDocument {
  openapi: string;
  info: { title: string; version: string };
  tags?: { name: string }[];
  paths: Record<string, Record<string, unknown>>;
}

function operationCountOf(document: OpenApiDocument): number {
  return Object.values(document.paths).reduce(
    (count, pathItem) => count + OPERATION_METHODS.filter((method) => method in pathItem).length,
    0,
  );
}

/** Every tag name the document declares or its operations carry. */
function tagNamesOf(document: OpenApiDocument): Set<string> {
  const names = new Set<string>((document.tags ?? []).map((tag) => tag.name));
  for (const pathItem of Object.values(document.paths)) {
    for (const operation of Object.values(pathItem)) {
      for (const tag of (operation as { tags?: string[] }).tags ?? []) {
        names.add(tag);
      }
    }
  }
  return names;
}

test.describe("springdoc API documentation", () => {
  test("the OpenAPI document is served to an anonymous caller", { tag: TAGS.SMOKE }, async ({ page }) => {
    const response = await page.request.get(API_DOCS_PATHS.OPENAPI_JSON);
    expect(response.status(), "status of the OpenAPI document").toBe(200);

    const document = (await response.json()) as OpenApiDocument;
    expect(document.openapi.startsWith(OPENAPI_VERSION_PREFIX), `openapi version ${document.openapi}`).toBe(true);
    expect(document.info.title, "info.title").toBe(API_DOCS_TITLE);
    expect(operationCountOf(document), "operations in the document").toBeGreaterThan(0);
  });

  test("the Swagger UI page renders the operations of the document", { tag: TAGS.SMOKE }, async ({
    page,
    networkGuard,
  }) => {
    const document = (await (await page.request.get(API_DOCS_PATHS.OPENAPI_JSON)).json()) as OpenApiDocument;
    expect(operationCountOf(document), "operations in the document").toBeGreaterThan(0);

    await page.goto(API_DOCS_PATHS.SWAGGER_UI);

    // springdoc redirects the configured path to the index.html it bundles; where that lives depends on its version
    // (3.0.0 image: /api/docs/webjars/swagger-ui/index.html), so only the page name is asserted
    await expect(page, "Swagger UI page").toHaveURL(DOCS_INDEX_URL);
    await expect(page.getByRole("heading", { name: API_DOCS_TITLE }), "title of the API").toBeVisible();
    // Swagger UI exposes no role or test id for its operation blocks, so these use its own CSS classes and data attributes.
    // The newer Swagger UI renders only the blocks near the viewport (6 of 176 measured), the 3.0.0 one renders all of
    // them, so the rendered blocks are checked against the document instead of counted.
    const operations = page.locator(".swagger-ui .opblock");
    await expect(operations.first(), "an operation block").toBeVisible();
    const renderedPaths = await page.locator(".swagger-ui .opblock-summary-path").evaluateAll((elements) =>
      elements.map((element) => element.getAttribute("data-path")),
    );
    const renderedTags = await page.locator(".swagger-ui .opblock-tag").evaluateAll((elements) =>
      elements.map((element) => element.getAttribute("data-tag")),
    );
    expect(renderedPaths.length, "rendered operation paths").toBeGreaterThan(0);
    expect(renderedTags.length, "rendered tag headers").toBeGreaterThan(0);
    for (const renderedPath of renderedPaths) {
      expect(Object.keys(document.paths), `path ${renderedPath} of a rendered block`).toContain(renderedPath);
    }
    for (const renderedTag of renderedTags) {
      expect([...tagNamesOf(document)], `tag ${renderedTag} of a rendered header`).toContain(renderedTag);
    }
    await expect(page.locator(".swagger-ui .errors-wrapper"), "Swagger UI load errors").toHaveCount(0);
    expect(networkGuard.blockedUrls, "requests the page made to a blocked host").toEqual([]);
  });
});
