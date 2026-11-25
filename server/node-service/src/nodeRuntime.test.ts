// Node 25 removed buffer.SlowBuffer; buffer-equal-constant-time@1.0.1 reads SlowBuffer.prototype when it is loaded,
// and jwa@1.4.1/2.0.0 load it eagerly, which broke these libraries on Node 26 (plans/node-service-node26, n2 C1).
// The test hides SlowBuffer from require("buffer"), so it fails on any Node version if an eager loader returns.
// Limits: it covers only what these three packages load when required, not modules they load later on a code path,
// and it does not detect other APIs removed in Node 25 or 26.
export {};

const REMOVED_IN_NODE_25 = "SlowBuffer";
const GOOGLE_AUTH_CONSUMERS = ["@google-cloud/storage", "@google-cloud/bigquery", "firebase-admin"];

describe("libraries load without buffer.SlowBuffer (removed in Node 25)", () => {
  test.each(GOOGLE_AUTH_CONSUMERS)("%s loads", (moduleName) => {
    jest.isolateModules(() => {
      jest.doMock("buffer", () => {
        const { [REMOVED_IN_NODE_25]: _removed, ...rest } = jest.requireActual<Record<string, unknown>>("buffer");
        return rest;
      });
      expect(() => require(moduleName)).not.toThrow();
    });
  });
});
