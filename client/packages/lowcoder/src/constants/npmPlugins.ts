import { sdkConfig } from "./sdkConfig";

const baseUrl = sdkConfig.baseURL || LOWCODER_NODE_SERVICE_URL || "";
export const NPM_REGISTRY_URL = `${baseUrl}/node-service/api/npm/registry`;
export const NPM_PLUGIN_ASSETS_BASE_URL = `${baseUrl}/node-service/api/npm/package`;
