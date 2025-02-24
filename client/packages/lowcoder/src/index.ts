import "core-js/actual";
import ResizeObserver from "resize-observer-polyfill";
import numbro from "numbro";
import Papa from "papaparse";
import * as supabase from "@supabase/supabase-js";
import * as alasql from "alasql";

import * as uuid from "uuid";
import "regenerator-runtime/runtime";
import "virtual:globals";
import { debug } from "loglevel";
import { bootstrap } from "./app";
import "./index.less";
import log from "loglevel";
import "antd-mobile/es/global";
import 'animate.css';

window.numbro = numbro;
window.Papa = Papa;
window.uuid = uuid;
window.supabase = supabase;
window.alasql = alasql;

// for chrome 63
if (!window.ResizeObserver) {
  window.ResizeObserver = ResizeObserver;
}

debug(`REACT_APP_EDITION: ${REACT_APP_EDITION}`);
debug(`REACT_APP_LANGUAGES:, ${REACT_APP_LANGUAGES}`);
debug(`REACT_APP_API_SERVICE_URL:, ${REACT_APP_API_SERVICE_URL}`);
debug(`REACT_APP_NODE_SERVICE_URL:, ${REACT_APP_NODE_SERVICE_URL}`);
debug(`REACT_APP_ENV:, ${REACT_APP_ENV}`);
debug(`REACT_APP_LOG_LEVEL:, ${REACT_APP_LOG_LEVEL}`);
 
try {
  bootstrap();
  // hideLoading();
} catch (e) {
  log.error(e);
}
