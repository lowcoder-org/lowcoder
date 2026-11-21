import { readdirSync } from "node:fs";
import { expect, test } from "@playwright/test";
import { firstRecordedItem, parseRecordedFile, RECORDED_DSL_DIR, RecordedFixtureError, recordedItem, type RecordedFile } from "../../src/dsl/recorded";

const VALID_RECORDING = {
  ui: {
    layout: { c1: { i: "c1", x: 0, y: 0, w: 6, h: 5, pos: 0 } },
    items: { c1: { compType: "button", name: "button1", comp: { text: "Button" } } },
  },
  hooks: [{ compType: "toast", name: "toast" }],
};

const parse = (value: unknown, compType = "button"): RecordedFile => parseRecordedFile(compType, JSON.stringify(value));

test.describe("recorded fixtures", () => {
  test("a valid recording parses", () => {
    expect(parse(VALID_RECORDING).hooks, "hooks").toHaveLength(1);
    expect(parse({ ui: { layout: [] }, hooks: [] }), "an app without components").toMatchObject({ hooks: [] });
  });

  test("malformed recordings throw RecordedFixtureError naming the file, never a TypeError", () => {
    const malformed: [string, unknown][] = [
      ["null", null],
      ["an array", []],
      ["no ui", { hooks: [] }],
      ["ui is a string", { ui: "x", hooks: [] }],
      ["no layout", { ui: {}, hooks: [] }],
      ["items is an array", { ui: { layout: {}, items: [] }, hooks: [] }],
      ["an item without a comp", { ui: { layout: {}, items: { c1: { compType: "button", name: "b" } } }, hooks: [] }],
      ["an item with a numeric name", { ui: { layout: {}, items: { c1: { compType: "button", name: 1, comp: {} } } }, hooks: [] }],
      ["no hooks", { ui: { layout: {} } }],
      ["hooks is an object", { ui: { layout: {} }, hooks: {} }],
      ["a hook without a name", { ui: { layout: {} }, hooks: [{ compType: "toast" }] }],
    ];
    for (const [description, value] of malformed) {
      expect(() => parse(value), description).toThrow(RecordedFixtureError);
      expect(() => parse(value), `${description}: the message names the file`).toThrow(/button\.json/);
    }
    expect(() => parseRecordedFile("button", "{not json"), "text that is no JSON").toThrow(RecordedFixtureError);
  });

  test("firstRecordedItem refuses an item of another type than the requested one", () => {
    const file = parse(VALID_RECORDING);

    expect(firstRecordedItem("button", file), "the requested type").toMatchObject({ compType: "button", name: "button1", layout: { i: "c1" } });
    expect(() => firstRecordedItem("input", file), "a button recording asked for as an input").toThrow(RecordedFixtureError);
    expect(() => firstRecordedItem("input", file)).toThrow(/holds a button as its first component, not a input/);
  });

  test("firstRecordedItem names a missing item and a missing layout entry", () => {
    expect(() => firstRecordedItem("button", parse({ ui: { layout: {} }, hooks: [] })), "no item").toThrow(/no component on the grid/);
    const noLayout = parse({ ui: { layout: {}, items: VALID_RECORDING.ui.items }, hooks: [] });
    expect(() => firstRecordedItem("button", noLayout), "no layout entry").toThrow(/no layout entry for item c1/);
  });

  test("every recording on disk that has a grid item is of its own file's type", () => {
    const types = readdirSync(RECORDED_DSL_DIR).filter((file) => file.endsWith(".json")).map((file) => file.replace(/\.json$/, ""));
    for (const compType of types) {
      try {
        expect(recordedItem(compType).compType, `${compType}.json holds a ${compType}`).toBe(compType);
      } catch (error) {
        // A hook type has no grid item; any other error (a mismatch, a malformed file) fails the test.
        expect(String(error), `${compType}: only the no-grid-item case is expected`).toContain("has no component on the grid");
      }
    }
  });
});
