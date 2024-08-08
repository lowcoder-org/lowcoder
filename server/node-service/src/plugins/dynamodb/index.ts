import { DataSourcePlugin } from "lowcoder-sdk/dataSource";
import dataSourceConfig, { DataSourceDataType } from "./dataSourceConfig";
import queryConfig, { ActionDataType } from "./queryConfig";
import { runDynamoDbQuery } from "./run";
import { version2spec } from "../../common/util";

const specs = {
  "v1.0": queryConfig
}

const dynamoDBPlugin: DataSourcePlugin<ActionDataType, DataSourceDataType> = {
  id: "dynamodb",
  name: "DynamoDB",
  category: "database",
  icon: "dynamodb.svg",
  dataSourceConfig,
  queryConfig: async (data) => {
    return version2spec(specs, data.specVersion);
  },
  run: async function (actionData, dataSourceConfig): Promise<any> {
    return runDynamoDbQuery(actionData, dataSourceConfig);
  },
};

export default dynamoDBPlugin;
