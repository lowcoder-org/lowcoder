import { DatasourceType } from "@lowcoder-ee/constants/queryConstants";
import { DatasourceConfigType } from "api/datasourceApi";
import { getBottomResIcon } from "@lowcoder-ee/util/bottomResUtils";
import { trans } from "i18n";
import { DataSourcePluginMeta } from "lowcoder-sdk/dataSource";

export const databasePlugins: Partial<DatasourceType>[] = [
  "mysql",
  "mongodb",
  "postgres",
  "redis",
  "es",
  "mssql",
  "oracle",
  "clickHouse",
  "snowflake",
  "mariadb",
];

export const apiPluginsForQueryLibrary: Partial<DatasourceType>[] = [
  "restApi",
  "smtp",
  "graphql",
  "googleSheets",
];

export const apiPlugins: Partial<DatasourceType>[] = [...apiPluginsForQueryLibrary];

export interface Datasource {
  id: string;
  name: string;
  type: DatasourceType;
  organizationId: string;
  datasourceConfig: DatasourceConfigType;
  // USER_CREATED(0):  user self create
  // SYSTEM_TEMPLATE(1) for example: onboard datasource, template datasource
  // SYSTEM_PREDEFINED(2) for example: rest api empty datasource
  creationSource: 0 | 1 | 2;
  createTime: number;
  pluginDefinition?: DataSourcePluginMeta;
}

export const QUICK_REST_API_ID = "#QUICK_REST_API";
export const QUICK_GRAPHQL_ID = "#QUICK_GRAPHQL";
export const LOWCODER_API_ID = "#LOWCODER_API";
export const LOWCODER_API_INFO = {
  icon: getBottomResIcon("lowcoderApi"),
  name: trans("query.lowcoderAPI"),
};
export const OLD_LOWCODER_DATASOURCE: Partial<DatasourceType>[] = [];
