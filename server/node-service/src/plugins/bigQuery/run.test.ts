import { BigQuery } from "@google-cloud/bigquery";
import bigQueryPlugin from "./index";
import run, { validateDataSourceConfig } from "./run";

/**
 * bigQuery plugin. Boundary: `@google-cloud/bigquery` is a module fake. `BigQuery` records its constructor
 * options and answers `query` and `getDatasets` from canned values (same reasoning as GCS).
 */
jest.mock("@google-cloud/bigquery", () => ({ BigQuery: jest.fn() }));

const CREDENTIALS = { client_email: "svc@demo.iam", private_key: "KEY", project_id: "demo" };
const REGION = "EU";
const SQL = "select 1 as a";
const ROWS = [{ a: 1 }];
const CTX = { languages: ["en"] } as any;
const dataSource = { privateKey: JSON.stringify(CREDENTIALS), region: REGION } as any;

let queryMock: jest.Mock;
let getDatasetsMock: jest.Mock;

beforeEach(() => {
  queryMock = jest.fn().mockResolvedValue([ROWS, {}]);
  getDatasetsMock = jest.fn().mockResolvedValue([[]]);
  (BigQuery as unknown as jest.Mock).mockReset().mockImplementation(() => ({ query: queryMock, getDatasets: getDatasetsMock }));
});

describe("run", () => {
  test("the client gets the parsed credentials and location = region", async () => {
    await run({ actionName: "Query", googleSQL: SQL } as any, dataSource);
    expect(BigQuery).toHaveBeenCalledTimes(1);
    expect(BigQuery).toHaveBeenCalledWith({ credentials: CREDENTIALS, location: REGION });
  });

  test("Query sends googleSQL and returns the first element of the query() result", async () => {
    await expect(run({ actionName: "Query", googleSQL: SQL } as any, dataSource)).resolves.toBe(ROWS);
    expect(queryMock).toHaveBeenCalledWith(SQL);
  });

  test("a non-Query action resolves to undefined and sends no query", async () => {
    await expect(run({ actionName: "Other" } as any, dataSource)).resolves.toBeUndefined();
    expect(queryMock).not.toHaveBeenCalled();
  });

  test("a privateKey that is not JSON gives a SyntaxError and builds no client", async () => {
    await expect(run({ actionName: "Query", googleSQL: SQL } as any, { ...dataSource, privateKey: "nope" })).rejects.toBeInstanceOf(SyntaxError);
    expect(BigQuery).not.toHaveBeenCalled();
  });

  test("a query error is re-thrown unchanged", async () => {
    const failure = new Error("Syntax error at [1:1]");
    queryMock.mockRejectedValue(failure);
    await expect(run({ actionName: "Query", googleSQL: SQL } as any, dataSource)).rejects.toBe(failure);
  });
});

describe("validateDataSourceConfig", () => {
  test("returns {success: true} after getDatasets()", async () => {
    await expect(validateDataSourceConfig(dataSource)).resolves.toEqual({ success: true });
    expect(getDatasetsMock).toHaveBeenCalledTimes(1);
    expect(BigQuery).toHaveBeenCalledWith({ credentials: CREDENTIALS, location: REGION });
  });

  test("a getDatasets error is re-thrown unchanged", async () => {
    const failure = new Error("Access Denied");
    getDatasetsMock.mockRejectedValue(failure);
    await expect(validateDataSourceConfig(dataSource)).rejects.toBe(failure);
  });
});

describe("plugin object (index.ts)", () => {
  test("exposes its identity", () => {
    expect(bigQueryPlugin.id).toBe("bigQuery");
    expect(bigQueryPlugin.category).toBe("Big Data");
  });

  test("validateDataSourceConfig and run delegate to run.ts", async () => {
    await expect(bigQueryPlugin.validateDataSourceConfig(dataSource)).resolves.toEqual({ success: true });
    await expect(bigQueryPlugin.run({ actionName: "Query", googleSQL: SQL } as any, dataSource, CTX)).resolves.toBe(ROWS);
  });

  test("run re-throws errors unchanged", async () => {
    const failure = new Error("quota exceeded");
    queryMock.mockRejectedValue(failure);
    await expect(bigQueryPlugin.run({ actionName: "Query", googleSQL: SQL } as any, dataSource, CTX)).rejects.toBe(failure);
  });
});
