import { DataSourcePlugin } from "lowcoder-sdk/dataSource";
import dataSourceConfig, { DataSourceDataType } from "./dataSourceConfig";
import queryConfig, { ActionDataType } from "./queryConfig";
import { DuckDBInstance } from "@duckdb/node-api";
import { ServiceError } from "../../common/error";

// Helper function to handle BigInt serialization
function serializeBigInts(row: any): any {
    const newRow: { [key: string]: any } = {}; // Add index signature
    for (const [key, value] of Object.entries(row)) {
        newRow[key] = typeof value === 'bigint' ? value.toString() : value;
    }
    return newRow;
}

const duckdbPlugin: DataSourcePlugin<ActionDataType, DataSourceDataType> = {
    id: "duckdb",
    name: "DuckDB",
    category: "database",
    icon: "duckdb.svg",
    dataSourceConfig,
    queryConfig,
    run: async function (actionData, dataSourceConfig): Promise<any> {
        const { databaseFile, options } = dataSourceConfig;
        const parsedOptions = JSON.parse(options);
        const instance = await DuckDBInstance.create(databaseFile, parsedOptions);
        try {
            const db = await instance.connect();
            try {
                if (actionData.actionName === "Query") {
                    try {
                        const result = await db.runAndReadAll(actionData.queryString);
                        const data = result.getRowObjects();
                        // Apply BigInt serialization to each row
                        return data.map(serializeBigInts);
                    } catch (error) {
                        throw new ServiceError((error as Error).message);
                    }
                }
            } finally {
                db.closeSync();
            }
        } finally {
            instance.closeSync();
        }
    },
};

export default duckdbPlugin;