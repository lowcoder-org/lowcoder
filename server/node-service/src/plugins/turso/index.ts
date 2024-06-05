import { DataSourcePlugin, PluginContext } from "lowcoder-sdk/dataSource";
import _ from "lodash";
import { ServiceError } from "../../common/error";
import { ConfigToType } from "lowcoder-sdk/dataSource";

const dataSourceConfig = {
  type: "dataSource",
  params: [
    {
      key: "url",
      type: "textInput",
      label: "URL",
      tooltip: "e.g. https://db-company.turso.io",
      placeholder: "<Your Turso URL>",
      rules: [{ required: true, message: "Please add the URL to your database" }]
    },
    {
      key: "token",
      label: "Token",
      type: "password",
      placeholder: "<Your Token>",
      rules: [{ required: true, message: "Please input the token" }],
    }
  ],
} as const;
type DataSourceDataType = ConfigToType<typeof dataSourceConfig>;

const queryConfig = {
  type: "query",
  label: "Action",
  actions: [
    {
      actionName: "Query",
      label: "Query",
      params: [
        {
          label: "Query String",
          key: "queryString",
          type: "sqlInput",
        },
        {
          label: "Include raw",
          key: "includeRaw",
          tooltip: "Include raw information in the response",
          type: "switch"
        }
      ],
    },
  ],
} as const;
type ActionDataType = ConfigToType<typeof queryConfig>;

// from https://github.com/tursodatabase/libsql/blob/main/docs/HRANA_3_SPEC.md#hrana-over-http
type Row = {
  type: "integer" | "text" | "float" | "blob" | "null";
  value?: string;
};
type Col = {
  name: string;
  decltype: string;
}
type ResultSet = {
  cols: Col[];
  rows: Row[][];
  affected_row_count: number;
  last_insert_rowid: number | null;
  replication_index: string;
  rows_read: number;
  rows_written: number;
  query_duration_ms: number;
}
type Result = {
  type: "ok"
  response: {
    type: "execute" | "close" | string;
    result: ResultSet
  }
} | {
  type: "error";
  error: any
};

type Response = {
  baton: string | null;
  base_url: string | null;
  results: Result[];
}

const tursoPlugin: DataSourcePlugin<ActionDataType, DataSourceDataType> = {
  id: "turso",
  name: "Turso",
  category: "database",
  icon: "turso.svg",
  dataSourceConfig,
  queryConfig,
  run: async function (actionData, dataSourceConfig, ctx: PluginContext): Promise<any> {
    const { url: _url, token } = dataSourceConfig;
    const url = _url.replace("libsql://", "https://");
    const { queryString, includeRaw } = actionData;
    
    const result = await fetch(`${url}/v2/pipeline`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({
        requests: [
          { type: "execute", stmt: { sql: queryString }},
          { type: "close" }
        ]
      })
    })
    
    if (!result.ok) {
      throw new ServiceError(`Failed to execute query. Endpoint returned ${result.status}: ${result.statusText}.`);
    }
    
    const data = await result.json() as Response;
    const parsed = parseResult(data.results[0]);
    
    return includeRaw ? parsed : parsed?.values;
  },
};


function parseValue(val: Col & Row): { [key: string]: any } {
  const name = val.name;
  let value: any = val.value;

  switch (true) {
    case val.type === "integer" && val.decltype === "boolean":
      value = Boolean(Number.parseInt(value));
      break;
    case val.type === "integer":
      value = Number.parseInt(value);
      break;
    case val.type === "float":
      value = Number.parseFloat(value);
      break;
    case ["datetime", "date"].includes(val.decltype) && val.type === "text" && !!value:
      value = new Date(value);
      break;
    case val.type === "null":
      value = null;
      break;
  }

  return {
    [name]: value,
  };
}

function parseResult(
  result: Result
): { raw: ResultSet; values: Record<string, any> } | undefined {
  if (result.type === "error") {
    throw new ServiceError(`Cannot parse result, received error: ${result.error}`);
  }
  
  const res = result.response.result;
  if (!res) return;

  const combined: (Col & Row)[][] = res.rows.map((row) =>
    row.map((col, i) => ({
      ...col,
      ...res.cols[i],
    }))
  );

  const values: any[] = [];
  for (let row of combined) {
    values.push(
      row.reduce((acc, curr) => ({ ...acc, ...parseValue(curr) }), {})
    );
  }

  return {
    values,
    raw: res,
  };
}

export default tursoPlugin;
