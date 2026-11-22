import fs from "fs";
import os from "os";
import path from "path";
import {
  dirToSpecList,
  kvToRecord,
  readYaml,
  safeJsonParse,
  safeJsonStringify,
  specsToOptions,
  toBoolean,
  toNumber,
  toString,
  version2spec,
} from "./util";

describe('version2spec', () => {
  test('should return the spec for the given version', () => {
    const specs = {
      v1: 'spec for version 1',
      v2: 'spec for version 2',
      v3: 'spec for version 3'
    };

    expect(version2spec(specs, 'v2')).toBe('spec for version 2');
  });

  test('should return the first spec if version is undefined', () => {
    const specs = {
      v1: 'spec for version 1',
      v2: 'spec for version 2',
      v3: 'spec for version 3'
    };

    expect(version2spec(specs, undefined)).toBe('spec for version 1');
  });

  test('should return the first spec if version is an empty string', () => {
    const specs = {
      v1: 'spec for version 1',
      v2: 'spec for version 2',
      v3: 'spec for version 3'
    };

    expect(version2spec(specs, "")).toBe('spec for version 1');
  });

  test('should return undefined if specs is an empty object and version is undefined', () => {
    const specs = {};

    expect(version2spec(specs, undefined)).toBeUndefined();
  });

  test('should return undefined if specs is an empty object and version is an empty string', () => {
    const specs = {};

    expect(version2spec(specs, "")).toBeUndefined();
  });

  test('should return undefined if the specified version does not exist in specs', () => {
    const specs = {
      v1: 'spec for version 1',
      v2: 'spec for version 2',
      v3: 'spec for version 3'
    };

    expect(version2spec(specs, 'v4')).toBeUndefined();
  });
});

describe('specsToOptions', () => {
  test('should convert specs object to options array', () => {
    const specs = {
      color: 'red',
      size: 'large',
      weight: 'light'
    };

    const expectedOptions = [
      { value: 'color', label: 'color' },
      { value: 'size', label: 'size' },
      { value: 'weight', label: 'weight' }
    ];

    expect(specsToOptions(specs)).toEqual(expectedOptions);
  });

  test('should return an empty array if specs object is empty', () => {
    const specs = {};
    const expectedOptions: any[] = [];

    expect(specsToOptions(specs)).toEqual(expectedOptions);
  });

  test('should handle specs object with non-string values', () => {
    const specs = {
      color: 'red',
      size: 42,
      available: true
    };

    const expectedOptions = [
      { value: 'color', label: 'color' },
      { value: 'size', label: 'size' },
      { value: 'available', label: 'available' }
    ];

    expect(specsToOptions(specs)).toEqual(expectedOptions);
  });

  test('should handle specs object with numeric keys', () => {
    const specs = {
      1: 'one',
      2: 'two',
      3: 'three'
    };

    const expectedOptions = [
      { value: '1', label: '1' },
      { value: '2', label: '2' },
      { value: '3', label: '3' }
    ];

    expect(specsToOptions(specs)).toEqual(expectedOptions);
  });
});

describe("kvToRecord", () => {
  const kvs = [
    { key: "a", value: "1" },
    { key: "empty", value: "" },
    { key: "b", value: "2" },
  ];

  test("drops empty values by default", () => {
    expect(kvToRecord(kvs)).toEqual({ a: "1", b: "2" });
  });

  test("keeps empty values with trimEmpty=false", () => {
    expect(kvToRecord(kvs, false)).toEqual({ a: "1", empty: "", b: "2" });
  });

  test("null and undefined input give {}", () => {
    expect(kvToRecord(null as any)).toEqual({});
    expect(kvToRecord(undefined as any)).toEqual({});
  });

  test("a later duplicate key wins", () => {
    expect(kvToRecord([{ key: "k", value: "1" }, { key: "k", value: "2" }])).toEqual({ k: "2" });
  });

  test("keeps 0, false, NaN, whitespace, objects and arrays; drops only undefined, null and empty string", () => {
    const mixed: { key: string; value: unknown }[] = [
      { key: "zero", value: 0 }, { key: "no", value: false }, { key: "nan", value: NaN }, { key: "ws", value: " " },
      { key: "obj", value: { a: 1 } }, { key: "arr", value: [] },
      { key: "u", value: undefined }, { key: "n", value: null }, { key: "e", value: "" },
    ];
    const result = kvToRecord(mixed);
    // toEqual ignores keys whose value is undefined, so the key list is checked separately
    expect(Object.keys(result).sort()).toEqual(["arr", "nan", "no", "obj", "ws", "zero"]);
    expect(result).toEqual({ zero: 0, no: false, nan: NaN, ws: " ", obj: { a: 1 }, arr: [] });
    expect(Object.keys(kvToRecord(mixed, false)).sort()).toEqual(["arr", "e", "n", "nan", "no", "obj", "u", "ws", "zero"]);
  });

  test("a later empty duplicate does not erase an earlier value; a later 0 or false replaces it", () => {
    expect(kvToRecord([{ key: "k", value: "first" }, { key: "k", value: "" }])).toEqual({ k: "first" });
    expect(kvToRecord<unknown>([{ key: "k", value: "first" }, { key: "k", value: 0 }])).toEqual({ k: 0 });
    expect(kvToRecord<unknown>([{ key: "k", value: "first" }, { key: "k", value: false }])).toEqual({ k: false });
  });
});

describe("toString", () => {
  test("undefined and null give an empty string", () => {
    expect(toString(undefined)).toBe("");
    expect(toString(null)).toBe("");
  });

  test("a string is returned as is", () => {
    expect(toString("abc")).toBe("abc");
  });

  test("a Date gives its ISO string", () => {
    expect(toString(new Date(0))).toBe("1970-01-01T00:00:00.000Z");
  });

  test("a RegExp gives its source form", () => {
    expect(toString(/ab+c/gi)).toBe("/ab+c/gi");
  });

  test("numbers, booleans and plain objects are JSON", () => {
    expect(toString(5)).toBe("5");
    expect(toString(false)).toBe("false");
    expect(toString({ a: [1, 2] })).toBe('{"a":[1,2]}');
  });

  test("bigint values serialize as strings, at top level and nested", () => {
    expect(toString(BigInt(10))).toBe('"10"');
    expect(toString({ a: BigInt(1), b: { c: BigInt(2) } })).toBe('{"a":"1","b":{"c":"2"}}');
  });
});

afterEach(() => {
  jest.restoreAllMocks(); // console spies are restored even when an assertion failed
});

describe("toNumber", () => {
  test.each([[""], [null], [undefined], ["abc"], [NaN]])("%p gives 0", (v) => {
    expect(toNumber(v)).toBe(0);
  });

  test("numbers and numeric strings convert", () => {
    expect(toNumber("1.5")).toBe(1.5);
    expect(toNumber(7)).toBe(7);
    expect(toNumber("-3")).toBe(-3);
  });

  test('the string "Infinity" is not finite and gives 0', () => {
    expect(toNumber("Infinity")).toBe(0);
  });

  test("B27: toNumber(Infinity) is 0", () => {
    expect(toNumber(Infinity)).toBe(0);
  });

  test("-Infinity gives 0 and the largest finite number is kept", () => {
    expect(toNumber(-Infinity)).toBe(0);
    expect(toNumber(Number.MAX_VALUE)).toBe(Number.MAX_VALUE);
  });
});

describe("toBoolean", () => {
  test.each([["0"], ["false"], [""], [0], [null], [undefined]])("%p is false", (v) => {
    expect(toBoolean(v)).toBe(false);
  });

  test.each([["true"], [1], ["1"], ["yes"], [{}]])("%p is true", (v) => {
    expect(toBoolean(v)).toBe(true);
  });
});

describe("readYaml and dirToSpecList (temp files)", () => {
  let dir: string;
  beforeEach(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), "util-yaml-"));
  });
  afterEach(() => {
    fs.rmSync(dir, { recursive: true, force: true });
  });

  test("a missing file gives {} and logs it", () => {
    const info = jest.spyOn(console, "info").mockImplementation(() => undefined); // log sink only
    expect(readYaml(path.join(dir, "missing.yaml"))).toEqual({});
    expect(info).toHaveBeenCalledWith("invalid yaml:", expect.objectContaining({ code: "ENOENT" }));
  });

  test("a valid YAML file is parsed", () => {
    const file = path.join(dir, "ok.yaml");
    fs.writeFileSync(file, "name: x\nlist:\n  - 1\n  - 2\n");
    expect(readYaml(file)).toEqual({ name: "x", list: [1, 2] });
  });

  test("invalid YAML gives {}", () => {
    const info = jest.spyOn(console, "info").mockImplementation(() => undefined); // log sink only
    const file = path.join(dir, "bad.yaml");
    fs.writeFileSync(file, "a: [unclosed\n");
    expect(readYaml(file)).toEqual({});
    expect(info).toHaveBeenCalledTimes(1);
  });

  test("dirToSpecList builds one item per file with a tag from the file name, and tags every operation", () => {
    const spec = "openapi: 3.0.0\npaths:\n  /p:\n    get:\n      operationId: getP\n";
    fs.writeFileSync(path.join(dir, "twilio_api_v2010.yaml"), spec);
    fs.writeFileSync(path.join(dir, "plain_name.json"), spec);

    const list = dirToSpecList(dir).sort((x, y) => x.id.localeCompare(y.id));

    expect(list.map((i) => i.id)).toEqual(["Api(v2010)", "PlainName"]);
    expect((list[0].spec as any).tags).toEqual([{ name: "Api(v2010)" }]);
    expect((list[0].spec as any).paths["/p"].get.tags).toEqual(["Api(v2010)"]);
  });
});

describe("safeJsonParse", () => {
  test("valid JSON is parsed", () => {
    expect(safeJsonParse('{"a":1}')).toEqual({ a: 1 });
  });

  test("invalid JSON gives {} and logs the input", () => {
    const warn = jest.spyOn(console, "warn").mockImplementation(() => undefined); // log sink only
    expect(safeJsonParse("{not json")).toEqual({});
    expect(warn).toHaveBeenCalledWith("can not json parse:", "{not json");
  });
});

describe("safeJsonStringify", () => {
  test("null and undefined pass through", () => {
    expect(safeJsonStringify(null)).toBeNull();
    expect(safeJsonStringify(undefined)).toBeUndefined();
  });

  test("an object is pretty-printed with 4 spaces", () => {
    expect(safeJsonStringify({ a: 1 })).toBe('{\n    "a": 1\n}');
  });

  test("a circular object gives null", () => {
    const circular: any = {};
    circular.self = circular;
    const warn = jest.spyOn(console, "warn").mockImplementation(() => undefined); // log sink only
    expect(safeJsonStringify(circular)).toBeNull();
    expect(warn).toHaveBeenCalledTimes(1);
  });
});
