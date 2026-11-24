import { supportedDatasourceTypes, type DatasourceTypeEntry } from "../../src/api/client";
import { TAGS } from "../../src/constants";
import { NODE_PLUGIN_IDS, nodePluginIdsOf } from "../../src/datasource/node-plugins";
import { expect, test } from "../../src/fixtures";

/**
 * D3: which node plugins the image under test serves. The catalogue (`GET /api/organizations/{orgId}/datasourceTypes`,
 * `OrganizationController.getSupportedDatasourceTypes`) answers the Java-native types, which carry no definition, and every
 * plugin of node-service's registry (`server/node-service/src/plugins/index.ts`) with its `definition`. For the plugins whose
 * host is fixed to a vendor cloud this is the only coverage: their definition is served, nothing more.
 *
 * The three tests are structural assertions: they need no "before" state.
 */

/**
 * The Java-native types the catalogue lists, measured on `3.0.0-e2e` and `3.0.1-e2e` and matching
 * `DatasourceMetaInfoServiceImpl.java:35-146` (`clickHouse` is capitalised like that and the lookup is case-sensitive; the
 * special lookup of `lowcoderApi` at `:177` is not a catalogue entry). The Java plugins serve them, never node-service.
 */
const JAVA_NATIVE_TYPES = [
  "postgres",
  "restApi",
  "mongodb",
  "mysql",
  "es",
  "redis",
  "mssql",
  "oracle",
  "mariadb",
  "smtp",
  "clickHouse",
  "snowflake",
  "googleSheets",
  "graphql",
] as const;

/** What a plugin's query config may be: `listPlugins` keeps an object and replaces a function with `{ type: "dynamic" }` (`services/plugin.ts:162-176`). */
const DYNAMIC_CONFIG_TYPE = "dynamic";

/** The problems of one served plugin definition, each prefixed with the plugin id; empty when the definition is complete. */
function definitionProblems(entry: DatasourceTypeEntry): string[] {
  const definition = entry.definition;
  if (!definition) return [`${entry.id}: no definition`];
  const problems: string[] = [];
  if (!Array.isArray(definition.dataSourceConfig?.params)) {
    problems.push(`${entry.id}: dataSourceConfig.params is ${JSON.stringify(definition.dataSourceConfig?.params)}, not an array`);
  }
  const queryConfig = definition.queryConfig;
  if (typeof queryConfig !== "object" || queryConfig === null || Array.isArray(queryConfig)) {
    problems.push(`${entry.id}: queryConfig is ${JSON.stringify(queryConfig)}, not an object`);
  } else if (typeof queryConfig.type !== "string" || queryConfig.type === "") {
    problems.push(`${entry.id}: queryConfig has no string type (a query config is "query" or "${DYNAMIC_CONFIG_TYPE}")`);
  }
  return problems;
}

test.describe("node-service plugin catalogue", { tag: [TAGS.NODE_SERVICE] }, () => {
  test("D3a: the image serves exactly the registered node-service plugins", async ({ page, apiUser }) => {
    const types = await supportedDatasourceTypes(page.request, apiUser.orgId);
    const served = nodePluginIdsOf(types);
    expect(served.length, "the catalogue lists no node plugin at all").toBeGreaterThan(0);
    expect([...served].sort(), "the node plugins the catalogue serves").toEqual([...NODE_PLUGIN_IDS].sort());
  });

  test("D3b: every node plugin definition has a data source form and a query config", async ({ page, apiUser }) => {
    const types = await supportedDatasourceTypes(page.request, apiUser.orgId);
    const plugins = types.filter((entry) => entry.definition);
    expect(plugins.length, "the catalogue lists no node plugin at all").toBeGreaterThan(0);
    expect(plugins.flatMap(definitionProblems), "the plugin definitions with a problem").toEqual([]);
  });

  test("D3c: Java-native types carry no node definition", async ({ page, apiUser }) => {
    const types = await supportedDatasourceTypes(page.request, apiUser.orgId);
    const nodePluginIds = new Set(NODE_PLUGIN_IDS);
    const withoutDefinition = types.filter((entry) => entry.definition === null).map((entry) => entry.id);
    // Every entry without a definition is a Java-native type and no node plugin id is among them; the explicit list below
    // fails when a Java type is dropped or renamed, the derived one when an unexpected type appears.
    expect([...withoutDefinition].sort(), "the catalogue entries with an explicit null definition").toEqual([...JAVA_NATIVE_TYPES].sort());
    expect(withoutDefinition.filter((id) => nodePluginIds.has(id)), "a node plugin id without a definition").toEqual([]);
    for (const type of JAVA_NATIVE_TYPES) {
      const entries = types.filter((entry) => entry.id === type);
      expect(entries, `the catalogue lists the Java-native type ${type} once`).toHaveLength(1);
      // An explicit null, not an absent key: `DatasourceMetaInfo.definition` is serialised as null.
      expect(entries[0], `${type} carries an explicit null definition`).toHaveProperty("definition", null);
    }
  });
});
