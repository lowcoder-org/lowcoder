import { DataSourceDataType } from "./dataSourceConfig";
import { ActionDataType } from "./queryConfig";
import { FirebirdI18nTranslator } from "./i18n";
import { ServiceError } from "../../common/error";
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

async function prepareQueryParameters(stmt: string, parameters: object) {
  const re : RegExp = /(:)([_a-zA-Z0-9\[\]\.]+)/gm;

  const placeholdersInStmt = stmt.matchAll(re);

  let parametersArray: any[] = [];

  for(const match of placeholdersInStmt) {
    const paramName: string = match[2];
    if (_.isNil(paramName)) {
      continue;
    }
    if (!_.has(parameters, paramName)) {
      throw new ServiceError(`Named parameter "${paramName}" not found in Query Parameters object.`);
    }
    parametersArray.push(_.get(parameters, paramName));
  }

  const modifiedStmt = stmt.replaceAll(re, "?");

  return {
    stmt: modifiedStmt,
    parametersArray: parametersArray
  }
}

export default async function run(action: ActionDataType, dataSourceConfig: DataSourceDataType, i18n: FirebirdI18nTranslator) {
  if (action.actionName === "Query") {
    let db = await fbdAsync.attachAsync(getFirebirdOptions(dataSourceConfig));
    promisifyAll(db);

    const { stmt, parametersArray } = await prepareQueryParameters(action.sql, action.params);

    const results = await db.queryAsync(stmt, parametersArray);

    db.detachAsync();
    return results;
  }
}
