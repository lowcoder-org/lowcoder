import { readdirSync } from "node:fs";
import { expect, test } from "@playwright/test";
import {
  prepareForPublish,
  holdsInsertedType,
  READY_TEST_ID,
  READY_TEXT,
  SavedDslTimeoutError,
  testIdOf,
  type SavedDsl,
} from "../../src/components/insert-all";
import {
  HOOK_TYPES,
  INSERT_TILE_LABELS,
  INSERT_TYPES,
  searchTextOf,
  TYPES_WITHOUT_TEST_ID,
} from "../../src/components/insert-catalog";
import { RECORDED_DSL_DIR, recordedHook, recordedItem } from "../../src/dsl/recorded";

const EXPECTED_TYPE_COUNT = 112;
const EXPECTED_HOOK_COUNT = 5;
const EXPECTED_WITHOUT_TEST_ID_COUNT = 21;

/** What `fixtures/dsl/<type>.json` holds, reduced to what `holdsInsertedType` reads. */
function recordedAsSaved(compType: string): SavedDsl {
  if (HOOK_TYPES.has(compType)) {
    return { ui: { layout: {} }, hooks: [{ compType, name: recordedHook(compType).name }] };
  }
  // `recordedItem` already refuses a recording whose first component is not `compType`; the type is taken from the item.
  const item = recordedItem(compType);
  return { ui: { layout: {}, items: { [item.layout.i]: { compType: item.compType, name: item.name, comp: item.comp } } }, hooks: [] };
}

test.describe("S1 catalog of the Components pane", () => {
  test("the catalog lists exactly the 112 recorded component types", () => {
    const recorded = readdirSync(RECORDED_DSL_DIR)
      .filter((file) => file.endsWith(".json"))
      .map((file) => file.replace(/\.json$/, ""))
      .sort();

    expect(INSERT_TYPES.length, "types in the catalog").toBe(EXPECTED_TYPE_COUNT);
    expect([...INSERT_TYPES].sort(), "catalog types against fixtures/dsl").toEqual(recorded);
  });

  test("the hook types and the types without a test id are catalog types, in the expected numbers", () => {
    expect(HOOK_TYPES.size, "hook types").toBe(EXPECTED_HOOK_COUNT);
    expect(TYPES_WITHOUT_TEST_ID.size, "grid types without a test id").toBe(EXPECTED_WITHOUT_TEST_ID_COUNT);
    for (const compType of [...HOOK_TYPES, ...TYPES_WITHOUT_TEST_ID]) {
      expect(INSERT_TILE_LABELS, `${compType} is a catalog type`).toHaveProperty(compType);
    }
    expect([...HOOK_TYPES].filter((type) => TYPES_WITHOUT_TEST_ID.has(type)), "no type is in both sets").toEqual([]);
  });

  test("searchTextOf is the label without spaces in lower case, and refuses an unknown type", () => {
    expect(searchTextOf("barChart")).toBe("barchart");
    expect(searchTextOf("kanban")).toBe("kanbanboard(preview!)");
    expect(searchTextOf("jsonSchemaForm")).toBe("jsonschemaform");
    expect(() => searchTextOf("noSuchType")).toThrow(/no tile label is known for the component type "noSuchType"/);
  });
});

test.describe("S1 saved-DSL helpers", () => {
  test("holdsInsertedType accepts the recording of every type, and no other type's recording", () => {
    for (const compType of INSERT_TYPES) {
      expect(holdsInsertedType(recordedAsSaved(compType), compType), `${compType} holds itself`).toBe(true);
    }
    expect(holdsInsertedType(recordedAsSaved("button"), "input"), "a button recording holds no input").toBe(false);
    expect(holdsInsertedType({ ui: { layout: {} } }, "button"), "an empty app holds no button").toBe(false);
  });

  test("a hook type is found by the recorded hook name: the base `toast` hook alone is not a dropped toast", () => {
    const onlyBaseToast: SavedDsl = { ui: { layout: {} }, hooks: [{ compType: "toast", name: "toast" }] };
    const dropped: SavedDsl = { ui: { layout: {} }, hooks: [...onlyBaseToast.hooks!, { compType: "toast", name: "toast1" }] };

    expect(holdsInsertedType(onlyBaseToast, "toast")).toBe(false);
    expect(holdsInsertedType(dropped, "toast")).toBe(true);
  });

  test("holdsInsertedType holds nothing for the `{}` of an unsaved app and refuses a DSL that is no object", () => {
    expect(holdsInsertedType({}, "button"), "unsaved app, grid type").toBe(false);
    expect(holdsInsertedType({}, "modal"), "unsaved app, hook type").toBe(false);
    expect(() => holdsInsertedType(null, "button")).toThrow(/not an object/);
  });

  test("prepareForPublish gives a grid component its test id and returns its name, leaving the input untouched", () => {
    const saved = recordedAsSaved("barChart");

    const { dsl, compName } = prepareForPublish(saved, "barChart");

    expect(compName).toBe("barChart1");
    expect(Object.values(dsl.ui.items!)[0]!.comp!.dataTestId).toBe(testIdOf("barChart"));
    expect(Object.values(saved.ui.items!)[0]!.comp!, "the input is not changed").not.toHaveProperty("dataTestId");
  });

  test("prepareForPublish adds the readiness text to a hook app and keeps its hook", () => {
    const { dsl, compName } = prepareForPublish(recordedAsSaved("modal"), "modal");

    expect(compName, "a hook type has no component name").toBeUndefined();
    const items = Object.values(dsl.ui.items!);
    expect(items, "one added item").toHaveLength(1);
    expect(items[0]).toMatchObject({ compType: "text", comp: { text: READY_TEXT, dataTestId: READY_TEST_ID } });
    expect(Object.keys(dsl.ui.layout!), "its layout entry").toEqual(Object.keys(dsl.ui.items!));
    expect(dsl.hooks, "the hook stays").toEqual([{ compType: "modal", name: "modal1" }]);
  });

  test("prepareForPublish names the type when the saved DSL lacks it", () => {
    expect(() => prepareForPublish({ ui: { layout: {}, items: {} } }, "button")).toThrow(/no button to give a test id/);
  });

  test("SavedDslTimeoutError names the app, the type and the defect", () => {
    const error = new SavedDslTimeoutError("app-1", "button", 20_000);

    expect(error.name).toBe("SavedDslTimeoutError");
    expect(error.message).toContain("app app-1");
    expect(error.message).toContain("button");
    expect(error.message).toContain("D-3");
  });
});
