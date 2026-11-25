import { DYNAMODB, RUN_FLAGS } from "../constants";

/** Where a DynamoDB data source connects: the DynamoDB Local sidecar of the run, as the app container reaches it (by the sidecar's network alias, over plain HTTP). */
export interface DynamodbConnection {
  /** `http://<alias>:<port>`, no trailing slash: the data source's endpoint URL. */
  endpointUrl: string;
  /** Any access key is accepted by the sidecar; this is the throw-away one of the suite. */
  accessKey: string;
  secretKey: string;
  region: string;
}

/** The sidecar's host variable is not set: the run did not start the DynamoDB Local sidecar. */
export class DynamodbSidecarMissingError extends Error {
  constructor() {
    super(
      `${DYNAMODB.HOST_ENV} is not set: the DynamoDB Local sidecar was not started. Run the suite through e2e/scripts/run-in-docker.sh with ${RUN_FLAGS.INCLUDE_NODE_SERVICE_SIDECARS}=1.`,
    );
    this.name = "DynamodbSidecarMissingError";
  }
}

/**
 * The connection to the run's DynamoDB Local sidecar from the environment. Throws `DynamodbSidecarMissingError` when the run script did not set the
 * host variable (it does so only with `E2E_INCLUDE_NODE_SERVICE_SIDECARS=1`), so a test that was selected without its sidecar fails loudly
 * instead of passing vacuously or connecting to a name that happens to resolve elsewhere. Reads only `env`.
 */
export function dynamodbConnection(env: NodeJS.ProcessEnv = process.env): DynamodbConnection {
  const host = env[DYNAMODB.HOST_ENV];
  if (!host) throw new DynamodbSidecarMissingError();
  return { endpointUrl: `http://${host}:${DYNAMODB.PORT}`, accessKey: DYNAMODB.ACCESS_KEY, secretKey: DYNAMODB.SECRET_KEY, region: DYNAMODB.REGION };
}

/** How long a direct call to the sidecar may take before it is abandoned: a local server answers in milliseconds. */
const DIRECT_CALL_TIMEOUT_MS = 10_000;

/** The content type and target prefix of the DynamoDB JSON protocol (version 1.0). */
export const DYNAMODB_CONTENT_TYPE = "application/x-amz-json-1.0";
export const DYNAMODB_TARGET_PREFIX = "DynamoDB_20120810.";

/**
 * The `Authorization` header of a direct call. DynamoDB Local requires a header with a `Credential=` scope but does not verify the signature
 * (measured: a signature of zeros is accepted), so no SigV4 computation is needed; against a real AWS endpoint this header would be refused.
 */
const DIRECT_SIGNATURE = "0".repeat(64);
const DIRECT_DATE = "20260101";

/** The answer of a direct call: the HTTP status and the body parsed as JSON (or the text when it is not JSON). */
export interface DynamodbDirectAnswer {
  status: number;
  body: unknown;
}

/**
 * One call of the DynamoDB JSON protocol from the TEST process to the sidecar: `operation` is the API operation (`PutItem`, `GetItem`, ...) and
 * `input` its request body in the API's own TYPED form (`{ "id": { "N": "1" } }`, no wrapping by the plugin). It is the control that shows
 * what the server itself holds and answers, next to what the plugin makes of it for the app, and the way a test makes and removes its own
 * tables. The runner reaches the sidecar by the same alias the app container does.
 */
export async function dynamodbDirect(connection: Pick<DynamodbConnection, "endpointUrl" | "accessKey" | "region">, operation: string, input: unknown): Promise<DynamodbDirectAnswer> {
  const response = await fetch(`${connection.endpointUrl}/`, {
    method: "POST",
    headers: {
      "Content-Type": DYNAMODB_CONTENT_TYPE,
      "X-Amz-Target": `${DYNAMODB_TARGET_PREFIX}${operation}`,
      Authorization: `AWS4-HMAC-SHA256 Credential=${connection.accessKey}/${DIRECT_DATE}/${connection.region}/dynamodb/aws4_request, SignedHeaders=host, Signature=${DIRECT_SIGNATURE}`,
    },
    body: JSON.stringify(input),
    signal: AbortSignal.timeout(DIRECT_CALL_TIMEOUT_MS),
  });
  const text = await response.text();
  let body: unknown = text;
  try {
    body = JSON.parse(text);
  } catch {
    // not JSON: the text itself is the body
  }
  return { status: response.status, body };
}
