import nock from "nock";
import SwaggerClient from "swagger-client";
import SwaggerParser from "@apidevtools/swagger-parser";
import openApiPlugin, { runOpenApi } from ".";
import { ServiceError } from "../../common/error";
import { ConfigKeySplit } from "./util";

const TEST_TIMEOUT_MS = 30000;
jest.setTimeout(TEST_TIMEOUT_MS);

const STATUS_OK = 200;
const STATUS_BAD_REQUEST = 400;
const STATUS_NOT_FOUND = 404;
const STATUS_SERVER_ERROR = 500;
const OLD_HOST = "http://old.test";
const NEW_HOST = "http://new.test:8080";
const SPEC_HOST = "http://spec.test";
const SPEC_PATH = "/spec.json";
const MISSING_SPEC_MESSAGE = "Specification not found in extra field, please recreate the data source.";
const MEDIA_JSON = "application/json";
const PET = { id: 5, name: "rex" };
const PET_PATH_PARAM = { name: "id", in: "path", required: true };

type Json = Record<string, any>;
interface SeenRequest {
  method: string;
  uri: string;
  headers: Record<string, any>;
  body: any;
}

type QueryConfigFn = (data: any, ctx?: any) => Promise<any>;
const keyOf = (position: string, name: string) => `${position}${ConfigKeySplit}${name}`;
const okResponse = { responses: { "200": { description: "ok" } } };

const swagger2Spec = (extra: Json = {}): any => ({
  swagger: "2.0",
  info: { title: "t", version: "1" },
  host: "old.test",
  basePath: "/v1",
  schemes: ["http"],
  produces: [MEDIA_JSON],
  consumes: [MEDIA_JSON],
  paths: {
    "/pets/{id}": {
      get: {
        operationId: "getPet",
        parameters: [{ ...PET_PATH_PARAM, type: "integer" }],
        ...okResponse,
      },
    },
    "/pets": {
      post: {
        operationId: "createPet",
        parameters: [{ name: "body", in: "body", schema: { type: "object" } }],
        ...okResponse,
      },
    },
  },
  ...extra,
});

const oas3Spec = (extra: Json = {}): any => ({
  openapi: "3.0.3",
  info: { title: "t", version: "1" },
  servers: [{ url: `${OLD_HOST}/v1` }],
  tags: [{ name: "pets" }],
  paths: {
    "/pets/{id}": {
      get: {
        operationId: "getPet",
        tags: ["pets"],
        parameters: [{ ...PET_PATH_PARAM, schema: { type: "integer" } }],
        ...okResponse,
      },
    },
    "/pets": {
      post: {
        operationId: "createPet",
        requestBody: {
          content: { [MEDIA_JSON]: { schema: { type: "object", properties: { name: { type: "string" } } } } },
        },
        ...okResponse,
      },
    },
  },
  ...extra,
});

let seen: SeenRequest[];

/** nock exposes node-fetch's raw headers as one-element arrays; compare them as plain strings. */
const flattenHeaders = (headers: Record<string, any>) =>
  Object.fromEntries(Object.entries(headers).map(([k, v]) => [k, Array.isArray(v) && v.length === 1 ? v[0] : v]));

/** Intercepts one request, records exactly what was sent and replies with the given status and body. */
function intercept(host: string, method: "get" | "post", path: string, status: number, body?: any) {
  return nock(host)
    [method](path)
    .reply(function (uri, requestBody) {
      seen.push({ method: this.req.method, uri, headers: flattenHeaders(this.req.headers), body: requestBody });
      return body === undefined ? [status] : [status, body];
    });
}

const oas3Config = (extra: Json = {}): any => ({ url: "", serverURL: "", ...extra });
const getPetAction = { actionName: "getPet", [keyOf("path", "id")]: 5 };

beforeAll(() => {
  nock.disableNetConnect();
});
beforeEach(() => {
  seen = [];
  jest.spyOn(logger, "error").mockImplementation(() => undefined);
});
afterEach(() => {
  jest.restoreAllMocks();
  nock.cleanAll();
});
afterAll(() => {
  nock.enableNetConnect();
});

describe("runOpenApi", () => {
  test("an unknown actionName gives 400 'unknown operation: x'", async () => {
    await expect(runOpenApi({ actionName: "x" }, oas3Config(), oas3Spec())).rejects.toMatchObject({
      code: STATUS_BAD_REQUEST,
      message: "unknown operation: x",
    });
    expect(seen).toEqual([]);
  });

  describe("Swagger 2 server selection", () => {
    test("with an empty serverURL the spec host, basePath and scheme are used", async () => {
      intercept(OLD_HOST, "get", "/v1/pets/5", STATUS_OK, PET);
      const result = await runOpenApi(getPetAction, oas3Config(), swagger2Spec());
      expect(result).toEqual(PET);
      expect(seen).toHaveLength(1);
      expect(seen[0].method).toBe("GET");
      expect(seen[0].uri).toBe("/v1/pets/5");
      expect(seen[0].headers.host).toBe("old.test");
    });

    test("the serverURL override rewrites host, basePath and scheme, and the request goes to the new host", async () => {
      const oldHostScope = intercept(OLD_HOST, "get", "/v1/pets/5", STATUS_OK, { id: "old" });
      intercept(NEW_HOST, "get", "/base/pets/5", STATUS_OK, PET);
      const spec = swagger2Spec({ schemes: ["https"] });
      const result = await runOpenApi(getPetAction, oas3Config({ serverURL: `${NEW_HOST}/base` }), spec);
      expect(result).toEqual(PET);
      expect(seen).toHaveLength(1);
      expect(seen[0].uri).toBe("/base/pets/5");
      expect(seen[0].headers.host).toBe("new.test:8080");
      expect(oldHostScope.isDone()).toBe(false);
    });

    test("an invalid serverURL is refused with 'invalid http url' before anything is sent", async () => {
      await expect(
        runOpenApi(getPetAction, oas3Config({ serverURL: "ftp://new.test" }), swagger2Spec())
      ).rejects.toThrow("invalid http url");
      expect(seen).toEqual([]);
    });
  });

  describe("OAS3 server selection", () => {
    test("the spec's server url is used without an override", async () => {
      intercept(OLD_HOST, "get", "/v1/pets/5", STATUS_OK, PET);
      expect(await runOpenApi(getPetAction, oas3Config(), oas3Spec())).toEqual(PET);
      expect(seen[0].headers.host).toBe("old.test");
    });

    test("the serverURL override goes through replaceServersUrl and the request goes to the new server", async () => {
      const oldHostScope = intercept(OLD_HOST, "get", "/v1/pets/5", STATUS_OK, { id: "old" });
      intercept(NEW_HOST, "get", "/api/pets/5", STATUS_OK, PET);
      const result = await runOpenApi(getPetAction, oas3Config({ serverURL: `${NEW_HOST}/api` }), oas3Spec());
      expect(result).toEqual(PET);
      expect(seen[0].uri).toBe("/api/pets/5");
      expect(oldHostScope.isDone()).toBe(false);
    });
  });

  describe("request building", () => {
    test("OAS3: the body fields are sent as the JSON body with the JSON content type", async () => {
      intercept(OLD_HOST, "post", "/v1/pets", STATUS_OK, PET);
      const result = await runOpenApi(
        { actionName: "createPet", [keyOf("body", "name")]: "rex" },
        oas3Config(),
        oas3Spec()
      );
      expect(result).toEqual(PET);
      expect(seen[0].method).toBe("POST");
      expect(seen[0].headers["content-type"]).toContain(MEDIA_JSON);
      expect(seen[0].body).toEqual({ name: "rex" });
    });

    test("Swagger 2: a body parameter is sent as the JSON body", async () => {
      intercept(OLD_HOST, "post", "/v1/pets", STATUS_OK, PET);
      const result = await runOpenApi(
        { actionName: "createPet", [keyOf("body", "body")]: { name: "rex" } },
        oas3Config(),
        swagger2Spec()
      );
      expect(result).toEqual(PET);
      expect(seen[0].headers["content-type"]).toContain(MEDIA_JSON);
      expect(seen[0].body).toEqual({ name: "rex" });
    });

    test("query parameters reach the URL", async () => {
      const spec = oas3Spec();
      spec.paths["/pets/{id}"].get.parameters.push({ name: "verbose", in: "query", schema: { type: "string" } });
      intercept(OLD_HOST, "get", "/v1/pets/5?verbose=yes", STATUS_OK, PET);
      await runOpenApi({ ...getPetAction, [keyOf("query", "verbose")]: "yes" }, oas3Config(), spec);
      expect(seen[0].uri).toBe("/v1/pets/5?verbose=yes");
    });

    test("the request is sent with the JSON Accept header", async () => {
      intercept(OLD_HOST, "get", "/v1/pets/5", STATUS_OK, PET);
      await runOpenApi(getPetAction, oas3Config(), oas3Spec());
      expect(seen[0].headers.accept).toContain(MEDIA_JSON);
    });
  });

  describe("default headers", () => {
    const headerSpec = () => {
      const spec = oas3Spec();
      spec.paths["/pets/{id}"].get.parameters.push({ name: "X-Override", in: "header", schema: { type: "string" } });
      return spec;
    };

    test("defaultHeaders are sent when the request does not set them", async () => {
      intercept(OLD_HOST, "get", "/v1/pets/5", STATUS_OK, PET);
      await runOpenApi(getPetAction, oas3Config(), oas3Spec(), { "X-Default": "from-default" });
      expect(seen[0].headers["x-default"]).toBe("from-default");
    });

    test("a request header overrides a default header of the same name", async () => {
      intercept(OLD_HOST, "get", "/v1/pets/5", STATUS_OK, PET);
      await runOpenApi(
        { ...getPetAction, [keyOf("header", "X-Override")]: "from-request" },
        oas3Config(),
        headerSpec(),
        { "X-Override": "from-default", "X-Default": "kept" }
      );
      expect(seen[0].headers["x-override"]).toBe("from-request");
      expect(seen[0].headers["x-default"]).toBe("kept");
    });

    test("an empty request header does not reach the wire and does not hide the default", async () => {
      intercept(OLD_HOST, "get", "/v1/pets/5", STATUS_OK, PET);
      await runOpenApi(
        { ...getPetAction, [keyOf("header", "X-Override")]: "" },
        oas3Config(),
        headerSpec(),
        { "X-Override": "from-default" }
      );
      expect(seen[0].headers["x-override"]).toBe("from-default");
    });
  });

  describe("security", () => {
    const secured = (scheme: Json, schemeName: string) => {
      const spec = oas3Spec({
        components: { securitySchemes: { [schemeName]: scheme } },
        security: [{ [schemeName]: [] }],
      });
      return spec;
    };

    test("an apiKey in a header reaches the wire", async () => {
      intercept(OLD_HOST, "get", "/v1/pets/5", STATUS_OK, PET);
      await runOpenApi(
        getPetAction,
        oas3Config({ dynamicParamsConfig: { "keyAuth.value": "secret" } }),
        secured({ type: "apiKey", in: "header", name: "X-Api-Key" }, "keyAuth")
      );
      expect(seen[0].headers["x-api-key"]).toBe("secret");
    });

    test("an apiKey in the query reaches the URL", async () => {
      intercept(OLD_HOST, "get", "/v1/pets/5?api_key=secret", STATUS_OK, PET);
      await runOpenApi(
        getPetAction,
        oas3Config({ dynamicParamsConfig: { "keyAuth.value": "secret" } }),
        secured({ type: "apiKey", in: "query", name: "api_key" }, "keyAuth")
      );
      expect(seen[0].uri).toBe("/v1/pets/5?api_key=secret");
    });

    test("basic auth is sent as an Authorization Basic header", async () => {
      intercept(OLD_HOST, "get", "/v1/pets/5", STATUS_OK, PET);
      await runOpenApi(
        getPetAction,
        oas3Config({ dynamicParamsConfig: { "basicAuth.username": "user", "basicAuth.password": "pass" } }),
        secured({ type: "http", scheme: "basic" }, "basicAuth")
      );
      expect(seen[0].headers.authorization).toBe(`Basic ${Buffer.from("user:pass").toString("base64")}`);
    });

    test("a bearer token is sent as an Authorization Bearer header", async () => {
      intercept(OLD_HOST, "get", "/v1/pets/5", STATUS_OK, PET);
      await runOpenApi(
        getPetAction,
        oas3Config({ dynamicParamsConfig: { "bearerAuth.value": "tok123" } }),
        secured({ type: "http", scheme: "bearer" }, "bearerAuth")
      );
      expect(seen[0].headers.authorization).toBe("Bearer tok123");
    });

    test("Swagger 2: an apiKey from securityDefinitions reaches the wire", async () => {
      intercept(OLD_HOST, "get", "/v1/pets/5", STATUS_OK, PET);
      await runOpenApi(
        getPetAction,
        oas3Config({ dynamicParamsConfig: { "keyAuth.value": "secret" } }),
        swagger2Spec({
          securityDefinitions: { keyAuth: { type: "apiKey", in: "header", name: "api_key" } },
          security: [{ keyAuth: [] }],
        })
      );
      expect(seen[0].headers.api_key).toBe("secret");
    });

    test("without credentials no auth header is sent", async () => {
      intercept(OLD_HOST, "get", "/v1/pets/5", STATUS_OK, PET);
      await runOpenApi(getPetAction, oas3Config(), secured({ type: "apiKey", in: "header", name: "X-Api-Key" }, "keyAuth"));
      expect(seen[0].headers).not.toHaveProperty("x-api-key");
    });
  });

  describe("error mapping", () => {
    test("a non-2xx response with a body returns that body", async () => {
      const errorBody = { message: "no such pet" };
      intercept(OLD_HOST, "get", "/v1/pets/5", STATUS_NOT_FOUND, errorBody);
      expect(await runOpenApi(getPetAction, oas3Config(), oas3Spec())).toEqual(errorBody);
    });

    test("a non-2xx response with no body gives 400 'status: <n>' and logs the failure", async () => {
      intercept(OLD_HOST, "get", "/v1/pets/5", STATUS_SERVER_ERROR);
      const error = await runOpenApi(getPetAction, oas3Config(), oas3Spec()).then(
        () => undefined,
        (e) => e
      );
      expect(error).toBeInstanceOf(ServiceError);
      expect(error.code).toBe(STATUS_BAD_REQUEST);
      expect(error.message).toBe(`status: ${STATUS_SERVER_ERROR}`);
      expect(logger.error).toHaveBeenCalledWith(expect.stringContaining(`${STATUS_SERVER_ERROR}`));
    });

    test("a network error is re-thrown unchanged, not mapped to a 400", async () => {
      nock(OLD_HOST).get("/v1/pets/5").replyWithError({ message: "socket hang up", code: "ECONNRESET" });
      const error = await runOpenApi(getPetAction, oas3Config(), oas3Spec()).then(
        () => undefined,
        (e) => e
      );
      expect(error).toBeInstanceOf(Error);
      expect(error).not.toBeInstanceOf(ServiceError);
      expect(error.message).toContain("socket hang up");
      expect(error.code).toBe("ECONNRESET");
    });

    // Limit: through the real HTTP stack node-fetch wraps the socket error in a new FetchError, so identity
    // cannot be observed at the HTTP boundary. The identity check therefore makes SwaggerClient.execute (a
    // third-party entry point, not repo code) reject with a sentinel that has no `status` and no `response`.
    test("an error without status or response body is re-thrown as the same object", async () => {
      const sentinel = Object.assign(new Error("boom"), { code: "ESENTINEL" });
      const executeSpy = jest.spyOn(SwaggerClient, "execute").mockRejectedValueOnce(sentinel);
      const error = await runOpenApi(getPetAction, oas3Config(), oas3Spec()).then(
        () => undefined,
        (e) => e
      );
      expect(executeSpy).toHaveBeenCalledTimes(1);
      expect(error).toBe(sentinel);
    });
  });

  describe("definitions", () => {
    test("openApiSpecDereferenced skips dereferencing: the operation is found in it, not in the spec argument", async () => {
      intercept(OLD_HOST, "get", "/v1/pets/5", STATUS_OK, PET);
      const unrelatedSpec = oas3Spec({ paths: {} });
      const result = await runOpenApi(getPetAction, oas3Config(), unrelatedSpec, undefined, oas3Spec());
      expect(result).toEqual(PET);
    });

    test("openApiSpecDereferenced is used as is: SwaggerParser.dereference is not called", async () => {
      intercept(OLD_HOST, "get", "/v1/pets/5", STATUS_OK, PET);
      const dereferenceSpy = jest.spyOn(SwaggerParser, "dereference");
      expect(await runOpenApi(getPetAction, oas3Config(), oas3Spec(), undefined, oas3Spec())).toEqual(PET);
      expect(dereferenceSpy).not.toHaveBeenCalled();
    });

    test("without openApiSpecDereferenced SwaggerParser.dereference is called once per spec", async () => {
      intercept(OLD_HOST, "get", "/v1/pets/5", STATUS_OK, PET);
      const dereferenceSpy = jest.spyOn(SwaggerParser, "dereference");
      expect(await runOpenApi(getPetAction, oas3Config(), oas3Spec())).toEqual(PET);
      expect(dereferenceSpy).toHaveBeenCalledTimes(1);
    });

    test("a spec with $ref parameters is dereferenced before the request is built", async () => {
      const spec = oas3Spec({
        components: { parameters: { PetId: { ...PET_PATH_PARAM, schema: { type: "integer" } } } },
      });
      spec.paths["/pets/{id}"].get.parameters = [{ $ref: "#/components/parameters/PetId" }];
      intercept(OLD_HOST, "get", "/v1/pets/5", STATUS_OK, PET);
      expect(await runOpenApi(getPetAction, oas3Config(), spec)).toEqual(PET);
    });

    test("a spec list resolves an operation id carrying the spec id suffix and sends the real operation", async () => {
      intercept(OLD_HOST, "get", "/v1/pets/5", STATUS_OK, PET);
      const SPEC_ID = "_second";
      const result = await runOpenApi({ ...getPetAction, actionName: `getPet${SPEC_ID}` }, oas3Config(), [
        { id: "_first", spec: oas3Spec({ paths: {} }) },
        { id: SPEC_ID, spec: oas3Spec() },
      ]);
      expect(result).toEqual(PET);
      expect(seen[0].uri).toBe("/v1/pets/5");
    });
  });
});

describe("openApi plugin object", () => {
  const ctx = { languages: [] };
  const pluginConfig = (spec: any): any => ({ url: "", serverURL: "", extra: { spec } });
  const captureSyncError = (fn: () => unknown) => {
    try {
      fn();
    } catch (e) {
      return e as any;
    }
    return undefined;
  };

  test("queryConfig without extra.spec gives 400", async () => {
    await expect((openApiPlugin.queryConfig as QueryConfigFn)({ url: "", serverURL: "" } as any, ctx as any)).rejects.toMatchObject({
      code: STATUS_BAD_REQUEST,
      message: MISSING_SPEC_MESSAGE,
    });
  });

  test("queryConfig with a spec string returns the categories and the actions", async () => {
    const result: any = await (openApiPlugin.queryConfig as QueryConfigFn)(pluginConfig(JSON.stringify(oas3Spec())), ctx as any);
    expect(result.type).toBe("query");
    expect(result.label).toBe("Operation");
    expect(result.categories).toEqual({ label: "Resource", items: [
        { label: "Pets", value: "pets" },
        { label: "Other", value: "other" },
      ],
    });
    const getPet = result.actions.find((a: any) => a.actionName === "getPet");
    expect(getPet).toBeDefined();
    expect(result.actions.map((a: any) => a.actionName).sort()).toEqual(["createPet", "getPet"]);
    expect(getPet.params.map((p: any) => p.key)).toEqual([keyOf("path", "id")]);
  });

  test("run without extra.spec gives 400 (thrown synchronously)", () => {
    const error = captureSyncError(() => openApiPlugin.run({ actionName: "getPet" }, { url: "", serverURL: "" } as any, ctx as any));
    expect(error).toBeInstanceOf(ServiceError);
    expect(error.code).toBe(STATUS_BAD_REQUEST);
    expect(error.message).toBe(MISSING_SPEC_MESSAGE);
  });

  test("run with a spec string parses it and executes the request", async () => {
    intercept(OLD_HOST, "get", "/v1/pets/5", STATUS_OK, PET);
    const result = await openApiPlugin.run(getPetAction, pluginConfig(JSON.stringify(oas3Spec())), ctx as any);
    expect(result).toEqual(PET);
    expect(seen).toHaveLength(1);
    expect(seen[0].uri).toBe("/v1/pets/5");
  });

  test("run with a spec object executes the request and applies the data source serverURL", async () => {
    intercept(NEW_HOST, "get", "/api/pets/5", STATUS_OK, PET);
    const config = { ...pluginConfig(oas3Spec()), serverURL: `${NEW_HOST}/api` };
    expect(await openApiPlugin.run(getPetAction, config, ctx as any)).toEqual(PET);
  });

  test("run with an unparseable spec string fails with a SyntaxError and sends nothing", () => {
    const error = captureSyncError(() => openApiPlugin.run(getPetAction, pluginConfig("{not json"), ctx as any));
    expect(error).toBeInstanceOf(SyntaxError);
    expect(seen).toEqual([]);
  });

  describe("dataSourceConfig.extra", () => {
    test("a served spec URL gives {data: {spec: <json string>}, extraParams} matching authParamsConfig", async () => {
      const spec = swagger2Spec({
        securityDefinitions: { keyAuth: { type: "apiKey", in: "header", name: "X-Api-Key", description: "the key" } },
      });
      nock(SPEC_HOST).get(SPEC_PATH).reply(STATUS_OK, spec);

      const result = await openApiPlugin.dataSourceConfig.extra!(
        { url: `${SPEC_HOST}${SPEC_PATH}`, serverURL: "" } as any
      );

      expect(typeof result.data.spec).toBe("string");
      expect(JSON.parse(result.data.spec)).toEqual(spec);
      expect(result.extraParams).toEqual([
        { type: "groupTitle", key: "keyAuth", label: "Api Key Auth" },
        {
          type: "password",
          key: "keyAuth.value",
          label: "X-Api-Key",
          tooltip: "the key",
          placeholder: "the key",
        },
      ]);
    });

    test("a non-http url is refused with 400 and nothing is fetched", async () => {
      await expect(
        openApiPlugin.dataSourceConfig.extra!({ url: "file:///etc/passwd", serverURL: "" } as any)
      ).rejects.toMatchObject({ code: STATUS_BAD_REQUEST });
    });
  });
});
