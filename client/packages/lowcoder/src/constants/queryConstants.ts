import { JSQuery } from "../comps/queries/jsQuery";
import { SQLQuery } from "../comps/queries/sqlQuery/SQLQuery";
import { HttpQuery } from "../comps/queries/httpQuery/httpQuery";
import { StreamQuery } from "../comps/queries/httpQuery/streamQuery";
import { MongoQuery } from "../comps/queries/mongoQuery";
import { LowcoderQuery } from "../comps/queries/lowcoderQuery";
import { RedisQuery } from "../comps/queries/redisQuery";
import { EsQuery } from "../comps/queries/esQuery";
import { SMTPQuery } from "../comps/queries/smtpQuery";
import { LibraryQuery } from "../comps/queries/libraryQuery";
import { ViewQuery } from "../comps/queries/viewQuery";
import { GoogleSheetsQuery } from "../comps/queries/googleSheetsQuery";
import { GraphqlQuery } from "../comps/queries/httpQuery/graphqlQuery";
import { toPluginQuery } from "comps/queries/pluginQuery/pluginQuery";
import { MultiCompConstructor } from "lowcoder-core";
import { DataSourcePluginMeta } from "lowcoder-sdk/dataSource";

export type DatasourceType =
  | "mysql"
  | "mongodb"
  | "restApi"
  | "streamApi"
  | "postgres"
  | "lowcoderApi"
  | "redis"
  | "es"
  | "mssql"
  | "smtp"
  | "oracle"
  | "clickHouse"
  | "googleSheets"
  | "graphql"
  | "snowflake"
  | "mariadb";

export type ResourceType = DatasourceType | "js" | "libraryQuery" | "view";

export const QueryMap = {
  js: JSQuery,
  mysql: SQLQuery,
  restApi: HttpQuery,
  streamApi: StreamQuery,
  mongodb: MongoQuery,
  postgres: SQLQuery,
  lowcoderApi: LowcoderQuery,
  redis: RedisQuery,
  es: EsQuery,
  mssql: SQLQuery,
  smtp: SMTPQuery,
  oracle: SQLQuery,
  clickHouse: SQLQuery,
  libraryQuery: LibraryQuery,
  view: ViewQuery,
  googleSheets: GoogleSheetsQuery,
  graphql: GraphqlQuery,
  snowflake: SQLQuery,
  mariadb: SQLQuery,
};

export const JsPluginQueryMap: Record<string, MultiCompConstructor> = {};

export function registryDataSourcePlugin(
  name: string,
  dataSourceId: string,
  dataSourcePlugin: DataSourcePluginMeta
) {
  const type = `${name}:${dataSourceId}` as `${string}:${string}`;
  if (!dataSourcePlugin) {
    return;
  }
  const { queryConfig } = dataSourcePlugin;
  if (!queryConfig || queryConfig.type === "dynamic") {
    return;
  }
  JsPluginQueryMap[type] = toPluginQuery(queryConfig) as MultiCompConstructor;
}

// Initialized as write mode, need to switch to the manually executed query when creating a new query or switching data sources
export const manualTriggerResource: ResourceType[] = ["js", "smtp"];

export const QUERY_EXECUTION_OK = "OK";
export const QUERY_EXECUTION_ERROR = "QUERY_EXECUTION_ERROR";
