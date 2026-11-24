import type { DatasourceTypeEntry } from "../api/client";

/**
 * The ids of the node plugins the node-service registry serves, as the registry lists them
 * (`server/node-service/src/plugins/index.ts:50-126`, 46 entries). Note the ids that differ from their folder names:
 * `OpenAI` (`openAi/index.ts`), `oss` (`aliyunOss/index.ts`) and `firebird` (`firebirdsql/index.ts:10`). The `graphql` type
 * is a Java-native type (`DatasourceMetaInfoServiceImpl.java:142-146`); node-service's `graphql/` folder is a helper and
 * is not registered. This is the set the catalogue test measures against the image; never edit it to make that test pass.
 */
export const NODE_PLUGIN_IDS: readonly string[] = [
  // Databases
  "dynamodb",
  "couchdb",
  "duckdb",
  "fauna",
  "turso",
  "firebird",
  // Big Data
  "athena",
  "bigQuery",
  // AI
  "OpenAI",
  "huggingFaceEndpoint",
  "huggingFaceInference",
  "did",
  // DevOps
  "appconfig",
  "datadog",
  "circleCi",
  // App Development
  "openApi",
  "postmanEcho",
  "lowcoder",
  "github",
  "gitlab",
  "lambda",
  "firebase",
  "supabaseApi",
  // Workflow
  "n8n",
  "boomi",
  // Messaging
  "twilio",
  "sendGrid",
  "oneSignal",
  // Assets
  "s3",
  "googleCloudStorage",
  "supabase",
  "cloudinary",
  "oss",
  // Project Management
  "asana",
  "jira",
  "notion",
  "slack",
  // Reports and Document Creation
  "apiTemplate",
  "carboneIo",
  // CRM
  "front",
  // E-commerce
  "stripe",
  "shopify",
  "woocommerce",
  // Webscrapers
  "serpApi",
  "eodhdApi",
  // RPA
  "uiPath",
];

/** The value of a placeholder host in recorded data source bodies: the `.invalid` TLD (RFC 2606) never resolves, so a recording that was not given a real target fails instead of reaching a host. */
export const NODE_PLUGIN_FIXTURE_PLACEHOLDER_URL = "http://placeholder.invalid";

/**
 * The ids of the catalogue entries that are node plugins: the ones that carry a `definition` (the Java-native types answer
 * `definition: null`, `DatasourceMetaInfoServiceImpl.java:189-199`). Order as served.
 */
export function nodePluginIdsOf(types: readonly DatasourceTypeEntry[]): string[] {
  return types.filter((entry) => entry.definition !== null && entry.definition !== undefined).map((entry) => entry.id);
}
