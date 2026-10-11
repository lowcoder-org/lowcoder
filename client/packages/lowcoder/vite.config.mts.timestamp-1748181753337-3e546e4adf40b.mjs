// vite.config.mts
import dotenv from "file:///Users/raheeliftikhar/Work/lowcoder-main/client/node_modules/dotenv/lib/main.js";
import { defineConfig } from "file:///Users/raheeliftikhar/Work/lowcoder-main/client/node_modules/vite/dist/node/index.js";
import react from "file:///Users/raheeliftikhar/Work/lowcoder-main/client/node_modules/@vitejs/plugin-react/dist/index.mjs";
import viteTsconfigPaths from "file:///Users/raheeliftikhar/Work/lowcoder-main/client/node_modules/vite-tsconfig-paths/dist/index.mjs";
import svgrPlugin from "file:///Users/raheeliftikhar/Work/lowcoder-main/client/node_modules/vite-plugin-svgr/dist/index.mjs";
import checker from "file:///Users/raheeliftikhar/Work/lowcoder-main/client/node_modules/vite-plugin-checker/dist/esm/main.js";
import { visualizer } from "file:///Users/raheeliftikhar/Work/lowcoder-main/client/node_modules/rollup-plugin-visualizer/dist/plugin/index.js";
import path from "path";
import chalk from "file:///Users/raheeliftikhar/Work/lowcoder-main/client/node_modules/chalk/source/index.js";
import { createHtmlPlugin } from "file:///Users/raheeliftikhar/Work/lowcoder-main/client/node_modules/vite-plugin-html/dist/index.mjs";
import dynamicImport from "file:///Users/raheeliftikhar/Work/lowcoder-main/client/node_modules/vite-plugin-dynamic-import/dist/index.mjs";

// src/dev-utils/util.js
function ensureLastSlash(str) {
  if (!str) {
    return "/";
  }
  if (!str.endsWith("/")) {
    return `${str}/`;
  }
  return str;
}

// src/dev-utils/buildVars.js
var buildVars = [
  {
    name: "PUBLIC_URL",
    defaultValue: "/"
  },
  {
    name: "REACT_APP_EDITION",
    defaultValue: "community"
  },
  {
    name: "REACT_APP_LANGUAGES",
    defaultValue: ""
  },
  {
    name: "REACT_APP_COMMIT_ID",
    defaultValue: "00000"
  },
  {
    name: "REACT_APP_API_SERVICE_URL",
    defaultValue: ""
  },
  {
    name: "REACT_APP_NODE_SERVICE_URL",
    defaultValue: ""
  },
  {
    name: "REACT_APP_ENV",
    defaultValue: "production"
  },
  {
    name: "REACT_APP_BUILD_ID",
    defaultValue: ""
  },
  {
    name: "REACT_APP_LOG_LEVEL",
    defaultValue: "error"
  },
  {
    name: "REACT_APP_IMPORT_MAP",
    defaultValue: "{}"
  },
  {
    name: "REACT_APP_SERVER_IPS",
    defaultValue: ""
  },
  {
    name: "REACT_APP_BUNDLE_BUILTIN_PLUGIN",
    defaultValue: ""
  },
  {
    name: "REACT_APP_BUNDLE_TYPE",
    defaultValue: "app"
  },
  {
    name: "REACT_APP_DISABLE_JS_SANDBOX",
    defaultValue: ""
  }
];

// src/dev-utils/external.js
var libs = [
  "axios",
  "redux",
  "react-router",
  "react-router-dom",
  "react-redux",
  "react",
  "react-dom",
  "lodash",
  "history",
  "antd",
  "@dnd-kit/core",
  "@dnd-kit/modifiers",
  "@dnd-kit/sortable",
  "@dnd-kit/utilities",
  {
    name: "moment",
    extractDefault: true
  },
  {
    name: "dayjs",
    extractDefault: true
  },
  {
    name: "lowcoder-sdk",
    from: "./src/index.sdk.ts"
  },
  {
    name: "styled-components",
    mergeDefaultAndNameExports: true
  }
];
var getLibGlobalVarName = (name) => {
  return "$" + name.replace(/@/g, "$").replace(/[\/\-]/g, "_");
};
var libsImportCode = (exclude = []) => {
  const importLines = [];
  const assignLines = [];
  libs.forEach((i) => {
    let name = i;
    let merge = false;
    let from = name;
    let extractDefault = false;
    if (typeof i === "object") {
      name = i.name;
      merge = i.mergeDefaultAndNameExports ?? false;
      from = i.from ?? name;
      extractDefault = i.extractDefault ?? false;
    }
    if (exclude.includes(name)) {
      return;
    }
    const varName = getLibGlobalVarName(name);
    if (merge) {
      importLines.push(`import * as ${varName}_named_exports from '${from}';`);
      importLines.push(`import ${varName} from '${from}';`);
      assignLines.push(`Object.assign(${varName}, ${varName}_named_exports);`);
    } else if (extractDefault) {
      importLines.push(`import ${varName} from '${from}';`);
    } else {
      importLines.push(`import * as ${varName} from '${from}';`);
    }
    assignLines.push(`window.${varName} = ${varName};`);
  });
  return importLines.concat(assignLines).join("\n");
};

// src/dev-utils/globalDepPlguin.js
function globalDepPlugin(exclude = []) {
  const virtualModuleId = "virtual:globals";
  return {
    name: "lowcoder-global-plugin",
    resolveId(id) {
      if (id === virtualModuleId) {
        return id;
      }
    },
    load(id) {
      if (id === virtualModuleId) {
        return libsImportCode(exclude);
      }
    }
  };
}

// vite.config.mts
import { terser } from "file:///Users/raheeliftikhar/Work/lowcoder-main/client/node_modules/rollup-plugin-terser/rollup-plugin-terser.mjs";
var __vite_injected_original_dirname = "/Users/raheeliftikhar/Work/lowcoder-main/client/packages/lowcoder";
dotenv.config();
var apiProxyTarget = process.env.LOWCODER_API_SERVICE_URL;
var nodeServiceApiProxyTarget = process.env.LOWCODER_NODE_SERVICE_URL;
var nodeEnv = process.env.NODE_ENV ?? "development";
var isDev = nodeEnv === "development";
var isVisualizerEnabled = !!process.env.ENABLE_VISUALIZER;
var browserCheckFileName = `browser-check.js`;
var base = ensureLastSlash(process.env.PUBLIC_URL);
if (!apiProxyTarget && isDev) {
  console.log();
  console.log(chalk.red`LOWCODER_API_SERVICE_URL is required.\n`);
  console.log(chalk.cyan`Start with command: LOWCODER_API_SERVICE_URL=\{backend-api-addr\} yarn start`);
  console.log();
  process.exit(1);
}
var proxyConfig = {
  "/api": {
    target: apiProxyTarget,
    changeOrigin: false
  }
};
if (nodeServiceApiProxyTarget) {
  proxyConfig["/node-service"] = {
    target: nodeServiceApiProxyTarget
  };
}
var define = {};
buildVars.forEach(({ name, defaultValue }) => {
  define[name] = JSON.stringify(process.env[name] || defaultValue);
});
var viteConfig = {
  define,
  assetsInclude: ["**/*.md"],
  resolve: {
    extensions: [".mjs", ".js", ".ts", ".jsx", ".tsx", ".json"],
    alias: {
      "@lowcoder-ee": path.resolve(
        __vite_injected_original_dirname,
        "../lowcoder/src"
      )
    }
  },
  base,
  build: {
    minify: "terser",
    manifest: true,
    target: "es2020",
    cssTarget: "chrome87",
    outDir: "build",
    assetsDir: "static",
    emptyOutDir: false,
    rollupOptions: {
      treeshake: {
        moduleSideEffects: true,
        propertyReadSideEffects: false,
        tryCatchDeoptimization: false,
        unknownGlobalSideEffects: false
      },
      output: {
        inlineDynamicImports: false,
        chunkFileNames: "[name]-[hash].js",
        manualChunks: (id) => {
          if (id.includes("node_modules")) {
            if (id.includes("@ant-design/icons"))
              return "ant-design-icons";
            if (id.includes("node_modules/antd"))
              return "antd";
            if (id.includes("styled-components"))
              return "styled-components";
            if (id.includes("react-qr-barcode-scanner"))
              return "barcode";
            if (id.includes("codemirror"))
              return "codemirror";
            if (id.includes("quill"))
              return "quill";
            if (id.includes("react-json-view"))
              return "react-json-view";
            if (id.includes("react-quill"))
              return "react-quill";
            if (id.includes("remark-gfm"))
              return "remark-gfm";
            if (id.includes("rehype-raw"))
              return "rehype-raw";
            if (id.includes("rehype-sanitize"))
              return "rehype-sanitize";
            if (id.includes("@dnd-kit"))
              return "dnd-kit";
            if (id.includes("react-draggable"))
              return "react-draggable";
            if (id.includes("react-grid-layout"))
              return "react-grid-layout";
            if (id.includes("react-sortable-hoc"))
              return "react-sortable-hoc";
            if (id.includes("@fortawesome"))
              return "fontawesome";
            if (id.includes("@remixicon"))
              return "remixicon";
            if (id.includes("moment"))
              return "moment";
            if (id.includes("date-fns"))
              return "date-fns";
            if (id.includes("dayjs"))
              return "dayjs";
            if (id.includes("clsx"))
              return "clsx";
            if (id.includes("immer"))
              return "immer";
            if (id.includes("lodash"))
              return "lodash";
            if (id.includes("lodash-es"))
              return "lodash-es";
            if (id.includes("uuid"))
              return "uuid";
            if (id.includes("ua-parser-js"))
              return "ua-parser-js";
            if (id.includes("html2canvas"))
              return "ua-parser-js";
            if (id.includes("numbro"))
              return "numbro";
            if (id.includes("buffer"))
              return "buffer";
            if (id.includes("file-saver"))
              return "file-saver";
            if (id.includes("papaparse"))
              return "papaparse";
            if (id.includes("parse5"))
              return "parse5";
            if (id.includes("xlsx"))
              return "xlsx";
            if (id.includes("alasql"))
              return "alasql";
            if (id.includes("sql-formatter"))
              return "sql-formatter";
            if (id.includes("axios"))
              return "axios";
            if (id.includes("fetch"))
              return "fetch";
            if (id.includes("http"))
              return "http-modules";
            if (id.includes("https"))
              return "https-modules";
            if (id.includes("sockjs"))
              return "websockets";
            if (id.includes("websocket"))
              return "websockets";
            if (id.includes("react-error-boundary"))
              return "react-error-boundary";
            if (id.includes("redux-devtools-extension"))
              return "redux-devtools";
            if (id.includes("regenerator-runtime"))
              return "regenerator-runtime";
            if (id.includes("eslint4b-prebuilt-2"))
              return "eslint4b-prebuilt-2";
            if (id.includes("cnchar"))
              return "cnchar";
            if (id.includes("hotkeys-js"))
              return "hotkeys-js";
            if (id.includes("loglevel"))
              return "loglevel";
            if (id.includes("qrcode.react"))
              return "qrcode-react";
            if (id.includes("react-joyride"))
              return "react-joyride";
            if (id.includes("rc-trigger"))
              return "rc-trigger";
            if (id.includes("really-relaxed-json"))
              return "really-relaxed-json";
            if (id.includes("simplebar-react"))
              return "simplebar-react";
            if (id.includes("react-documents"))
              return "react-documents";
            if (id.includes("react-colorful"))
              return "react-colorful";
            if (id.includes("react-best-gradient-color-picker"))
              return "react-best-gradient-color-picker";
            if (id.includes("@supabase/supabase-js"))
              return "supabase";
            return null;
          }
          return null;
        }
      },
      plugins: [
        terser({
          compress: {
            drop_console: true,
            drop_debugger: true,
            pure_funcs: ["console.info", "console.debug", "console.log"]
          },
          format: {
            comments: /(@vite-ignore|webpackIgnore)/
          }
        })
      ],
      onwarn: (warning, warn) => {
        if (warning.code === "MODULE_LEVEL_DIRECTIVE") {
          return;
        }
        warn(warning);
      }
    },
    commonjsOptions: {
      transformMixedEsModules: true,
      defaultIsModuleExports: (id) => {
        if (id.indexOf("antd/lib") !== -1) {
          return false;
        }
        return "auto";
      }
    }
  },
  optimizeDeps: {
    entries: ["./src/**/*.{js,jsx,ts,tsx}"],
    include: ["antd"]
    // include: ['antd/**/*'],
    // force: true,
  },
  css: {
    preprocessorOptions: {
      less: {
        modifyVars: {
          "@primary-color": "#b480de",
          "@link-color": "#3377FF",
          "@border-color-base": "#b480de",
          "@border-radius-base": "4px"
        },
        javascriptEnabled: true
      }
    },
    modules: {
      // Configuration for CSS modules
      scopeBehaviour: "local"
      // Ensures CSS modules are scoped locally by default
    }
  },
  server: {
    open: true,
    cors: true,
    port: 8e3,
    host: "0.0.0.0",
    proxy: proxyConfig
  },
  plugins: [
    checker({
      typescript: true,
      eslint: {
        lintCommand: 'eslint --quiet "./src/**/*.{ts,tsx}"',
        dev: {
          logLevel: ["error"]
        }
      }
    }),
    react({
      babel: {
        parserOpts: {
          plugins: ["decorators-legacy"]
        }
      }
    }),
    viteTsconfigPaths({
      projects: ["../lowcoder/tsconfig.json", "../lowcoder-design/tsconfig.json"]
    }),
    svgrPlugin({
      svgrOptions: {
        exportType: "named",
        prettier: false,
        svgo: false,
        titleProp: true,
        ref: true
      }
    }),
    globalDepPlugin(),
    createHtmlPlugin({
      minify: true,
      inject: {
        data: {
          browserCheckScript: isDev ? "" : `<script src="${base}${browserCheckFileName}"></script>`
        }
      }
    }),
    isVisualizerEnabled && visualizer(),
    dynamicImport(),
    { include: ["process"] }
  ].filter(Boolean)
};
var browserCheckConfig = {
  ...viteConfig,
  define: {
    ...viteConfig.define,
    "process.env.NODE_ENV": JSON.stringify("production")
  },
  build: {
    ...viteConfig.build,
    manifest: false,
    copyPublicDir: true,
    emptyOutDir: true,
    lib: {
      formats: ["es"],
      name: "BrowserCheck",
      entry: "./src/browser-check.ts",
      fileName: () => {
        return browserCheckFileName;
      }
    }
  }
};
var buildTargets = {
  main: viteConfig,
  browserCheck: browserCheckConfig
};
var buildTarget = buildTargets[process.env.BUILD_TARGET || "main"];
var vite_config_default = defineConfig(buildTarget || viteConfig);
export {
  vite_config_default as default,
  viteConfig
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcubXRzIiwgInNyYy9kZXYtdXRpbHMvdXRpbC5qcyIsICJzcmMvZGV2LXV0aWxzL2J1aWxkVmFycy5qcyIsICJzcmMvZGV2LXV0aWxzL2V4dGVybmFsLmpzIiwgInNyYy9kZXYtdXRpbHMvZ2xvYmFsRGVwUGxndWluLmpzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiL1VzZXJzL3JhaGVlbGlmdGlraGFyL1dvcmsvbG93Y29kZXItbWFpbi9jbGllbnQvcGFja2FnZXMvbG93Y29kZXJcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIi9Vc2Vycy9yYWhlZWxpZnRpa2hhci9Xb3JrL2xvd2NvZGVyLW1haW4vY2xpZW50L3BhY2thZ2VzL2xvd2NvZGVyL3ZpdGUuY29uZmlnLm10c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vVXNlcnMvcmFoZWVsaWZ0aWtoYXIvV29yay9sb3djb2Rlci1tYWluL2NsaWVudC9wYWNrYWdlcy9sb3djb2Rlci92aXRlLmNvbmZpZy5tdHNcIjtpbXBvcnQgZG90ZW52IGZyb20gXCJkb3RlbnZcIjtcbmltcG9ydCB7IGRlZmluZUNvbmZpZywgUGx1Z2luT3B0aW9uLCBTZXJ2ZXJPcHRpb25zLCBVc2VyQ29uZmlnIH0gZnJvbSBcInZpdGVcIjtcbmltcG9ydCByZWFjdCBmcm9tIFwiQHZpdGVqcy9wbHVnaW4tcmVhY3RcIjtcbmltcG9ydCB2aXRlVHNjb25maWdQYXRocyBmcm9tIFwidml0ZS10c2NvbmZpZy1wYXRoc1wiO1xuaW1wb3J0IHN2Z3JQbHVnaW4gZnJvbSBcInZpdGUtcGx1Z2luLXN2Z3JcIjtcbmltcG9ydCBjaGVja2VyIGZyb20gXCJ2aXRlLXBsdWdpbi1jaGVja2VyXCI7XG5pbXBvcnQgeyB2aXN1YWxpemVyIH0gZnJvbSBcInJvbGx1cC1wbHVnaW4tdmlzdWFsaXplclwiO1xuaW1wb3J0IHBhdGggZnJvbSBcInBhdGhcIjtcbmltcG9ydCBjaGFsayBmcm9tIFwiY2hhbGtcIjtcbmltcG9ydCB7IGNyZWF0ZUh0bWxQbHVnaW4gfSBmcm9tIFwidml0ZS1wbHVnaW4taHRtbFwiO1xuaW1wb3J0IGR5bmFtaWNJbXBvcnQgZnJvbSAndml0ZS1wbHVnaW4tZHluYW1pYy1pbXBvcnQnO1xuaW1wb3J0IHsgZW5zdXJlTGFzdFNsYXNoIH0gZnJvbSBcIi4vc3JjL2Rldi11dGlscy91dGlsXCI7XG5pbXBvcnQgeyBidWlsZFZhcnMgfSBmcm9tIFwiLi9zcmMvZGV2LXV0aWxzL2J1aWxkVmFyc1wiO1xuaW1wb3J0IHsgZ2xvYmFsRGVwUGx1Z2luIH0gZnJvbSBcIi4vc3JjL2Rldi11dGlscy9nbG9iYWxEZXBQbGd1aW5cIjtcbmltcG9ydCB7IHRlcnNlciB9IGZyb20gJ3JvbGx1cC1wbHVnaW4tdGVyc2VyJztcbi8vIGltcG9ydCB7IG5vZGVQb2x5ZmlsbHMgfSBmcm9tICd2aXRlLXBsdWdpbi1ub2RlLXBvbHlmaWxscydcblxuZG90ZW52LmNvbmZpZygpO1xuXG5jb25zdCBhcGlQcm94eVRhcmdldCA9IHByb2Nlc3MuZW52LkxPV0NPREVSX0FQSV9TRVJWSUNFX1VSTDtcbmNvbnN0IG5vZGVTZXJ2aWNlQXBpUHJveHlUYXJnZXQgPSBwcm9jZXNzLmVudi5MT1dDT0RFUl9OT0RFX1NFUlZJQ0VfVVJMO1xuY29uc3Qgbm9kZUVudiA9IHByb2Nlc3MuZW52Lk5PREVfRU5WID8/IFwiZGV2ZWxvcG1lbnRcIjtcbmNvbnN0IGlzRGV2ID0gbm9kZUVudiA9PT0gXCJkZXZlbG9wbWVudFwiO1xuY29uc3QgaXNWaXN1YWxpemVyRW5hYmxlZCA9ICEhcHJvY2Vzcy5lbnYuRU5BQkxFX1ZJU1VBTElaRVI7XG4vLyB0aGUgZmlsZSB3YXMgbmV2ZXIgY3JlYXRlZFxuLy8gY29uc3QgYnJvd3NlckNoZWNrRmlsZU5hbWUgPSBgYnJvd3Nlci1jaGVjay0ke3Byb2Nlc3MuZW52LlJFQUNUX0FQUF9DT01NSVRfSUR9LmpzYDtcbmNvbnN0IGJyb3dzZXJDaGVja0ZpbGVOYW1lID0gYGJyb3dzZXItY2hlY2suanNgO1xuY29uc3QgYmFzZSA9IGVuc3VyZUxhc3RTbGFzaChwcm9jZXNzLmVudi5QVUJMSUNfVVJMKTtcblxuaWYgKCFhcGlQcm94eVRhcmdldCAmJiBpc0Rldikge1xuICBjb25zb2xlLmxvZygpO1xuICBjb25zb2xlLmxvZyhjaGFsay5yZWRgTE9XQ09ERVJfQVBJX1NFUlZJQ0VfVVJMIGlzIHJlcXVpcmVkLlxcbmApO1xuICBjb25zb2xlLmxvZyhjaGFsay5jeWFuYFN0YXJ0IHdpdGggY29tbWFuZDogTE9XQ09ERVJfQVBJX1NFUlZJQ0VfVVJMPVxce2JhY2tlbmQtYXBpLWFkZHJcXH0geWFybiBzdGFydGApO1xuICBjb25zb2xlLmxvZygpO1xuICBwcm9jZXNzLmV4aXQoMSk7XG59XG5cbmNvbnN0IHByb3h5Q29uZmlnOiBTZXJ2ZXJPcHRpb25zW1wicHJveHlcIl0gPSB7XG4gIFwiL2FwaVwiOiB7XG4gICAgdGFyZ2V0OiBhcGlQcm94eVRhcmdldCxcbiAgICBjaGFuZ2VPcmlnaW46IGZhbHNlLFxuICB9LFxufTtcblxuaWYgKG5vZGVTZXJ2aWNlQXBpUHJveHlUYXJnZXQpIHtcbiAgcHJveHlDb25maWdbXCIvbm9kZS1zZXJ2aWNlXCJdID0ge1xuICAgIHRhcmdldDogbm9kZVNlcnZpY2VBcGlQcm94eVRhcmdldCxcbiAgfTtcbn1cblxuY29uc3QgZGVmaW5lID0ge307XG5idWlsZFZhcnMuZm9yRWFjaCgoeyBuYW1lLCBkZWZhdWx0VmFsdWUgfSkgPT4ge1xuICBkZWZpbmVbbmFtZV0gPSBKU09OLnN0cmluZ2lmeShwcm9jZXNzLmVudltuYW1lXSB8fCBkZWZhdWx0VmFsdWUpO1xufSk7XG5cbi8vIGh0dHBzOi8vdml0ZWpzLmRldi9jb25maWcvXG5leHBvcnQgY29uc3Qgdml0ZUNvbmZpZzogVXNlckNvbmZpZyA9IHtcbiAgZGVmaW5lLFxuICBhc3NldHNJbmNsdWRlOiBbXCIqKi8qLm1kXCJdLFxuICByZXNvbHZlOiB7XG4gICAgZXh0ZW5zaW9uczogW1wiLm1qc1wiLCBcIi5qc1wiLCBcIi50c1wiLCBcIi5qc3hcIiwgXCIudHN4XCIsIFwiLmpzb25cIl0sXG4gICAgYWxpYXM6IHtcbiAgICAgIFwiQGxvd2NvZGVyLWVlXCI6IHBhdGgucmVzb2x2ZShcbiAgICAgICAgX19kaXJuYW1lLCBcIi4uL2xvd2NvZGVyL3NyY1wiXG4gICAgICApLFxuICAgIH0sXG4gIH0sXG4gIGJhc2UsXG4gIGJ1aWxkOiB7XG4gICAgbWluaWZ5OiBcInRlcnNlclwiLFxuICAgIG1hbmlmZXN0OiB0cnVlLFxuICAgIHRhcmdldDogXCJlczIwMjBcIixcbiAgICBjc3NUYXJnZXQ6IFwiY2hyb21lODdcIixcbiAgICBvdXREaXI6IFwiYnVpbGRcIixcbiAgICBhc3NldHNEaXI6IFwic3RhdGljXCIsXG4gICAgZW1wdHlPdXREaXI6IGZhbHNlLFxuICAgIHJvbGx1cE9wdGlvbnM6IHtcbiAgICAgIHRyZWVzaGFrZToge1xuICAgICAgICBtb2R1bGVTaWRlRWZmZWN0czogdHJ1ZSwgXG4gICAgICAgIHByb3BlcnR5UmVhZFNpZGVFZmZlY3RzOiBmYWxzZSxcbiAgICAgICAgdHJ5Q2F0Y2hEZW9wdGltaXphdGlvbjogZmFsc2UsIFxuICAgICAgICB1bmtub3duR2xvYmFsU2lkZUVmZmVjdHM6IGZhbHNlLCBcbiAgICAgIH0sXG4gICAgICBvdXRwdXQ6IHtcbiAgICAgICAgaW5saW5lRHluYW1pY0ltcG9ydHM6IGZhbHNlLFxuICAgICAgICBjaHVua0ZpbGVOYW1lczogXCJbbmFtZV0tW2hhc2hdLmpzXCIsXG4gICAgICAgIG1hbnVhbENodW5rczogKGlkKSA9PiB7XG4gICAgICAgICAgaWYgKGlkLmluY2x1ZGVzKFwibm9kZV9tb2R1bGVzXCIpKSB7XG4gICAgICAgICAgICAvLyBVSSBMSUJSQVJJRVNcbiAgICAgICAgICAgIC8vIGlmIChpZC5pbmNsdWRlcyhcIm5vZGVfbW9kdWxlcy9AYW50LWRlc2lnbi92NS1wYXRjaC1mb3ItcmVhY3QtMTlcIikpIHJldHVybiBcImFudC1kZXNpZ24tdjUtcGF0Y2hcIjtcbiAgICAgICAgICAgIGlmIChpZC5pbmNsdWRlcyhcIkBhbnQtZGVzaWduL2ljb25zXCIpKSByZXR1cm4gXCJhbnQtZGVzaWduLWljb25zXCI7XG4gICAgICAgICAgICBpZiAoaWQuaW5jbHVkZXMoXCJub2RlX21vZHVsZXMvYW50ZFwiKSkgcmV0dXJuIFwiYW50ZFwiO1xuICAgICAgICAgICAgaWYgKGlkLmluY2x1ZGVzKFwic3R5bGVkLWNvbXBvbmVudHNcIikpIHJldHVybiBcInN0eWxlZC1jb21wb25lbnRzXCI7XG5cbiAgICAgICAgICAgIC8vIFx1RDgzRFx1REQzOSBCQVJDT0RFICYgUVIgQ09ERSBQUk9DRVNTSU5HXG4gICAgICAgICAgICBpZiAoaWQuaW5jbHVkZXMoXCJyZWFjdC1xci1iYXJjb2RlLXNjYW5uZXJcIikpIHJldHVybiBcImJhcmNvZGVcIjtcbiAgICAgICAgXG4gICAgICAgICAgICAvLyBURVhUIEVESVRPUlMgJiBQQVJTRVJTXG4gICAgICAgICAgICBpZiAoaWQuaW5jbHVkZXMoXCJjb2RlbWlycm9yXCIpKSByZXR1cm4gXCJjb2RlbWlycm9yXCI7XG4gICAgICAgICAgICBpZiAoaWQuaW5jbHVkZXMoXCJxdWlsbFwiKSkgcmV0dXJuIFwicXVpbGxcIjtcbiAgICAgICAgICAgIGlmIChpZC5pbmNsdWRlcyhcInJlYWN0LWpzb24tdmlld1wiKSkgcmV0dXJuIFwicmVhY3QtanNvbi12aWV3XCI7XG4gICAgICAgICAgICBpZiAoaWQuaW5jbHVkZXMoXCJyZWFjdC1xdWlsbFwiKSkgcmV0dXJuIFwicmVhY3QtcXVpbGxcIjtcbiAgICAgICAgICAgIGlmIChpZC5pbmNsdWRlcyhcInJlbWFyay1nZm1cIikpIHJldHVybiBcInJlbWFyay1nZm1cIjtcbiAgICAgICAgICAgIGlmIChpZC5pbmNsdWRlcyhcInJlaHlwZS1yYXdcIikpIHJldHVybiBcInJlaHlwZS1yYXdcIjtcbiAgICAgICAgICAgIGlmIChpZC5pbmNsdWRlcyhcInJlaHlwZS1zYW5pdGl6ZVwiKSkgcmV0dXJuIFwicmVoeXBlLXNhbml0aXplXCI7XG4gICAgICAgIFxuICAgICAgICAgICAgLy8gRFJBRyAmIERST1BcbiAgICAgICAgICAgIGlmIChpZC5pbmNsdWRlcyhcIkBkbmQta2l0XCIpKSByZXR1cm4gXCJkbmQta2l0XCI7XG4gICAgICAgICAgICBpZiAoaWQuaW5jbHVkZXMoXCJyZWFjdC1kcmFnZ2FibGVcIikpIHJldHVybiBcInJlYWN0LWRyYWdnYWJsZVwiO1xuICAgICAgICAgICAgaWYgKGlkLmluY2x1ZGVzKFwicmVhY3QtZ3JpZC1sYXlvdXRcIikpIHJldHVybiBcInJlYWN0LWdyaWQtbGF5b3V0XCI7XG4gICAgICAgICAgICBpZiAoaWQuaW5jbHVkZXMoXCJyZWFjdC1zb3J0YWJsZS1ob2NcIikpIHJldHVybiBcInJlYWN0LXNvcnRhYmxlLWhvY1wiO1xuICAgICAgICBcbiAgICAgICAgICAgIC8vIElDT05TICYgRk9OVFNcbiAgICAgICAgICAgIGlmIChpZC5pbmNsdWRlcyhcIkBmb3J0YXdlc29tZVwiKSkgcmV0dXJuIFwiZm9udGF3ZXNvbWVcIjtcbiAgICAgICAgICAgIGlmIChpZC5pbmNsdWRlcyhcIkByZW1peGljb25cIikpIHJldHVybiBcInJlbWl4aWNvblwiO1xuICAgICAgICBcbiAgICAgICAgICAgIC8vIERBVEUvVElNRSBIQU5ETElOR1xuICAgICAgICAgICAgaWYgKGlkLmluY2x1ZGVzKFwibW9tZW50XCIpKSByZXR1cm4gXCJtb21lbnRcIjtcbiAgICAgICAgICAgIGlmIChpZC5pbmNsdWRlcyhcImRhdGUtZm5zXCIpKSByZXR1cm4gXCJkYXRlLWZuc1wiO1xuICAgICAgICAgICAgaWYgKGlkLmluY2x1ZGVzKFwiZGF5anNcIikpIHJldHVybiBcImRheWpzXCI7XG4gICAgICAgIFxuICAgICAgICAgICAgLy8gVVRJTElUSUVTICYgSEVMUEVSU1xuICAgICAgICAgICAgaWYgKGlkLmluY2x1ZGVzKFwiY2xzeFwiKSkgcmV0dXJuIFwiY2xzeFwiO1xuICAgICAgICAgICAgaWYgKGlkLmluY2x1ZGVzKFwiaW1tZXJcIikpIHJldHVybiBcImltbWVyXCI7XG4gICAgICAgICAgICBpZiAoaWQuaW5jbHVkZXMoXCJsb2Rhc2hcIikpIHJldHVybiBcImxvZGFzaFwiO1xuICAgICAgICAgICAgaWYgKGlkLmluY2x1ZGVzKFwibG9kYXNoLWVzXCIpKSByZXR1cm4gXCJsb2Rhc2gtZXNcIjtcbiAgICAgICAgICAgIGlmIChpZC5pbmNsdWRlcyhcInV1aWRcIikpIHJldHVybiBcInV1aWRcIjtcbiAgICAgICAgICAgIGlmIChpZC5pbmNsdWRlcyhcInVhLXBhcnNlci1qc1wiKSkgcmV0dXJuIFwidWEtcGFyc2VyLWpzXCI7XG4gICAgICAgICAgICBpZiAoaWQuaW5jbHVkZXMoXCJodG1sMmNhbnZhc1wiKSkgcmV0dXJuIFwidWEtcGFyc2VyLWpzXCI7XG4gICAgICAgICAgICBpZiAoaWQuaW5jbHVkZXMoXCJudW1icm9cIikpIHJldHVybiBcIm51bWJyb1wiO1xuICAgICAgICBcbiAgICAgICAgICAgIC8vIEZJTEUgJiBEQVRBIFBST0NFU1NJTkdcbiAgICAgICAgICAgIGlmIChpZC5pbmNsdWRlcyhcImJ1ZmZlclwiKSkgcmV0dXJuIFwiYnVmZmVyXCI7XG4gICAgICAgICAgICBpZiAoaWQuaW5jbHVkZXMoXCJmaWxlLXNhdmVyXCIpKSByZXR1cm4gXCJmaWxlLXNhdmVyXCI7XG4gICAgICAgICAgICBpZiAoaWQuaW5jbHVkZXMoXCJwYXBhcGFyc2VcIikpIHJldHVybiBcInBhcGFwYXJzZVwiO1xuICAgICAgICAgICAgaWYgKGlkLmluY2x1ZGVzKFwicGFyc2U1XCIpKSByZXR1cm4gXCJwYXJzZTVcIjtcbiAgICAgICAgICAgIGlmIChpZC5pbmNsdWRlcyhcInhsc3hcIikpIHJldHVybiBcInhsc3hcIjtcbiAgICAgICAgICAgIGlmIChpZC5pbmNsdWRlcyhcImFsYXNxbFwiKSkgcmV0dXJuIFwiYWxhc3FsXCI7XG4gICAgICAgICAgICBpZiAoaWQuaW5jbHVkZXMoXCJzcWwtZm9ybWF0dGVyXCIpKSByZXR1cm4gXCJzcWwtZm9ybWF0dGVyXCI7XG4gICAgICAgIFxuICAgICAgICAgICAgLy8gTkVUV09SSyAmIEhUVFBcbiAgICAgICAgICAgIGlmIChpZC5pbmNsdWRlcyhcImF4aW9zXCIpKSByZXR1cm4gXCJheGlvc1wiO1xuICAgICAgICAgICAgaWYgKGlkLmluY2x1ZGVzKFwiZmV0Y2hcIikpIHJldHVybiBcImZldGNoXCI7XG4gICAgICAgICAgICBpZiAoaWQuaW5jbHVkZXMoXCJodHRwXCIpKSByZXR1cm4gXCJodHRwLW1vZHVsZXNcIjtcbiAgICAgICAgICAgIGlmIChpZC5pbmNsdWRlcyhcImh0dHBzXCIpKSByZXR1cm4gXCJodHRwcy1tb2R1bGVzXCI7XG4gICAgICAgIFxuICAgICAgICAgICAgLy8gV0VCIFNPQ0tFVFMgJiBTVFJFQU1JTkdcbiAgICAgICAgICAgIGlmIChpZC5pbmNsdWRlcyhcInNvY2tqc1wiKSkgcmV0dXJuIFwid2Vic29ja2V0c1wiO1xuICAgICAgICAgICAgaWYgKGlkLmluY2x1ZGVzKFwid2Vic29ja2V0XCIpKSByZXR1cm4gXCJ3ZWJzb2NrZXRzXCI7XG4gICAgICAgIFxuICAgICAgICAgICAgLy8gU1RBVEUgTUFOQUdFTUVOVFxuICAgICAgICAgICAgaWYgKGlkLmluY2x1ZGVzKFwicmVhY3QtZXJyb3ItYm91bmRhcnlcIikpIHJldHVybiBcInJlYWN0LWVycm9yLWJvdW5kYXJ5XCI7XG4gICAgICAgICAgICBpZiAoaWQuaW5jbHVkZXMoXCJyZWR1eC1kZXZ0b29scy1leHRlbnNpb25cIikpIHJldHVybiBcInJlZHV4LWRldnRvb2xzXCI7XG4gICAgICAgIFxuICAgICAgICAgICAgLy8gUE9MWUZJTExTICYgQlJPV1NFUiBDT01QQVRJQklMSVRZXG4gICAgICAgICAgICAvLyBpZiAoaWQuaW5jbHVkZXMoXCJjb3JlLWpzXCIpKSByZXR1cm4gXCJjb3JlLWpzXCI7XG4gICAgICAgICAgICBpZiAoaWQuaW5jbHVkZXMoXCJyZWdlbmVyYXRvci1ydW50aW1lXCIpKSByZXR1cm4gXCJyZWdlbmVyYXRvci1ydW50aW1lXCI7XG4gICAgICAgICAgICBpZiAoaWQuaW5jbHVkZXMoXCJlc2xpbnQ0Yi1wcmVidWlsdC0yXCIpKSByZXR1cm4gXCJlc2xpbnQ0Yi1wcmVidWlsdC0yXCI7XG5cbiAgICAgICAgICAgIC8vIE1JU0NFTExBTkVPVVNcbiAgICAgICAgICAgIGlmIChpZC5pbmNsdWRlcyhcImNuY2hhclwiKSkgcmV0dXJuIFwiY25jaGFyXCI7XG4gICAgICAgICAgICBpZiAoaWQuaW5jbHVkZXMoXCJob3RrZXlzLWpzXCIpKSByZXR1cm4gXCJob3RrZXlzLWpzXCI7XG4gICAgICAgICAgICBpZiAoaWQuaW5jbHVkZXMoXCJsb2dsZXZlbFwiKSkgcmV0dXJuIFwibG9nbGV2ZWxcIjtcbiAgICAgICAgICAgIGlmIChpZC5pbmNsdWRlcyhcInFyY29kZS5yZWFjdFwiKSkgcmV0dXJuIFwicXJjb2RlLXJlYWN0XCI7XG4gICAgICAgICAgICBpZiAoaWQuaW5jbHVkZXMoXCJyZWFjdC1qb3lyaWRlXCIpKSByZXR1cm4gXCJyZWFjdC1qb3lyaWRlXCI7XG4gICAgICAgICAgICBpZiAoaWQuaW5jbHVkZXMoXCJyYy10cmlnZ2VyXCIpKSByZXR1cm4gXCJyYy10cmlnZ2VyXCI7XG4gICAgICAgICAgICBpZiAoaWQuaW5jbHVkZXMoXCJyZWFsbHktcmVsYXhlZC1qc29uXCIpKSByZXR1cm4gXCJyZWFsbHktcmVsYXhlZC1qc29uXCI7XG4gICAgICAgICAgICBpZiAoaWQuaW5jbHVkZXMoXCJzaW1wbGViYXItcmVhY3RcIikpIHJldHVybiBcInNpbXBsZWJhci1yZWFjdFwiO1xuICAgICAgICAgICAgaWYgKGlkLmluY2x1ZGVzKFwicmVhY3QtZG9jdW1lbnRzXCIpKSByZXR1cm4gXCJyZWFjdC1kb2N1bWVudHNcIjtcbiAgICAgICAgICAgIGlmIChpZC5pbmNsdWRlcyhcInJlYWN0LWNvbG9yZnVsXCIpKSByZXR1cm4gXCJyZWFjdC1jb2xvcmZ1bFwiO1xuICAgICAgICAgICAgaWYgKGlkLmluY2x1ZGVzKFwicmVhY3QtYmVzdC1ncmFkaWVudC1jb2xvci1waWNrZXJcIikpIHJldHVybiBcInJlYWN0LWJlc3QtZ3JhZGllbnQtY29sb3ItcGlja2VyXCI7XG4gICAgICAgICAgICBpZiAoaWQuaW5jbHVkZXMoXCJAc3VwYWJhc2Uvc3VwYWJhc2UtanNcIikpIHJldHVybiBcInN1cGFiYXNlXCI7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH0sXG4gICAgICB9LFxuICAgICAgcGx1Z2luczogW1xuICAgICAgICB0ZXJzZXIoe1xuICAgICAgICAgIGNvbXByZXNzOiB7XG4gICAgICAgICAgICBkcm9wX2NvbnNvbGU6IHRydWUsICBcbiAgICAgICAgICAgIGRyb3BfZGVidWdnZXI6IHRydWUsIFxuICAgICAgICAgICAgcHVyZV9mdW5jczogW1wiY29uc29sZS5pbmZvXCIsIFwiY29uc29sZS5kZWJ1Z1wiLCBcImNvbnNvbGUubG9nXCJdLCBcbiAgICAgICAgICB9LFxuICAgICAgICAgIGZvcm1hdDoge1xuICAgICAgICAgICAgY29tbWVudHM6IC8oQHZpdGUtaWdub3JlfHdlYnBhY2tJZ25vcmUpL1xuICAgICAgICAgIH0sXG4gICAgICAgIH0pIGFzIFBsdWdpbk9wdGlvbixcbiAgICAgIF0sXG4gICAgICBvbndhcm46ICh3YXJuaW5nLCB3YXJuKSA9PiB7XG4gICAgICAgIGlmICh3YXJuaW5nLmNvZGUgPT09ICdNT0RVTEVfTEVWRUxfRElSRUNUSVZFJykge1xuICAgICAgICAgIHJldHVyblxuICAgICAgICB9XG4gICAgICAgIHdhcm4od2FybmluZylcbiAgICAgIH0sXG4gICAgfSxcbiAgICBjb21tb25qc09wdGlvbnM6IHtcbiAgICAgIHRyYW5zZm9ybU1peGVkRXNNb2R1bGVzIDogdHJ1ZSxcbiAgICAgIGRlZmF1bHRJc01vZHVsZUV4cG9ydHM6IChpZCkgPT4ge1xuICAgICAgICBpZiAoaWQuaW5kZXhPZihcImFudGQvbGliXCIpICE9PSAtMSkge1xuICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gXCJhdXRvXCI7XG4gICAgICB9LFxuICAgIH0sXG4gIH0sXG4gIG9wdGltaXplRGVwczoge1xuICAgIGVudHJpZXM6IFsnLi9zcmMvKiovKi57anMsanN4LHRzLHRzeH0nXSxcbiAgICBpbmNsdWRlOiBbJ2FudGQnXSxcbiAgICAvLyBpbmNsdWRlOiBbJ2FudGQvKiovKiddLFxuICAgIC8vIGZvcmNlOiB0cnVlLFxuICB9LFxuICBjc3M6IHtcbiAgICBwcmVwcm9jZXNzb3JPcHRpb25zOiB7XG4gICAgICBsZXNzOiB7XG4gICAgICAgIG1vZGlmeVZhcnM6IHtcbiAgICAgICAgICBcIkBwcmltYXJ5LWNvbG9yXCI6IFwiI2I0ODBkZVwiLFxuICAgICAgICAgIFwiQGxpbmstY29sb3JcIjogXCIjMzM3N0ZGXCIsXG4gICAgICAgICAgXCJAYm9yZGVyLWNvbG9yLWJhc2VcIjogXCIjYjQ4MGRlXCIsXG4gICAgICAgICAgXCJAYm9yZGVyLXJhZGl1cy1iYXNlXCI6IFwiNHB4XCIsXG4gICAgICAgIH0sXG4gICAgICAgIGphdmFzY3JpcHRFbmFibGVkOiB0cnVlLFxuICAgICAgfSxcbiAgICB9LFxuICAgIG1vZHVsZXM6IHtcbiAgICAgIC8vIENvbmZpZ3VyYXRpb24gZm9yIENTUyBtb2R1bGVzXG4gICAgICBzY29wZUJlaGF2aW91cjogJ2xvY2FsJyAvLyBFbnN1cmVzIENTUyBtb2R1bGVzIGFyZSBzY29wZWQgbG9jYWxseSBieSBkZWZhdWx0XG4gICAgfVxuICB9LFxuICBzZXJ2ZXI6IHtcbiAgICBvcGVuOiB0cnVlLFxuICAgIGNvcnM6IHRydWUsXG4gICAgcG9ydDogODAwMCxcbiAgICBob3N0OiBcIjAuMC4wLjBcIixcbiAgICBwcm94eTogcHJveHlDb25maWcsXG4gIH0sXG4gIHBsdWdpbnM6IFtcbiAgICBjaGVja2VyKHtcbiAgICAgIHR5cGVzY3JpcHQ6IHRydWUsXG4gICAgICBlc2xpbnQ6IHtcbiAgICAgICAgbGludENvbW1hbmQ6ICdlc2xpbnQgLS1xdWlldCBcIi4vc3JjLyoqLyoue3RzLHRzeH1cIicsXG4gICAgICAgIGRldjoge1xuICAgICAgICAgIGxvZ0xldmVsOiBbXCJlcnJvclwiXSxcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgfSksXG4gICAgcmVhY3Qoe1xuICAgICAgYmFiZWw6IHtcbiAgICAgICAgcGFyc2VyT3B0czoge1xuICAgICAgICAgIHBsdWdpbnM6IFtcImRlY29yYXRvcnMtbGVnYWN5XCJdLFxuICAgICAgICB9LFxuICAgICAgfSxcbiAgICB9KSxcbiAgICB2aXRlVHNjb25maWdQYXRocyh7XG4gICAgICBwcm9qZWN0czogW1wiLi4vbG93Y29kZXIvdHNjb25maWcuanNvblwiLCBcIi4uL2xvd2NvZGVyLWRlc2lnbi90c2NvbmZpZy5qc29uXCJdLFxuICAgIH0pLFxuICAgIHN2Z3JQbHVnaW4oe1xuICAgICAgc3Znck9wdGlvbnM6IHtcbiAgICAgICAgZXhwb3J0VHlwZTogXCJuYW1lZFwiLFxuICAgICAgICBwcmV0dGllcjogZmFsc2UsXG4gICAgICAgIHN2Z286IGZhbHNlLFxuICAgICAgICB0aXRsZVByb3A6IHRydWUsXG4gICAgICAgIHJlZjogdHJ1ZSxcbiAgICAgIH0sXG4gICAgfSksXG4gICAgZ2xvYmFsRGVwUGx1Z2luKCksXG4gICAgY3JlYXRlSHRtbFBsdWdpbih7XG4gICAgICBtaW5pZnk6IHRydWUsXG4gICAgICBpbmplY3Q6IHtcbiAgICAgICAgZGF0YToge1xuICAgICAgICAgIGJyb3dzZXJDaGVja1NjcmlwdDogaXNEZXYgPyBcIlwiIDogYDxzY3JpcHQgc3JjPVwiJHtiYXNlfSR7YnJvd3NlckNoZWNrRmlsZU5hbWV9XCI+PC9zY3JpcHQ+YCxcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgfSksXG4gICAgaXNWaXN1YWxpemVyRW5hYmxlZCAmJiB2aXN1YWxpemVyKCksXG4gICAgZHluYW1pY0ltcG9ydCgpLFxuICAgICh7IGluY2x1ZGU6IFsncHJvY2VzcyddIH0pLFxuICBdLmZpbHRlcihCb29sZWFuKSxcbn07XG5cbmNvbnN0IGJyb3dzZXJDaGVja0NvbmZpZzogVXNlckNvbmZpZyA9IHtcbiAgLi4udml0ZUNvbmZpZyxcbiAgZGVmaW5lOiB7XG4gICAgLi4udml0ZUNvbmZpZy5kZWZpbmUsXG4gICAgXCJwcm9jZXNzLmVudi5OT0RFX0VOVlwiOiBKU09OLnN0cmluZ2lmeShcInByb2R1Y3Rpb25cIiksXG4gIH0sXG4gIGJ1aWxkOiB7XG4gICAgLi4udml0ZUNvbmZpZy5idWlsZCxcbiAgICBtYW5pZmVzdDogZmFsc2UsXG4gICAgY29weVB1YmxpY0RpcjogdHJ1ZSxcbiAgICBlbXB0eU91dERpcjogdHJ1ZSxcbiAgICBsaWI6IHtcbiAgICAgIGZvcm1hdHM6IFtcImVzXCJdLFxuICAgICAgbmFtZTogXCJCcm93c2VyQ2hlY2tcIixcbiAgICAgIGVudHJ5OiBcIi4vc3JjL2Jyb3dzZXItY2hlY2sudHNcIixcbiAgICAgIGZpbGVOYW1lOiAoKSA9PiB7XG4gICAgICAgIHJldHVybiBicm93c2VyQ2hlY2tGaWxlTmFtZTtcbiAgICAgIH0sXG4gICAgfSxcbiAgfSxcbn07XG5cbmNvbnN0IGJ1aWxkVGFyZ2V0cyA9IHtcbiAgbWFpbjogdml0ZUNvbmZpZyxcbiAgYnJvd3NlckNoZWNrOiBicm93c2VyQ2hlY2tDb25maWcsXG59O1xuXG5jb25zdCBidWlsZFRhcmdldCA9IGJ1aWxkVGFyZ2V0c1twcm9jZXNzLmVudi5CVUlMRF9UQVJHRVQgfHwgXCJtYWluXCJdO1xuXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoYnVpbGRUYXJnZXQgfHwgdml0ZUNvbmZpZyk7XG4iLCAiY29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2Rpcm5hbWUgPSBcIi9Vc2Vycy9yYWhlZWxpZnRpa2hhci9Xb3JrL2xvd2NvZGVyLW1haW4vY2xpZW50L3BhY2thZ2VzL2xvd2NvZGVyL3NyYy9kZXYtdXRpbHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIi9Vc2Vycy9yYWhlZWxpZnRpa2hhci9Xb3JrL2xvd2NvZGVyLW1haW4vY2xpZW50L3BhY2thZ2VzL2xvd2NvZGVyL3NyYy9kZXYtdXRpbHMvdXRpbC5qc1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vVXNlcnMvcmFoZWVsaWZ0aWtoYXIvV29yay9sb3djb2Rlci1tYWluL2NsaWVudC9wYWNrYWdlcy9sb3djb2Rlci9zcmMvZGV2LXV0aWxzL3V0aWwuanNcIjtpbXBvcnQgZnMgZnJvbSBcIm5vZGU6ZnNcIjtcbmltcG9ydCB7IGRpcm5hbWUgfSBmcm9tIFwibm9kZTpwYXRoXCI7XG5pbXBvcnQgeyBmaWxlVVJMVG9QYXRoIH0gZnJvbSBcIm5vZGU6dXJsXCI7XG5cbmV4cG9ydCBmdW5jdGlvbiBzdHJpcExhc3RTbGFzaChzdHIpIHtcbiAgaWYgKHN0ci5lbmRzV2l0aChcIi9cIikpIHtcbiAgICByZXR1cm4gc3RyLnNsaWNlKDAsIHN0ci5sZW5ndGggLSAxKTtcbiAgfVxuICByZXR1cm4gc3RyO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZW5zdXJlTGFzdFNsYXNoKHN0cikge1xuICBpZiAoIXN0cikge1xuICAgIHJldHVybiBcIi9cIjtcbiAgfVxuICBpZiAoIXN0ci5lbmRzV2l0aChcIi9cIikpIHtcbiAgICByZXR1cm4gYCR7c3RyfS9gO1xuICB9XG4gIHJldHVybiBzdHI7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiByZWFkSnNvbihmaWxlKSB7XG4gIHJldHVybiBKU09OLnBhcnNlKGZzLnJlYWRGaWxlU3luYyhmaWxlKS50b1N0cmluZygpKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGN1cnJlbnREaXJOYW1lKGltcG9ydE1ldGFVcmwpIHtcbiAgcmV0dXJuIGRpcm5hbWUoZmlsZVVSTFRvUGF0aChpbXBvcnRNZXRhVXJsKSk7XG59XG4iLCAiY29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2Rpcm5hbWUgPSBcIi9Vc2Vycy9yYWhlZWxpZnRpa2hhci9Xb3JrL2xvd2NvZGVyLW1haW4vY2xpZW50L3BhY2thZ2VzL2xvd2NvZGVyL3NyYy9kZXYtdXRpbHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIi9Vc2Vycy9yYWhlZWxpZnRpa2hhci9Xb3JrL2xvd2NvZGVyLW1haW4vY2xpZW50L3BhY2thZ2VzL2xvd2NvZGVyL3NyYy9kZXYtdXRpbHMvYnVpbGRWYXJzLmpzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9Vc2Vycy9yYWhlZWxpZnRpa2hhci9Xb3JrL2xvd2NvZGVyLW1haW4vY2xpZW50L3BhY2thZ2VzL2xvd2NvZGVyL3NyYy9kZXYtdXRpbHMvYnVpbGRWYXJzLmpzXCI7ZXhwb3J0IGNvbnN0IGJ1aWxkVmFycyA9IFtcbiAge1xuICAgIG5hbWU6IFwiUFVCTElDX1VSTFwiLFxuICAgIGRlZmF1bHRWYWx1ZTogXCIvXCIsXG4gIH0sXG4gIHtcbiAgICBuYW1lOiBcIlJFQUNUX0FQUF9FRElUSU9OXCIsXG4gICAgZGVmYXVsdFZhbHVlOiBcImNvbW11bml0eVwiLFxuICB9LFxuICB7XG4gICAgbmFtZTogXCJSRUFDVF9BUFBfTEFOR1VBR0VTXCIsXG4gICAgZGVmYXVsdFZhbHVlOiBcIlwiLFxuICB9LFxuICB7XG4gICAgbmFtZTogXCJSRUFDVF9BUFBfQ09NTUlUX0lEXCIsXG4gICAgZGVmYXVsdFZhbHVlOiBcIjAwMDAwXCIsXG4gIH0sXG4gIHtcbiAgICBuYW1lOiBcIlJFQUNUX0FQUF9BUElfU0VSVklDRV9VUkxcIixcbiAgICBkZWZhdWx0VmFsdWU6IFwiXCIsXG4gIH0sXG4gIHtcbiAgICBuYW1lOiBcIlJFQUNUX0FQUF9OT0RFX1NFUlZJQ0VfVVJMXCIsXG4gICAgZGVmYXVsdFZhbHVlOiBcIlwiLFxuICB9LFxuICB7XG4gICAgbmFtZTogXCJSRUFDVF9BUFBfRU5WXCIsXG4gICAgZGVmYXVsdFZhbHVlOiBcInByb2R1Y3Rpb25cIixcbiAgfSxcbiAge1xuICAgIG5hbWU6IFwiUkVBQ1RfQVBQX0JVSUxEX0lEXCIsXG4gICAgZGVmYXVsdFZhbHVlOiBcIlwiLFxuICB9LFxuICB7XG4gICAgbmFtZTogXCJSRUFDVF9BUFBfTE9HX0xFVkVMXCIsXG4gICAgZGVmYXVsdFZhbHVlOiBcImVycm9yXCIsXG4gIH0sXG4gIHtcbiAgICBuYW1lOiBcIlJFQUNUX0FQUF9JTVBPUlRfTUFQXCIsXG4gICAgZGVmYXVsdFZhbHVlOiBcInt9XCIsXG4gIH0sXG4gIHtcbiAgICBuYW1lOiBcIlJFQUNUX0FQUF9TRVJWRVJfSVBTXCIsXG4gICAgZGVmYXVsdFZhbHVlOiBcIlwiLFxuICB9LFxuICB7XG4gICAgbmFtZTogXCJSRUFDVF9BUFBfQlVORExFX0JVSUxUSU5fUExVR0lOXCIsXG4gICAgZGVmYXVsdFZhbHVlOiBcIlwiLFxuICB9LFxuICB7XG4gICAgbmFtZTogXCJSRUFDVF9BUFBfQlVORExFX1RZUEVcIixcbiAgICBkZWZhdWx0VmFsdWU6IFwiYXBwXCIsXG4gIH0sXG4gIHtcbiAgICBuYW1lOiBcIlJFQUNUX0FQUF9ESVNBQkxFX0pTX1NBTkRCT1hcIixcbiAgICBkZWZhdWx0VmFsdWU6IFwiXCIsXG4gIH0sXG5dO1xuIiwgImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvVXNlcnMvcmFoZWVsaWZ0aWtoYXIvV29yay9sb3djb2Rlci1tYWluL2NsaWVudC9wYWNrYWdlcy9sb3djb2Rlci9zcmMvZGV2LXV0aWxzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvVXNlcnMvcmFoZWVsaWZ0aWtoYXIvV29yay9sb3djb2Rlci1tYWluL2NsaWVudC9wYWNrYWdlcy9sb3djb2Rlci9zcmMvZGV2LXV0aWxzL2V4dGVybmFsLmpzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9Vc2Vycy9yYWhlZWxpZnRpa2hhci9Xb3JrL2xvd2NvZGVyLW1haW4vY2xpZW50L3BhY2thZ2VzL2xvd2NvZGVyL3NyYy9kZXYtdXRpbHMvZXh0ZXJuYWwuanNcIjsvKipcbiAqIGxpYnMgdG8gaW1wb3J0IGFzIGdsb2JhbCB2YXJcbiAqIG5hbWU6IG1vZHVsZSBuYW1lXG4gKiBtZXJnZURlZmF1bHRBbmROYW1lRXhwb3J0czogd2hldGhlciB0byBtZXJnZSBkZWZhdWx0IGFuZCBuYW1lZCBleHBvcnRzXG4gKi9cbmV4cG9ydCBjb25zdCBsaWJzID0gW1xuICBcImF4aW9zXCIsXG4gIFwicmVkdXhcIixcbiAgXCJyZWFjdC1yb3V0ZXJcIixcbiAgXCJyZWFjdC1yb3V0ZXItZG9tXCIsXG4gIFwicmVhY3QtcmVkdXhcIixcbiAgXCJyZWFjdFwiLFxuICBcInJlYWN0LWRvbVwiLFxuICBcImxvZGFzaFwiLFxuICBcImhpc3RvcnlcIixcbiAgXCJhbnRkXCIsXG4gIFwiQGRuZC1raXQvY29yZVwiLFxuICBcIkBkbmQta2l0L21vZGlmaWVyc1wiLFxuICBcIkBkbmQta2l0L3NvcnRhYmxlXCIsXG4gIFwiQGRuZC1raXQvdXRpbGl0aWVzXCIsXG4gIHtcbiAgICBuYW1lOiBcIm1vbWVudFwiLFxuICAgIGV4dHJhY3REZWZhdWx0OiB0cnVlLFxuICB9LFxuICB7XG4gICAgbmFtZTogXCJkYXlqc1wiLFxuICAgIGV4dHJhY3REZWZhdWx0OiB0cnVlLFxuICB9LFxuICB7XG4gICAgbmFtZTogXCJsb3djb2Rlci1zZGtcIixcbiAgICBmcm9tOiBcIi4vc3JjL2luZGV4LnNkay50c1wiLFxuICB9LFxuICB7XG4gICAgbmFtZTogXCJzdHlsZWQtY29tcG9uZW50c1wiLFxuICAgIG1lcmdlRGVmYXVsdEFuZE5hbWVFeHBvcnRzOiB0cnVlLFxuICB9LFxuXTtcblxuLyoqXG4gKiBnZXQgZ2xvYmFsIHZhciBuYW1lIGZyb20gbW9kdWxlIG5hbWVcbiAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lXG4gKiBAcmV0dXJuc1xuICovXG5leHBvcnQgY29uc3QgZ2V0TGliR2xvYmFsVmFyTmFtZSA9IChuYW1lKSA9PiB7XG4gIHJldHVybiBcIiRcIiArIG5hbWUucmVwbGFjZSgvQC9nLCBcIiRcIikucmVwbGFjZSgvW1xcL1xcLV0vZywgXCJfXCIpO1xufTtcblxuZXhwb3J0IGNvbnN0IGdldExpYk5hbWVzID0gKCkgPT4ge1xuICByZXR1cm4gbGlicy5tYXAoKGkpID0+IHtcbiAgICBpZiAodHlwZW9mIGkgPT09IFwib2JqZWN0XCIpIHtcbiAgICAgIHJldHVybiBpLm5hbWU7XG4gICAgfVxuICAgIHJldHVybiBpO1xuICB9KTtcbn07XG5cbmV4cG9ydCBjb25zdCBnZXRBbGxMaWJHbG9iYWxWYXJOYW1lcyA9ICgpID0+IHtcbiAgY29uc3QgcmV0ID0ge307XG4gIGxpYnMuZm9yRWFjaCgobGliKSA9PiB7XG4gICAgbGV0IG5hbWUgPSBsaWI7XG4gICAgaWYgKHR5cGVvZiBsaWIgPT09IFwib2JqZWN0XCIpIHtcbiAgICAgIG5hbWUgPSBsaWIubmFtZTtcbiAgICB9XG4gICAgcmV0W25hbWVdID0gZ2V0TGliR2xvYmFsVmFyTmFtZShuYW1lKTtcbiAgfSk7XG4gIHJldHVybiByZXQ7XG59O1xuXG5leHBvcnQgY29uc3QgbGlic0ltcG9ydENvZGUgPSAoZXhjbHVkZSA9IFtdKSA9PiB7XG4gIGNvbnN0IGltcG9ydExpbmVzID0gW107XG4gIGNvbnN0IGFzc2lnbkxpbmVzID0gW107XG4gIGxpYnMuZm9yRWFjaCgoaSkgPT4ge1xuICAgIGxldCBuYW1lID0gaTtcbiAgICBsZXQgbWVyZ2UgPSBmYWxzZTtcbiAgICBsZXQgZnJvbSA9IG5hbWU7XG4gICAgbGV0IGV4dHJhY3REZWZhdWx0ID0gZmFsc2U7XG5cbiAgICBpZiAodHlwZW9mIGkgPT09IFwib2JqZWN0XCIpIHtcbiAgICAgIG5hbWUgPSBpLm5hbWU7XG4gICAgICBtZXJnZSA9IGkubWVyZ2VEZWZhdWx0QW5kTmFtZUV4cG9ydHMgPz8gZmFsc2U7XG4gICAgICBmcm9tID0gaS5mcm9tID8/IG5hbWU7XG4gICAgICBleHRyYWN0RGVmYXVsdCA9IGkuZXh0cmFjdERlZmF1bHQgPz8gZmFsc2U7XG4gICAgfVxuXG4gICAgaWYgKGV4Y2x1ZGUuaW5jbHVkZXMobmFtZSkpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCB2YXJOYW1lID0gZ2V0TGliR2xvYmFsVmFyTmFtZShuYW1lKTtcbiAgICBpZiAobWVyZ2UpIHtcbiAgICAgIGltcG9ydExpbmVzLnB1c2goYGltcG9ydCAqIGFzICR7dmFyTmFtZX1fbmFtZWRfZXhwb3J0cyBmcm9tICcke2Zyb219JztgKTtcbiAgICAgIGltcG9ydExpbmVzLnB1c2goYGltcG9ydCAke3Zhck5hbWV9IGZyb20gJyR7ZnJvbX0nO2ApO1xuICAgICAgYXNzaWduTGluZXMucHVzaChgT2JqZWN0LmFzc2lnbigke3Zhck5hbWV9LCAke3Zhck5hbWV9X25hbWVkX2V4cG9ydHMpO2ApO1xuICAgIH0gZWxzZSBpZiAoZXh0cmFjdERlZmF1bHQpIHtcbiAgICAgIGltcG9ydExpbmVzLnB1c2goYGltcG9ydCAke3Zhck5hbWV9IGZyb20gJyR7ZnJvbX0nO2ApO1xuICAgIH0gZWxzZSB7XG4gICAgICBpbXBvcnRMaW5lcy5wdXNoKGBpbXBvcnQgKiBhcyAke3Zhck5hbWV9IGZyb20gJyR7ZnJvbX0nO2ApO1xuICAgIH1cbiAgICBhc3NpZ25MaW5lcy5wdXNoKGB3aW5kb3cuJHt2YXJOYW1lfSA9ICR7dmFyTmFtZX07YCk7XG4gIH0pO1xuICByZXR1cm4gaW1wb3J0TGluZXMuY29uY2F0KGFzc2lnbkxpbmVzKS5qb2luKFwiXFxuXCIpO1xufTtcbiIsICJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiL1VzZXJzL3JhaGVlbGlmdGlraGFyL1dvcmsvbG93Y29kZXItbWFpbi9jbGllbnQvcGFja2FnZXMvbG93Y29kZXIvc3JjL2Rldi11dGlsc1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiL1VzZXJzL3JhaGVlbGlmdGlraGFyL1dvcmsvbG93Y29kZXItbWFpbi9jbGllbnQvcGFja2FnZXMvbG93Y29kZXIvc3JjL2Rldi11dGlscy9nbG9iYWxEZXBQbGd1aW4uanNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL1VzZXJzL3JhaGVlbGlmdGlraGFyL1dvcmsvbG93Y29kZXItbWFpbi9jbGllbnQvcGFja2FnZXMvbG93Y29kZXIvc3JjL2Rldi11dGlscy9nbG9iYWxEZXBQbGd1aW4uanNcIjtpbXBvcnQgeyBsaWJzSW1wb3J0Q29kZSB9IGZyb20gXCIuL2V4dGVybmFsLmpzXCI7XG5cbmV4cG9ydCBmdW5jdGlvbiBnbG9iYWxEZXBQbHVnaW4oZXhjbHVkZSA9IFtdKSB7XG4gIGNvbnN0IHZpcnR1YWxNb2R1bGVJZCA9IFwidmlydHVhbDpnbG9iYWxzXCI7XG4gIHJldHVybiB7XG4gICAgbmFtZTogXCJsb3djb2Rlci1nbG9iYWwtcGx1Z2luXCIsXG4gICAgcmVzb2x2ZUlkKGlkKSB7XG4gICAgICBpZiAoaWQgPT09IHZpcnR1YWxNb2R1bGVJZCkge1xuICAgICAgICByZXR1cm4gaWQ7XG4gICAgICB9XG4gICAgfSxcbiAgICBsb2FkKGlkKSB7XG4gICAgICBpZiAoaWQgPT09IHZpcnR1YWxNb2R1bGVJZCkge1xuICAgICAgICByZXR1cm4gbGlic0ltcG9ydENvZGUoZXhjbHVkZSk7XG4gICAgICB9XG4gICAgfSxcbiAgfTtcbn1cbiJdLAogICJtYXBwaW5ncyI6ICI7QUFBdVgsT0FBTyxZQUFZO0FBQzFZLFNBQVMsb0JBQTZEO0FBQ3RFLE9BQU8sV0FBVztBQUNsQixPQUFPLHVCQUF1QjtBQUM5QixPQUFPLGdCQUFnQjtBQUN2QixPQUFPLGFBQWE7QUFDcEIsU0FBUyxrQkFBa0I7QUFDM0IsT0FBTyxVQUFVO0FBQ2pCLE9BQU8sV0FBVztBQUNsQixTQUFTLHdCQUF3QjtBQUNqQyxPQUFPLG1CQUFtQjs7O0FDQ25CLFNBQVMsZ0JBQWdCLEtBQUs7QUFDbkMsTUFBSSxDQUFDLEtBQUs7QUFDUixXQUFPO0FBQUEsRUFDVDtBQUNBLE1BQUksQ0FBQyxJQUFJLFNBQVMsR0FBRyxHQUFHO0FBQ3RCLFdBQU8sR0FBRyxHQUFHO0FBQUEsRUFDZjtBQUNBLFNBQU87QUFDVDs7O0FDbkJrYSxJQUFNLFlBQVk7QUFBQSxFQUNsYjtBQUFBLElBQ0UsTUFBTTtBQUFBLElBQ04sY0FBYztBQUFBLEVBQ2hCO0FBQUEsRUFDQTtBQUFBLElBQ0UsTUFBTTtBQUFBLElBQ04sY0FBYztBQUFBLEVBQ2hCO0FBQUEsRUFDQTtBQUFBLElBQ0UsTUFBTTtBQUFBLElBQ04sY0FBYztBQUFBLEVBQ2hCO0FBQUEsRUFDQTtBQUFBLElBQ0UsTUFBTTtBQUFBLElBQ04sY0FBYztBQUFBLEVBQ2hCO0FBQUEsRUFDQTtBQUFBLElBQ0UsTUFBTTtBQUFBLElBQ04sY0FBYztBQUFBLEVBQ2hCO0FBQUEsRUFDQTtBQUFBLElBQ0UsTUFBTTtBQUFBLElBQ04sY0FBYztBQUFBLEVBQ2hCO0FBQUEsRUFDQTtBQUFBLElBQ0UsTUFBTTtBQUFBLElBQ04sY0FBYztBQUFBLEVBQ2hCO0FBQUEsRUFDQTtBQUFBLElBQ0UsTUFBTTtBQUFBLElBQ04sY0FBYztBQUFBLEVBQ2hCO0FBQUEsRUFDQTtBQUFBLElBQ0UsTUFBTTtBQUFBLElBQ04sY0FBYztBQUFBLEVBQ2hCO0FBQUEsRUFDQTtBQUFBLElBQ0UsTUFBTTtBQUFBLElBQ04sY0FBYztBQUFBLEVBQ2hCO0FBQUEsRUFDQTtBQUFBLElBQ0UsTUFBTTtBQUFBLElBQ04sY0FBYztBQUFBLEVBQ2hCO0FBQUEsRUFDQTtBQUFBLElBQ0UsTUFBTTtBQUFBLElBQ04sY0FBYztBQUFBLEVBQ2hCO0FBQUEsRUFDQTtBQUFBLElBQ0UsTUFBTTtBQUFBLElBQ04sY0FBYztBQUFBLEVBQ2hCO0FBQUEsRUFDQTtBQUFBLElBQ0UsTUFBTTtBQUFBLElBQ04sY0FBYztBQUFBLEVBQ2hCO0FBQ0Y7OztBQ3BETyxJQUFNLE9BQU87QUFBQSxFQUNsQjtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsSUFDRSxNQUFNO0FBQUEsSUFDTixnQkFBZ0I7QUFBQSxFQUNsQjtBQUFBLEVBQ0E7QUFBQSxJQUNFLE1BQU07QUFBQSxJQUNOLGdCQUFnQjtBQUFBLEVBQ2xCO0FBQUEsRUFDQTtBQUFBLElBQ0UsTUFBTTtBQUFBLElBQ04sTUFBTTtBQUFBLEVBQ1I7QUFBQSxFQUNBO0FBQUEsSUFDRSxNQUFNO0FBQUEsSUFDTiw0QkFBNEI7QUFBQSxFQUM5QjtBQUNGO0FBT08sSUFBTSxzQkFBc0IsQ0FBQyxTQUFTO0FBQzNDLFNBQU8sTUFBTSxLQUFLLFFBQVEsTUFBTSxHQUFHLEVBQUUsUUFBUSxXQUFXLEdBQUc7QUFDN0Q7QUF1Qk8sSUFBTSxpQkFBaUIsQ0FBQyxVQUFVLENBQUMsTUFBTTtBQUM5QyxRQUFNLGNBQWMsQ0FBQztBQUNyQixRQUFNLGNBQWMsQ0FBQztBQUNyQixPQUFLLFFBQVEsQ0FBQyxNQUFNO0FBQ2xCLFFBQUksT0FBTztBQUNYLFFBQUksUUFBUTtBQUNaLFFBQUksT0FBTztBQUNYLFFBQUksaUJBQWlCO0FBRXJCLFFBQUksT0FBTyxNQUFNLFVBQVU7QUFDekIsYUFBTyxFQUFFO0FBQ1QsY0FBUSxFQUFFLDhCQUE4QjtBQUN4QyxhQUFPLEVBQUUsUUFBUTtBQUNqQix1QkFBaUIsRUFBRSxrQkFBa0I7QUFBQSxJQUN2QztBQUVBLFFBQUksUUFBUSxTQUFTLElBQUksR0FBRztBQUMxQjtBQUFBLElBQ0Y7QUFFQSxVQUFNLFVBQVUsb0JBQW9CLElBQUk7QUFDeEMsUUFBSSxPQUFPO0FBQ1Qsa0JBQVksS0FBSyxlQUFlLE9BQU8sd0JBQXdCLElBQUksSUFBSTtBQUN2RSxrQkFBWSxLQUFLLFVBQVUsT0FBTyxVQUFVLElBQUksSUFBSTtBQUNwRCxrQkFBWSxLQUFLLGlCQUFpQixPQUFPLEtBQUssT0FBTyxrQkFBa0I7QUFBQSxJQUN6RSxXQUFXLGdCQUFnQjtBQUN6QixrQkFBWSxLQUFLLFVBQVUsT0FBTyxVQUFVLElBQUksSUFBSTtBQUFBLElBQ3RELE9BQU87QUFDTCxrQkFBWSxLQUFLLGVBQWUsT0FBTyxVQUFVLElBQUksSUFBSTtBQUFBLElBQzNEO0FBQ0EsZ0JBQVksS0FBSyxVQUFVLE9BQU8sTUFBTSxPQUFPLEdBQUc7QUFBQSxFQUNwRCxDQUFDO0FBQ0QsU0FBTyxZQUFZLE9BQU8sV0FBVyxFQUFFLEtBQUssSUFBSTtBQUNsRDs7O0FDbkdPLFNBQVMsZ0JBQWdCLFVBQVUsQ0FBQyxHQUFHO0FBQzVDLFFBQU0sa0JBQWtCO0FBQ3hCLFNBQU87QUFBQSxJQUNMLE1BQU07QUFBQSxJQUNOLFVBQVUsSUFBSTtBQUNaLFVBQUksT0FBTyxpQkFBaUI7QUFDMUIsZUFBTztBQUFBLE1BQ1Q7QUFBQSxJQUNGO0FBQUEsSUFDQSxLQUFLLElBQUk7QUFDUCxVQUFJLE9BQU8saUJBQWlCO0FBQzFCLGVBQU8sZUFBZSxPQUFPO0FBQUEsTUFDL0I7QUFBQSxJQUNGO0FBQUEsRUFDRjtBQUNGOzs7QUpIQSxTQUFTLGNBQWM7QUFkdkIsSUFBTSxtQ0FBbUM7QUFpQnpDLE9BQU8sT0FBTztBQUVkLElBQU0saUJBQWlCLFFBQVEsSUFBSTtBQUNuQyxJQUFNLDRCQUE0QixRQUFRLElBQUk7QUFDOUMsSUFBTSxVQUFVLFFBQVEsSUFBSSxZQUFZO0FBQ3hDLElBQU0sUUFBUSxZQUFZO0FBQzFCLElBQU0sc0JBQXNCLENBQUMsQ0FBQyxRQUFRLElBQUk7QUFHMUMsSUFBTSx1QkFBdUI7QUFDN0IsSUFBTSxPQUFPLGdCQUFnQixRQUFRLElBQUksVUFBVTtBQUVuRCxJQUFJLENBQUMsa0JBQWtCLE9BQU87QUFDNUIsVUFBUSxJQUFJO0FBQ1osVUFBUSxJQUFJLE1BQU0sNENBQTRDO0FBQzlELFVBQVEsSUFBSSxNQUFNLGtGQUFrRjtBQUNwRyxVQUFRLElBQUk7QUFDWixVQUFRLEtBQUssQ0FBQztBQUNoQjtBQUVBLElBQU0sY0FBc0M7QUFBQSxFQUMxQyxRQUFRO0FBQUEsSUFDTixRQUFRO0FBQUEsSUFDUixjQUFjO0FBQUEsRUFDaEI7QUFDRjtBQUVBLElBQUksMkJBQTJCO0FBQzdCLGNBQVksZUFBZSxJQUFJO0FBQUEsSUFDN0IsUUFBUTtBQUFBLEVBQ1Y7QUFDRjtBQUVBLElBQU0sU0FBUyxDQUFDO0FBQ2hCLFVBQVUsUUFBUSxDQUFDLEVBQUUsTUFBTSxhQUFhLE1BQU07QUFDNUMsU0FBTyxJQUFJLElBQUksS0FBSyxVQUFVLFFBQVEsSUFBSSxJQUFJLEtBQUssWUFBWTtBQUNqRSxDQUFDO0FBR00sSUFBTSxhQUF5QjtBQUFBLEVBQ3BDO0FBQUEsRUFDQSxlQUFlLENBQUMsU0FBUztBQUFBLEVBQ3pCLFNBQVM7QUFBQSxJQUNQLFlBQVksQ0FBQyxRQUFRLE9BQU8sT0FBTyxRQUFRLFFBQVEsT0FBTztBQUFBLElBQzFELE9BQU87QUFBQSxNQUNMLGdCQUFnQixLQUFLO0FBQUEsUUFDbkI7QUFBQSxRQUFXO0FBQUEsTUFDYjtBQUFBLElBQ0Y7QUFBQSxFQUNGO0FBQUEsRUFDQTtBQUFBLEVBQ0EsT0FBTztBQUFBLElBQ0wsUUFBUTtBQUFBLElBQ1IsVUFBVTtBQUFBLElBQ1YsUUFBUTtBQUFBLElBQ1IsV0FBVztBQUFBLElBQ1gsUUFBUTtBQUFBLElBQ1IsV0FBVztBQUFBLElBQ1gsYUFBYTtBQUFBLElBQ2IsZUFBZTtBQUFBLE1BQ2IsV0FBVztBQUFBLFFBQ1QsbUJBQW1CO0FBQUEsUUFDbkIseUJBQXlCO0FBQUEsUUFDekIsd0JBQXdCO0FBQUEsUUFDeEIsMEJBQTBCO0FBQUEsTUFDNUI7QUFBQSxNQUNBLFFBQVE7QUFBQSxRQUNOLHNCQUFzQjtBQUFBLFFBQ3RCLGdCQUFnQjtBQUFBLFFBQ2hCLGNBQWMsQ0FBQyxPQUFPO0FBQ3BCLGNBQUksR0FBRyxTQUFTLGNBQWMsR0FBRztBQUcvQixnQkFBSSxHQUFHLFNBQVMsbUJBQW1CO0FBQUcscUJBQU87QUFDN0MsZ0JBQUksR0FBRyxTQUFTLG1CQUFtQjtBQUFHLHFCQUFPO0FBQzdDLGdCQUFJLEdBQUcsU0FBUyxtQkFBbUI7QUFBRyxxQkFBTztBQUc3QyxnQkFBSSxHQUFHLFNBQVMsMEJBQTBCO0FBQUcscUJBQU87QUFHcEQsZ0JBQUksR0FBRyxTQUFTLFlBQVk7QUFBRyxxQkFBTztBQUN0QyxnQkFBSSxHQUFHLFNBQVMsT0FBTztBQUFHLHFCQUFPO0FBQ2pDLGdCQUFJLEdBQUcsU0FBUyxpQkFBaUI7QUFBRyxxQkFBTztBQUMzQyxnQkFBSSxHQUFHLFNBQVMsYUFBYTtBQUFHLHFCQUFPO0FBQ3ZDLGdCQUFJLEdBQUcsU0FBUyxZQUFZO0FBQUcscUJBQU87QUFDdEMsZ0JBQUksR0FBRyxTQUFTLFlBQVk7QUFBRyxxQkFBTztBQUN0QyxnQkFBSSxHQUFHLFNBQVMsaUJBQWlCO0FBQUcscUJBQU87QUFHM0MsZ0JBQUksR0FBRyxTQUFTLFVBQVU7QUFBRyxxQkFBTztBQUNwQyxnQkFBSSxHQUFHLFNBQVMsaUJBQWlCO0FBQUcscUJBQU87QUFDM0MsZ0JBQUksR0FBRyxTQUFTLG1CQUFtQjtBQUFHLHFCQUFPO0FBQzdDLGdCQUFJLEdBQUcsU0FBUyxvQkFBb0I7QUFBRyxxQkFBTztBQUc5QyxnQkFBSSxHQUFHLFNBQVMsY0FBYztBQUFHLHFCQUFPO0FBQ3hDLGdCQUFJLEdBQUcsU0FBUyxZQUFZO0FBQUcscUJBQU87QUFHdEMsZ0JBQUksR0FBRyxTQUFTLFFBQVE7QUFBRyxxQkFBTztBQUNsQyxnQkFBSSxHQUFHLFNBQVMsVUFBVTtBQUFHLHFCQUFPO0FBQ3BDLGdCQUFJLEdBQUcsU0FBUyxPQUFPO0FBQUcscUJBQU87QUFHakMsZ0JBQUksR0FBRyxTQUFTLE1BQU07QUFBRyxxQkFBTztBQUNoQyxnQkFBSSxHQUFHLFNBQVMsT0FBTztBQUFHLHFCQUFPO0FBQ2pDLGdCQUFJLEdBQUcsU0FBUyxRQUFRO0FBQUcscUJBQU87QUFDbEMsZ0JBQUksR0FBRyxTQUFTLFdBQVc7QUFBRyxxQkFBTztBQUNyQyxnQkFBSSxHQUFHLFNBQVMsTUFBTTtBQUFHLHFCQUFPO0FBQ2hDLGdCQUFJLEdBQUcsU0FBUyxjQUFjO0FBQUcscUJBQU87QUFDeEMsZ0JBQUksR0FBRyxTQUFTLGFBQWE7QUFBRyxxQkFBTztBQUN2QyxnQkFBSSxHQUFHLFNBQVMsUUFBUTtBQUFHLHFCQUFPO0FBR2xDLGdCQUFJLEdBQUcsU0FBUyxRQUFRO0FBQUcscUJBQU87QUFDbEMsZ0JBQUksR0FBRyxTQUFTLFlBQVk7QUFBRyxxQkFBTztBQUN0QyxnQkFBSSxHQUFHLFNBQVMsV0FBVztBQUFHLHFCQUFPO0FBQ3JDLGdCQUFJLEdBQUcsU0FBUyxRQUFRO0FBQUcscUJBQU87QUFDbEMsZ0JBQUksR0FBRyxTQUFTLE1BQU07QUFBRyxxQkFBTztBQUNoQyxnQkFBSSxHQUFHLFNBQVMsUUFBUTtBQUFHLHFCQUFPO0FBQ2xDLGdCQUFJLEdBQUcsU0FBUyxlQUFlO0FBQUcscUJBQU87QUFHekMsZ0JBQUksR0FBRyxTQUFTLE9BQU87QUFBRyxxQkFBTztBQUNqQyxnQkFBSSxHQUFHLFNBQVMsT0FBTztBQUFHLHFCQUFPO0FBQ2pDLGdCQUFJLEdBQUcsU0FBUyxNQUFNO0FBQUcscUJBQU87QUFDaEMsZ0JBQUksR0FBRyxTQUFTLE9BQU87QUFBRyxxQkFBTztBQUdqQyxnQkFBSSxHQUFHLFNBQVMsUUFBUTtBQUFHLHFCQUFPO0FBQ2xDLGdCQUFJLEdBQUcsU0FBUyxXQUFXO0FBQUcscUJBQU87QUFHckMsZ0JBQUksR0FBRyxTQUFTLHNCQUFzQjtBQUFHLHFCQUFPO0FBQ2hELGdCQUFJLEdBQUcsU0FBUywwQkFBMEI7QUFBRyxxQkFBTztBQUlwRCxnQkFBSSxHQUFHLFNBQVMscUJBQXFCO0FBQUcscUJBQU87QUFDL0MsZ0JBQUksR0FBRyxTQUFTLHFCQUFxQjtBQUFHLHFCQUFPO0FBRy9DLGdCQUFJLEdBQUcsU0FBUyxRQUFRO0FBQUcscUJBQU87QUFDbEMsZ0JBQUksR0FBRyxTQUFTLFlBQVk7QUFBRyxxQkFBTztBQUN0QyxnQkFBSSxHQUFHLFNBQVMsVUFBVTtBQUFHLHFCQUFPO0FBQ3BDLGdCQUFJLEdBQUcsU0FBUyxjQUFjO0FBQUcscUJBQU87QUFDeEMsZ0JBQUksR0FBRyxTQUFTLGVBQWU7QUFBRyxxQkFBTztBQUN6QyxnQkFBSSxHQUFHLFNBQVMsWUFBWTtBQUFHLHFCQUFPO0FBQ3RDLGdCQUFJLEdBQUcsU0FBUyxxQkFBcUI7QUFBRyxxQkFBTztBQUMvQyxnQkFBSSxHQUFHLFNBQVMsaUJBQWlCO0FBQUcscUJBQU87QUFDM0MsZ0JBQUksR0FBRyxTQUFTLGlCQUFpQjtBQUFHLHFCQUFPO0FBQzNDLGdCQUFJLEdBQUcsU0FBUyxnQkFBZ0I7QUFBRyxxQkFBTztBQUMxQyxnQkFBSSxHQUFHLFNBQVMsa0NBQWtDO0FBQUcscUJBQU87QUFDNUQsZ0JBQUksR0FBRyxTQUFTLHVCQUF1QjtBQUFHLHFCQUFPO0FBQ2pELG1CQUFPO0FBQUEsVUFDVDtBQUNBLGlCQUFPO0FBQUEsUUFDVDtBQUFBLE1BQ0Y7QUFBQSxNQUNBLFNBQVM7QUFBQSxRQUNQLE9BQU87QUFBQSxVQUNMLFVBQVU7QUFBQSxZQUNSLGNBQWM7QUFBQSxZQUNkLGVBQWU7QUFBQSxZQUNmLFlBQVksQ0FBQyxnQkFBZ0IsaUJBQWlCLGFBQWE7QUFBQSxVQUM3RDtBQUFBLFVBQ0EsUUFBUTtBQUFBLFlBQ04sVUFBVTtBQUFBLFVBQ1o7QUFBQSxRQUNGLENBQUM7QUFBQSxNQUNIO0FBQUEsTUFDQSxRQUFRLENBQUMsU0FBUyxTQUFTO0FBQ3pCLFlBQUksUUFBUSxTQUFTLDBCQUEwQjtBQUM3QztBQUFBLFFBQ0Y7QUFDQSxhQUFLLE9BQU87QUFBQSxNQUNkO0FBQUEsSUFDRjtBQUFBLElBQ0EsaUJBQWlCO0FBQUEsTUFDZix5QkFBMEI7QUFBQSxNQUMxQix3QkFBd0IsQ0FBQyxPQUFPO0FBQzlCLFlBQUksR0FBRyxRQUFRLFVBQVUsTUFBTSxJQUFJO0FBQ2pDLGlCQUFPO0FBQUEsUUFDVDtBQUNBLGVBQU87QUFBQSxNQUNUO0FBQUEsSUFDRjtBQUFBLEVBQ0Y7QUFBQSxFQUNBLGNBQWM7QUFBQSxJQUNaLFNBQVMsQ0FBQyw0QkFBNEI7QUFBQSxJQUN0QyxTQUFTLENBQUMsTUFBTTtBQUFBO0FBQUE7QUFBQSxFQUdsQjtBQUFBLEVBQ0EsS0FBSztBQUFBLElBQ0gscUJBQXFCO0FBQUEsTUFDbkIsTUFBTTtBQUFBLFFBQ0osWUFBWTtBQUFBLFVBQ1Ysa0JBQWtCO0FBQUEsVUFDbEIsZUFBZTtBQUFBLFVBQ2Ysc0JBQXNCO0FBQUEsVUFDdEIsdUJBQXVCO0FBQUEsUUFDekI7QUFBQSxRQUNBLG1CQUFtQjtBQUFBLE1BQ3JCO0FBQUEsSUFDRjtBQUFBLElBQ0EsU0FBUztBQUFBO0FBQUEsTUFFUCxnQkFBZ0I7QUFBQTtBQUFBLElBQ2xCO0FBQUEsRUFDRjtBQUFBLEVBQ0EsUUFBUTtBQUFBLElBQ04sTUFBTTtBQUFBLElBQ04sTUFBTTtBQUFBLElBQ04sTUFBTTtBQUFBLElBQ04sTUFBTTtBQUFBLElBQ04sT0FBTztBQUFBLEVBQ1Q7QUFBQSxFQUNBLFNBQVM7QUFBQSxJQUNQLFFBQVE7QUFBQSxNQUNOLFlBQVk7QUFBQSxNQUNaLFFBQVE7QUFBQSxRQUNOLGFBQWE7QUFBQSxRQUNiLEtBQUs7QUFBQSxVQUNILFVBQVUsQ0FBQyxPQUFPO0FBQUEsUUFDcEI7QUFBQSxNQUNGO0FBQUEsSUFDRixDQUFDO0FBQUEsSUFDRCxNQUFNO0FBQUEsTUFDSixPQUFPO0FBQUEsUUFDTCxZQUFZO0FBQUEsVUFDVixTQUFTLENBQUMsbUJBQW1CO0FBQUEsUUFDL0I7QUFBQSxNQUNGO0FBQUEsSUFDRixDQUFDO0FBQUEsSUFDRCxrQkFBa0I7QUFBQSxNQUNoQixVQUFVLENBQUMsNkJBQTZCLGtDQUFrQztBQUFBLElBQzVFLENBQUM7QUFBQSxJQUNELFdBQVc7QUFBQSxNQUNULGFBQWE7QUFBQSxRQUNYLFlBQVk7QUFBQSxRQUNaLFVBQVU7QUFBQSxRQUNWLE1BQU07QUFBQSxRQUNOLFdBQVc7QUFBQSxRQUNYLEtBQUs7QUFBQSxNQUNQO0FBQUEsSUFDRixDQUFDO0FBQUEsSUFDRCxnQkFBZ0I7QUFBQSxJQUNoQixpQkFBaUI7QUFBQSxNQUNmLFFBQVE7QUFBQSxNQUNSLFFBQVE7QUFBQSxRQUNOLE1BQU07QUFBQSxVQUNKLG9CQUFvQixRQUFRLEtBQUssZ0JBQWdCLElBQUksR0FBRyxvQkFBb0I7QUFBQSxRQUM5RTtBQUFBLE1BQ0Y7QUFBQSxJQUNGLENBQUM7QUFBQSxJQUNELHVCQUF1QixXQUFXO0FBQUEsSUFDbEMsY0FBYztBQUFBLElBQ2IsRUFBRSxTQUFTLENBQUMsU0FBUyxFQUFFO0FBQUEsRUFDMUIsRUFBRSxPQUFPLE9BQU87QUFDbEI7QUFFQSxJQUFNLHFCQUFpQztBQUFBLEVBQ3JDLEdBQUc7QUFBQSxFQUNILFFBQVE7QUFBQSxJQUNOLEdBQUcsV0FBVztBQUFBLElBQ2Qsd0JBQXdCLEtBQUssVUFBVSxZQUFZO0FBQUEsRUFDckQ7QUFBQSxFQUNBLE9BQU87QUFBQSxJQUNMLEdBQUcsV0FBVztBQUFBLElBQ2QsVUFBVTtBQUFBLElBQ1YsZUFBZTtBQUFBLElBQ2YsYUFBYTtBQUFBLElBQ2IsS0FBSztBQUFBLE1BQ0gsU0FBUyxDQUFDLElBQUk7QUFBQSxNQUNkLE1BQU07QUFBQSxNQUNOLE9BQU87QUFBQSxNQUNQLFVBQVUsTUFBTTtBQUNkLGVBQU87QUFBQSxNQUNUO0FBQUEsSUFDRjtBQUFBLEVBQ0Y7QUFDRjtBQUVBLElBQU0sZUFBZTtBQUFBLEVBQ25CLE1BQU07QUFBQSxFQUNOLGNBQWM7QUFDaEI7QUFFQSxJQUFNLGNBQWMsYUFBYSxRQUFRLElBQUksZ0JBQWdCLE1BQU07QUFFbkUsSUFBTyxzQkFBUSxhQUFhLGVBQWUsVUFBVTsiLAogICJuYW1lcyI6IFtdCn0K
