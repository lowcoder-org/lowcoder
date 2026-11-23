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

// Releases the connection. A failing detach is logged and never replaces the result or the error of the
// work done on the connection. It calls node-firebird's callback `detach` directly, so it also works when
// promisifyAll(db) has thrown. It does not cover a detach callback that is never called.
async function detachQuietly(db: any) {
  try {
    await new Promise<void>((resolve, reject) => db.detach((err?: Error | null) => (err ? reject(err) : resolve())));
  } catch (e) {
    logger.error(`firebird detach failed: ${e}`);
  }
}

export async function validateDataSourceConfig(dataSourceConfig: DataSourceDataType) {
  const db = await fbdAsync.attachAsync(getFirebirdOptions(dataSourceConfig));
  try {
    promisifyAll(db);
    await db.queryAsync("SELECT 1 FROM RDB$DATABASE;");
  } finally {
    await detachQuietly(db);
  }
  return {
    success: true,
  };
}

const PARAMETER_NAME_CHAR = /[_a-zA-Z0-9\[\]\.]/;

// Replaces every `:name` placeholder with `?` and collects the values in statement order. Placeholders
// are recognised only outside string literals, quoted identifiers and comments. An unterminated literal,
// identifier or comment is copied to the end of the statement unchanged. Q'...' literals are not
// recognised, and `:name` variables inside EXECUTE BLOCK are treated as parameters.
async function prepareQueryParameters(stmt: string, parameters: object) {
  const parametersArray: any[] = [];
  let modifiedStmt = "";
  let i = 0;

  while (i < stmt.length) {
    const ch = stmt[i];
    let end = i + 1;

    if (ch === "'" || ch === '"') {
      const close = stmt.indexOf(ch, i + 1);
      end = close === -1 ? stmt.length : close + 1;
    } else if (stmt.startsWith("--", i)) {
      const nl = stmt.indexOf("\n", i);
      end = nl === -1 ? stmt.length : nl;
    } else if (stmt.startsWith("/*", i)) {
      const close = stmt.indexOf("*/", i + 2);
      end = close === -1 ? stmt.length : close + 2;
    } else if (ch === ":" && PARAMETER_NAME_CHAR.test(stmt.charAt(i + 1))) {
      end = i + 1;
      while (PARAMETER_NAME_CHAR.test(stmt.charAt(end))) {
        end++;
      }
      const paramName = stmt.slice(i + 1, end);
      if (!_.has(parameters, paramName)) {
        throw new ServiceError(`Named parameter "${paramName}" not found in Query Parameters object.`);
      }
      parametersArray.push(_.get(parameters, paramName));
      modifiedStmt += "?";
      i = end;
      continue;
    }

    modifiedStmt += stmt.slice(i, end);
    i = end;
  }

  return {
    stmt: modifiedStmt,
    parametersArray: parametersArray
  }
}

export default async function run(action: ActionDataType, dataSourceConfig: DataSourceDataType, i18n: FirebirdI18nTranslator) {
  if (action.actionName === "Query") {
    const { stmt, parametersArray } = await prepareQueryParameters(action.sql, action.params);

    const db = await fbdAsync.attachAsync(getFirebirdOptions(dataSourceConfig));
    try {
      promisifyAll(db);
      return await db.queryAsync(stmt, parametersArray);
    } finally {
      await detachQuietly(db);
    }
  }
}
