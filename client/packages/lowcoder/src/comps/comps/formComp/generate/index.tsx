import { DataSourceTypeConfig } from "./dataSourceCommon";
import { msSqlConfig } from "./mssql";
import { mysqlConfig } from "./mysql";
import { oracleSqlConfig } from "./oracle";
import { postgreSqlConfig } from "./postgresql";
import { databricksConfig } from "./databricks";
import { DatasourceType } from "@lowcoder-ee/constants/queryConstants";

export function getDataSourceTypeConfig(
  dataSourceType?: DatasourceType
): DataSourceTypeConfig | undefined {
  if (dataSourceType) {
    switch (dataSourceType) {
      case "mysql":
        return mysqlConfig;
      case "postgres":
        return postgreSqlConfig;
      case "databricks":
        return databricksConfig;
      case "mssql":
        return msSqlConfig;
      case "oracle":
        return oracleSqlConfig;
    }
  }
}
