import path from "path";
import nock from "nock";
import SwaggerParser from "@apidevtools/swagger-parser";
import { OpenAPI } from "openapi-types";
import {
  authParamsConfig,
  defaultParseOpenApiOptions,
  parseMultiOpenApi,
  parseOpenApi,
  retrieveSpec,
} from "./parse";
import { ServiceError } from "../../common/error";
import { ConfigKeySplit } from "./util";

const demoSwaggerYaml = path.join(__dirname, "./fixture/swagger.yaml");
const demoOpenApiYaml = path.join(__dirname, "./fixture/openapi.yaml");

const SPEC_HOST = "http://spec.test";
const SPEC_PATH = "/spec.json";
const SPEC_URL = `${SPEC_HOST}${SPEC_PATH}`;
const STATUS_OK = 200;
const STATUS_BAD_REQUEST = 400;
const PARSER_SWAGGER_VERSION_MESSAGE = "Unrecognized Swagger version: 1.2. Expected 2.0";
const OAS3_FIXTURE_ACTION_COUNT = 19;
const SWAGGER2_FIXTURE_ACTION_COUNT = 20;
const JSON_INDENT = 4;
const CATEGORY_OTHER = "other";

type Json = Record<string, any>;
const keyOf = (position: string, name: string) => `${position}${ConfigKeySplit}${name}`;
const swagger2 = (extra: Json = {}): OpenAPI.Document =>
  ({ swagger: "2.0", info: { title: "t", version: "1" }, paths: {}, ...extra } as any);
const oas3 = (extra: Json = {}): OpenAPI.Document =>
  ({ openapi: "3.0.3", info: { title: "t", version: "1" }, paths: {}, ...extra } as any);
const getOp = (extra: Json = {}) => ({ responses: { "200": { description: "ok" } }, ...extra });

beforeAll(() => {
  nock.disableNetConnect();
});
afterEach(() => {
  nock.cleanAll();
});
afterAll(() => {
  nock.enableNetConnect();
});

describe("authParamsConfig", () => {
  const title = (key: string, label: string) => ({ type: "groupTitle", key, label });

  describe("swagger 2", () => {
    test("without securityDefinitions gives an empty list", async () => {
      expect(await authParamsConfig(swagger2())).toEqual([]);
    });

    test("apiKey gives a group title and a password field keyed <name>.value", async () => {
      const configs = await authParamsConfig(
        swagger2({
          securityDefinitions: {
            keyAuth: { type: "apiKey", name: "X-Api-Key", in: "header", description: "the key" },
          },
        })
      );
      expect(configs).toEqual([
        title("keyAuth", "Api Key Auth"),
        {
          type: "password",
          key: "keyAuth.value",
          label: "X-Api-Key",
          tooltip: "the key",
          placeholder: "the key",
        },
      ]);
    });

    test("basic gives username and password fields", async () => {
      const configs = await authParamsConfig(
        swagger2({ securityDefinitions: { basicAuth: { type: "basic" } } })
      );
      expect(configs).toEqual([
        title("basicAuth", "HTTP Basic Auth"),
        {
          type: "textInput",
          key: "basicAuth.username",
          label: "Username",
          tooltip: "Basic auth username",
          placeholder: "<Basic Auth Username>",
        },
        {
          type: "password",
          key: "basicAuth.password",
          label: "Password",
          tooltip: "Basic auth password",
          placeholder: "<Basic Auth Password>",
        },
      ]);
    });

    test("oauth2 contributes nothing and does not hide the other schemes", async () => {
      const configs = await authParamsConfig(
        swagger2({
          securityDefinitions: {
            oauth: { type: "oauth2", flow: "implicit", authorizationUrl: "http://a", scopes: {} },
            basicAuth: { type: "basic" },
          },
        })
      );
      expect(configs.map((c) => c.key)).toEqual([
        "basicAuth",
        "basicAuth.username",
        "basicAuth.password",
      ]);
    });
  });

  describe("openapi 3", () => {
    test("without components gives an empty list", async () => {
      expect(await authParamsConfig(oas3())).toEqual([]);
    });

    test("without securitySchemes gives an empty list", async () => {
      expect(await authParamsConfig(oas3({ components: {} }))).toEqual([]);
    });

    test("a $ref scheme is skipped", async () => {
      const configs = await authParamsConfig(
        oas3({
          components: { securitySchemes: { shared: { $ref: "#/components/securitySchemes/other" } } },
        })
      );
      expect(configs).toEqual([]);
    });

    test("apiKey gives a group title and a password field", async () => {
      const configs = await authParamsConfig(
        oas3({
          components: {
            securitySchemes: { keyAuth: { type: "apiKey", name: "api_key", in: "query" } },
          },
        })
      );
      expect(configs).toEqual([
        title("keyAuth", "Api Key Auth"),
        {
          type: "password",
          key: "keyAuth.value",
          label: "api_key",
          tooltip: undefined,
          placeholder: undefined,
        },
      ]);
    });

    test.each(["basic", "Basic", "BASIC"])("http scheme %s gives username and password", async (scheme) => {
      const configs = await authParamsConfig(
        oas3({ components: { securitySchemes: { web: { type: "http", scheme } } } })
      );
      expect(configs.map((c) => [c.type, c.key, c.label])).toEqual([
        ["groupTitle", "web", "HTTP Basic Auth"],
        ["textInput", "web.username", "Username"],
        ["password", "web.password", "Password"],
      ]);
    });

    test.each(["bearer", "Bearer"])("http scheme %s gives a token field", async (scheme) => {
      const configs = await authParamsConfig(
        oas3({
          components: {
            securitySchemes: { tok: { type: "http", scheme, description: "jwt token" } },
          },
        })
      );
      expect(configs).toEqual([
        title("tok", "Api Token Auth"),
        {
          type: "password",
          key: "tok.value",
          label: "Token",
          tooltip: "jwt token",
          placeholder: "jwt token",
        },
      ]);
    });

    test("an http scheme that is neither basic nor bearer contributes nothing", async () => {
      const configs = await authParamsConfig(
        oas3({ components: { securitySchemes: { dig: { type: "http", scheme: "digest" } } } })
      );
      expect(configs).toEqual([]);
    });

    test("oauth2 and openIdConnect contribute nothing", async () => {
      const configs = await authParamsConfig(
        oas3({
          components: {
            securitySchemes: {
              oauth: { type: "oauth2", flows: {} },
              oidc: { type: "openIdConnect", openIdConnectUrl: "http://a/.well-known" },
            },
          },
        })
      );
      expect(configs).toEqual([]);
    });
  });
});

describe("retrieveSpec", () => {
  test("a non-http url is a 400 Invalid spec url", async () => {
    const url = "ftp://x";
    await expect(retrieveSpec(url)).rejects.toMatchObject({
      constructor: ServiceError,
      message: `Invalid spec url: ${url}`,
      code: STATUS_BAD_REQUEST,
    });
  });

  test("returns the bundled spec fetched over http", async () => {
    const doc = swagger2({
      paths: { "/pets": { get: getOp({ operationId: "listPets" }) } },
    });
    const scope = nock(SPEC_HOST).get(SPEC_PATH).reply(STATUS_OK, doc);
    const result = await retrieveSpec(SPEC_URL);
    expect(result).toEqual({ spec: doc });
    expect(scope.isDone()).toBe(true);
  });

  test("a served OpenAPI 3 document is accepted", async () => {
    const doc = oas3({ paths: { "/pets": { get: getOp() } } });
    nock(SPEC_HOST).get(SPEC_PATH).reply(STATUS_OK, doc);
    expect(await retrieveSpec(SPEC_URL)).toEqual({ spec: doc });
  });

  // The "Only OpenApi v2 and v3 supported" ServiceError of retrieveSpec is unreachable: swagger-parser's
  // own version check rejects every other version first, so its SyntaxError is what the caller sees.
  // One would expect a ServiceError here; the observed (real swagger-parser) behaviour is a SyntaxError,
  // which is what this test pins. The ServiceError guard itself is unreachable (see the comment above).
  test("a swagger 1.2 document is rejected with the parser's SyntaxError, not retrieveSpec's ServiceError", async () => {
    nock(SPEC_HOST).get(SPEC_PATH).reply(STATUS_OK, swagger2({ swagger: "1.2" }));
    const error = await retrieveSpec(SPEC_URL).catch((e) => e);
    expect(error).toBeInstanceOf(SyntaxError);
    expect(error).not.toBeInstanceOf(ServiceError);
    expect(error.message).toBe(PARSER_SWAGGER_VERSION_MESSAGE);
  });

  test("a document with an unsupported openapi version is rejected by the parser", async () => {
    nock(SPEC_HOST).get(SPEC_PATH).reply(STATUS_OK, oas3({ openapi: "4.0.0" }));
    const error = await retrieveSpec(SPEC_URL).catch((e) => e);
    expect(error).toBeInstanceOf(SyntaxError);
    expect(error.message).toMatch(/^Unsupported OpenAPI version: 4\.0\.0\./);
  });
});

describe("parseOpenApi", () => {
  test("a JSON string input is parsed", async () => {
    const spec = swagger2({
      paths: { "/pets": { get: getOp({ operationId: "listPets", tags: ["pets"] }) } },
    });
    const result = await parseOpenApi(JSON.stringify(spec));
    expect(result.actions.map((a) => a.actionName)).toEqual(["listPets"]);
    expect(result.categories).toEqual([{ label: "Pets", value: "pets" }]);
  });

  // swagger-parser only accepts a spec without paths for OpenAPI 3.1.0 with webhooks.
  test("a spec without paths gives empty actions and categories", async () => {
    const spec = oas3({ openapi: "3.1.0", webhooks: {}, tags: [{ name: "ignored" }] });
    delete (spec as Json).paths;
    expect(await parseOpenApi(spec)).toEqual({ actions: [], categories: [] });
  });

  // The "Only OpenApi v2 and v3 supported" ServiceError of parseOpenApi is unreachable: the dereference
  // step runs swagger-parser's version check first and throws its own SyntaxError.
  test("an unsupported version with paths throws the parser's version error", async () => {
    const spec = swagger2({ swagger: "1.2", paths: { "/a": { get: getOp() } } });
    const error = await parseOpenApi(spec).catch((e) => e);
    expect(error).toBeInstanceOf(SyntaxError);
    expect(error.message).toBe(PARSER_SWAGGER_VERSION_MESSAGE);
  });

  test("tags become categories with an upper-first label", async () => {
    const spec = swagger2({
      tags: [{ name: "pets" }, { name: "storeFront" }],
      paths: { "/pets": { get: getOp({ operationId: "listPets", tags: ["pets"] }) } },
    });
    const { categories } = await parseOpenApi(spec);
    expect(categories).toEqual([
      { label: "Pets", value: "pets" },
      { label: "StoreFront", value: "storeFront" },
    ]);
  });

  test("an untagged operation goes to the other category", async () => {
    const spec = swagger2({
      tags: [{ name: "pets" }],
      paths: { "/ping": { get: getOp({ operationId: "ping" }) } },
    });
    const { actions, categories } = await parseOpenApi(spec);
    expect(actions[0].category).toEqual([CATEGORY_OTHER]);
    expect(categories).toEqual([
      { label: "Pets", value: "pets" },
      { label: "Other", value: CATEGORY_OTHER },
    ]);
  });

  test("an operation tag is not added twice when the spec already lists it", async () => {
    const spec = swagger2({
      tags: [{ name: "pets" }],
      paths: {
        "/a": { get: getOp({ operationId: "a", tags: ["pets"] }) },
        "/b": { get: getOp({ operationId: "b", tags: ["pets", "extra"] }) },
      },
    });
    const { categories } = await parseOpenApi(spec);
    expect(categories).toEqual([
      { label: "Pets", value: "pets" },
      { label: "Extra", value: "extra" },
    ]);
  });

  test("non-method path keys are skipped", async () => {
    const spec = oas3({
      paths: {
        "/pets": {
          summary: "path summary",
          description: "path description",
          parameters: [],
          "x-custom": { get: getOp() },
          get: getOp({ operationId: "listPets" }),
        },
      },
    });
    const { actions } = await parseOpenApi(spec);
    expect(actions.map((a) => a.actionName)).toEqual(["listPets"]);
  });

  test("a method with an empty operation is skipped", async () => {
    const spec = oas3({ paths: { "/pets": { get: null, post: getOp({ operationId: "addPet" }) } } });
    const { actions } = await parseOpenApi(spec);
    expect(actions.map((a) => a.actionName)).toEqual(["addPet"]);
  });

  test("a null path item is skipped", async () => {
    const spec = oas3({ paths: { "/gone": null, "/pets": { get: getOp({ operationId: "listPets" }) } } });
    const { actions } = await parseOpenApi(spec);
    expect(actions.map((a) => a.actionName)).toEqual(["listPets"]);
  });

  test("the default label is the operationId and the default description the summary", async () => {
    const spec = oas3({
      paths: {
        "/pets": {
          get: getOp({ operationId: "listPets", summary: "List pets", description: "Long text" }),
        },
      },
    });
    const { actions } = await parseOpenApi(spec);
    expect(actions[0]).toMatchObject({
      actionName: "listPets",
      label: "listPets",
      description: "List pets",
    });
  });

  test("without an operationId the label is METHOD - path and the action name is derived by swagger-client", async () => {
    const spec = oas3({
      paths: { "/pets/{id}": { get: getOp({ description: "Only a description" }) } },
    });
    const { actions } = await parseOpenApi(spec);
    expect(actions).toHaveLength(1);
    expect(actions[0].label).toBe("GET - /pets/{id}");
    expect(actions[0].description).toBe("Only a description");
    expect(actions[0].actionName).toBe("get_pets__id_");
  });

  test("the description is empty without summary and description", async () => {
    const spec = oas3({ paths: { "/pets": { get: getOp({ operationId: "listPets" }) } } });
    const { actions } = await parseOpenApi(spec);
    expect(actions[0].description).toBe("");
  });

  test("custom actionLabel and actionDescription are used with method, path and operation", async () => {
    const spec = oas3({
      paths: { "/pets": { delete: getOp({ operationId: "removePet", summary: "S" }) } },
    });
    const actionLabel = jest.fn(
      (method: string, p: string, op: any) => `${method}|${p}|${op.operationId}`
    );
    const actionDescription = jest.fn(
      (method: string, p: string, op: any) => `desc-${method}|${p}|${op.operationId}`
    );
    const { actions } = await parseOpenApi(spec, { actionLabel, actionDescription });
    expect(actions[0]).toMatchObject({
      actionName: "removePet",
      label: "delete|/pets|removePet",
      description: "desc-delete|/pets|removePet",
    });
    expect(actionLabel).toHaveBeenCalledTimes(1);
    expect(actionDescription).toHaveBeenCalledTimes(1);
    expect(actionDescription).toHaveBeenCalledWith(
      "delete",
      "/pets",
      expect.objectContaining({ operationId: "removePet", summary: "S" })
    );
  });

  test("an option that is not supplied keeps its default", async () => {
    const spec = oas3({ paths: { "/pets": { get: getOp({ operationId: "listPets", summary: "S" }) } } });
    const { actions } = await parseOpenApi(spec, { actionLabel: () => "custom" });
    expect(actions[0].label).toBe("custom");
    expect(actions[0].description).toBe("S");
  });

  test("the default options are the documented functions", () => {
    expect(defaultParseOpenApiOptions.actionLabel("post", "/x", {} as any)).toBe("POST - /x");
    expect(defaultParseOpenApiOptions.actionDescription("post", "/x", {} as any)).toBe("");
  });

  test("swagger 2 operations are converted by the swagger 2 parser", async () => {
    const spec = swagger2({
      paths: {
        "/pets/{id}": {
          parameters: [{ name: "id", in: "path", required: true, type: "integer" }],
          get: getOp({
            operationId: "getPet",
            parameters: [{ name: "verbose", in: "query", type: "boolean" }],
          }),
        },
      },
    });
    const { actions } = await parseOpenApi(spec);
    expect(actions[0].params.map((p: any) => [p.key, p.type])).toEqual([
      [keyOf("path", "id"), "numberInput"],
      [keyOf("query", "verbose"), "booleanInput"],
    ]);
  });

  test("openapi 3 operations are converted by the openapi 3 parser", async () => {
    const spec = oas3({
      paths: {
        "/pets/{id}": {
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
          get: getOp({
            operationId: "getPet",
            parameters: [{ name: "verbose", in: "query", schema: { type: "boolean" } }],
          }),
        },
      },
    });
    const { actions } = await parseOpenApi(spec);
    expect(actions[0].params.map((p: any) => [p.key, p.type])).toEqual([
      [keyOf("path", "id"), "numberInput"],
      [keyOf("query", "verbose"), "booleanInput"],
    ]);
  });

  describe("fixtures", () => {
    test("the swagger 2 petstore parses into the expected actions", async () => {
      const doc = await SwaggerParser.bundle(demoSwaggerYaml);
      const { actions, categories } = await parseOpenApi(doc);
      expect(actions).toHaveLength(SWAGGER2_FIXTURE_ACTION_COUNT);
      expect(categories).toEqual([
        { label: "Pet", value: "pet" },
        { label: "Store", value: "store" },
        { label: "User", value: "user" },
      ]);
      const byName = (name: string) => actions.find((a) => a.actionName === name);

      expect(byName("findPetsByStatus")).toEqual({
        category: ["pet"],
        actionName: "findPetsByStatus",
        label: "findPetsByStatus",
        description: "Finds Pets by status",
        params: [
          {
            label: "status",
            tooltip: "Status values that need to be considered for filter",
            defaultValue: "available",
            options: [
              { label: "available", value: "available" },
              { label: "pending", value: "pending" },
              { label: "sold", value: "sold" },
            ],
            type: "select",
            key: keyOf("query", "status"),
          },
        ],
      });
      expect(byName("uploadFile")!.params).toEqual([
        {
          label: "petId",
          tooltip: "ID of pet to update",
          options: [],
          type: "numberInput",
          key: keyOf("path", "petId"),
        },
        {
          label: "additionalMetadata",
          tooltip: "Additional data to pass to server",
          options: [],
          type: "textInput",
          key: keyOf("formData", "additionalMetadata"),
        },
        {
          label: "file",
          tooltip: "file to upload",
          options: [],
          type: "file",
          key: keyOf("formData", "file"),
        },
      ]);
    });

    test("the openapi 3 petstore parses into the expected actions", async () => {
      const doc = await SwaggerParser.bundle(demoOpenApiYaml);
      const { actions, categories } = await parseOpenApi(doc);
      expect(actions).toHaveLength(OAS3_FIXTURE_ACTION_COUNT);
      expect(categories).toEqual([
        { label: "Pet", value: "pet" },
        { label: "Store", value: "store" },
        { label: "User", value: "user" },
      ]);
      const byName = (name: string) => actions.find((a) => a.actionName === name);

      expect(byName("findPetsByStatus")).toEqual({
        category: ["pet"],
        actionName: "findPetsByStatus",
        label: "findPetsByStatus",
        description: "Finds Pets by status",
        params: [
          {
            label: "status",
            tooltip: "Status values that need to be considered for filter",
            options: [
              { label: "available", value: "available" },
              { label: "pending", value: "pending" },
              { label: "sold", value: "sold" },
              { label: "", value: "" },
            ],
            type: "select",
            defaultValue: "available",
            key: keyOf("query", "status"),
          },
        ],
      });

      expect(byName("updatePetWithForm")!.params).toEqual([
        {
          label: "petId",
          tooltip: "ID of pet that needs to be updated",
          options: [],
          type: "numberInput",
          key: keyOf("path", "petId"),
        },
        {
          label: "name",
          tooltip: "Name of pet that needs to be updated",
          options: [],
          type: "textInput",
          defaultValue: "",
          key: keyOf("query", "name"),
        },
        {
          label: "status",
          tooltip: "Status of pet that needs to be updated",
          options: [],
          type: "textInput",
          defaultValue: "",
          key: keyOf("query", "status"),
        },
      ]);

      expect(byName("addPet")!.params.map((p: any) => [p.key, p.type, p.defaultValue])).toEqual([
        [keyOf("body", "id"), "numberInput", 10],
        [keyOf("body", "name"), "textInput", "doggie"],
        [keyOf("body", "category"), "jsonInput", JSON.stringify({ id: 1, name: "Dogs" }, null, JSON_INDENT)],
        [keyOf("body", "photoUrls"), "jsonInput", JSON.stringify([""], null, JSON_INDENT)],
        [keyOf("body", "tags"), "jsonInput", JSON.stringify([{ name: "" }], null, JSON_INDENT)],
        [keyOf("body", "status"), "select", "available"],
      ]);

      expect(byName("uploadFile")!.params.map((p: any) => [p.key, p.type])).toEqual([
        [keyOf("path", "petId"), "numberInput"],
        [keyOf("query", "additionalMetadata"), "textInput"],
        [keyOf("body", "body"), "file"],
      ]);
    });
  });
});

describe("parseMultiOpenApi", () => {
  test("concatenates actions, suffixes names with the spec id and dedupes categories", async () => {
    const first = swagger2({
      tags: [{ name: "pets" }],
      paths: { "/pets": { get: getOp({ operationId: "list", tags: ["pets"] }) } },
    });
    const second = oas3({
      tags: [{ name: "pets" }, { name: "owners" }],
      paths: {
        "/pets": { get: getOp({ operationId: "list", tags: ["pets"] }) },
        "/owners": { get: getOp({ operationId: "owners", tags: ["owners"] }) },
      },
    });
    const { actions, categories } = await parseMultiOpenApi([
      { id: "A", spec: first },
      { id: "B", spec: JSON.stringify(second) },
    ]);
    expect(actions.map((a) => a.actionName)).toEqual(["listA", "listB", "ownersB"]);
    expect(actions.map((a) => a.label)).toEqual(["list", "list", "owners"]);
    expect(categories).toEqual([
      { label: "Pets", value: "pets" },
      { label: "Owners", value: "owners" },
    ]);
  });

  test("an empty list gives empty results", async () => {
    expect(await parseMultiOpenApi([])).toEqual({ actions: [], categories: [] });
  });

  test("options are passed through to every spec", async () => {
    const spec = (id: string) =>
      oas3({ paths: { "/pets": { get: getOp({ operationId: `op${id}` }) } } });
    const { actions } = await parseMultiOpenApi(
      [
        { id: "1", spec: spec("1") },
        { id: "2", spec: spec("2") },
      ],
      { actionLabel: (method, p) => `${method}:${p}` }
    );
    expect(actions.map((a) => [a.actionName, a.label])).toEqual([
      ["op11", "get:/pets"],
      ["op22", "get:/pets"],
    ]);
  });
});
