import { OpenAPIV3 } from "openapi-types";
import { parseOperation } from "./oas3";
import {
  ConfigKeySplit,
  MediaTypeJson,
  MediaTypeMultiPartFormData,
  MediaTypeUrlEncoded,
} from "../util";

const POSITION_QUERY = "query";
const POSITION_PATH = "path";
const POSITION_BODY = "body";
const JSON_INDENT = 4;
const EMPTY_OPTION = { label: "", value: "" };

type Json = Record<string, any>;

const keyOf = (position: string, name: string) => `${position}${ConfigKeySplit}${name}`;
const operationOf = (op: Json = {}) => op as OpenAPIV3.OperationObject;
const pathItemOf = (item: Json = {}) => item as OpenAPIV3.PathItemObject;
const queryParam = (name: string, schema?: Json, extra: Json = {}) => ({
  name,
  in: POSITION_QUERY,
  ...(schema ? { schema } : {}),
  ...extra,
});
const parseQuery = (schema?: Json, extra: Json = {}) =>
  parseOperation(operationOf({ parameters: [queryParam("p", schema, extra)] }), pathItemOf())[0] as any;
const parseBody = (content: Json) =>
  parseOperation(operationOf({ requestBody: { content } }), pathItemOf()) as any[];
const stringify = (value: unknown) => JSON.stringify(value, null, JSON_INDENT);

describe("oas3 parseOperation", () => {
  let warnSpy: jest.SpyInstance;
  beforeEach(() => {
    warnSpy = jest.spyOn(console, "warn").mockImplementation(() => undefined);
  });
  afterEach(() => {
    warnSpy.mockRestore();
  });

  describe("inputs", () => {
    test("no operation gives an empty list", () => {
      expect(parseOperation(undefined, pathItemOf())).toEqual([]);
    });

    test("no path item gives an empty list", () => {
      expect(parseOperation(operationOf(), undefined)).toEqual([]);
    });

    test("an operation without parameters or body gives an empty list", () => {
      expect(parseOperation(operationOf(), pathItemOf())).toEqual([]);
    });

    test("path-level parameters come first, then operation-level ones", () => {
      const params = parseOperation(
        operationOf({ parameters: [queryParam("opParam", { type: "string" })] }),
        pathItemOf({
          parameters: [{ name: "pathParam", in: POSITION_PATH, schema: { type: "integer" } }],
        })
      );
      expect(params.map((p) => [p.key, p.type])).toEqual([
        [keyOf(POSITION_PATH, "pathParam"), "numberInput"],
        [keyOf(POSITION_QUERY, "opParam"), "textInput"],
      ]);
    });

    test("a $ref parameter is skipped with a warning and the others are kept", () => {
      const refParam = { $ref: "#/components/parameters/Shared" };
      const params = parseOperation(
        operationOf({ parameters: [refParam, queryParam("kept", { type: "string" })] }),
        pathItemOf()
      );
      expect(params.map((p) => p.key)).toEqual([keyOf(POSITION_QUERY, "kept")]);
      expect(warnSpy).toHaveBeenCalledWith("unexpected ref parameters:", refParam);
    });

    test("the parameter description is the tooltip and falls back to the schema description", () => {
      const withDesc = parseQuery({ type: "string", description: "from schema" }, { description: "from param" });
      expect(withDesc.tooltip).toBe("from param");
      const withoutDesc = parseQuery({ type: "string", description: "from schema" });
      expect(withoutDesc.tooltip).toBe("from schema");
    });
  });

  describe("parameter without a schema", () => {
    test("becomes an exact textInput with an empty default", () => {
      expect(parseQuery(undefined, { description: "plain" })).toEqual({
        label: "p",
        tooltip: "plain",
        options: [],
        type: "textInput",
        defaultValue: "",
        key: keyOf(POSITION_QUERY, "p"),
      });
    });
  });

  describe("type mapping", () => {
    test("boolean gives booleanInput", () => {
      expect(parseQuery({ type: "boolean", default: true })).toMatchObject({
        type: "booleanInput",
        defaultValue: true,
        options: [],
      });
    });

    test.each(["integer", "number"])("%s gives numberInput", (type) => {
      expect(parseQuery({ type, default: 7 })).toMatchObject({
        type: "numberInput",
        defaultValue: 7,
        options: [],
      });
    });

    test("string gives textInput with the empty-string example as default", () => {
      expect(parseQuery({ type: "string" })).toMatchObject({
        type: "textInput",
        defaultValue: "",
        options: [],
      });
    });

    test("string with enum gives select, options as strings and a trailing empty option", () => {
      expect(parseQuery({ type: "string", enum: ["a", "b"] })).toMatchObject({
        type: "select",
        defaultValue: "a",
        options: [
          { label: "a", value: "a" },
          { label: "b", value: "b" },
          EMPTY_OPTION,
        ],
      });
    });

    test("string with enum that already contains an empty string gets no second empty option", () => {
      const param = parseQuery({ type: "string", enum: ["a", "", "b"] });
      expect(param.type).toBe("select");
      expect(param.options).toEqual([
        { label: "a", value: "a" },
        EMPTY_OPTION,
        { label: "b", value: "b" },
      ]);
    });

    test("an array gives jsonInput with a stringified default", () => {
      expect(parseQuery({ type: "array", items: { type: "string", default: "x" } })).toMatchObject({
        type: "jsonInput",
        defaultValue: stringify(["x"]),
        options: [],
      });
    });

    test("an object gives jsonInput with a stringified default", () => {
      const param = parseQuery({
        type: "object",
        properties: { id: { type: "integer", default: 1 }, label: { type: "string" } },
      });
      expect(param.type).toBe("jsonInput");
      expect(param.defaultValue).toBe(stringify({ id: 1, label: "" }));
    });

    test("an object without a default and without properties has an undefined default", () => {
      const param = parseQuery({ type: "object" });
      expect(param.type).toBe("jsonInput");
      expect(param.defaultValue).toBeUndefined();
    });

    test("format binary gives file", () => {
      expect(parseQuery({ type: "string", format: "binary" })).toMatchObject({
        type: "file",
        defaultValue: "",
      });
    });

    test("an unknown type gives textInput", () => {
      expect(parseQuery({ type: "mystery" })).toMatchObject({ type: "textInput", options: [] });
    });

    test("a missing type defaults to array, so the parameter is a jsonInput", () => {
      const param = parseQuery({ description: "typeless" });
      expect(param.type).toBe("jsonInput");
      expect(param.tooltip).toBe("typeless");
      expect(param.defaultValue).toBeUndefined();
    });
  });

  describe("request body", () => {
    test("a $ref request body adds nothing and warns", () => {
      const operation = operationOf({ requestBody: { $ref: "#/components/requestBodies/Shared" } });
      expect(parseOperation(operation, pathItemOf())).toEqual([]);
      expect(warnSpy).toHaveBeenCalledWith("unexpected requestBody of operation:", operation);
    });

    test("empty content adds nothing", () => {
      expect(parseBody({})).toEqual([]);
    });

    test("a $ref schema adds nothing and warns", () => {
      const schema = { $ref: "#/components/schemas/Pet" };
      expect(parseBody({ [MediaTypeJson]: { schema } })).toEqual([]);
      expect(warnSpy).toHaveBeenCalledWith("unexpected schema:", schema);
    });

    test("a media type without a schema adds nothing", () => {
      expect(parseBody({ [MediaTypeJson]: {} })).toEqual([]);
    });

    test("a JSON body gives a single body param", () => {
      expect(
        parseBody({
          [MediaTypeJson]: { schema: { type: "object", properties: { name: { type: "string" } } } },
        })
      ).toEqual([
        {
          label: "body",
          tooltip: undefined,
          options: [],
          type: "jsonInput",
          defaultValue: stringify({ name: "" }),
          key: keyOf(POSITION_BODY, "body"),
        },
      ]);
    });

    test("the first media type is the one used", () => {
      const params = parseBody({
        [MediaTypeJson]: { schema: { type: "object", properties: { a: { type: "string" } } } },
        [MediaTypeUrlEncoded]: { schema: { type: "object", properties: { b: { type: "string" } } } },
      });
      expect(params.map((p) => p.key)).toEqual([keyOf(POSITION_BODY, "body")]);
    });

    test("the media type example wins over the schema example", () => {
      const [param] = parseBody({
        [MediaTypeJson]: {
          example: { name: "from-example" },
          schema: { type: "object", properties: { name: { type: "string", default: "from-schema" } } },
        },
      });
      expect(param.defaultValue).toBe(stringify({ name: "from-example" }));
    });

    test("a falsy body example falls back to the generated value (intended truthiness)", () => {
      expect(
        parseBody({ [MediaTypeJson]: { example: 0, schema: { type: "integer", default: 7 } } })[0].defaultValue
      ).toBe(7);
      expect(
        parseBody({
          [MediaTypeUrlEncoded]: {
            example: { prop: 0 },
            schema: { type: "object", properties: { prop: { type: "integer", default: 7 } } },
          },
        })[0].defaultValue
      ).toBe(7);
      expect(
        parseBody({
          [MediaTypeJson]: { example: 0, examples: { a: { value: 5 } }, schema: { type: "integer" } },
        })[0].defaultValue
      ).toBe(5);
      expect(
        parseBody({
          [MediaTypeJson]: { examples: { a: { value: 0 } }, schema: { type: "integer", default: 7 } },
        })[0].defaultValue
      ).toBe(7);
    });

    test("without example the first examples value is used", () => {
      const [param] = parseBody({
        [MediaTypeJson]: {
          examples: {
            first: { value: { name: "first" } },
            second: { value: { name: "second" } },
          },
          schema: { type: "object" },
        },
      });
      expect(param.defaultValue).toBe(stringify({ name: "first" }));
    });

    test("a $ref in examples is ignored and the schema example is used", () => {
      const [param] = parseBody({
        [MediaTypeJson]: {
          examples: { first: { $ref: "#/components/examples/E" } },
          schema: { type: "string", default: "from-schema" },
        },
      });
      expect(param.defaultValue).toBe("from-schema");
    });

    test.each([
      ["urlencoded", MediaTypeUrlEncoded],
      ["multipart", MediaTypeMultiPartFormData],
    ])(
      "%s with properties gives one param per property, skipping readOnly and $ref ones",
      (_name, mediaType) => {
        const params = parseBody({
          [mediaType]: {
            example: { name: "Rex", count: 3 },
            schema: {
              type: "object",
              properties: {
                id: { type: "integer", readOnly: true },
                owner: { $ref: "#/components/schemas/Owner" },
                name: { type: "string", default: "schema-default" },
                count: { type: "integer" },
                kind: { type: "string", enum: ["dog", "cat"] },
                upload: { type: "string", format: "binary" },
              },
            },
          },
        });
        expect(params).toEqual([
          {
            label: "name",
            tooltip: undefined,
            options: [],
            type: "textInput",
            defaultValue: "Rex",
            key: keyOf(POSITION_BODY, "name"),
          },
          {
            label: "count",
            tooltip: undefined,
            options: [],
            type: "numberInput",
            defaultValue: 3,
            key: keyOf(POSITION_BODY, "count"),
          },
          {
            label: "kind",
            tooltip: undefined,
            options: [
              { label: "dog", value: "dog" },
              { label: "cat", value: "cat" },
              EMPTY_OPTION,
            ],
            type: "select",
            defaultValue: "dog",
            key: keyOf(POSITION_BODY, "kind"),
          },
          {
            label: "upload",
            tooltip: undefined,
            options: [],
            type: "file",
            defaultValue: "",
            key: keyOf(POSITION_BODY, "upload"),
          },
        ]);
        expect(warnSpy).toHaveBeenCalledWith("unexpected propSchema:", {
          $ref: "#/components/schemas/Owner",
        });
      }
    );

    test("a form property whose schema is null is skipped", () => {
      const params = parseBody({
        [MediaTypeUrlEncoded]: {
          schema: { type: "object", properties: { empty: null, name: { type: "string" } } },
        },
      });
      expect(params.map((p) => p.key)).toEqual([keyOf(POSITION_BODY, "name")]);
    });

    test("a form media type whose schema has no properties falls back to a single body param", () => {
      const params = parseBody({
        [MediaTypeUrlEncoded]: { schema: { type: "string", default: "raw" } },
      });
      expect(params).toEqual([
        {
          label: "body",
          tooltip: undefined,
          options: [],
          type: "textInput",
          defaultValue: "raw",
          key: keyOf(POSITION_BODY, "body"),
        },
      ]);
    });

    test("a binary octet-stream body gives a single file param", () => {
      const params = parseBody({
        "application/octet-stream": { schema: { type: "string", format: "binary" } },
      });
      expect(params).toEqual([
        {
          label: "body",
          tooltip: undefined,
          options: [],
          type: "file",
          defaultValue: "",
          key: keyOf(POSITION_BODY, "body"),
        },
      ]);
    });
  });
});
