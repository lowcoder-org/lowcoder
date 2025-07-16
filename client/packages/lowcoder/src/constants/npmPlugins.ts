// export const SERVER_HOST = `${REACT_APP_NODE_SERVICE_URL ?? ""}`;
// export const NPM_REGISTRY_URL = `${SERVER_HOST}/node-service/api/npm/registry`;
// export const NPM_PLUGIN_ASSETS_BASE_URL = `${SERVER_HOST}/node-service/api/npm/package`;

import { SERVER_HOST } from "./apiConstants";

export const ASSETS_BASE_URL = `api/npm/package`;
export const NPM_REGISTRY_URL = `${SERVER_HOST}/api/npm/registry`;
export const NPM_PLUGIN_ASSETS_BASE_URL = `${SERVER_HOST}/api/npm/package`;