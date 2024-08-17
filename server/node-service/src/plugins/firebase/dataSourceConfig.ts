import { ConfigToType } from "lowcoder-sdk/dataSource";
import { specsToOptions } from "../../common/util";

const specs = {
  "v1.0": ""
}
const dataSourceConfig = {
  type: "dataSource",
  params: [
    {
      key: "databaseUrl",
      label: "Database URL",
      tooltip:
        "You can find your database URL and Firestore ID in your [Firebase project console](https://console.firebase.google.com/). Required for Realtime database.",
      type: "textInput",
    },
    {
      key: "firestoreId",
      label: "Project ID",
      tooltip: "Firebase project ID, Optional when the Database URL is filled.",
      type: "textInput",
    },
    {
      key: "privateKey",
      label: "Private Key",
      type: "password",
      tooltip:
        "The [document](https://firebase.google.com/docs/admin/setup) on how to obtain the private key.",
    },
    {
      label: "Spec Version",
      key: "specVersion",
      type: "select",
      tooltip: "Version of the spec file.",
      placeholder: "v1.0",
      options: specsToOptions(specs)
    },
  ],
} as const;

export type DataSourceDataType = ConfigToType<typeof dataSourceConfig>;

export default dataSourceConfig;
