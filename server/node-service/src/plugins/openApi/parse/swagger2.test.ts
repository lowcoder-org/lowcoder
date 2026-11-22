import { OpenAPIV2 } from "openapi-types";
import { parseOperation } from "./swagger2";
import { ConfigKeySplit } from "../util";

const POSITION_QUERY = "query";
const POSITION_PATH = "path";
const POSITION_BODY = "body";
const POSITION_FORM = "formData";
const JSON_INDENT = 4;

type ParamSpec = Record<string, any>;

const operationOf = (parameters?: ParamSpec[]) =>
  ({ parameters, responses: {} } as unknown as OpenAPIV2.OperationObject);
const pathItemOf = (parameters?: ParamSpec[]) => ({ parameters } as unknown as OpenAPIV2.PathItemObject);
const parseParams = (parameters: ParamSpec[], pathParameters?: ParamSpec[]) =>
  parseOperation(operationOf(parameters), pathItemOf(pathParameters)) as any[];
const keyOf = (position: string, name: string) => `${position}${ConfigKeySplit}${name}`;

describe("swagger2 parseOperation", () => {
  let warnSpy: jest.SpyInstance;
  beforeEach(() => {
    warnSpy = jest.spyOn(console, "warn").mockImplementation(() => undefined);
  });
  afterEach(() => {
    warnSpy.mockRestore();
  });

  test("an operation and a path item without parameters give no params", () => {
    expect(parseOperation(operationOf(), pathItemOf())).toEqual([]);
  });

  describe("type map", () => {
    test.each([
      ["integer", "numberInput"],
      ["number", "numberInput"],
      ["boolean", "booleanInput"],
      ["string", "textInput"],
      ["object", "jsonInput"],
      ["file", "file"],
    ])("type %s becomes %s and the whole config is exact", (specType, expectedType) => {
      const params = parseParams([
        { name: "p", in: POSITION_FORM, type: specType, description: "desc" },
      ]);
      expect(params).toEqual([
        {
          label: "p",
          tooltip: "desc",
          defaultValue: undefined,
          options: [],
          type: expectedType,
          key: keyOf(POSITION_FORM, "p"),
        },
      ]);
    });

    test("an unknown type becomes jsonInput", () => {
      const [param] = parseParams([{ name: "p", in: POSITION_QUERY, type: "mystery" }]);
      expect(param.type).toBe("jsonInput");
    });

    test("a parameter with neither type nor schema becomes jsonInput", () => {
      const [param] = parseParams([{ name: "p", in: POSITION_QUERY }]);
      expect(param.type).toBe("jsonInput");
      expect(param.defaultValue).toBeUndefined();
    });

    test("schema.type is used when type is absent and the schema supplies the default", () => {
      const [stringBody] = parseParams([
        { name: "s", in: POSITION_BODY, schema: { type: "string" } },
      ]);
      expect(stringBody.type).toBe("textInput");
      expect(stringBody.defaultValue).toBe("");

      const [numberBody] = parseParams([
        { name: "n", in: POSITION_BODY, schema: { type: "integer", default: 5 } },
      ]);
      expect(numberBody.type).toBe("numberInput");
      expect(numberBody.defaultValue).toBe(5);
    });
  });

  describe("array parameters", () => {
    test("an array in the query is a textInput", () => {
      const [param] = parseParams([
        { name: "tags", in: POSITION_QUERY, type: "array", items: { type: "string" } },
      ]);
      expect(param.type).toBe("textInput");
      expect(param.options).toEqual([]);
    });

    test("an array outside the query is a jsonInput", () => {
      const [param] = parseParams([
        { name: "tags", in: POSITION_FORM, type: "array", items: { type: "string" } },
      ]);
      expect(param.type).toBe("jsonInput");
    });

    test("an array with items.enum is a select with options and the items default", () => {
      const [param] = parseParams([
        {
          name: "status",
          in: POSITION_QUERY,
          type: "array",
          items: { type: "string", enum: ["available", "sold"], default: "available" },
        },
      ]);
      expect(param).toEqual({
        label: "status",
        tooltip: undefined,
        defaultValue: "available",
        options: [
          { label: "available", value: "available" },
          { label: "sold", value: "sold" },
        ],
        type: "select",
        key: keyOf(POSITION_QUERY, "status"),
      });
    });

    test("an array with a $ref items object contributes no options and stays a query textInput", () => {
      const [param] = parseParams([
        { name: "refs", in: POSITION_QUERY, type: "array", items: { $ref: "#/definitions/X" } },
      ]);
      expect(param.type).toBe("textInput");
      expect(param.options).toEqual([]);
    });
  });

  describe("defaults and options", () => {
    test("an object schema default is stringified", () => {
      const [param] = parseParams([
        {
          name: "body",
          in: POSITION_BODY,
          schema: {
            type: "object",
            properties: { id: { type: "integer", default: 1 }, name: { type: "string" } },
          },
        },
      ]);
      expect(param.type).toBe("jsonInput");
      expect(param.defaultValue).toBe(JSON.stringify({ id: 1, name: "" }, null, JSON_INDENT));
    });

    test("an array schema default is stringified", () => {
      const [param] = parseParams([
        {
          name: "body",
          in: POSITION_BODY,
          schema: { type: "array", items: { type: "string", default: "x" } },
        },
      ]);
      expect(param.type).toBe("jsonInput");
      expect(param.defaultValue).toBe(JSON.stringify(["x"], null, JSON_INDENT));
    });

    test("a parameter enum becomes string options", () => {
      const [param] = parseParams([
        { name: "level", in: POSITION_QUERY, type: "integer", enum: [1, 2, 3] },
      ]);
      expect(param.options).toEqual([
        { label: "1", value: "1" },
        { label: "2", value: "2" },
        { label: "3", value: "3" },
      ]);
    });

    test("items.enum wins over a parameter enum", () => {
      const [param] = parseParams([
        {
          name: "x",
          in: POSITION_QUERY,
          type: "array",
          enum: ["ignored"],
          items: { type: "string", enum: ["a"] },
        },
      ]);
      expect(param.options).toEqual([{ label: "a", value: "a" }]);
    });
  });

  describe("parameter sources", () => {
    test("a $ref parameter is skipped with a warning and the others are kept", () => {
      const refParam = { $ref: "#/parameters/Shared" };
      const params = parseParams([refParam, { name: "kept", in: POSITION_QUERY, type: "string" }]);
      expect(params.map((p) => p.key)).toEqual([keyOf(POSITION_QUERY, "kept")]);
      expect(warnSpy).toHaveBeenCalledWith("unexpected ref parameters:", refParam);
    });

    test("path-level parameters come before operation-level parameters", () => {
      const params = parseParams(
        [{ name: "opParam", in: POSITION_QUERY, type: "string" }],
        [{ name: "pathParam", in: POSITION_PATH, type: "integer" }]
      );
      expect(params.map((p) => [p.key, p.type])).toEqual([
        [keyOf(POSITION_PATH, "pathParam"), "numberInput"],
        [keyOf(POSITION_QUERY, "opParam"), "textInput"],
      ]);
    });
  });
});
