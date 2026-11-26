import {
  calcGridItemSizePx,
  calcWH,
  convertDroppingSize,
  DEFAULT_POSITION_PARAMS,
  PositionParams,
} from "./calculateUtils";

const MEASURED_WIDTH = 1200;
const DROPPED_W = 10;
const DROPPED_H = 6;
const EQUAL_ROW_HEIGHT = 8;
const DIFFERENT_ROW_HEIGHT = 16;
const HALF_WIDTH = MEASURED_WIDTH / 2;

function measured(overrides: Partial<PositionParams> = {}): PositionParams {
  return { ...DEFAULT_POSITION_PARAMS, containerWidth: MEASURED_WIDTH, ...overrides };
}

/** What the conversion answers for a source: the pixel size in the source grid, converted into the target's units. */
function converted(target: PositionParams, source: PositionParams, w: number, h: number) {
  const { width, height } = calcGridItemSizePx(source, w, h);
  return calcWH(target, width, height, { w: false, h: false, ceil: false });
}

function show(label: string, input: unknown, output: unknown) {
  console.log(`[calculateUtils.test] ${label}: in=${JSON.stringify(input)} out=${JSON.stringify(output)}`);
}

describe("convertDroppingSize", () => {
  it("keeps the given size when there are no source parameters", () => {
    const out = convertDroppingSize(measured(), undefined, DROPPED_W, DROPPED_H);
    show("no source", { w: DROPPED_W, h: DROPPED_H }, out);
    expect(out).toEqual({ w: DROPPED_W, h: DROPPED_H });
  });

  it("keeps the given width of an unmeasured source and converts the height (equal row heights)", () => {
    const target = measured({ rowHeight: EQUAL_ROW_HEIGHT });
    const out = convertDroppingSize(target, DEFAULT_POSITION_PARAMS, DROPPED_W, DROPPED_H);
    const expected = converted(target, DEFAULT_POSITION_PARAMS, DROPPED_W, DROPPED_H);
    show("unmeasured source, equal row height", { w: DROPPED_W, h: DROPPED_H, expectedConversion: expected }, out);
    // the conversion itself answers a width of 0 for the unmeasured source: this is what the guard is for
    expect(expected.w).toBe(0);
    expect(out.w).toBe(DROPPED_W);
    expect(out.h).toBe(expected.h);
  });

  it("keeps the given width of an unmeasured source and still converts the height when the row heights differ", () => {
    const target = measured({ rowHeight: DIFFERENT_ROW_HEIGHT });
    const out = convertDroppingSize(target, DEFAULT_POSITION_PARAMS, DROPPED_W, DROPPED_H);
    const expected = converted(target, DEFAULT_POSITION_PARAMS, DROPPED_W, DROPPED_H);
    show("unmeasured source, different row height", { w: DROPPED_W, h: DROPPED_H, expectedConversion: expected }, out);
    expect(out.w).toBe(DROPPED_W);
    expect(out.h).toBe(expected.h);
    // the converted height is not the given one, so this case tells a kept conversion from a bypassed one
    expect(out.h).not.toBe(DROPPED_H);
  });

  it("returns the conversion, equal to the input, for a measured source equal to the target", () => {
    const target = measured();
    const out = convertDroppingSize(target, measured(), DROPPED_W, DROPPED_H);
    const expected = converted(target, measured(), DROPPED_W, DROPPED_H);
    show("measured equal source", { w: DROPPED_W, h: DROPPED_H, expectedConversion: expected }, out);
    expect(out).toEqual(expected);
    expect(out).toEqual({ w: DROPPED_W, h: DROPPED_H });
  });

  it("converts the width of a measured source of half the target's width", () => {
    const target = measured();
    const source = measured({ containerWidth: HALF_WIDTH });
    const out = convertDroppingSize(target, source, DROPPED_W, DROPPED_H);
    const expected = converted(target, source, DROPPED_W, DROPPED_H);
    show("measured half-width source", { w: DROPPED_W, h: DROPPED_H, expectedConversion: expected }, out);
    expect(out).toEqual(expected);
    // half the container width means half the pixels per column: the same pixel size is about half the columns
    expect(out.w).toBe(DROPPED_W / 2);
  });
});
