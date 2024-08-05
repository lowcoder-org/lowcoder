import { DataSourcePlugin } from "lowcoder-sdk/dataSource";
import dataSourceConfig, { DataSourceDataType } from "./dataSourceConfig";
import queryConfig, { ActionDataType } from "./queryConfig";
import { runFirebasePlugin } from "./run";

const specs = {
  "v1.0": queryConfig
}

const firebasePlugin: DataSourcePlugin<ActionDataType, DataSourceDataType> = {
  id: "firebase",
  icon: "firebase.svg",
  name: "Firebase",
  category: "api",
  queryConfig: async (data) => {
    return specs[data.specVersion as keyof typeof specs]
  },
  dataSourceConfig,
  run: function (actionData, dataSourceConfig): Promise<any> {
    return runFirebasePlugin(actionData, dataSourceConfig);
  },
};

export default firebasePlugin;
