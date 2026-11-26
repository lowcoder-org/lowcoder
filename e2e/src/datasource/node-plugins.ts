import type { DatasourceTypeEntry } from "../api/client";

/**
 * The ids of the node plugins the node-service registry serves, as the registry lists them
 * (`server/node-service/src/plugins/index.ts:48-122`, 45 entries). Note the ids that differ from their folder names:
 * `OpenAI` (`openAi/index.ts`), `oss` (`aliyunOss/index.ts`) and `firebird` (`firebirdsql/index.ts:10`). The `graphql` type
 * is a Java-native type (`DatasourceMetaInfoServiceImpl.java:142-146`); node-service's `graphql/` folder is a helper and
 * is not registered. This is the set the catalogue test measures against the image; never edit it to make that test pass.
 */
export const NODE_PLUGIN_IDS: readonly string[] = [
  // Databases
  "dynamodb",
  "couchdb",
  "duckdb",
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

/** The value of a placeholder host in recorded data source bodies: the `.invalid` TLD (RFC 2606). A placeholder host is never relied on to fail: it may resolve in an environment with a DNS search domain (measured), so every request a test makes is pointed at the echo target (or another deterministic target) and a recording holds placeholder values only. */
export const NODE_PLUGIN_FIXTURE_PLACEHOLDER_URL = "http://placeholder.invalid";

/**
 * The ids of the catalogue entries that are node plugins: the ones that carry a `definition` (the Java-native types answer
 * `definition: null`, `DatasourceMetaInfoServiceImpl.java:189-199`). Order as served.
 */
export function nodePluginIdsOf(types: readonly DatasourceTypeEntry[]): string[] {
  return types.filter((entry) => entry.definition !== null && entry.definition !== undefined).map((entry) => entry.id);
}

/** The name of the API key security scheme of `OPEN_API_FIXTURE_SPEC`; the data source form stores the key under `<name>.value`. */
export const OPEN_API_FIXTURE_SCHEME = "E2EKeyAuth";

/** The header the API key of `OPEN_API_FIXTURE_SPEC` travels in; the form labels the key field with it. */
export const OPEN_API_FIXTURE_KEY_HEADER = "X-E2E-Key";

/** The operation of `OPEN_API_FIXTURE_SPEC`. */
export const OPEN_API_FIXTURE_OPERATION = "listItems";

/**
 * A minimal OpenAPI 3.0 document for the generic `openApi` plugin: `GET /items` (operation `listItems`, query parameter `q`)
 * secured by an API key in the header `X-E2E-Key`. Its one server is the placeholder host, which no test relies on to fail:
 * every request is pointed at the echo through the data source's `serverURL`. The tests serve it from the echo as a canned
 * answer; the plugin's form fetches it for real while it builds its dynamic config.
 */
export const OPEN_API_FIXTURE_SPEC = {
  openapi: "3.0.0",
  info: { title: "e2e items", version: "1.0.0" },
  servers: [{ url: NODE_PLUGIN_FIXTURE_PLACEHOLDER_URL }],
  security: [{ [OPEN_API_FIXTURE_SCHEME]: [] }],
  paths: {
    "/items": {
      get: {
        operationId: OPEN_API_FIXTURE_OPERATION,
        summary: "List the items",
        parameters: [{ name: "q", in: "query", required: false, schema: { type: "string" } }],
        responses: { "200": { description: "the items" } },
      },
    },
  },
  components: {
    securitySchemes: {
      [OPEN_API_FIXTURE_SCHEME]: { type: "apiKey", in: "header", name: OPEN_API_FIXTURE_KEY_HEADER },
    },
  },
} as const;

/** The scheme word of an HTTP Basic `Authorization` header value (RFC 7617). */
export const BASIC_AUTH_SCHEME = "Basic";

/** The user name and password of an HTTP Basic `Authorization` header value. */
export interface BasicCredentials {
  user: string;
  password: string;
}

/**
 * Decodes an `Authorization` header value of the form `Basic <base64(user:password)>` (RFC 7617: the user name ends at the first
 * colon, the password may hold colons). Returns `undefined` for anything else: no header, a repeated header (an array), another
 * scheme, text that is not canonical base64, or a decoded text without a colon. The tests compare what a plugin sent with the
 * credentials they configured, so a failing decode must read as "not Basic credentials", never as an empty user.
 */
export function parseBasicAuthorization(header: string | string[] | undefined): BasicCredentials | undefined {
  if (typeof header !== "string") return undefined;
  const prefix = `${BASIC_AUTH_SCHEME} `;
  if (!header.startsWith(prefix)) return undefined;
  const encoded = header.slice(prefix.length);
  const decoded = Buffer.from(encoded, "base64").toString("utf8");
  if (Buffer.from(decoded, "utf8").toString("base64") !== encoded) return undefined;
  const colon = decoded.indexOf(":");
  if (colon < 0) return undefined;
  return { user: decoded.slice(0, colon), password: decoded.slice(colon + 1) };
}

/** The pieces of an AWS Signature Version 4 `Authorization` header (the form the AWS SDK sends). */
export interface SigV4Authorization {
  /** The access key id of the credential scope. */
  accessKey: string;
  /** The `YYYYMMDD` date of the credential scope. */
  date: string;
  region: string;
  /** The service of the credential scope (`dynamodb`, `s3`). */
  service: string;
  /** The header names that were signed, in the order the header lists them. */
  signedHeaders: string[];
  /** The 64 hex digits of the signature (never compared with a value: it depends on the clock and a random invocation id). */
  signature: string;
}

const SIGV4_PATTERN = /^AWS4-HMAC-SHA256 Credential=([^/,\s]+)\/(\d{8})\/([^/,\s]+)\/([^/,\s]+)\/aws4_request, SignedHeaders=([a-z0-9;-]+), Signature=([0-9a-f]{64})$/;

/**
 * Parses `AWS4-HMAC-SHA256 Credential=<key>/<date>/<region>/<service>/aws4_request, SignedHeaders=<a;b>, Signature=<64 hex>`.
 * Returns `undefined` for anything else: no header, a repeated header (an array), another scheme, a different order or spacing of
 * the three parts, a scope that does not end in `aws4_request`, or a signature that is not 64 lower-case hex digits. A test compares
 * the stable parts (key, scope, signed-header list) and never the signature.
 */
export function parseSigV4Authorization(header: string | string[] | undefined): SigV4Authorization | undefined {
  if (typeof header !== "string") return undefined;
  const match = SIGV4_PATTERN.exec(header);
  if (!match) return undefined;
  const [, accessKey, date, region, service, signedHeaders, signature] = match as unknown as [string, string, string, string, string, string, string];
  return { accessKey, date, region, service, signedHeaders: signedHeaders.split(";"), signature };
}
