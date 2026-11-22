export {};

const EE_MARKER = { id: "ee-marker-plugin", name: "EE marker" };

describe("plugins/index.ts ee override", () => {
  afterEach(() => {
    jest.resetModules();
    jest.dontMock("../ee/plugins");
  });

  test("when ../ee/plugins exists its default export replaces the open-source list exactly", () => {
    jest.doMock("../ee/plugins", () => ({ default: [EE_MARKER] }), { virtual: true });
    let list: unknown;
    jest.isolateModules(() => {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      list = require("./index").default;
    });

    expect(list).toEqual([EE_MARKER]);
    expect((list as unknown[])[0]).toBe(EE_MARKER);
  });
});
