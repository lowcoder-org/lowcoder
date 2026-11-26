import { render, screen } from "@testing-library/react";
import { IconDictionary, resetIconDictionary } from "@lowcoder-ee/constants/iconConstants";
import { IconControlView } from "./iconControl";

/**
 * `useIcon` of lowcoder-design loads its icon table asynchronously and keeps the icon in state, set in an effect keyed by the
 * `/icon:` key of the value (`""` for any other value). The stand-in has the same shape over a fake table, and sets the icon
 * synchronously inside the effect, so a rerender settles within `act`. It is a plain function, not `jest.fn`: the shared jest
 * config has `resetMocks: true`, which clears `jest.fn` implementations before each test.
 */
jest.mock("lowcoder-design", () => {
  const actual = jest.requireActual("lowcoder-design");
  const React = jest.requireActual("react");
  const FAKE_ICONS: Record<string, { title: string; getView: () => unknown }> = {
    "solid/star": { title: "Star", getView: () => React.createElement("span", { "data-testid": "icon-marker" }) },
  };
  const keyOf = (value?: string) => {
    const unquoted = actual.removeQuote(value);
    return unquoted.startsWith(actual.iconPrefix) ? unquoted.slice(actual.iconPrefix.length) : "";
  };
  function standInUseIcon(value?: string) {
    const key = keyOf(value);
    const [icon, setIcon] = React.useState(undefined);
    React.useEffect(() => {
      setIcon(FAKE_ICONS[key]);
    }, [key]);
    return icon;
  }
  return { ...actual, useIcon: standInUseIcon };
});

const ICON_VALUE = "/icon:solid/star";
const IMAGE_URI = "data:image/png;base64,iVBORw0KGgo=";
const PLAIN_TEXT = "hello";
const QUOTED_EMPTY = '""';
const MARKER = "icon-marker";

function drawnAs(container: HTMLElement) {
  const img = container.querySelector("img");
  return {
    marker: screen.queryByTestId(MARKER) !== null,
    imgSrc: img ? img.getAttribute("src") : null,
    markup: container.innerHTML,
  };
}

function show(label: string, value: string, container: HTMLElement) {
  console.log(`[iconControl.test] ${label}: value=${JSON.stringify(value)} -> ${JSON.stringify(drawnAs(container))}`);
}

beforeEach(() => {
  resetIconDictionary();
});

describe("IconControlView after the value changes", () => {
  it("draws the image of a data URI after an icon name, and caches nothing under the URI", () => {
    const { container, rerender } = render(<IconControlView value={ICON_VALUE} />);
    show("start", ICON_VALUE, container);
    expect(drawnAs(container).marker).toBe(true);

    rerender(<IconControlView value={IMAGE_URI} />);
    show("after the switch", IMAGE_URI, container);
    expect(drawnAs(container).imgSrc).toBe(IMAGE_URI);
    expect(drawnAs(container).marker).toBe(false);
    expect(IconDictionary[IMAGE_URI]).toBeUndefined();
  });

  it("draws the icon again when the value goes from an image to an icon name", () => {
    const { container, rerender } = render(<IconControlView value={IMAGE_URI} />);
    show("start", IMAGE_URI, container);
    expect(drawnAs(container).imgSrc).toBe(IMAGE_URI);

    rerender(<IconControlView value={ICON_VALUE} />);
    show("after the switch", ICON_VALUE, container);
    expect(drawnAs(container).marker).toBe(true);
    expect(drawnAs(container).imgSrc).toBeNull();
  });

  it("draws plain text as an image after an icon name, as a page loaded with that text does", () => {
    const { container, rerender } = render(<IconControlView value={ICON_VALUE} />);
    expect(drawnAs(container).marker).toBe(true);

    rerender(<IconControlView value={PLAIN_TEXT} />);
    show("after the switch", PLAIN_TEXT, container);
    expect(drawnAs(container).imgSrc).toBe(PLAIN_TEXT);
    expect(drawnAs(container).marker).toBe(false);
  });

  it("draws nothing for an empty value after an icon name", () => {
    const { container, rerender } = render(<IconControlView value={ICON_VALUE} />);
    expect(drawnAs(container).marker).toBe(true);

    rerender(<IconControlView value="" />);
    show("after the switch", "", container);
    expect(drawnAs(container).marker).toBe(false);
    expect(drawnAs(container).imgSrc).toBeNull();
  });

  it("pins the known limit: a quoted empty value keeps the old icon after an icon name, cached under it", () => {
    const { container, rerender } = render(<IconControlView value={ICON_VALUE} />);
    expect(drawnAs(container).marker).toBe(true);

    rerender(<IconControlView value={QUOTED_EMPTY} />);
    show("after the switch", QUOTED_EMPTY, container);
    // not wanted, only not covered by the fix: a later change of what the quoted empty value draws changes this case on purpose
    expect(drawnAs(container).marker).toBe(true);
    expect(drawnAs(container).imgSrc).toBeNull();
    expect(IconDictionary[QUOTED_EMPTY]).toBeDefined();
  });
});
