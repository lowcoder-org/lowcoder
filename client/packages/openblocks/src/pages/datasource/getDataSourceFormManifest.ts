import { DatasourceType } from "@lowcoder-ee/constants/queryConstants";
import { DatasourceFormRegistry } from "@lowcoder-ee/pages/datasource/form/datasourceFormRegistry";
import { DataSourcePluginMeta } from "lowcoder-sdk/dataSource";
import { DatasourceFormManifest } from "./form/datasourceFormRegistry";
import { PluginDataSourceForm } from "./form/pluginDataSourceForm";

export function getDataSourceFormManifest(
  dataSourceType: DatasourceType,
  plugin?: DataSourcePluginMeta
): DatasourceFormManifest | undefined {
  if (plugin) {
    return {
      form: PluginDataSourceForm,
      enableTest: !!plugin.shouldValidateDataSourceConfig,
    };
  }

  return DatasourceFormRegistry[dataSourceType];
}
