import { expect, test } from "@playwright/test";
import { text } from "../../src/dsl/builders";
import {
  BOUND_TEXT_TEST_ID_PREFIX,
  ComponentPathError,
  BOUND_TEXT_ROWS,
  boundText,
  boundTextTestId,
  COMPONENT_TEST_ID_PREFIX,
  testIdOf,
  withValueAt,
} from "../../src/components/scenario";

/** Unit tests of the S2-S7 helpers; they need no running app. */
test.describe("scenario helpers", () => {
  test("boundText gives the text a test id derived from the component name and keeps the expression", () => {
    const item = boundText({ id: "x", name: "select1", expression: "{{select1.value}}" });

    expect(boundTextTestId("select1"), "derived test id").toBe(`${BOUND_TEXT_TEST_ID_PREFIX}select1`);
    expect(item.item.compType, "a text component").toBe("text");
    expect(item.item.comp.dataTestId, "test id of the text").toBe("t-select1");
    expect(item.item.comp.text, "the bound expression").toBe("{{select1.value}}");
    expect(item.id, "layout id differs from a component id of the same name").toBe("tx-x");
    expect(item.item.name, "the generated component name is t_<name>").toBe("t_select1");
    expect(item.layout.h, "the layout override: four grid rows").toBe(BOUND_TEXT_ROWS);
    expect(item.layout.h, "the override replaced the text builder's own height").not.toBe(
      text({ id: "x", name: "t_select1", text: "", testId: "t-select1" }).layout.h,
    );
    expect(item.layout.x, "the rest of the builder's layout is kept").toBe(text({ id: "x", name: "t_select1", text: "", testId: "t-select1" }).layout.x);
  });

  test("testIdOf is the prefix e2e- followed by the component name", () => {
    expect(COMPONENT_TEST_ID_PREFIX).toBe("e2e-");
    expect(testIdOf("date1")).toBe("e2e-date1");
    expect(testIdOf("")).toBe("e2e-");
  });

  test("withValueAt sets a nested value in a copy and leaves the original alone", () => {
    const original = { options: { manual: [{ label: "a" }, { label: "b" }] } };

    const changed = withValueAt(original, ["options", "manual", 1, "onEvent"], ["handler"]);

    expect(changed, "value placed at the path").toEqual({
      options: { manual: [{ label: "a" }, { label: "b", onEvent: ["handler"] }] },
    });
    expect(original.options.manual[1], "the original is not modified").toEqual({ label: "b" });
  });

  test("withValueAt rejects a path whose parent does not exist", () => {
    expect(() => withValueAt({ a: {} }, ["a", "missing", "x"], 1)).toThrow(ComponentPathError);
    expect(() => withValueAt({ a: {} }, ["a", "missing", "x"], 1)).toThrow(/a\.missing\.x: a\.missing does not exist/);
  });

  test("withValueAt rejects an empty path and a path through a primitive", () => {
    expect(() => withValueAt({}, [], 1)).toThrow(/the path is empty/);
    expect(() => withValueAt({ a: "text" }, ["a", "b"], 1)).toThrow(/a is not an object or array/);
  });
});
