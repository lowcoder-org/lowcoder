import "core-js/actual";
import ResizeObserver from "resize-observer-polyfill";
import numbro from "numbro";
import Papa from "papaparse";
import * as supabase from "@supabase/supabase-js";

import * as uuid from "uuid";
import "regenerator-runtime/runtime";
import { debug } from "loglevel";
import "./index.less";
import log from "loglevel";
import "antd-mobile/es/global";
import 'animate.css';
import {initTranslator as tran1} from "i18n/design";
import {initTranslator as tran2} from "i18n";


window.numbro = numbro;
window.Papa = Papa;
window.uuid = uuid;
window.supabase = supabase;

// for chrome 63
if (!window.ResizeObserver) {
  window.ResizeObserver = ResizeObserver;
}

function hideLoading() {
  // hide loading
  const node = document.getElementById("loading");
  if (node) {
    // @ts-ignore
    node.style.opacity = 0;
  }
}

debug(`REACT_APP_EDITION: ${REACT_APP_EDITION}`);
debug(`REACT_APP_LANGUAGES:, ${REACT_APP_LANGUAGES}`);
debug(`REACT_APP_API_SERVICE_URL:, ${REACT_APP_API_SERVICE_URL}`);
debug(`REACT_APP_NODE_SERVICE_URL:, ${REACT_APP_NODE_SERVICE_URL}`);
debug(`REACT_APP_ENV:, ${REACT_APP_ENV}`);
debug(`REACT_APP_LOG_LEVEL:, ${REACT_APP_LOG_LEVEL}`);
tran1().then(() => {
  tran2().then(async () => {
    try {
      const bootstrap = await import("./app").then(module => module.bootstrap);
      bootstrap();
      hideLoading();
    } catch (e) {
      log.error(e);
    }
  })
})
