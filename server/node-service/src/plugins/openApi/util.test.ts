import { File } from "formdata-node";
import {
  appendCategories,
  appendTags,
  ConfigKeySplit,
  extractLevelData,
  extractSecurityParams,
  findOas3FilePropertiesFromSchema,
  findOperation,
  getFileData,
  getOperationId,
  getSchemaExample,
  getSchemaType,
  isFileData,
  isOas3,
  isValidHttpMethods,
  mergeCategories,
  normalizeParams,
  parseUrl,
  replaceServersUrl,
  specVersion,
  MediaTypeJson,
  MediaTypeMultiPartFormData,
  MediaTypeOctetStream,
  MediaTypeUrlEncoded,
} from "./util";
import { parseOpenApi } from "./parse";

type Json = Record<string, any>;
const keyOf = (position: string, name: string) => `${position}${ConfigKeySplit}${name}`;
const BASE64_HELLO = Buffer.from("hello").toString("base64");
const DEFAULT_FILE_NAME = "file";
const FILE_TYPE_PNG = "image/png";
const REF_SCHEMA = { $ref: "#/components/schemas/X" };
const oas3Doc = (extra: Json = {}): any => ({ openapi: "3.0.3", paths: {}, ...extra });
const swagger2Doc = (extra: Json = {}): any => ({ swagger: "2.0", paths: {}, ...extra });
const oas3Op = (content: Json): any => ({ requestBody: { content } });
const multipartOp = (properties: Json): any =>
  oas3Op({ [MediaTypeMultiPartFormData]: { schema: { type: "object", properties } } });


test("extractSecurityParams", () => {
  const params = extractSecurityParams({"dynamicParamsConfig":{ "ApiKeyAuth.value": "hello", ApiKeyAuth: null }}, {
    openapi: "3.0",
    components: {
      securitySchemes: {
        ApiKeyAuth: {
          type: "apiKey",
          in: "header",
          name: "X-N8N-API-KEY",
        },
      },
    },
  } as any);

  expect(params.authorized).toEqual({ ApiKeyAuth: { value: "hello" } });
});

test("extractLevelData", () => {
  expect(extractLevelData({ "a.b": 1, a: null })).toEqual({
    a: {
      b: 1,
    },
  });
  expect(extractLevelData({ "a.b.c": 1, "a.d": 2, c: 3 })).toEqual({
    a: {
      "b.c": 1,
      d: 2,
    },
  });
});

test("getSchemaExample", () => {
  expect(
    getSchemaExample({
      type: "boolean",
      example: true,
    })
  ).toBe(true);

  expect(
    getSchemaExample({
      type: "object",
      example: {},
      properties: {
        a: {
          type: "number",
          example: 1,
        },
      },
    })
  ).toEqual({});

  expect(
    getSchemaExample({
      type: "object",
      properties: {
        a: {
          type: "number",
          example: 1,
        },
        b: {
          type: "object",
          properties: {
            b_1: {
              type: "number",
              example: 2,
            },
            b_2: {
              type: "array",
              items: {
                example: 3,
              },
            },
            b_3: {
              type: "array",
              items: {
                enum: ["ok", "hello"],
              },
            },
            b_4: {
              type: "array",
              items: {},
            },
          },
        },
      },
    })
  ).toEqual({ a: 1, b: { b_1: 2, b_2: [3], b_3: ["ok"], b_4: [] } });

  expect(
    getSchemaExample({
      type: "array",
      items: {
        type: "object",
        properties: {
          a: {
            type: "number",
            example: 1,
          },
          b: {
            type: "object",
            properties: {
              b_1: {
                type: "number",
                example: 2,
              },
            },
          },
          c: {
            type: "boolean",
            example: true,
            readOnly: true,
          },
        },
      },
    })
  ).toEqual([{ a: 1, b: { b_1: 2 } }]);
});

test("parseUrl", () => {
  expect(parseUrl("https://hello.com:8080/api/v1?a=1")).toEqual({
    host: "hello.com:8080",
    pathname: "/api/v1",
    schema: "https",
  });
  expect(() => parseUrl("hello.com:8080/api/v1?a=1")).toThrow();
  expect(() => parseUrl("//hello.com:8080/api/v1?a=1")).toThrow();
});

describe("getFileData", () => {
  test.each([[undefined], [null], [""]])("a falsy value (%p) gives null", (value) => {
    expect(getFileData(value as any)).toBeNull();
  });

  test("a base64 string gives a Buffer of the decoded bytes", () => {
    const result = getFileData(BASE64_HELLO);
    expect(Buffer.isBuffer(result)).toBe(true);
    expect((result as Buffer).toString("utf8")).toBe("hello");
  });

  test("a Buffer is passed through as the same object", () => {
    const buf = Buffer.from("raw");
    expect(getFileData(buf as any)).toBe(buf);
  });

  test("a File is passed through as the same object", () => {
    const file = new File(["x"], "x.txt");
    expect(getFileData(file as any)).toBe(file);
  });

  test("{data, name, type} gives a File with that name, type and decoded content", async () => {
    const result = getFileData({ data: BASE64_HELLO, name: "a.png", type: FILE_TYPE_PNG }) as File;
    expect(result).toBeInstanceOf(File);
    expect(result.name).toBe("a.png");
    expect(result.type).toBe(FILE_TYPE_PNG);
    expect(await result.text()).toBe("hello");
  });

  test("a missing name defaults to 'file'", () => {
    const result = getFileData({ data: BASE64_HELLO }) as File;
    expect(result).toBeInstanceOf(File);
    expect(result.name).toBe(DEFAULT_FILE_NAME);
  });

  test("{name} without data gives null", () => {
    expect(getFileData({ name: "a.png" } as any)).toBeNull();
  });
});

describe("specVersion and isOas3", () => {
  test.each([
    [{}, [2, 0], false],
    [{ swagger: "2.0" }, [2, 0], false],
    [{ openapi: "3.0.1" }, [3, 0], true],
    [{ openapi: "3" }, [3, 0], true],
  ])("%j gives %j (isOas3 %p)", (doc, expected, oas3) => {
    expect(specVersion(doc)).toEqual(expected);
    expect(isOas3(doc)).toBe(oas3);
  });
});

describe("extractSecurityParams", () => {
  test("OAS3 keeps only the keys named in components.securitySchemes", () => {
    const result = extractSecurityParams(
      {
        dynamicParamsConfig: {
          "basic.username": "u",
          "basic.password": "p",
          "undeclared.value": "dropped",
        },
      },
      oas3Doc({ components: { securitySchemes: { basic: { type: "http", scheme: "basic" } } } })
    );
    expect(result.authorized).toEqual({ basic: { username: "u", password: "p" } });
  });

  test("Swagger 2 uses securityDefinitions", () => {
    const result = extractSecurityParams(
      { dynamicParamsConfig: { "key.value": "k", "other.value": "dropped" } },
      swagger2Doc({ securityDefinitions: { key: { type: "apiKey", in: "header", name: "X-K" } } })
    );
    expect(result.authorized).toEqual({ key: { value: "k" } });
  });

  test("a spec with neither gives authorized {} and no dynamicParamsConfig is tolerated", () => {
    expect(
      extractSecurityParams({ dynamicParamsConfig: { "a.value": "x" } }, swagger2Doc()).authorized
    ).toEqual({});
    expect(extractSecurityParams({}, oas3Doc()).authorized).toEqual({});
  });

  test("bearerAuth.value and apiKeyAuth.value are injected even when undeclared", () => {
    const result = extractSecurityParams(
      { dynamicParamsConfig: { "bearerAuth.value": "tok", "apiKeyAuth.value": "key" } },
      oas3Doc()
    );
    expect(result.authorized).toEqual({
      bearerAuth: { value: "tok" },
      apiKeyAuth: { value: "key" },
    });
  });

  test("OAUTH_ACCESS_TOKEN short-circuits to {OAUTH_ACCESS_TOKEN: {value}} and keeps spec security", () => {
    const security = [{ oauth: [] }];
    const result = extractSecurityParams(
      { OAUTH_ACCESS_TOKEN: "oauth-tok", dynamicParamsConfig: { "bearerAuth.value": "ignored" } },
      oas3Doc({ security })
    );
    expect(result).toEqual({
      authorized: { OAUTH_ACCESS_TOKEN: { value: "oauth-tok" } },
      specSecurity: security,
    });
  });

  test("specSecurity is the spec's security, and defaults to []", () => {
    const security = [{ basic: [] }];
    expect(extractSecurityParams({}, oas3Doc({ security })).specSecurity).toBe(security);
    expect(extractSecurityParams({}, oas3Doc()).specSecurity).toEqual([]);
  });
});

describe("normalizeParams", () => {
  const jsonBodyOp = (): any => oas3Op({ [MediaTypeJson]: { schema: { type: "object" } } });

  test("a key without the separator is ignored and falsy values are dropped", () => {
    const result = normalizeParams(
      { plain: "ignored", [keyOf("query", "empty")]: "", [keyOf("query", "zero")]: 0, [keyOf("query", "kept")]: "v" },
      {} as any,
      false
    );
    expect(result).toEqual({ parameters: { kept: "v" }, requestBody: undefined });
  });

  test("Swagger 2 puts everything in parameters and turns a type:file param into a Buffer", () => {
    const operation: any = { parameters: [{ name: "upload", in: "formData", type: "file" }] };
    const result = normalizeParams(
      {
        [keyOf("formData", "upload")]: BASE64_HELLO,
        [keyOf("body", "payload")]: { a: 1 },
        [keyOf("query", "q")]: "x",
      },
      operation,
      false
    );
    expect(Buffer.isBuffer(result.parameters.upload)).toBe(true);
    expect(result.parameters.upload.toString("utf8")).toBe("hello");
    expect(result.parameters.payload).toEqual({ a: 1 });
    expect(result.parameters.q).toBe("x");
    expect(result.requestBody).toBeUndefined();
  });

  test("OAS3 sends body fields to requestBody and the rest to parameters", () => {
    const result = normalizeParams(
      { [keyOf("query", "q")]: "1", [keyOf("body", "a")]: 1, [keyOf("body", "b")]: "x" },
      jsonBodyOp(),
      true
    );
    expect(result).toEqual({ parameters: { q: "1" }, requestBody: { a: 1, b: "x" } });
  });

  test("OAS3 with no body fields leaves requestBody undefined", () => {
    const result = normalizeParams({ [keyOf("query", "q")]: "1" }, jsonBodyOp(), true);
    expect(result).toEqual({ parameters: { q: "1" }, requestBody: undefined });
  });

  test("OAS3 multipart: a format:binary property given as {data,name,type} becomes a File", async () => {
    const operation = multipartOp({
      avatar: { type: "string", format: "binary" },
      title: { type: "string" },
    });
    const result = normalizeParams(
      {
        [keyOf("body", "avatar")]: { data: BASE64_HELLO, name: "a.png", type: FILE_TYPE_PNG },
        [keyOf("body", "title")]: "t",
      },
      operation,
      true
    );
    const avatar = result.requestBody.avatar as File;
    expect(avatar).toBeInstanceOf(File);
    expect(avatar.name).toBe("a.png");
    expect(avatar.type).toBe(FILE_TYPE_PNG);
    expect(await avatar.text()).toBe("hello");
    expect(result.requestBody.title).toBe("t");
  });

  test("OAS3 multipart: a binary property given as a base64 string becomes a Buffer", () => {
    const result = normalizeParams(
      { [keyOf("body", "avatar")]: BASE64_HELLO },
      multipartOp({ avatar: { type: "string", format: "binary" } }),
      true
    );
    expect(Buffer.isBuffer(result.requestBody.avatar)).toBe(true);
    expect(result.requestBody.avatar.toString("utf8")).toBe("hello");
  });

  test("a single 'body' field with JSON content is unwrapped to the value", () => {
    const result = normalizeParams({ [keyOf("body", "body")]: { id: 7 } }, jsonBodyOp(), true);
    expect(result.requestBody).toEqual({ id: 7 });
  });

  test("a single JSON field not named 'body' is not unwrapped", () => {
    const result = normalizeParams({ [keyOf("body", "id")]: 7 }, jsonBodyOp(), true);
    expect(result.requestBody).toEqual({ id: 7 });
  });

  test("an octet-stream 'body' becomes a Buffer", () => {
    const operation = oas3Op({ [MediaTypeOctetStream]: { schema: { type: "string", format: "binary" } } });
    const result = normalizeParams({ [keyOf("body", "body")]: BASE64_HELLO }, operation, true);
    expect(Buffer.isBuffer(result.requestBody)).toBe(true);
    expect(result.requestBody.toString("utf8")).toBe("hello");
  });

  test("an octet-stream 'body' that is not file data keeps the field object", () => {
    const operation = oas3Op({ [MediaTypeOctetStream]: { schema: { type: "string", format: "binary" } } });
    const result = normalizeParams({ [keyOf("body", "body")]: { name: "no-data" } }, operation, true);
    expect(result.requestBody).toEqual({ body: { name: "no-data" } });
  });

  test("a single urlencoded field is not unwrapped", () => {
    const operation = oas3Op({ [MediaTypeUrlEncoded]: { schema: { type: "object" } } });
    const result = normalizeParams({ [keyOf("body", "body")]: "x" }, operation, true);
    expect(result.requestBody).toEqual({ body: "x" });
  });

  test("a $ref requestBody is ignored and its body fields are not sent as parameters", () => {
    const result = normalizeParams(
      { [keyOf("body", "a")]: 1, [keyOf("query", "q")]: "1" },
      { requestBody: { $ref: "#/components/requestBodies/X" } } as any,
      true
    );
    expect(result).toEqual({ parameters: { q: "1" }, requestBody: undefined });
  });
});

describe("findOas3FilePropertiesFromSchema", () => {
  test.each([[undefined], [REF_SCHEMA], [{ type: "array", items: { type: "string", format: "binary" } }]])(
    "%j gives []",
    (schema) => {
      expect(findOas3FilePropertiesFromSchema(schema as any)).toEqual([]);
    }
  );

  test("only format:binary properties are returned; $ref properties are skipped", () => {
    const binary = { type: "string", format: "binary" };
    const result = findOas3FilePropertiesFromSchema({
      type: "object",
      properties: {
        file: binary,
        text: { type: "string" },
        byteField: { type: "string", format: "byte" },
        linked: REF_SCHEMA,
      },
    } as any);
    expect(result).toEqual([["file", binary]]);
  });

  test("an object schema without properties gives []", () => {
    expect(findOas3FilePropertiesFromSchema({ type: "object" })).toEqual([]);
  });
});

describe("isFileData", () => {
  const binaryProps = { f: { type: "string", format: "binary" }, t: { type: "string" }, r: REF_SCHEMA };

  test("OAS3: no requestBody is false", () => {
    expect(isFileData("f", {} as any, true)).toBe(false);
  });

  test("OAS3: a $ref requestBody is false", () => {
    expect(isFileData("f", { requestBody: { $ref: "#/x" } } as any, true)).toBe(false);
  });

  test("OAS3: no multipart content is false even when JSON has a binary property", () => {
    const operation = oas3Op({ [MediaTypeJson]: { schema: { type: "object", properties: binaryProps } } });
    expect(isFileData("f", operation, true)).toBe(false);
  });

  test("OAS3: a $ref multipart schema is false", () => {
    const operation = oas3Op({ [MediaTypeMultiPartFormData]: { schema: REF_SCHEMA } });
    expect(isFileData("f", operation, true)).toBe(false);
  });

  test("OAS3: a multipart schema without properties is false", () => {
    const operation = oas3Op({ [MediaTypeMultiPartFormData]: { schema: { type: "object" } } });
    expect(isFileData("f", operation, true)).toBe(false);
  });

  test("OAS3: a $ref property is false", () => {
    expect(isFileData("r", multipartOp(binaryProps), true)).toBe(false);
  });

  test("OAS3: a binary property is true, a non-binary one is false, an unknown name is false", () => {
    const operation = multipartOp(binaryProps);
    expect(isFileData("f", operation, true)).toBe(true);
    expect(isFileData("t", operation, true)).toBe(false);
    expect(isFileData("missing", operation, true)).toBe(false);
  });

  test("Swagger 2: $ref params are skipped, type:file matches, other types and unknown names do not", () => {
    const operation: any = {
      parameters: [
        { $ref: "#/parameters/X" },
        { name: "upload", in: "formData", type: "file" },
        { name: "q", in: "query", type: "string" },
      ],
    };
    expect(isFileData("upload", operation, false)).toBe(true);
    expect(isFileData("q", operation, false)).toBe(false);
    expect(isFileData("missing", operation, false)).toBe(false);
    expect(isFileData("upload", {} as any, false)).toBe(false);
  });
});

describe("findOperation", () => {
  const spec = (): any => ({
    openapi: "3.0.3",
    paths: {
      "/skipped": null,
      "/pets": {
        parameters: [{ name: "limit", in: "query" }],
        get: { operationId: "listPets" },
        post: {},
      },
    },
  });
  const SPEC_ID = "_spec1";

  test("a spec without paths gives null", () => {
    expect(findOperation("listPets", { openapi: "3.0.3" } as any)).toBeNull();
  });

  test("an operationId is found, a null path item is skipped", () => {
    const doc = spec();
    expect(findOperation("listPets", doc)).toEqual({
      operation: doc.paths["/pets"].get,
      realOperationId: "listPets",
    });
  });

  test("an operation without operationId is found by its generated id", () => {
    const doc = spec();
    expect(findOperation("post_pets", doc)?.operation).toBe(doc.paths["/pets"].post);
  });

  test("the specId suffix is matched, and realOperationId has no suffix", () => {
    const doc = spec();
    expect(findOperation(`listPets${SPEC_ID}`, doc, SPEC_ID)).toEqual({
      operation: doc.paths["/pets"].get,
      realOperationId: "listPets",
    });
    expect(findOperation("listPets", doc, SPEC_ID)).toBeNull();
  });

  test("an unknown id gives null", () => {
    expect(findOperation("nope", spec())).toBeNull();
  });
});

describe("isValidHttpMethods", () => {
  test.each([
    ["get", true],
    ["post", true],
    ["parameters", false],
    ["x-foo", false],
  ])("%s is %p", (method, expected) => {
    expect(isValidHttpMethods(method)).toBe(expected);
  });
});

describe("appendTags", () => {
  const TAG = "pets";

  test("creates tags on the spec and on operations with and without existing tags", () => {
    const doc: any = oas3Doc({
      paths: {
        "/a": { get: {}, post: { tags: ["other"] } },
      },
    });
    appendTags(doc, TAG);
    expect(doc.tags).toEqual([{ name: TAG }]);
    expect(doc.paths["/a"].get.tags).toEqual([TAG]);
    expect(doc.paths["/a"].post.tags).toEqual(["other", TAG]);
  });

  test("does not duplicate an existing tag, and appends to existing spec tags", () => {
    const doc: any = oas3Doc({
      tags: [{ name: "other" }],
      paths: { "/a": { get: { tags: [TAG] } } },
    });
    appendTags(doc, TAG);
    appendTags(doc, TAG);
    expect(doc.tags).toEqual([{ name: "other" }, { name: TAG }]);
    expect(doc.paths["/a"].get.tags).toEqual([TAG]);
  });

  test("only HTTP-method keys are traversed", () => {
    const parameters = [{ name: "limit", in: "query" }];
    const extension = { note: "x" };
    const doc: any = oas3Doc({ paths: { "/a": { parameters, "x-foo": extension, summary: "s", get: {} } } });
    appendTags(doc, TAG);
    expect(doc.paths["/a"].parameters).toBe(parameters);
    expect(doc.paths["/a"]["x-foo"]).toEqual({ note: "x" });
    expect(doc.paths["/a"].get.tags).toEqual([TAG]);
  });
});

describe("replaceServersUrl", () => {
  const NEW_URL = "https://new.example.com/v1";
  const OLD_URL = "https://old.example.com";

  test("root servers are replaced; a server with no url is left alone", () => {
    const noUrl = { description: "no url" };
    const doc: any = oas3Doc({ servers: [{ url: OLD_URL, description: "d" }, noUrl] });
    replaceServersUrl(doc, NEW_URL);
    expect(doc.servers).toEqual([{ url: NEW_URL, description: "d" }, { description: "no url" }]);
    expect(doc.servers[1]).not.toHaveProperty("url");
  });

  test("missing root servers get created", () => {
    const doc: any = oas3Doc();
    replaceServersUrl(doc, NEW_URL);
    expect(doc.servers).toEqual([{ url: NEW_URL }]);
  });

  test("path-level and operation-level servers are replaced; a null path item is skipped", () => {
    const doc: any = oas3Doc({
      paths: {
        "/null": null,
        "/a": {
          servers: [{ url: OLD_URL }],
          get: { servers: [{ url: OLD_URL }] },
          post: {},
          "x-foo": { servers: [{ url: OLD_URL }] },
        },
      },
    });
    replaceServersUrl(doc, NEW_URL);
    expect(doc.paths["/null"]).toBeNull();
    expect(doc.paths["/a"].servers).toEqual([{ url: NEW_URL }]);
    expect(doc.paths["/a"].get.servers).toEqual([{ url: NEW_URL }]);
    expect(doc.paths["/a"].post).toEqual({});
    expect(doc.paths["/a"]["x-foo"].servers).toEqual([{ url: OLD_URL }]);
  });
});

describe("getSchemaType", () => {
  test("a $ref or no schema gives undefined; otherwise the type", () => {
    expect(getSchemaType(undefined)).toBeUndefined();
    expect(getSchemaType(REF_SCHEMA)).toBeUndefined();
    expect(getSchemaType({ type: "integer" })).toBe("integer");
  });
});

describe("getSchemaExample (further cases)", () => {
  test("a $ref and a readOnly schema give undefined", () => {
    expect(getSchemaExample(REF_SCHEMA)).toBeUndefined();
    expect(getSchemaExample({ type: "string", readOnly: true, default: "x" })).toBeUndefined();
  });

  test("default wins over example, example over the first enum value, enum over type", () => {
    expect(getSchemaExample({ type: "string", default: "d", example: "e", enum: ["n"] })).toBe("d");
    expect(getSchemaExample({ type: "string", example: "e", enum: ["n"] })).toBe("e");
    expect(getSchemaExample({ type: "string", enum: ["first", "second"] })).toBe("first");
  });

  test("precedence also holds when the lower-priority value is falsy", () => {
    expect(getSchemaExample({ type: "string", default: "d", example: "" })).toBe("d");
    expect(getSchemaExample({ type: "integer", default: 5, example: 0 })).toBe(5);
    expect(getSchemaExample({ type: "string", example: "e", enum: [""] })).toBe("e");
    expect(getSchemaExample({ type: "integer", enum: [0, 1] })).toBe(0);
    expect(getSchemaExample({ type: "string", enum: [] })).toBe("");
  });

  // B29: util.ts:390-394 test default/example by truthiness. Asserts the CORRECT
  // behaviour: the explicit default 0 must win over the example 1. Fails today (returns 1).
  test.failing("B29: a falsy default (0) still wins over example", () => {
    expect(getSchemaExample({ type: "integer", default: 0, example: 1 })).toBe(0);
  });

  test("a plain string gives an empty string", () => {
    expect(getSchemaExample({ type: "string" })).toBe("");
  });

  test("an array of strings gives [''] and an array of $ref items gives []", () => {
    expect(getSchemaExample({ type: "array", items: { type: "string" } })).toEqual([""]);
    expect(getSchemaExample({ type: "array", items: REF_SCHEMA } as any)).toEqual([]);
  });

  test("oneOf and anyOf take the first member", () => {
    expect(getSchemaExample({ oneOf: [{ example: 1 }, { example: 2 }] } as any)).toBe(1);
    expect(getSchemaExample({ anyOf: [{ example: "a" }, { example: "b" }] } as any)).toBe("a");
  });

  test("allOf merges the member examples", () => {
    expect(
      getSchemaExample({
        allOf: [
          { type: "object", properties: { a: { example: 1 } } },
          { type: "object", properties: { b: { default: 2 } } },
        ],
      } as any)
    ).toEqual({ a: 1, b: 2 });
  });

  test("nested properties recurse", () => {
    expect(
      getSchemaExample({
        type: "object",
        properties: { outer: { type: "object", properties: { inner: { type: "string" } } } },
      })
    ).toEqual({ outer: { inner: "" } });
  });

  test("an empty schema gives undefined", () => {
    expect(getSchemaExample({})).toBeUndefined();
  });
});

// parse.ts dereferences with circular:true, so a recursive schema reaches getSchemaExample as an object cycle.
const selfReferencingSchema = () => {
  const node: any = { type: "object", properties: {} };
  node.properties.children = { type: "array", items: node };
  return node;
};

// Limit of test.failing: it passes on ANY failure, so the two B19 cases below cannot by themselves prove the
// failure is the recursive RangeError. That the failure is "RangeError: Maximum call stack size exceeded" at
// util.ts:426 (the recursive getSchemaExample call) was observed by converting each case to a plain test in a
// scratch copy; Correct behaviour
// is asserted, never the buggy one.
test.failing("B19: getSchemaExample terminates on a self-referencing schema", () => {
  expect(() => getSchemaExample(selfReferencingSchema())).not.toThrow();
});

test.failing("B19: parseOpenApi resolves for a spec with a self-referencing schema", async () => {
  const spec = oas3Doc({
    info: { title: "t", version: "1" },
    paths: {
      "/nodes": {
        post: {
          operationId: "createNode",
          requestBody: {
            content: { [MediaTypeJson]: { schema: { $ref: "#/components/schemas/Node" } } },
          },
          responses: { "200": { description: "ok" } },
        },
      },
    },
    components: {
      schemas: {
        Node: {
          type: "object",
          properties: { children: { type: "array", items: { $ref: "#/components/schemas/Node" } } },
        },
      },
    },
  });
  await expect(parseOpenApi(spec)).resolves.toBeDefined();
});

describe("parseUrl (further cases)", () => {
  test("a non-http URL throws 'invalid http url'", () => {
    expect(() => parseUrl("ftp://h/p")).toThrow("invalid http url");
  });

  test("http://h:8/p gives host h:8, pathname /p and schema http", () => {
    expect(parseUrl("http://h:8/p")).toEqual({ host: "h:8", pathname: "/p", schema: "http" });
  });

  test("a target that starts with http but has no protocol falls back to schema https", () => {
    expect(parseUrl("httpfoo").schema).toBe("https");
  });
});

describe("mergeCategories and appendCategories", () => {
  const cat = (value: string, label = value) => ({ value, label });

  test("mergeCategories dedupes by value and does not mutate its inputs", () => {
    const a = [cat("x"), cat("y")];
    const b = [cat("y", "other label"), cat("z")];
    const merged = mergeCategories(a, b);
    expect(merged).toEqual([cat("x"), cat("y"), cat("z")]);
    expect(a).toEqual([cat("x"), cat("y")]);
    expect(b).toEqual([cat("y", "other label"), cat("z")]);
  });

  test("appendCategories dedupes by value and mutates its first argument", () => {
    const a = [cat("x")];
    const b = [cat("x", "dup"), cat("z")];
    const returned = appendCategories(a, b);
    expect(returned).toBeUndefined();
    expect(a).toEqual([cat("x"), cat("z")]);
    expect(b).toEqual([cat("x", "dup"), cat("z")]);
  });
});

describe("getOperationId", () => {
  const SPEC_ID = "_s1";

  test("an explicit id is returned with and without the specId suffix", () => {
    expect(getOperationId({ operationId: "listPets" } as any, "/pets", "get")).toBe("listPets");
    expect(getOperationId({ operationId: "listPets" } as any, "/pets", "get", SPEC_ID)).toBe(`listPets${SPEC_ID}`);
  });

  test("a missing id is generated from method and path", () => {
    expect(getOperationId({} as any, "/pets/{id}", "get")).toBe("get_pets__id_");
    expect(getOperationId({} as any, "/pets/{id}", "get", SPEC_ID)).toBe(`get_pets__id_${SPEC_ID}`);
  });
});
