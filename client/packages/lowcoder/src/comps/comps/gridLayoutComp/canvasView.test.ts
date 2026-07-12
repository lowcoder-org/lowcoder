import { DEFAULT_ROW_COUNT } from "@lowcoder-ee/layout/calculateUtils";
import {
  shouldShowStretchCanvasHeight,
  shouldStretchCanvasHeight,
} from "./canvasView";

describe("canvas stretch height helpers", () => {
  it("shows stretch only for fixed row count", () => {
    expect(shouldShowStretchCanvasHeight(DEFAULT_ROW_COUNT)).toBe(false);
    expect(shouldShowStretchCanvasHeight(24)).toBe(true);
  });

  it("enables stretch only in runtime for fixed row count", () => {
    expect(shouldStretchCanvasHeight(DEFAULT_ROW_COUNT, true, true)).toBe(false);
    expect(shouldStretchCanvasHeight(24, false, true)).toBe(false);
    expect(shouldStretchCanvasHeight(24, true, false)).toBe(false);
    expect(shouldStretchCanvasHeight(24, true, true)).toBe(true);
  });
});
