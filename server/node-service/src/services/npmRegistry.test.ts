import type { NpmRegistryConfig, NpmRegistryConfigEntry } from "./npmRegistry";

type RegistryModule = typeof import("./npmRegistry");

const ENV_CONFIG = "NPM_REGISTRY_CONFIG";
const DEFAULT_URL = "https://registry.npmjs.org";
const GLOBAL_URL = "https://global.example.test";
const ORG_URL = "https://org.example.test";
const PACKAGE_URL = "https://package.example.test";
const ORG_PATTERN = "@acme";
const PACKAGE_PATTERN = "@acme/special";
const PACKAGE_IN_ORG = "@acme/other";
const PACKAGE_IN_LOOKALIKE_ORG = "@acmecorp/x";
const PACKAGE_UNMATCHED = "left-pad";

const globalEntry: NpmRegistryConfigEntry = {
  scope: { type: "global" },
  registry: { url: GLOBAL_URL, auth: { type: "none" } },
};
const orgEntry: NpmRegistryConfigEntry = {
  scope: { type: "organization", pattern: ORG_PATTERN },
  registry: { url: ORG_URL, auth: { type: "basic", credentials: "b3JnOnB3" } },
};
const packageEntry: NpmRegistryConfigEntry = {
  scope: { type: "package", pattern: PACKAGE_PATTERN },
  registry: { url: PACKAGE_URL, auth: { type: "bearer", credentials: "tok" } },
};

const savedEnv = process.env[ENV_CONFIG];

// The service is a singleton read from the env at first use: each case loads a fresh module registry.
function loadModule(envValue: string | undefined): RegistryModule {
  if (envValue === undefined) {
    delete process.env[ENV_CONFIG];
  } else {
    process.env[ENV_CONFIG] = envValue;
  }
  let mod!: RegistryModule;
  jest.isolateModules(() => {
    mod = require("./npmRegistry");
  });
  return mod;
}

afterEach(() => {
  jest.restoreAllMocks();
  if (savedEnv === undefined) {
    delete process.env[ENV_CONFIG];
  } else {
    process.env[ENV_CONFIG] = savedEnv;
  }
});

describe("NpmRegistryService singleton from NPM_REGISTRY_CONFIG", () => {
  test("DEFAULT_REGISTRY is the public npm registry without auth", () => {
    const { NpmRegistryService } = loadModule(undefined);
    expect(NpmRegistryService.DEFAULT_REGISTRY).toEqual({
      scope: { type: "global" },
      registry: { url: DEFAULT_URL, auth: { type: "none" } },
    });
  });

  test("with the variable unset, any package gets the default registry", () => {
    const { NpmRegistryService } = loadModule(undefined);
    const service = NpmRegistryService.getInstance();
    expect(service.getRegistryEntryForPackage(PACKAGE_UNMATCHED).registry.url).toBe(DEFAULT_URL);
    expect(service.getRegistryEntryForPackage(PACKAGE_PATTERN).registry.url).toBe(DEFAULT_URL);
  });

  test("precedence is package > organization > global, whatever the input order", () => {
    const { NpmRegistryService } = loadModule(JSON.stringify([globalEntry, orgEntry, packageEntry]));
    const service = NpmRegistryService.getInstance();
    expect(service.getRegistryEntryForPackage(PACKAGE_PATTERN)).toEqual(packageEntry);
    expect(service.getRegistryEntryForPackage(PACKAGE_IN_ORG)).toEqual(orgEntry);
    expect(service.getRegistryEntryForPackage(PACKAGE_UNMATCHED)).toEqual(globalEntry);
  });

  test("precedence also holds for the reversed input order", () => {
    const { NpmRegistryService } = loadModule(JSON.stringify([packageEntry, orgEntry, globalEntry]));
    const service = NpmRegistryService.getInstance();
    expect(service.getRegistryEntryForPackage(PACKAGE_PATTERN).registry.url).toBe(PACKAGE_URL);
    expect(service.getRegistryEntryForPackage(PACKAGE_IN_ORG).registry.url).toBe(ORG_URL);
    expect(service.getRegistryEntryForPackage(PACKAGE_UNMATCHED).registry.url).toBe(GLOBAL_URL);
  });

  test("an organization pattern is a plain prefix: @acme also matches @acmecorp/x", () => {
    const { NpmRegistryService } = loadModule(JSON.stringify([globalEntry, orgEntry]));
    const service = NpmRegistryService.getInstance();
    expect(service.getRegistryEntryForPackage(PACKAGE_IN_LOOKALIKE_ORG).registry.url).toBe(ORG_URL);
  });

  test("a package pattern is an exact match, not a prefix", () => {
    const { NpmRegistryService } = loadModule(JSON.stringify([globalEntry, packageEntry]));
    const service = NpmRegistryService.getInstance();
    expect(service.getRegistryEntryForPackage(`${PACKAGE_PATTERN}-extra`).registry.url).toBe(GLOBAL_URL);
  });

  test("a config without a global entry gets the default appended, so unmatched packages still resolve", () => {
    const { NpmRegistryService } = loadModule(JSON.stringify([orgEntry]));
    const service = NpmRegistryService.getInstance();
    expect(service.getRegistryEntryForPackage(PACKAGE_IN_ORG).registry.url).toBe(ORG_URL);
    expect(service.getRegistryEntryForPackage(PACKAGE_UNMATCHED)).toEqual(NpmRegistryService.DEFAULT_REGISTRY);
  });

  test("an empty array config falls back to the default registry", () => {
    const { NpmRegistryService } = loadModule("[]");
    expect(NpmRegistryService.getInstance().getRegistryEntryForPackage(PACKAGE_UNMATCHED).registry.url).toBe(DEFAULT_URL);
  });

  test("invalid JSON logs an error and falls back to the default registry", () => {
    const errorSpy = jest.spyOn(global.logger, "error").mockImplementation(() => undefined);
    const { NpmRegistryService } = loadModule("{not json");
    const service = NpmRegistryService.getInstance();
    expect(errorSpy).toHaveBeenCalledTimes(1);
    expect(String(errorSpy.mock.calls[0][0])).toContain("Error parsing NPM registry config");
    expect(service.getRegistryEntryForPackage(PACKAGE_UNMATCHED)).toEqual(NpmRegistryService.DEFAULT_REGISTRY);
  });

  test("getInstance returns the same object on every call", () => {
    const { NpmRegistryService } = loadModule(undefined);
    expect(NpmRegistryService.getInstance()).toBe(NpmRegistryService.getInstance());
  });
});

describe("NpmRegistryService.getRegistryEntryForPackageWithConfig", () => {
  const { NpmRegistryService } = loadModule(undefined);

  test("an empty list gives the default registry", () => {
    expect(NpmRegistryService.getRegistryEntryForPackageWithConfig(PACKAGE_UNMATCHED, [])).toBe(
      NpmRegistryService.DEFAULT_REGISTRY
    );
  });

  test("an organization-only list with a non-matching package gives the default registry", () => {
    expect(NpmRegistryService.getRegistryEntryForPackageWithConfig(PACKAGE_UNMATCHED, [orgEntry])).toBe(
      NpmRegistryService.DEFAULT_REGISTRY
    );
  });

  test("a matching package entry beats a global one regardless of order", () => {
    const globalFirst: NpmRegistryConfig = [globalEntry, packageEntry];
    const packageFirst: NpmRegistryConfig = [packageEntry, globalEntry];
    expect(NpmRegistryService.getRegistryEntryForPackageWithConfig(PACKAGE_PATTERN, globalFirst)).toBe(packageEntry);
    expect(NpmRegistryService.getRegistryEntryForPackageWithConfig(PACKAGE_PATTERN, packageFirst)).toBe(packageEntry);
  });

  test("an organization entry beats a global one, and a global one catches the rest", () => {
    const config: NpmRegistryConfig = [globalEntry, orgEntry];
    expect(NpmRegistryService.getRegistryEntryForPackageWithConfig(PACKAGE_IN_ORG, config)).toBe(orgEntry);
    expect(NpmRegistryService.getRegistryEntryForPackageWithConfig(PACKAGE_UNMATCHED, config)).toBe(globalEntry);
  });

  test("does not reorder the caller's array", () => {
    const config: NpmRegistryConfig = [globalEntry, orgEntry, packageEntry];
    NpmRegistryService.getRegistryEntryForPackageWithConfig(PACKAGE_PATTERN, config);
    expect(config).toEqual([globalEntry, orgEntry, packageEntry]);
  });
});
