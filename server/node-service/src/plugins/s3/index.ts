import { S3ServiceException } from "@aws-sdk/client-s3";
import { ServiceError } from "../../common/error";
import _ from "lodash";
import { DataSourcePluginFactory, PluginContext } from "lowcoder-sdk/dataSource";
import { ActionDataType } from "./queryConfig";
import { DataSourceDataType } from "./dataSourceConfig";
import run, { validateDataSourceConfig } from "./run";
import getI18nTranslator from "./i18n";
import getDataSourceConfig from "./dataSourceConfig";
import getQueryConfig from "./queryConfig";
import { dirToSpecList } from "../../common/util";
import path from "path";


const specs = {
  "V1.0": "Nothing to do",
}

const s3Plugin: DataSourcePluginFactory = (context: PluginContext) => {
  const i18n = getI18nTranslator(context.languages);
  return {
    id: "s3",
    name: i18n.trans("name"),
    icon: "s3.svg",
    description: i18n.trans("description"),
    category: "Assets",
    dataSourceConfig: getDataSourceConfig(i18n, specs),
    queryConfig: async (data) => {
      return getQueryConfig(i18n, data.specVersion as keyof typeof specs)
    },

    validateDataSourceConfig: async (dataSourceConfig: DataSourceDataType) => {
      return validateDataSourceConfig(dataSourceConfig);
    },

    run: async (
      action: ActionDataType,
      dataSourceConfig: DataSourceDataType,
      ctx: PluginContext
    ) => {
      const i18n = getI18nTranslator(ctx.languages);
      try {
        return await run(action, dataSourceConfig, i18n);
      } catch (e) {
        if (e instanceof S3ServiceException) {
          throw new ServiceError(e.message, 400);
        }
        throw e;
      }
    },
  };
};

export default s3Plugin;
