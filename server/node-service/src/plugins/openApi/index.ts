import SwaggerClient from "swagger-client";
import SwaggerParser from "@apidevtools/swagger-parser";
import { ConfigToType, DataSourcePlugin } from "lowcoder-sdk/dataSource";
import { authParamsConfig, MultiOpenApiSpecItem, parseOpenApi, retrieveSpec } from "./parse";
import {
  extractSecurityParams,
  findOperation,
  replaceServersUrl,
  isOas3,
  normalizeParams,
  parseUrl,
  isFile,
} from "./util";
import { badRequest } from "../../common/error";
import { OpenAPI, OpenAPIV2, OpenAPIV3 } from "openapi-types";
import _ from "lodash";
import { fetch } from "../../common/fetch";
import { RequestInit } from "node-fetch";

const dataSourceConfig = {
  type: "dataSource",
  params: [
    {
      label: "Spec URL",
      key: "url",
      type: "textInput",
      updatable: true,
      rules: [
        {
          required: true,
        },
      ],
      tooltip: "JSON/YAML format spec url of Swagger or OpenApi.",
      placeholder: "https://petstore.swagger.io/v2/swagger.yaml",
    },
    {
      label: "Server URL",
      key: "serverURL",
      type: "textInput",
      tooltip: "Change the default server url written in the spec file.",
      placeholder: "https://example.com/api/v1",
    }
  ],
} as const;

type DataSourceDataType = ConfigToType<typeof dataSourceConfig>;
interface ActionDataType {
  actionName: string;
  [key: string]: any;
}

async function getDefinitions(
  spec: OpenAPI.Document | MultiOpenApiSpecItem[],
  openApiSpecDereferenced?: OpenAPI.Document,
): Promise<{ def: OpenAPI.Document; id: string }[]> {
  if (openApiSpecDereferenced) {
    return [{
      def: openApiSpecDereferenced,
      id: "",
    }]
  } else {
    const specList = Array.isArray(spec) ? spec : [{ spec, id: "" }];
    return await Promise.all(
      specList.map(async ({id, spec}) => {
        const deRefedSpec = await SwaggerParser.dereference(spec, { dereference: {
          circular: true, // Retains circular references
        },
        resolve: {
          external: false,
          http: false,
        },
      });
        return {
          def: deRefedSpec,
          id,
        };
      })
    );
  }
}

export async function runOpenApi(
  actionData: ActionDataType,
  dataSourceConfig: DataSourceDataType,
  spec: OpenAPI.Document | MultiOpenApiSpecItem[],
  defaultHeaders?: Record<string, string>,
  openApiSpecDereferenced?: OpenAPI.Document,
) {
  const { actionName, ...otherActionData } = actionData;
  const { serverURL } = dataSourceConfig;

  let operation, realOperationId, definition: OpenAPI.Document | undefined;

  for (const {id, def} of await getDefinitions(spec, openApiSpecDereferenced)) {
    const ret = findOperation(actionName, def, id);
    if (ret) {
      definition = def;
      operation = ret.operation;
      realOperationId = ret.realOperationId;
      break;
    }
  }

  if (!operation || !definition) {
    throw badRequest(`unknown operation: ${actionName}`);
  }

  const isOas3Spec = isOas3(definition);
  if (serverURL) {
    if (isOas3Spec) {
      replaceServersUrl(definition as OpenAPIV3.Document, serverURL);
    } else {
      const swaggerDoc = definition as OpenAPIV2.Document;
      const { host, pathname, schema } = parseUrl(serverURL);
      swaggerDoc.host = host || swaggerDoc.host;
      swaggerDoc.basePath = pathname || swaggerDoc.basePath;
      swaggerDoc.schemes = [schema];
    }
  }

  try {
    const { parameters, requestBody } = normalizeParams(otherActionData, operation, isOas3Spec);
    let securities = extractSecurityParams(dataSourceConfig, definition);

    const response = await SwaggerClient.execute({
      spec: definition,
      operationId: realOperationId,
      parameters,
      requestBody,
      securities,
      responseContentType: "application/json",
      userFetch: async (url: string, req: RequestInit) => {
        return fetch(url, req);
      },
      requestInterceptor: (req: any) => {
        const headers = _.omitBy(req.headers, (i) => !i);
        const ret = {
          ...req,
          duplex: "half",
          headers: {
            ...defaultHeaders,
            ...headers,
          },
        };
        return ret;
      },
    });
    return response.body;
  } catch (e: any) {
    if (e.response?.body) {
      return e.response.body;
    }
    if (e.status) {
      logger.error(`Request failure: ${JSON.stringify(e.response)} ${e.status}`)
      throw badRequest(`status: ${e.status}`);
    }
    throw e;
  }
}

const openApiPlugin: DataSourcePlugin<ActionDataType, DataSourceDataType> = {
  id: "openApi",
  name: "Open API",
  icon: "swagger.svg",
  category: "App Development",
  dataSourceConfig: {
    ...dataSourceConfig,
    extra: async (dataSourceConfig) => {
      // called whenever datasource config opens or changes
      const { url} = dataSourceConfig;
      const { spec: specObj} = await retrieveSpec(url);
      const extraParams = await authParamsConfig(specObj);
      const spec = JSON.stringify(specObj);
      return {
        data: {
          spec,
        },
        extraParams,
      };
    },
  },
  queryConfig: async (data) => {
    const spec = data.extra?.spec;
    if (!spec) {
      throw badRequest("Specification not found in extra field, please recreate the data source.");
    }
    const { actions, categories } = await parseOpenApi(spec);
    return {
      type: "query",
      label: "Operation",
      categories: {
        label: "Resource",
        items: categories,
      },
      actions,
    } as const;
  },
  run: (actionData, dataSourceConfig) => {
    let spec = dataSourceConfig.extra?.spec;
    if (!spec) {
      throw badRequest("Specification not found in extra field, please recreate the data source.");
    }

    if (typeof spec === "string") {
      spec = JSON.parse(spec);
    }

    return runOpenApi(actionData, dataSourceConfig, spec);
  },
};

export default openApiPlugin;