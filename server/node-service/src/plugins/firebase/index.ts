import { DataSourcePlugin } from "lowcoder-sdk/dataSource";
import dataSourceConfig, { DataSourceDataType } from "./dataSourceConfig";
import queryConfig, { ActionDataType } from "./queryConfig";
import { runFirebasePlugin } from "./run";
import { version2spec } from "../../common/util";

const specs = {
  "v1.0": queryConfig
}

const firebasePlugin: DataSourcePlugin<ActionDataType, DataSourceDataType> = {
  id: "firebase",
  icon: "firebase.svg",
  name: "Google Firebase",
  category: "App Development",
  queryConfig: async (data) => {
    return version2spec(specs, data.specVersion);
  },
  dataSourceConfig,
  run: function (actionData, dataSourceConfig): Promise<any> {
    return runFirebasePlugin(actionData, dataSourceConfig);
  },
};

export default firebasePlugin;
