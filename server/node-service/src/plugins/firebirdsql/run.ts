import { DataSourceDataType } from "./dataSourceConfig";
import { ActionDataType } from "./queryConfig";
import { FirebirdI18nTranslator } from "./i18n";
import _ from "lodash";
import Firebird from "node-firebird";

// @ts-ignore
import { promisifyAll } from 'bluebird';
const fbdAsync: any = promisifyAll(Firebird);

function getFirebirdOptions(params: DataSourceDataType) {
  const options = {
    host: params.host.trim(),
    port: params.port,
    database: params.database.trim(),
    user: params.username.trim(),
    password: params.password,
    lowercase_keys: params.lowercaseKeys, // set to true to lowercase keys
    role: _.isEmpty(_.isString(params.role) ? params.role.trim() : null) ? null : params.role.trim(),
    pageSize: 4096, // default when creating database
    retryConnectionInterval: 1000, // reconnect interval in case of connection drop
    blobAsText: params.blobAsText, // set to true to get blob as text, only affects blob subtype 1
    encoding: 'UTF8', // default encoding for connection is UTF-8
  };
  return options;
}

export async function validateDataSourceConfig(dataSourceConfig: DataSourceDataType) {
  try {
    let db = await fbdAsync.attachAsync(getFirebirdOptions(dataSourceConfig));
    promisifyAll(db);
    let result = await db.queryAsync("SELECT 1 FROM RDB$DATABASE;");
    db.detachAsync();
    return {
      success: true,
    };
  } catch (e) {
    throw e;
  }
}

export default async function run(action: ActionDataType, dataSourceConfig: DataSourceDataType, i18n: FirebirdI18nTranslator) {
  if (action.actionName === "Query") {
    let db = await fbdAsync.attachAsync(getFirebirdOptions(dataSourceConfig));
    promisifyAll(db);
    const results = await db.queryAsync(action.sql);
    db.detachAsync();
    return results;
  }
}
