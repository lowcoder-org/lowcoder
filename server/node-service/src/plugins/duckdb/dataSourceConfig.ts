// @server/node-service/src/plugins/duckdb/dataSourceConfig.ts
import { ConfigToType } from "lowcoder-sdk/dataSource";

const dataSourceConfig = {
    type: "dataSource",
    params: [
        {
            key: "databaseFile",
            type: "textInput",
            label: "Database File",
            rules: [{ required: true, message: "Please provide a database file path 'db.duckdb' or ':memory:' for an in-memory database" }],
            tooltip: "Please provide a database file path 'db.duckdb' or ':memory:' for an in-memory database",
            defaultValue: ":memory:",
        },
        {
            key: "options",
            type: "textInput",
            label: "Database Options",
            tooltip: "Additional options to pass to the DuckDB constructor (in JSON format)",
            defaultValue: `{"access_mode": "READ_WRITE","max_memory": "512MB","threads": "4"}`,
        },
    ],
} as const;

export default dataSourceConfig;

export type DataSourceDataType = ConfigToType<typeof dataSourceConfig>;
