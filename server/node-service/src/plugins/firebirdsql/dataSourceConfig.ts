import { ConfigToType } from "lowcoder-sdk/dataSource";
import { FirebirdI18nTranslator } from "./i18n";

const getDataSourceConfig = (i18n: FirebirdI18nTranslator) => {
  const dataSourceConfig = {
    type: "dataSource",
    params: [
      {
        key: "host",
        label: "Host Address",
        type: "textInput",
        placeholder: "<FQDN or IP address>",
        rules: [{ required: true, message: i18n.trans("hostRequiredMessage") }],
      },
      {
        key: "database",
        label: "Database name",
        type: "textInput",
        placeholder: "database.fdb",
        rules: [{ required: true, message: i18n.trans("dbnameRequiredMessage") }],
      },
      {
        key: "port",
        label: i18n.trans("port"),
        type: "numberInput",
        defaultValue: 3050,
        rules: [{ required: true, message: i18n.trans("portRequiredMessage") }],
      },
      {
        key: "username",
        label: i18n.trans("username"),
        type: "textInput",
        defaultValue: "SYSDBA",
        rules: [{ required: true, message: i18n.trans("usernameRequiredMessage") }],
      },
      {
        key: "password",
        label: i18n.trans("password"),
        type: "password",
        defaultValue: "masterkey",
      },
      {
        key: "role",
        label: i18n.trans("role"),
        type: "textInput",
        defaultValue: "",
      },
      {
        key: "lowercaseKeys",
        label: i18n.trans("lowercaseKeys"),
        type: "checkbox",
        defaultValue: true,
      },
      {
        key: "blobAsText",
        label: i18n.trans("blobAsText"),
        type: "checkbox",
        defaultValue: true,
      },
    ],
  } as const;
  return dataSourceConfig;
};

export default getDataSourceConfig;

export type DataSourceDataType = ConfigToType<ReturnType<typeof getDataSourceConfig>>;
