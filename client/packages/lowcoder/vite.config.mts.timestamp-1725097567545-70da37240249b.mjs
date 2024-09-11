// vite.config.mts
import dotenv from "file:///Users/falkwolskyadmin/Development/Lowcoder/Development/lowcoder/client/node_modules/dotenv/lib/main.js";
import { defineConfig } from "file:///Users/falkwolskyadmin/Development/Lowcoder/Development/lowcoder/client/node_modules/vite/dist/node/index.js";
import react from "file:///Users/falkwolskyadmin/Development/Lowcoder/Development/lowcoder/client/node_modules/@vitejs/plugin-react/dist/index.mjs";
import viteTsconfigPaths from "file:///Users/falkwolskyadmin/Development/Lowcoder/Development/lowcoder/client/node_modules/vite-tsconfig-paths/dist/index.mjs";
import svgrPlugin from "file:///Users/falkwolskyadmin/Development/Lowcoder/Development/lowcoder/client/node_modules/vite-plugin-svgr/dist/index.mjs";
import checker from "file:///Users/falkwolskyadmin/Development/Lowcoder/Development/lowcoder/client/node_modules/vite-plugin-checker/dist/esm/main.js";
import { visualizer } from "file:///Users/falkwolskyadmin/Development/Lowcoder/Development/lowcoder/client/node_modules/rollup-plugin-visualizer/dist/plugin/index.js";
import path from "path";
import chalk from "file:///Users/falkwolskyadmin/Development/Lowcoder/Development/lowcoder/client/node_modules/chalk/source/index.js";
import { createHtmlPlugin } from "file:///Users/falkwolskyadmin/Development/Lowcoder/Development/lowcoder/client/node_modules/vite-plugin-html/dist/index.mjs";
import dynamicImport from "file:///Users/falkwolskyadmin/Development/Lowcoder/Development/lowcoder/client/node_modules/vite-plugin-dynamic-import/dist/index.mjs";

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
var __vite_injected_original_dirname = "/Users/falkwolskyadmin/Development/Lowcoder/Development/lowcoder/client/packages/lowcoder";
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
    manifest: true,
    target: "es2015",
    cssTarget: "chrome63",
    outDir: "build",
    assetsDir: "static",
    emptyOutDir: false,
    rollupOptions: {
      output: {
        chunkFileNames: "[hash].js"
      },
      onwarn: (warning, warn) => {
        if (warning.code === "MODULE_LEVEL_DIRECTIVE") {
          return;
        }
        warn(warning);
      }
    },
    commonjsOptions: {
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
          "@primary-color": "#3377FF",
          "@link-color": "#3377FF",
          "@border-color-base": "#D7D9E0",
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
    copyPublicDir: false,
    emptyOutDir: true,
    lib: {
      formats: ["iife"],
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcubXRzIiwgInNyYy9kZXYtdXRpbHMvdXRpbC5qcyIsICJzcmMvZGV2LXV0aWxzL2J1aWxkVmFycy5qcyIsICJzcmMvZGV2LXV0aWxzL2V4dGVybmFsLmpzIiwgInNyYy9kZXYtdXRpbHMvZ2xvYmFsRGVwUGxndWluLmpzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiL1VzZXJzL2ZhbGt3b2xza3lhZG1pbi9EZXZlbG9wbWVudC9Mb3djb2Rlci9EZXZlbG9wbWVudC9sb3djb2Rlci9jbGllbnQvcGFja2FnZXMvbG93Y29kZXJcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIi9Vc2Vycy9mYWxrd29sc2t5YWRtaW4vRGV2ZWxvcG1lbnQvTG93Y29kZXIvRGV2ZWxvcG1lbnQvbG93Y29kZXIvY2xpZW50L3BhY2thZ2VzL2xvd2NvZGVyL3ZpdGUuY29uZmlnLm10c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vVXNlcnMvZmFsa3dvbHNreWFkbWluL0RldmVsb3BtZW50L0xvd2NvZGVyL0RldmVsb3BtZW50L2xvd2NvZGVyL2NsaWVudC9wYWNrYWdlcy9sb3djb2Rlci92aXRlLmNvbmZpZy5tdHNcIjtpbXBvcnQgZG90ZW52IGZyb20gXCJkb3RlbnZcIjtcbmltcG9ydCB7IGRlZmluZUNvbmZpZywgU2VydmVyT3B0aW9ucywgVXNlckNvbmZpZyB9IGZyb20gXCJ2aXRlXCI7XG5pbXBvcnQgcmVhY3QgZnJvbSBcIkB2aXRlanMvcGx1Z2luLXJlYWN0XCI7XG5pbXBvcnQgdml0ZVRzY29uZmlnUGF0aHMgZnJvbSBcInZpdGUtdHNjb25maWctcGF0aHNcIjtcbmltcG9ydCBzdmdyUGx1Z2luIGZyb20gXCJ2aXRlLXBsdWdpbi1zdmdyXCI7XG5pbXBvcnQgY2hlY2tlciBmcm9tIFwidml0ZS1wbHVnaW4tY2hlY2tlclwiO1xuaW1wb3J0IHsgdmlzdWFsaXplciB9IGZyb20gXCJyb2xsdXAtcGx1Z2luLXZpc3VhbGl6ZXJcIjtcbmltcG9ydCBwYXRoIGZyb20gXCJwYXRoXCI7XG5pbXBvcnQgY2hhbGsgZnJvbSBcImNoYWxrXCI7XG5pbXBvcnQgeyBjcmVhdGVIdG1sUGx1Z2luIH0gZnJvbSBcInZpdGUtcGx1Z2luLWh0bWxcIjtcbmltcG9ydCBkeW5hbWljSW1wb3J0IGZyb20gJ3ZpdGUtcGx1Z2luLWR5bmFtaWMtaW1wb3J0JztcbmltcG9ydCB7IGVuc3VyZUxhc3RTbGFzaCB9IGZyb20gXCIuL3NyYy9kZXYtdXRpbHMvdXRpbFwiO1xuaW1wb3J0IHsgYnVpbGRWYXJzIH0gZnJvbSBcIi4vc3JjL2Rldi11dGlscy9idWlsZFZhcnNcIjtcbmltcG9ydCB7IGdsb2JhbERlcFBsdWdpbiB9IGZyb20gXCIuL3NyYy9kZXYtdXRpbHMvZ2xvYmFsRGVwUGxndWluXCI7XG4vLyBpbXBvcnQgeyBub2RlUG9seWZpbGxzIH0gZnJvbSAndml0ZS1wbHVnaW4tbm9kZS1wb2x5ZmlsbHMnXG5cbmRvdGVudi5jb25maWcoKTtcblxuY29uc3QgYXBpUHJveHlUYXJnZXQgPSBwcm9jZXNzLmVudi5MT1dDT0RFUl9BUElfU0VSVklDRV9VUkw7XG5jb25zdCBub2RlU2VydmljZUFwaVByb3h5VGFyZ2V0ID0gcHJvY2Vzcy5lbnYuTE9XQ09ERVJfTk9ERV9TRVJWSUNFX1VSTDtcbmNvbnN0IG5vZGVFbnYgPSBwcm9jZXNzLmVudi5OT0RFX0VOViA/PyBcImRldmVsb3BtZW50XCI7XG5jb25zdCBpc0RldiA9IG5vZGVFbnYgPT09IFwiZGV2ZWxvcG1lbnRcIjtcbmNvbnN0IGlzVmlzdWFsaXplckVuYWJsZWQgPSAhIXByb2Nlc3MuZW52LkVOQUJMRV9WSVNVQUxJWkVSO1xuLy8gdGhlIGZpbGUgd2FzIG5ldmVyIGNyZWF0ZWRcbi8vIGNvbnN0IGJyb3dzZXJDaGVja0ZpbGVOYW1lID0gYGJyb3dzZXItY2hlY2stJHtwcm9jZXNzLmVudi5SRUFDVF9BUFBfQ09NTUlUX0lEfS5qc2A7XG5jb25zdCBicm93c2VyQ2hlY2tGaWxlTmFtZSA9IGBicm93c2VyLWNoZWNrLmpzYDtcbmNvbnN0IGJhc2UgPSBlbnN1cmVMYXN0U2xhc2gocHJvY2Vzcy5lbnYuUFVCTElDX1VSTCk7XG5cbmlmICghYXBpUHJveHlUYXJnZXQgJiYgaXNEZXYpIHtcbiAgY29uc29sZS5sb2coKTtcbiAgY29uc29sZS5sb2coY2hhbGsucmVkYExPV0NPREVSX0FQSV9TRVJWSUNFX1VSTCBpcyByZXF1aXJlZC5cXG5gKTtcbiAgY29uc29sZS5sb2coY2hhbGsuY3lhbmBTdGFydCB3aXRoIGNvbW1hbmQ6IExPV0NPREVSX0FQSV9TRVJWSUNFX1VSTD1cXHtiYWNrZW5kLWFwaS1hZGRyXFx9IHlhcm4gc3RhcnRgKTtcbiAgY29uc29sZS5sb2coKTtcbiAgcHJvY2Vzcy5leGl0KDEpO1xufVxuXG5jb25zdCBwcm94eUNvbmZpZzogU2VydmVyT3B0aW9uc1tcInByb3h5XCJdID0ge1xuICBcIi9hcGlcIjoge1xuICAgIHRhcmdldDogYXBpUHJveHlUYXJnZXQsXG4gICAgY2hhbmdlT3JpZ2luOiBmYWxzZSxcbiAgfSxcbn07XG5cbmlmIChub2RlU2VydmljZUFwaVByb3h5VGFyZ2V0KSB7XG4gIHByb3h5Q29uZmlnW1wiL25vZGUtc2VydmljZVwiXSA9IHtcbiAgICB0YXJnZXQ6IG5vZGVTZXJ2aWNlQXBpUHJveHlUYXJnZXQsXG4gIH07XG59XG5cbmNvbnN0IGRlZmluZSA9IHt9O1xuYnVpbGRWYXJzLmZvckVhY2goKHsgbmFtZSwgZGVmYXVsdFZhbHVlIH0pID0+IHtcbiAgZGVmaW5lW25hbWVdID0gSlNPTi5zdHJpbmdpZnkocHJvY2Vzcy5lbnZbbmFtZV0gfHwgZGVmYXVsdFZhbHVlKTtcbn0pO1xuXG4vLyBodHRwczovL3ZpdGVqcy5kZXYvY29uZmlnL1xuZXhwb3J0IGNvbnN0IHZpdGVDb25maWc6IFVzZXJDb25maWcgPSB7XG4gIGRlZmluZSxcbiAgYXNzZXRzSW5jbHVkZTogW1wiKiovKi5tZFwiXSxcbiAgcmVzb2x2ZToge1xuICAgIGV4dGVuc2lvbnM6IFtcIi5tanNcIiwgXCIuanNcIiwgXCIudHNcIiwgXCIuanN4XCIsIFwiLnRzeFwiLCBcIi5qc29uXCJdLFxuICAgIGFsaWFzOiB7XG4gICAgICBcIkBsb3djb2Rlci1lZVwiOiBwYXRoLnJlc29sdmUoXG4gICAgICAgIF9fZGlybmFtZSwgXCIuLi9sb3djb2Rlci9zcmNcIlxuICAgICAgKSxcbiAgICB9LFxuICB9LFxuICBiYXNlLFxuICBidWlsZDoge1xuICAgIG1hbmlmZXN0OiB0cnVlLFxuICAgIHRhcmdldDogXCJlczIwMTVcIixcbiAgICBjc3NUYXJnZXQ6IFwiY2hyb21lNjNcIixcbiAgICBvdXREaXI6IFwiYnVpbGRcIixcbiAgICBhc3NldHNEaXI6IFwic3RhdGljXCIsXG4gICAgZW1wdHlPdXREaXI6IGZhbHNlLFxuICAgIHJvbGx1cE9wdGlvbnM6IHtcbiAgICAgIG91dHB1dDoge1xuICAgICAgICBjaHVua0ZpbGVOYW1lczogXCJbaGFzaF0uanNcIixcbiAgICAgIH0sXG4gICAgICBvbndhcm46ICh3YXJuaW5nLCB3YXJuKSA9PiB7XG4gICAgICAgIGlmICh3YXJuaW5nLmNvZGUgPT09ICdNT0RVTEVfTEVWRUxfRElSRUNUSVZFJykge1xuICAgICAgICAgIHJldHVyblxuICAgICAgICB9XG4gICAgICAgIHdhcm4od2FybmluZylcbiAgICAgIH0sXG4gICAgfSxcbiAgICBjb21tb25qc09wdGlvbnM6IHtcbiAgICAgIGRlZmF1bHRJc01vZHVsZUV4cG9ydHM6IChpZCkgPT4ge1xuICAgICAgICBpZiAoaWQuaW5kZXhPZihcImFudGQvbGliXCIpICE9PSAtMSkge1xuICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gXCJhdXRvXCI7XG4gICAgICB9LFxuICAgIH0sXG4gIH0sXG4gIG9wdGltaXplRGVwczoge1xuICAgIGVudHJpZXM6IFsnLi9zcmMvKiovKi57anMsanN4LHRzLHRzeH0nXSxcbiAgICBpbmNsdWRlOiBbJ2FudGQnXSxcbiAgICAvLyBpbmNsdWRlOiBbJ2FudGQvKiovKiddLFxuICAgIC8vIGZvcmNlOiB0cnVlLFxuICB9LFxuICBjc3M6IHtcbiAgICBwcmVwcm9jZXNzb3JPcHRpb25zOiB7XG4gICAgICBsZXNzOiB7XG4gICAgICAgIG1vZGlmeVZhcnM6IHtcbiAgICAgICAgICBcIkBwcmltYXJ5LWNvbG9yXCI6IFwiIzMzNzdGRlwiLFxuICAgICAgICAgIFwiQGxpbmstY29sb3JcIjogXCIjMzM3N0ZGXCIsXG4gICAgICAgICAgXCJAYm9yZGVyLWNvbG9yLWJhc2VcIjogXCIjRDdEOUUwXCIsXG4gICAgICAgICAgXCJAYm9yZGVyLXJhZGl1cy1iYXNlXCI6IFwiNHB4XCIsXG4gICAgICAgIH0sXG4gICAgICAgIGphdmFzY3JpcHRFbmFibGVkOiB0cnVlLFxuICAgICAgfSxcbiAgICB9LFxuICAgIG1vZHVsZXM6IHtcbiAgICAgIC8vIENvbmZpZ3VyYXRpb24gZm9yIENTUyBtb2R1bGVzXG4gICAgICBzY29wZUJlaGF2aW91cjogJ2xvY2FsJyAvLyBFbnN1cmVzIENTUyBtb2R1bGVzIGFyZSBzY29wZWQgbG9jYWxseSBieSBkZWZhdWx0XG4gICAgfVxuICB9LFxuICBzZXJ2ZXI6IHtcbiAgICBvcGVuOiB0cnVlLFxuICAgIGNvcnM6IHRydWUsXG4gICAgcG9ydDogODAwMCxcbiAgICBob3N0OiBcIjAuMC4wLjBcIixcbiAgICBwcm94eTogcHJveHlDb25maWcsXG4gIH0sXG4gIHBsdWdpbnM6IFtcbiAgICBjaGVja2VyKHtcbiAgICAgIHR5cGVzY3JpcHQ6IHRydWUsXG4gICAgICBlc2xpbnQ6IHtcbiAgICAgICAgbGludENvbW1hbmQ6ICdlc2xpbnQgLS1xdWlldCBcIi4vc3JjLyoqLyoue3RzLHRzeH1cIicsXG4gICAgICAgIGRldjoge1xuICAgICAgICAgIGxvZ0xldmVsOiBbXCJlcnJvclwiXSxcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgfSksXG4gICAgcmVhY3Qoe1xuICAgICAgYmFiZWw6IHtcbiAgICAgICAgcGFyc2VyT3B0czoge1xuICAgICAgICAgIHBsdWdpbnM6IFtcImRlY29yYXRvcnMtbGVnYWN5XCJdLFxuICAgICAgICB9LFxuICAgICAgfSxcbiAgICB9KSxcbiAgICB2aXRlVHNjb25maWdQYXRocyh7XG4gICAgICBwcm9qZWN0czogW1wiLi4vbG93Y29kZXIvdHNjb25maWcuanNvblwiLCBcIi4uL2xvd2NvZGVyLWRlc2lnbi90c2NvbmZpZy5qc29uXCJdLFxuICAgIH0pLFxuICAgIHN2Z3JQbHVnaW4oe1xuICAgICAgc3Znck9wdGlvbnM6IHtcbiAgICAgICAgZXhwb3J0VHlwZTogXCJuYW1lZFwiLFxuICAgICAgICBwcmV0dGllcjogZmFsc2UsXG4gICAgICAgIHN2Z286IGZhbHNlLFxuICAgICAgICB0aXRsZVByb3A6IHRydWUsXG4gICAgICAgIHJlZjogdHJ1ZSxcbiAgICAgIH0sXG4gICAgfSksXG4gICAgZ2xvYmFsRGVwUGx1Z2luKCksXG4gICAgY3JlYXRlSHRtbFBsdWdpbih7XG4gICAgICBtaW5pZnk6IHRydWUsXG4gICAgICBpbmplY3Q6IHtcbiAgICAgICAgZGF0YToge1xuICAgICAgICAgIGJyb3dzZXJDaGVja1NjcmlwdDogaXNEZXYgPyBcIlwiIDogYDxzY3JpcHQgc3JjPVwiJHtiYXNlfSR7YnJvd3NlckNoZWNrRmlsZU5hbWV9XCI+PC9zY3JpcHQ+YCxcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgfSksXG4gICAgaXNWaXN1YWxpemVyRW5hYmxlZCAmJiB2aXN1YWxpemVyKCksXG4gICAgZHluYW1pY0ltcG9ydCgpLFxuICAgICh7IGluY2x1ZGU6IFsncHJvY2VzcyddIH0pLFxuICBdLmZpbHRlcihCb29sZWFuKSxcbn07XG5cbmNvbnN0IGJyb3dzZXJDaGVja0NvbmZpZzogVXNlckNvbmZpZyA9IHtcbiAgLi4udml0ZUNvbmZpZyxcbiAgZGVmaW5lOiB7XG4gICAgLi4udml0ZUNvbmZpZy5kZWZpbmUsXG4gICAgXCJwcm9jZXNzLmVudi5OT0RFX0VOVlwiOiBKU09OLnN0cmluZ2lmeShcInByb2R1Y3Rpb25cIiksXG4gIH0sXG4gIGJ1aWxkOiB7XG4gICAgLi4udml0ZUNvbmZpZy5idWlsZCxcbiAgICBtYW5pZmVzdDogZmFsc2UsXG4gICAgY29weVB1YmxpY0RpcjogZmFsc2UsXG4gICAgZW1wdHlPdXREaXI6IHRydWUsXG4gICAgbGliOiB7XG4gICAgICBmb3JtYXRzOiBbXCJpaWZlXCJdLFxuICAgICAgbmFtZTogXCJCcm93c2VyQ2hlY2tcIixcbiAgICAgIGVudHJ5OiBcIi4vc3JjL2Jyb3dzZXItY2hlY2sudHNcIixcbiAgICAgIGZpbGVOYW1lOiAoKSA9PiB7XG4gICAgICAgIHJldHVybiBicm93c2VyQ2hlY2tGaWxlTmFtZTtcbiAgICAgIH0sXG4gICAgfSxcbiAgfSxcbn07XG5cbmNvbnN0IGJ1aWxkVGFyZ2V0cyA9IHtcbiAgbWFpbjogdml0ZUNvbmZpZyxcbiAgYnJvd3NlckNoZWNrOiBicm93c2VyQ2hlY2tDb25maWcsXG59O1xuXG5jb25zdCBidWlsZFRhcmdldCA9IGJ1aWxkVGFyZ2V0c1twcm9jZXNzLmVudi5CVUlMRF9UQVJHRVQgfHwgXCJtYWluXCJdO1xuXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoYnVpbGRUYXJnZXQgfHwgdml0ZUNvbmZpZyk7XG4iLCAiY29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2Rpcm5hbWUgPSBcIi9Vc2Vycy9mYWxrd29sc2t5YWRtaW4vRGV2ZWxvcG1lbnQvTG93Y29kZXIvRGV2ZWxvcG1lbnQvbG93Y29kZXIvY2xpZW50L3BhY2thZ2VzL2xvd2NvZGVyL3NyYy9kZXYtdXRpbHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIi9Vc2Vycy9mYWxrd29sc2t5YWRtaW4vRGV2ZWxvcG1lbnQvTG93Y29kZXIvRGV2ZWxvcG1lbnQvbG93Y29kZXIvY2xpZW50L3BhY2thZ2VzL2xvd2NvZGVyL3NyYy9kZXYtdXRpbHMvdXRpbC5qc1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vVXNlcnMvZmFsa3dvbHNreWFkbWluL0RldmVsb3BtZW50L0xvd2NvZGVyL0RldmVsb3BtZW50L2xvd2NvZGVyL2NsaWVudC9wYWNrYWdlcy9sb3djb2Rlci9zcmMvZGV2LXV0aWxzL3V0aWwuanNcIjtpbXBvcnQgZnMgZnJvbSBcIm5vZGU6ZnNcIjtcbmltcG9ydCB7IGRpcm5hbWUgfSBmcm9tIFwibm9kZTpwYXRoXCI7XG5pbXBvcnQgeyBmaWxlVVJMVG9QYXRoIH0gZnJvbSBcIm5vZGU6dXJsXCI7XG5cbmV4cG9ydCBmdW5jdGlvbiBzdHJpcExhc3RTbGFzaChzdHIpIHtcbiAgaWYgKHN0ci5lbmRzV2l0aChcIi9cIikpIHtcbiAgICByZXR1cm4gc3RyLnNsaWNlKDAsIHN0ci5sZW5ndGggLSAxKTtcbiAgfVxuICByZXR1cm4gc3RyO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZW5zdXJlTGFzdFNsYXNoKHN0cikge1xuICBpZiAoIXN0cikge1xuICAgIHJldHVybiBcIi9cIjtcbiAgfVxuICBpZiAoIXN0ci5lbmRzV2l0aChcIi9cIikpIHtcbiAgICByZXR1cm4gYCR7c3RyfS9gO1xuICB9XG4gIHJldHVybiBzdHI7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiByZWFkSnNvbihmaWxlKSB7XG4gIHJldHVybiBKU09OLnBhcnNlKGZzLnJlYWRGaWxlU3luYyhmaWxlKS50b1N0cmluZygpKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGN1cnJlbnREaXJOYW1lKGltcG9ydE1ldGFVcmwpIHtcbiAgcmV0dXJuIGRpcm5hbWUoZmlsZVVSTFRvUGF0aChpbXBvcnRNZXRhVXJsKSk7XG59XG4iLCAiY29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2Rpcm5hbWUgPSBcIi9Vc2Vycy9mYWxrd29sc2t5YWRtaW4vRGV2ZWxvcG1lbnQvTG93Y29kZXIvRGV2ZWxvcG1lbnQvbG93Y29kZXIvY2xpZW50L3BhY2thZ2VzL2xvd2NvZGVyL3NyYy9kZXYtdXRpbHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIi9Vc2Vycy9mYWxrd29sc2t5YWRtaW4vRGV2ZWxvcG1lbnQvTG93Y29kZXIvRGV2ZWxvcG1lbnQvbG93Y29kZXIvY2xpZW50L3BhY2thZ2VzL2xvd2NvZGVyL3NyYy9kZXYtdXRpbHMvYnVpbGRWYXJzLmpzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9Vc2Vycy9mYWxrd29sc2t5YWRtaW4vRGV2ZWxvcG1lbnQvTG93Y29kZXIvRGV2ZWxvcG1lbnQvbG93Y29kZXIvY2xpZW50L3BhY2thZ2VzL2xvd2NvZGVyL3NyYy9kZXYtdXRpbHMvYnVpbGRWYXJzLmpzXCI7ZXhwb3J0IGNvbnN0IGJ1aWxkVmFycyA9IFtcbiAge1xuICAgIG5hbWU6IFwiUFVCTElDX1VSTFwiLFxuICAgIGRlZmF1bHRWYWx1ZTogXCIvXCIsXG4gIH0sXG4gIHtcbiAgICBuYW1lOiBcIlJFQUNUX0FQUF9FRElUSU9OXCIsXG4gICAgZGVmYXVsdFZhbHVlOiBcImNvbW11bml0eVwiLFxuICB9LFxuICB7XG4gICAgbmFtZTogXCJSRUFDVF9BUFBfTEFOR1VBR0VTXCIsXG4gICAgZGVmYXVsdFZhbHVlOiBcIlwiLFxuICB9LFxuICB7XG4gICAgbmFtZTogXCJSRUFDVF9BUFBfQ09NTUlUX0lEXCIsXG4gICAgZGVmYXVsdFZhbHVlOiBcIjAwMDAwXCIsXG4gIH0sXG4gIHtcbiAgICBuYW1lOiBcIlJFQUNUX0FQUF9BUElfU0VSVklDRV9VUkxcIixcbiAgICBkZWZhdWx0VmFsdWU6IFwiXCIsXG4gIH0sXG4gIHtcbiAgICBuYW1lOiBcIlJFQUNUX0FQUF9OT0RFX1NFUlZJQ0VfVVJMXCIsXG4gICAgZGVmYXVsdFZhbHVlOiBcIlwiLFxuICB9LFxuICB7XG4gICAgbmFtZTogXCJSRUFDVF9BUFBfRU5WXCIsXG4gICAgZGVmYXVsdFZhbHVlOiBcInByb2R1Y3Rpb25cIixcbiAgfSxcbiAge1xuICAgIG5hbWU6IFwiUkVBQ1RfQVBQX0JVSUxEX0lEXCIsXG4gICAgZGVmYXVsdFZhbHVlOiBcIlwiLFxuICB9LFxuICB7XG4gICAgbmFtZTogXCJSRUFDVF9BUFBfTE9HX0xFVkVMXCIsXG4gICAgZGVmYXVsdFZhbHVlOiBcImVycm9yXCIsXG4gIH0sXG4gIHtcbiAgICBuYW1lOiBcIlJFQUNUX0FQUF9JTVBPUlRfTUFQXCIsXG4gICAgZGVmYXVsdFZhbHVlOiBcInt9XCIsXG4gIH0sXG4gIHtcbiAgICBuYW1lOiBcIlJFQUNUX0FQUF9TRVJWRVJfSVBTXCIsXG4gICAgZGVmYXVsdFZhbHVlOiBcIlwiLFxuICB9LFxuICB7XG4gICAgbmFtZTogXCJSRUFDVF9BUFBfQlVORExFX0JVSUxUSU5fUExVR0lOXCIsXG4gICAgZGVmYXVsdFZhbHVlOiBcIlwiLFxuICB9LFxuICB7XG4gICAgbmFtZTogXCJSRUFDVF9BUFBfQlVORExFX1RZUEVcIixcbiAgICBkZWZhdWx0VmFsdWU6IFwiYXBwXCIsXG4gIH0sXG4gIHtcbiAgICBuYW1lOiBcIlJFQUNUX0FQUF9ESVNBQkxFX0pTX1NBTkRCT1hcIixcbiAgICBkZWZhdWx0VmFsdWU6IFwiXCIsXG4gIH0sXG5dO1xuIiwgImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvVXNlcnMvZmFsa3dvbHNreWFkbWluL0RldmVsb3BtZW50L0xvd2NvZGVyL0RldmVsb3BtZW50L2xvd2NvZGVyL2NsaWVudC9wYWNrYWdlcy9sb3djb2Rlci9zcmMvZGV2LXV0aWxzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvVXNlcnMvZmFsa3dvbHNreWFkbWluL0RldmVsb3BtZW50L0xvd2NvZGVyL0RldmVsb3BtZW50L2xvd2NvZGVyL2NsaWVudC9wYWNrYWdlcy9sb3djb2Rlci9zcmMvZGV2LXV0aWxzL2V4dGVybmFsLmpzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9Vc2Vycy9mYWxrd29sc2t5YWRtaW4vRGV2ZWxvcG1lbnQvTG93Y29kZXIvRGV2ZWxvcG1lbnQvbG93Y29kZXIvY2xpZW50L3BhY2thZ2VzL2xvd2NvZGVyL3NyYy9kZXYtdXRpbHMvZXh0ZXJuYWwuanNcIjsvKipcbiAqIGxpYnMgdG8gaW1wb3J0IGFzIGdsb2JhbCB2YXJcbiAqIG5hbWU6IG1vZHVsZSBuYW1lXG4gKiBtZXJnZURlZmF1bHRBbmROYW1lRXhwb3J0czogd2hldGhlciB0byBtZXJnZSBkZWZhdWx0IGFuZCBuYW1lZCBleHBvcnRzXG4gKi9cbmV4cG9ydCBjb25zdCBsaWJzID0gW1xuICBcImF4aW9zXCIsXG4gIFwicmVkdXhcIixcbiAgXCJyZWFjdC1yb3V0ZXJcIixcbiAgXCJyZWFjdC1yb3V0ZXItZG9tXCIsXG4gIFwicmVhY3QtcmVkdXhcIixcbiAgXCJyZWFjdFwiLFxuICBcInJlYWN0LWRvbVwiLFxuICBcImxvZGFzaFwiLFxuICBcImhpc3RvcnlcIixcbiAgXCJhbnRkXCIsXG4gIFwiQGRuZC1raXQvY29yZVwiLFxuICBcIkBkbmQta2l0L21vZGlmaWVyc1wiLFxuICBcIkBkbmQta2l0L3NvcnRhYmxlXCIsXG4gIFwiQGRuZC1raXQvdXRpbGl0aWVzXCIsXG4gIHtcbiAgICBuYW1lOiBcIm1vbWVudFwiLFxuICAgIGV4dHJhY3REZWZhdWx0OiB0cnVlLFxuICB9LFxuICB7XG4gICAgbmFtZTogXCJkYXlqc1wiLFxuICAgIGV4dHJhY3REZWZhdWx0OiB0cnVlLFxuICB9LFxuICB7XG4gICAgbmFtZTogXCJsb3djb2Rlci1zZGtcIixcbiAgICBmcm9tOiBcIi4vc3JjL2luZGV4LnNkay50c1wiLFxuICB9LFxuICB7XG4gICAgbmFtZTogXCJzdHlsZWQtY29tcG9uZW50c1wiLFxuICAgIG1lcmdlRGVmYXVsdEFuZE5hbWVFeHBvcnRzOiB0cnVlLFxuICB9LFxuXTtcblxuLyoqXG4gKiBnZXQgZ2xvYmFsIHZhciBuYW1lIGZyb20gbW9kdWxlIG5hbWVcbiAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lXG4gKiBAcmV0dXJuc1xuICovXG5leHBvcnQgY29uc3QgZ2V0TGliR2xvYmFsVmFyTmFtZSA9IChuYW1lKSA9PiB7XG4gIHJldHVybiBcIiRcIiArIG5hbWUucmVwbGFjZSgvQC9nLCBcIiRcIikucmVwbGFjZSgvW1xcL1xcLV0vZywgXCJfXCIpO1xufTtcblxuZXhwb3J0IGNvbnN0IGdldExpYk5hbWVzID0gKCkgPT4ge1xuICByZXR1cm4gbGlicy5tYXAoKGkpID0+IHtcbiAgICBpZiAodHlwZW9mIGkgPT09IFwib2JqZWN0XCIpIHtcbiAgICAgIHJldHVybiBpLm5hbWU7XG4gICAgfVxuICAgIHJldHVybiBpO1xuICB9KTtcbn07XG5cbmV4cG9ydCBjb25zdCBnZXRBbGxMaWJHbG9iYWxWYXJOYW1lcyA9ICgpID0+IHtcbiAgY29uc3QgcmV0ID0ge307XG4gIGxpYnMuZm9yRWFjaCgobGliKSA9PiB7XG4gICAgbGV0IG5hbWUgPSBsaWI7XG4gICAgaWYgKHR5cGVvZiBsaWIgPT09IFwib2JqZWN0XCIpIHtcbiAgICAgIG5hbWUgPSBsaWIubmFtZTtcbiAgICB9XG4gICAgcmV0W25hbWVdID0gZ2V0TGliR2xvYmFsVmFyTmFtZShuYW1lKTtcbiAgfSk7XG4gIHJldHVybiByZXQ7XG59O1xuXG5leHBvcnQgY29uc3QgbGlic0ltcG9ydENvZGUgPSAoZXhjbHVkZSA9IFtdKSA9PiB7XG4gIGNvbnN0IGltcG9ydExpbmVzID0gW107XG4gIGNvbnN0IGFzc2lnbkxpbmVzID0gW107XG4gIGxpYnMuZm9yRWFjaCgoaSkgPT4ge1xuICAgIGxldCBuYW1lID0gaTtcbiAgICBsZXQgbWVyZ2UgPSBmYWxzZTtcbiAgICBsZXQgZnJvbSA9IG5hbWU7XG4gICAgbGV0IGV4dHJhY3REZWZhdWx0ID0gZmFsc2U7XG5cbiAgICBpZiAodHlwZW9mIGkgPT09IFwib2JqZWN0XCIpIHtcbiAgICAgIG5hbWUgPSBpLm5hbWU7XG4gICAgICBtZXJnZSA9IGkubWVyZ2VEZWZhdWx0QW5kTmFtZUV4cG9ydHMgPz8gZmFsc2U7XG4gICAgICBmcm9tID0gaS5mcm9tID8/IG5hbWU7XG4gICAgICBleHRyYWN0RGVmYXVsdCA9IGkuZXh0cmFjdERlZmF1bHQgPz8gZmFsc2U7XG4gICAgfVxuXG4gICAgaWYgKGV4Y2x1ZGUuaW5jbHVkZXMobmFtZSkpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCB2YXJOYW1lID0gZ2V0TGliR2xvYmFsVmFyTmFtZShuYW1lKTtcbiAgICBpZiAobWVyZ2UpIHtcbiAgICAgIGltcG9ydExpbmVzLnB1c2goYGltcG9ydCAqIGFzICR7dmFyTmFtZX1fbmFtZWRfZXhwb3J0cyBmcm9tICcke2Zyb219JztgKTtcbiAgICAgIGltcG9ydExpbmVzLnB1c2goYGltcG9ydCAke3Zhck5hbWV9IGZyb20gJyR7ZnJvbX0nO2ApO1xuICAgICAgYXNzaWduTGluZXMucHVzaChgT2JqZWN0LmFzc2lnbigke3Zhck5hbWV9LCAke3Zhck5hbWV9X25hbWVkX2V4cG9ydHMpO2ApO1xuICAgIH0gZWxzZSBpZiAoZXh0cmFjdERlZmF1bHQpIHtcbiAgICAgIGltcG9ydExpbmVzLnB1c2goYGltcG9ydCAke3Zhck5hbWV9IGZyb20gJyR7ZnJvbX0nO2ApO1xuICAgIH0gZWxzZSB7XG4gICAgICBpbXBvcnRMaW5lcy5wdXNoKGBpbXBvcnQgKiBhcyAke3Zhck5hbWV9IGZyb20gJyR7ZnJvbX0nO2ApO1xuICAgIH1cbiAgICBhc3NpZ25MaW5lcy5wdXNoKGB3aW5kb3cuJHt2YXJOYW1lfSA9ICR7dmFyTmFtZX07YCk7XG4gIH0pO1xuICByZXR1cm4gaW1wb3J0TGluZXMuY29uY2F0KGFzc2lnbkxpbmVzKS5qb2luKFwiXFxuXCIpO1xufTtcbiIsICJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiL1VzZXJzL2ZhbGt3b2xza3lhZG1pbi9EZXZlbG9wbWVudC9Mb3djb2Rlci9EZXZlbG9wbWVudC9sb3djb2Rlci9jbGllbnQvcGFja2FnZXMvbG93Y29kZXIvc3JjL2Rldi11dGlsc1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiL1VzZXJzL2ZhbGt3b2xza3lhZG1pbi9EZXZlbG9wbWVudC9Mb3djb2Rlci9EZXZlbG9wbWVudC9sb3djb2Rlci9jbGllbnQvcGFja2FnZXMvbG93Y29kZXIvc3JjL2Rldi11dGlscy9nbG9iYWxEZXBQbGd1aW4uanNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL1VzZXJzL2ZhbGt3b2xza3lhZG1pbi9EZXZlbG9wbWVudC9Mb3djb2Rlci9EZXZlbG9wbWVudC9sb3djb2Rlci9jbGllbnQvcGFja2FnZXMvbG93Y29kZXIvc3JjL2Rldi11dGlscy9nbG9iYWxEZXBQbGd1aW4uanNcIjtpbXBvcnQgeyBsaWJzSW1wb3J0Q29kZSB9IGZyb20gXCIuL2V4dGVybmFsLmpzXCI7XG5cbmV4cG9ydCBmdW5jdGlvbiBnbG9iYWxEZXBQbHVnaW4oZXhjbHVkZSA9IFtdKSB7XG4gIGNvbnN0IHZpcnR1YWxNb2R1bGVJZCA9IFwidmlydHVhbDpnbG9iYWxzXCI7XG4gIHJldHVybiB7XG4gICAgbmFtZTogXCJsb3djb2Rlci1nbG9iYWwtcGx1Z2luXCIsXG4gICAgcmVzb2x2ZUlkKGlkKSB7XG4gICAgICBpZiAoaWQgPT09IHZpcnR1YWxNb2R1bGVJZCkge1xuICAgICAgICByZXR1cm4gaWQ7XG4gICAgICB9XG4gICAgfSxcbiAgICBsb2FkKGlkKSB7XG4gICAgICBpZiAoaWQgPT09IHZpcnR1YWxNb2R1bGVJZCkge1xuICAgICAgICByZXR1cm4gbGlic0ltcG9ydENvZGUoZXhjbHVkZSk7XG4gICAgICB9XG4gICAgfSxcbiAgfTtcbn1cbiJdLAogICJtYXBwaW5ncyI6ICI7QUFB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
