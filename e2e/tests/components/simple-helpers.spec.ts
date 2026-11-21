import { expect, test } from "@playwright/test";
import { RecordedFixtureError, recordedItem } from "../../src/dsl/recorded";
import { SeedShapeError, containerWithChildren, slotChild, slotContainers } from "../../src/simple-components/seed";

/** The helpers of src/simple-components/seed.ts need no stack: they build DSL objects from the recordings. */
const BODY = slotChild({ id: "b1", name: "bodyText1", text: "Body", testId: "kid-body" });

test.describe("slotChild", () => {
  test("is one full-width text item under its id, in the recorded header child's shape", () => {
    expect(BODY).toEqual({
      layout: { b1: { i: "b1", x: 0, y: 0, w: 24, h: 5, pos: 0 } },
      items: { b1: { compType: "text", name: "bodyText1", comp: { text: "Body", dataTestId: "kid-body" } } },
    });
  });
});

test.describe("slotContainers", () => {
  test("keeps one child set per slot key", () => {
    const second = slotChild({ id: "k1", name: "kidText1", text: "Kid1", testId: "kid-1" });
    const slots = slotContainers({ "0": BODY, "1": second });
    expect(Object.keys(slots), "slot keys").toEqual(["0", "1"]);
    expect(slots["1"], "slot 1's children").toBe(second);
  });
});

test.describe("containerWithChildren", () => {
  test("puts the body child into body slot 0 and replaces the header text and its test id", () => {
    const container = containerWithChildren("container", { body: BODY, header: { text: "Head", testId: "kid-header" } });

    expect(container.body["0"], "body slot 0").toEqual({ view: BODY });
    const headerTexts = Object.values(container.header.items).map((child) => child.comp);
    expect(headerTexts, "the one header child").toHaveLength(1);
    expect(headerTexts[0], "its text and test id").toMatchObject({ text: "Head", dataTestId: "kid-header" });
  });

  test("changes only the header text child of collapsibleContainer, not its toggle", () => {
    const container = containerWithChildren("collapsibleContainer", { body: BODY, header: { text: "Head", testId: "kid-header" } });

    const byType = Object.values(container.header.items).map((child) => child.compType).sort();
    expect(byType, "header children").toEqual(["text", "toggleButton"]);
    const toggle = Object.values(container.header.items).find((child) => child.compType === "toggleButton");
    expect(toggle?.comp.dataTestId, "the toggle keeps no test id").toBeUndefined();
  });

  test("leaves the header as recorded when none is given", () => {
    const container = containerWithChildren("pageLayout", { body: BODY });
    const recordedHeader = (recordedItem("pageLayout").comp.container as { header: unknown }).header;

    expect(container.header, "header equals the one of the recording, not another call's output").toEqual(recordedHeader);
    expect(container.body["0"]?.view, "body child").toBe(BODY);
  });

  test("throws SeedShapeError when a header is requested for a container whose header has no text child", () => {
    // pageLayout's recorded header holds a navigation component only.
    expect(() => containerWithChildren("pageLayout", { body: BODY, header: { text: "Head", testId: "kid-header" } })).toThrow(SeedShapeError);
    expect(() => containerWithChildren("pageLayout", { body: BODY, header: { text: "Head", testId: "kid-header" } })).toThrow(
      /cannot seed pageLayout: its header has no text child/,
    );
  });

  test("returns a fresh copy each call, so one test's seed never leaks into another", () => {
    const first = containerWithChildren("container", { body: BODY, header: { text: "A", testId: "x" } });
    const second = containerWithChildren("container", { body: BODY });

    const headerOf = (container: typeof first) => Object.values(container.header.items)[0]!.comp.text;
    expect(headerOf(first), "first").toBe("A");
    expect(headerOf(second), "second keeps the recorded header text").not.toBe("A");
  });

  test("throws SeedShapeError for a type without a container, naming it", () => {
    expect(() => containerWithChildren("button", { body: BODY })).toThrow(SeedShapeError);
    expect(() => containerWithChildren("button", { body: BODY })).toThrow(/cannot seed button/);
  });

  test("throws RecordedFixtureError for a type with no recording", () => {
    expect(() => containerWithChildren("noSuchType", { body: BODY })).toThrow(RecordedFixtureError);
  });
});
