import { withMethodExposing } from "../generators/withMethodExposing";
import { isEmpty } from "lodash";
import { simpleMultiComp, stateComp, withViewFn } from "../generators";
import { NameConfig, withExposingConfigs } from "../generators/withExposing";
import { JSONObject } from "../../util/jsonTypes";
import { useEffect, useMemo, useCallback } from "react";
import isEqual from "fast-deep-equal";
import { trans } from "i18n";
import log from "loglevel";

const APP_STORE_NAMESPACE = "lowcoder_app_local_storage";

const LocalStorageCompBase = withViewFn(
  simpleMultiComp({ values: stateComp<JSONObject>({}) }),
  (comp) => {
    const originStore = localStorage.getItem(APP_STORE_NAMESPACE) || "{}";

    let parseStore = {};
    try {
      parseStore = JSON.parse(originStore);
    } catch (e) {
      log.error("application local storage invalid");
    }

    useEffect(() => {
      const value = comp.children.values.value;
      if (!isEqual(value, parseStore)) {
        comp.children.values.dispatchChangeValueAction(parseStore);
      }
    }, [parseStore]);

    useEffect(() => {
      const handler = () => {
        try {
          const raw = localStorage.getItem(APP_STORE_NAMESPACE) || "{}";
          const parsed = JSON.parse(raw);
          comp.children.values.dispatchChangeValueAction(parsed);
        } catch (e) {
          log.error("Failed to parse localStorage:", e);
        }
      };

      // Add listener on mount
      window.addEventListener("lowcoder-localstorage-updated", handler);

      return () => {
        window.removeEventListener("lowcoder-localstorage-updated", handler);
      };
    }, []);

    return null;
  }
);

export let LocalStorageComp = withExposingConfigs(LocalStorageCompBase, [
  new NameConfig("values", trans("localStorageComp.valueDesc")),
]);

LocalStorageComp = withMethodExposing(LocalStorageComp, [
  {
    method: {
      name: "setItem",
      description: trans("localStorageComp.setItemDesc"),
      params: [
        { name: "key", type: "string" },
        { name: "value", type: "JSONValue" },
      ],
    },
    execute: (comp, params) => {
      const key = params?.[0];
      const value = params?.[1];

      if (typeof key === "string" && !isEmpty(key)) {
        try {
          const originStore = localStorage.getItem(APP_STORE_NAMESPACE) || "{}";
          if (originStore.length > 1024 * 1024) {
            return; // Limit up to 1m
          }

          const parseStore = JSON.parse(originStore);
          parseStore[key] = value;
          localStorage.setItem(APP_STORE_NAMESPACE, JSON.stringify(parseStore));
          comp.children.values.dispatchChangeValueAction(parseStore);

          window.dispatchEvent(new CustomEvent("lowcoder-localstorage-updated"));
        } catch (e) {
          localStorage.setItem(APP_STORE_NAMESPACE, "{}");
        }
      }
    },
  },
  {
    method: {
      name: "removeItem",
      description: trans("localStorageComp.removeItemDesc"),
      params: [{ name: "key", type: "string" }],
    },
    execute: (comp, params) => {
      const key = params?.[0];
      if (typeof key === "string" && !isEmpty(key)) {
        try {
          const originStore = localStorage.getItem(APP_STORE_NAMESPACE) || "{}";
          const parseStore = JSON.parse(originStore);
          delete parseStore[key];
          localStorage.setItem(APP_STORE_NAMESPACE, JSON.stringify(parseStore));
          comp.children.values.dispatchChangeValueAction(parseStore);

          //  Trigger update
          window.dispatchEvent(new CustomEvent("lowcoder-localstorage-updated"));
        } catch (e) {
          localStorage.setItem(APP_STORE_NAMESPACE, "{}");
        }
      }
    },
  },
  {
    method: {
      name: "clear",
      description: trans("localStorageComp.clearItemDesc"),
      params: [],
    },
    execute: (comp) => {
      localStorage.removeItem(APP_STORE_NAMESPACE);
      comp.children.values.dispatchChangeValueAction({});

      // Trigger update
      window.dispatchEvent(new CustomEvent("lowcoder-localstorage-updated"));
    },
  },
]);
