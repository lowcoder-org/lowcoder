// vite.config.mts
import dotenv from "file:///F:/Projects/lowcoder/client/node_modules/dotenv/lib/main.js";
import { defineConfig } from "file:///F:/Projects/lowcoder/client/node_modules/vite/dist/node/index.js";
import react from "file:///F:/Projects/lowcoder/client/node_modules/@vitejs/plugin-react/dist/index.mjs";
import viteTsconfigPaths from "file:///F:/Projects/lowcoder/client/node_modules/vite-tsconfig-paths/dist/index.mjs";
import svgrPlugin from "file:///F:/Projects/lowcoder/client/node_modules/vite-plugin-svgr/dist/index.mjs";
import checker from "file:///F:/Projects/lowcoder/client/node_modules/vite-plugin-checker/dist/esm/main.js";
import { visualizer } from "file:///F:/Projects/lowcoder/client/node_modules/rollup-plugin-visualizer/dist/plugin/index.js";
import path from "path";
import chalk from "file:///F:/Projects/lowcoder/client/node_modules/chalk/source/index.js";
import { createHtmlPlugin } from "file:///F:/Projects/lowcoder/client/node_modules/vite-plugin-html/dist/index.mjs";
import dynamicImport from "file:///F:/Projects/lowcoder/client/node_modules/vite-plugin-dynamic-import/dist/index.mjs";

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
  },
  {
    name: "REACT_APP_VIEW_MODE",
    defaultValue: "admin"
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
var __vite_injected_original_dirname = "F:\\Projects\\lowcoder\\client\\packages\\lowcoder";
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
    target: "esnext",
    cssTarget: "chrome87",
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcubXRzIiwgInNyYy9kZXYtdXRpbHMvdXRpbC5qcyIsICJzcmMvZGV2LXV0aWxzL2J1aWxkVmFycy5qcyIsICJzcmMvZGV2LXV0aWxzL2V4dGVybmFsLmpzIiwgInNyYy9kZXYtdXRpbHMvZ2xvYmFsRGVwUGxndWluLmpzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiRjpcXFxcUHJvamVjdHNcXFxcbG93Y29kZXJcXFxcY2xpZW50XFxcXHBhY2thZ2VzXFxcXGxvd2NvZGVyXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCJGOlxcXFxQcm9qZWN0c1xcXFxsb3djb2RlclxcXFxjbGllbnRcXFxccGFja2FnZXNcXFxcbG93Y29kZXJcXFxcdml0ZS5jb25maWcubXRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9GOi9Qcm9qZWN0cy9sb3djb2Rlci9jbGllbnQvcGFja2FnZXMvbG93Y29kZXIvdml0ZS5jb25maWcubXRzXCI7aW1wb3J0IGRvdGVudiBmcm9tIFwiZG90ZW52XCI7XHJcbmltcG9ydCB7IGRlZmluZUNvbmZpZywgU2VydmVyT3B0aW9ucywgVXNlckNvbmZpZyB9IGZyb20gXCJ2aXRlXCI7XHJcbmltcG9ydCByZWFjdCBmcm9tIFwiQHZpdGVqcy9wbHVnaW4tcmVhY3RcIjtcclxuaW1wb3J0IHZpdGVUc2NvbmZpZ1BhdGhzIGZyb20gXCJ2aXRlLXRzY29uZmlnLXBhdGhzXCI7XHJcbmltcG9ydCBzdmdyUGx1Z2luIGZyb20gXCJ2aXRlLXBsdWdpbi1zdmdyXCI7XHJcbmltcG9ydCBjaGVja2VyIGZyb20gXCJ2aXRlLXBsdWdpbi1jaGVja2VyXCI7XHJcbmltcG9ydCB7IHZpc3VhbGl6ZXIgfSBmcm9tIFwicm9sbHVwLXBsdWdpbi12aXN1YWxpemVyXCI7XHJcbmltcG9ydCBwYXRoIGZyb20gXCJwYXRoXCI7XHJcbmltcG9ydCBjaGFsayBmcm9tIFwiY2hhbGtcIjtcclxuaW1wb3J0IHsgY3JlYXRlSHRtbFBsdWdpbiB9IGZyb20gXCJ2aXRlLXBsdWdpbi1odG1sXCI7XHJcbmltcG9ydCBkeW5hbWljSW1wb3J0IGZyb20gJ3ZpdGUtcGx1Z2luLWR5bmFtaWMtaW1wb3J0JztcclxuaW1wb3J0IHsgZW5zdXJlTGFzdFNsYXNoIH0gZnJvbSBcIi4vc3JjL2Rldi11dGlscy91dGlsXCI7XHJcbmltcG9ydCB7IGJ1aWxkVmFycyB9IGZyb20gXCIuL3NyYy9kZXYtdXRpbHMvYnVpbGRWYXJzXCI7XHJcbmltcG9ydCB7IGdsb2JhbERlcFBsdWdpbiB9IGZyb20gXCIuL3NyYy9kZXYtdXRpbHMvZ2xvYmFsRGVwUGxndWluXCI7XHJcbi8vIGltcG9ydCB7IG5vZGVQb2x5ZmlsbHMgfSBmcm9tICd2aXRlLXBsdWdpbi1ub2RlLXBvbHlmaWxscydcclxuXHJcbmRvdGVudi5jb25maWcoKTtcclxuXHJcbmNvbnN0IGFwaVByb3h5VGFyZ2V0ID0gcHJvY2Vzcy5lbnYuTE9XQ09ERVJfQVBJX1NFUlZJQ0VfVVJMO1xyXG5jb25zdCBub2RlU2VydmljZUFwaVByb3h5VGFyZ2V0ID0gcHJvY2Vzcy5lbnYuTE9XQ09ERVJfTk9ERV9TRVJWSUNFX1VSTDtcclxuY29uc3Qgbm9kZUVudiA9IHByb2Nlc3MuZW52Lk5PREVfRU5WID8/IFwiZGV2ZWxvcG1lbnRcIjtcclxuY29uc3QgaXNEZXYgPSBub2RlRW52ID09PSBcImRldmVsb3BtZW50XCI7XHJcbmNvbnN0IGlzVmlzdWFsaXplckVuYWJsZWQgPSAhIXByb2Nlc3MuZW52LkVOQUJMRV9WSVNVQUxJWkVSO1xyXG4vLyB0aGUgZmlsZSB3YXMgbmV2ZXIgY3JlYXRlZFxyXG4vLyBjb25zdCBicm93c2VyQ2hlY2tGaWxlTmFtZSA9IGBicm93c2VyLWNoZWNrLSR7cHJvY2Vzcy5lbnYuUkVBQ1RfQVBQX0NPTU1JVF9JRH0uanNgO1xyXG5jb25zdCBicm93c2VyQ2hlY2tGaWxlTmFtZSA9IGBicm93c2VyLWNoZWNrLmpzYDtcclxuY29uc3QgYmFzZSA9IGVuc3VyZUxhc3RTbGFzaChwcm9jZXNzLmVudi5QVUJMSUNfVVJMKTtcclxuXHJcbmlmICghYXBpUHJveHlUYXJnZXQgJiYgaXNEZXYpIHtcclxuICBjb25zb2xlLmxvZygpO1xyXG4gIGNvbnNvbGUubG9nKGNoYWxrLnJlZGBMT1dDT0RFUl9BUElfU0VSVklDRV9VUkwgaXMgcmVxdWlyZWQuXFxuYCk7XHJcbiAgY29uc29sZS5sb2coY2hhbGsuY3lhbmBTdGFydCB3aXRoIGNvbW1hbmQ6IExPV0NPREVSX0FQSV9TRVJWSUNFX1VSTD1cXHtiYWNrZW5kLWFwaS1hZGRyXFx9IHlhcm4gc3RhcnRgKTtcclxuICBjb25zb2xlLmxvZygpO1xyXG4gIHByb2Nlc3MuZXhpdCgxKTtcclxufVxyXG5cclxuY29uc3QgcHJveHlDb25maWc6IFNlcnZlck9wdGlvbnNbXCJwcm94eVwiXSA9IHtcclxuICBcIi9hcGlcIjoge1xyXG4gICAgdGFyZ2V0OiBhcGlQcm94eVRhcmdldCxcclxuICAgIGNoYW5nZU9yaWdpbjogZmFsc2UsXHJcbiAgfSxcclxufTtcclxuXHJcbmlmIChub2RlU2VydmljZUFwaVByb3h5VGFyZ2V0KSB7XHJcbiAgcHJveHlDb25maWdbXCIvbm9kZS1zZXJ2aWNlXCJdID0ge1xyXG4gICAgdGFyZ2V0OiBub2RlU2VydmljZUFwaVByb3h5VGFyZ2V0LFxyXG4gIH07XHJcbn1cclxuXHJcbmNvbnN0IGRlZmluZSA9IHt9O1xyXG5idWlsZFZhcnMuZm9yRWFjaCgoeyBuYW1lLCBkZWZhdWx0VmFsdWUgfSkgPT4ge1xyXG4gIGRlZmluZVtuYW1lXSA9IEpTT04uc3RyaW5naWZ5KHByb2Nlc3MuZW52W25hbWVdIHx8IGRlZmF1bHRWYWx1ZSk7XHJcbn0pO1xyXG5cclxuLy8gaHR0cHM6Ly92aXRlanMuZGV2L2NvbmZpZy9cclxuZXhwb3J0IGNvbnN0IHZpdGVDb25maWc6IFVzZXJDb25maWcgPSB7XHJcbiAgZGVmaW5lLFxyXG4gIGFzc2V0c0luY2x1ZGU6IFtcIioqLyoubWRcIl0sXHJcbiAgcmVzb2x2ZToge1xyXG4gICAgZXh0ZW5zaW9uczogW1wiLm1qc1wiLCBcIi5qc1wiLCBcIi50c1wiLCBcIi5qc3hcIiwgXCIudHN4XCIsIFwiLmpzb25cIl0sXHJcbiAgICBhbGlhczoge1xyXG4gICAgICBcIkBsb3djb2Rlci1lZVwiOiBwYXRoLnJlc29sdmUoXHJcbiAgICAgICAgX19kaXJuYW1lLCBcIi4uL2xvd2NvZGVyL3NyY1wiXHJcbiAgICAgICksXHJcbiAgICB9LFxyXG4gIH0sXHJcbiAgYmFzZSxcclxuICBidWlsZDoge1xyXG4gICAgbWFuaWZlc3Q6IHRydWUsXHJcbiAgICB0YXJnZXQ6IFwiZXNuZXh0XCIsXHJcbiAgICBjc3NUYXJnZXQ6IFwiY2hyb21lODdcIixcclxuICAgIG91dERpcjogXCJidWlsZFwiLFxyXG4gICAgYXNzZXRzRGlyOiBcInN0YXRpY1wiLFxyXG4gICAgZW1wdHlPdXREaXI6IGZhbHNlLFxyXG4gICAgcm9sbHVwT3B0aW9uczoge1xyXG4gICAgICBvdXRwdXQ6IHtcclxuICAgICAgICBjaHVua0ZpbGVOYW1lczogXCJbaGFzaF0uanNcIixcclxuICAgICAgfSxcclxuICAgICAgb253YXJuOiAod2FybmluZywgd2FybikgPT4ge1xyXG4gICAgICAgIGlmICh3YXJuaW5nLmNvZGUgPT09ICdNT0RVTEVfTEVWRUxfRElSRUNUSVZFJykge1xyXG4gICAgICAgICAgcmV0dXJuXHJcbiAgICAgICAgfVxyXG4gICAgICAgIHdhcm4od2FybmluZylcclxuICAgICAgfSxcclxuICAgIH0sXHJcbiAgICBjb21tb25qc09wdGlvbnM6IHtcclxuICAgICAgZGVmYXVsdElzTW9kdWxlRXhwb3J0czogKGlkKSA9PiB7XHJcbiAgICAgICAgaWYgKGlkLmluZGV4T2YoXCJhbnRkL2xpYlwiKSAhPT0gLTEpIHtcclxuICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIFwiYXV0b1wiO1xyXG4gICAgICB9LFxyXG4gICAgfSxcclxuICB9LFxyXG4gIG9wdGltaXplRGVwczoge1xyXG4gICAgZW50cmllczogWycuL3NyYy8qKi8qLntqcyxqc3gsdHMsdHN4fSddLFxyXG4gICAgaW5jbHVkZTogWydhbnRkJ10sXHJcbiAgICAvLyBpbmNsdWRlOiBbJ2FudGQvKiovKiddLFxyXG4gICAgLy8gZm9yY2U6IHRydWUsXHJcbiAgfSxcclxuICBjc3M6IHtcclxuICAgIHByZXByb2Nlc3Nvck9wdGlvbnM6IHtcclxuICAgICAgbGVzczoge1xyXG4gICAgICAgIG1vZGlmeVZhcnM6IHtcclxuICAgICAgICAgIFwiQHByaW1hcnktY29sb3JcIjogXCIjYjQ4MGRlXCIsXHJcbiAgICAgICAgICBcIkBsaW5rLWNvbG9yXCI6IFwiIzMzNzdGRlwiLFxyXG4gICAgICAgICAgXCJAYm9yZGVyLWNvbG9yLWJhc2VcIjogXCIjYjQ4MGRlXCIsXHJcbiAgICAgICAgICBcIkBib3JkZXItcmFkaXVzLWJhc2VcIjogXCI0cHhcIixcclxuICAgICAgICB9LFxyXG4gICAgICAgIGphdmFzY3JpcHRFbmFibGVkOiB0cnVlLFxyXG4gICAgICB9LFxyXG4gICAgfSxcclxuICAgIG1vZHVsZXM6IHtcclxuICAgICAgLy8gQ29uZmlndXJhdGlvbiBmb3IgQ1NTIG1vZHVsZXNcclxuICAgICAgc2NvcGVCZWhhdmlvdXI6ICdsb2NhbCcgLy8gRW5zdXJlcyBDU1MgbW9kdWxlcyBhcmUgc2NvcGVkIGxvY2FsbHkgYnkgZGVmYXVsdFxyXG4gICAgfVxyXG4gIH0sXHJcbiAgc2VydmVyOiB7XHJcbiAgICBvcGVuOiB0cnVlLFxyXG4gICAgY29yczogdHJ1ZSxcclxuICAgIHBvcnQ6IDgwMDAsXHJcbiAgICBob3N0OiBcIjAuMC4wLjBcIixcclxuICAgIHByb3h5OiBwcm94eUNvbmZpZyxcclxuICB9LFxyXG4gIHBsdWdpbnM6IFtcclxuICAgIGNoZWNrZXIoe1xyXG4gICAgICB0eXBlc2NyaXB0OiB0cnVlLFxyXG4gICAgICBlc2xpbnQ6IHtcclxuICAgICAgICBsaW50Q29tbWFuZDogJ2VzbGludCAtLXF1aWV0IFwiLi9zcmMvKiovKi57dHMsdHN4fVwiJyxcclxuICAgICAgICBkZXY6IHtcclxuICAgICAgICAgIGxvZ0xldmVsOiBbXCJlcnJvclwiXSxcclxuICAgICAgICB9LFxyXG4gICAgICB9LFxyXG4gICAgfSksXHJcbiAgICByZWFjdCh7XHJcbiAgICAgIGJhYmVsOiB7XHJcbiAgICAgICAgcGFyc2VyT3B0czoge1xyXG4gICAgICAgICAgcGx1Z2luczogW1wiZGVjb3JhdG9ycy1sZWdhY3lcIl0sXHJcbiAgICAgICAgfSxcclxuICAgICAgfSxcclxuICAgIH0pLFxyXG4gICAgdml0ZVRzY29uZmlnUGF0aHMoe1xyXG4gICAgICBwcm9qZWN0czogW1wiLi4vbG93Y29kZXIvdHNjb25maWcuanNvblwiLCBcIi4uL2xvd2NvZGVyLWRlc2lnbi90c2NvbmZpZy5qc29uXCJdLFxyXG4gICAgfSksXHJcbiAgICBzdmdyUGx1Z2luKHtcclxuICAgICAgc3Znck9wdGlvbnM6IHtcclxuICAgICAgICBleHBvcnRUeXBlOiBcIm5hbWVkXCIsXHJcbiAgICAgICAgcHJldHRpZXI6IGZhbHNlLFxyXG4gICAgICAgIHN2Z286IGZhbHNlLFxyXG4gICAgICAgIHRpdGxlUHJvcDogdHJ1ZSxcclxuICAgICAgICByZWY6IHRydWUsXHJcbiAgICAgIH0sXHJcbiAgICB9KSxcclxuICAgIGdsb2JhbERlcFBsdWdpbigpLFxyXG4gICAgY3JlYXRlSHRtbFBsdWdpbih7XHJcbiAgICAgIG1pbmlmeTogdHJ1ZSxcclxuICAgICAgaW5qZWN0OiB7XHJcbiAgICAgICAgZGF0YToge1xyXG4gICAgICAgICAgYnJvd3NlckNoZWNrU2NyaXB0OiBpc0RldiA/IFwiXCIgOiBgPHNjcmlwdCBzcmM9XCIke2Jhc2V9JHticm93c2VyQ2hlY2tGaWxlTmFtZX1cIj48L3NjcmlwdD5gLFxyXG4gICAgICAgIH0sXHJcbiAgICAgIH0sXHJcbiAgICB9KSxcclxuICAgIGlzVmlzdWFsaXplckVuYWJsZWQgJiYgdmlzdWFsaXplcigpLFxyXG4gICAgZHluYW1pY0ltcG9ydCgpLFxyXG4gICAgKHsgaW5jbHVkZTogWydwcm9jZXNzJ10gfSksXHJcbiAgXS5maWx0ZXIoQm9vbGVhbiksXHJcbn07XHJcblxyXG5jb25zdCBicm93c2VyQ2hlY2tDb25maWc6IFVzZXJDb25maWcgPSB7XHJcbiAgLi4udml0ZUNvbmZpZyxcclxuICBkZWZpbmU6IHtcclxuICAgIC4uLnZpdGVDb25maWcuZGVmaW5lLFxyXG4gICAgXCJwcm9jZXNzLmVudi5OT0RFX0VOVlwiOiBKU09OLnN0cmluZ2lmeShcInByb2R1Y3Rpb25cIiksXHJcbiAgfSxcclxuICBidWlsZDoge1xyXG4gICAgLi4udml0ZUNvbmZpZy5idWlsZCxcclxuICAgIG1hbmlmZXN0OiBmYWxzZSxcclxuICAgIGNvcHlQdWJsaWNEaXI6IGZhbHNlLFxyXG4gICAgZW1wdHlPdXREaXI6IHRydWUsXHJcbiAgICBsaWI6IHtcclxuICAgICAgZm9ybWF0czogW1wiaWlmZVwiXSxcclxuICAgICAgbmFtZTogXCJCcm93c2VyQ2hlY2tcIixcclxuICAgICAgZW50cnk6IFwiLi9zcmMvYnJvd3Nlci1jaGVjay50c1wiLFxyXG4gICAgICBmaWxlTmFtZTogKCkgPT4ge1xyXG4gICAgICAgIHJldHVybiBicm93c2VyQ2hlY2tGaWxlTmFtZTtcclxuICAgICAgfSxcclxuICAgIH0sXHJcbiAgfSxcclxufTtcclxuXHJcbmNvbnN0IGJ1aWxkVGFyZ2V0cyA9IHtcclxuICBtYWluOiB2aXRlQ29uZmlnLFxyXG4gIGJyb3dzZXJDaGVjazogYnJvd3NlckNoZWNrQ29uZmlnLFxyXG59O1xyXG5cclxuY29uc3QgYnVpbGRUYXJnZXQgPSBidWlsZFRhcmdldHNbcHJvY2Vzcy5lbnYuQlVJTERfVEFSR0VUIHx8IFwibWFpblwiXTtcclxuXHJcbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZyhidWlsZFRhcmdldCB8fCB2aXRlQ29uZmlnKTtcclxuIiwgImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJGOlxcXFxQcm9qZWN0c1xcXFxsb3djb2RlclxcXFxjbGllbnRcXFxccGFja2FnZXNcXFxcbG93Y29kZXJcXFxcc3JjXFxcXGRldi11dGlsc1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiRjpcXFxcUHJvamVjdHNcXFxcbG93Y29kZXJcXFxcY2xpZW50XFxcXHBhY2thZ2VzXFxcXGxvd2NvZGVyXFxcXHNyY1xcXFxkZXYtdXRpbHNcXFxcdXRpbC5qc1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vRjovUHJvamVjdHMvbG93Y29kZXIvY2xpZW50L3BhY2thZ2VzL2xvd2NvZGVyL3NyYy9kZXYtdXRpbHMvdXRpbC5qc1wiO2ltcG9ydCBmcyBmcm9tIFwibm9kZTpmc1wiO1xyXG5pbXBvcnQgeyBkaXJuYW1lIH0gZnJvbSBcIm5vZGU6cGF0aFwiO1xyXG5pbXBvcnQgeyBmaWxlVVJMVG9QYXRoIH0gZnJvbSBcIm5vZGU6dXJsXCI7XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gc3RyaXBMYXN0U2xhc2goc3RyKSB7XHJcbiAgaWYgKHN0ci5lbmRzV2l0aChcIi9cIikpIHtcclxuICAgIHJldHVybiBzdHIuc2xpY2UoMCwgc3RyLmxlbmd0aCAtIDEpO1xyXG4gIH1cclxuICByZXR1cm4gc3RyO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gZW5zdXJlTGFzdFNsYXNoKHN0cikge1xyXG4gIGlmICghc3RyKSB7XHJcbiAgICByZXR1cm4gXCIvXCI7XHJcbiAgfVxyXG4gIGlmICghc3RyLmVuZHNXaXRoKFwiL1wiKSkge1xyXG4gICAgcmV0dXJuIGAke3N0cn0vYDtcclxuICB9XHJcbiAgcmV0dXJuIHN0cjtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIHJlYWRKc29uKGZpbGUpIHtcclxuICByZXR1cm4gSlNPTi5wYXJzZShmcy5yZWFkRmlsZVN5bmMoZmlsZSkudG9TdHJpbmcoKSk7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBjdXJyZW50RGlyTmFtZShpbXBvcnRNZXRhVXJsKSB7XHJcbiAgcmV0dXJuIGRpcm5hbWUoZmlsZVVSTFRvUGF0aChpbXBvcnRNZXRhVXJsKSk7XHJcbn1cclxuIiwgImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJGOlxcXFxQcm9qZWN0c1xcXFxsb3djb2RlclxcXFxjbGllbnRcXFxccGFja2FnZXNcXFxcbG93Y29kZXJcXFxcc3JjXFxcXGRldi11dGlsc1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiRjpcXFxcUHJvamVjdHNcXFxcbG93Y29kZXJcXFxcY2xpZW50XFxcXHBhY2thZ2VzXFxcXGxvd2NvZGVyXFxcXHNyY1xcXFxkZXYtdXRpbHNcXFxcYnVpbGRWYXJzLmpzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9GOi9Qcm9qZWN0cy9sb3djb2Rlci9jbGllbnQvcGFja2FnZXMvbG93Y29kZXIvc3JjL2Rldi11dGlscy9idWlsZFZhcnMuanNcIjtleHBvcnQgY29uc3QgYnVpbGRWYXJzID0gW1xyXG4gIHtcclxuICAgIG5hbWU6IFwiUFVCTElDX1VSTFwiLFxyXG4gICAgZGVmYXVsdFZhbHVlOiBcIi9cIixcclxuICB9LFxyXG4gIHtcclxuICAgIG5hbWU6IFwiUkVBQ1RfQVBQX0VESVRJT05cIixcclxuICAgIGRlZmF1bHRWYWx1ZTogXCJjb21tdW5pdHlcIixcclxuICB9LFxyXG4gIHtcclxuICAgIG5hbWU6IFwiUkVBQ1RfQVBQX0xBTkdVQUdFU1wiLFxyXG4gICAgZGVmYXVsdFZhbHVlOiBcIlwiLFxyXG4gIH0sXHJcbiAge1xyXG4gICAgbmFtZTogXCJSRUFDVF9BUFBfQ09NTUlUX0lEXCIsXHJcbiAgICBkZWZhdWx0VmFsdWU6IFwiMDAwMDBcIixcclxuICB9LFxyXG4gIHtcclxuICAgIG5hbWU6IFwiUkVBQ1RfQVBQX0FQSV9TRVJWSUNFX1VSTFwiLFxyXG4gICAgZGVmYXVsdFZhbHVlOiBcIlwiLFxyXG4gIH0sXHJcbiAge1xyXG4gICAgbmFtZTogXCJSRUFDVF9BUFBfTk9ERV9TRVJWSUNFX1VSTFwiLFxyXG4gICAgZGVmYXVsdFZhbHVlOiBcIlwiLFxyXG4gIH0sXHJcbiAge1xyXG4gICAgbmFtZTogXCJSRUFDVF9BUFBfRU5WXCIsXHJcbiAgICBkZWZhdWx0VmFsdWU6IFwicHJvZHVjdGlvblwiLFxyXG4gIH0sXHJcbiAge1xyXG4gICAgbmFtZTogXCJSRUFDVF9BUFBfQlVJTERfSURcIixcclxuICAgIGRlZmF1bHRWYWx1ZTogXCJcIixcclxuICB9LFxyXG4gIHtcclxuICAgIG5hbWU6IFwiUkVBQ1RfQVBQX0xPR19MRVZFTFwiLFxyXG4gICAgZGVmYXVsdFZhbHVlOiBcImVycm9yXCIsXHJcbiAgfSxcclxuICB7XHJcbiAgICBuYW1lOiBcIlJFQUNUX0FQUF9JTVBPUlRfTUFQXCIsXHJcbiAgICBkZWZhdWx0VmFsdWU6IFwie31cIixcclxuICB9LFxyXG4gIHtcclxuICAgIG5hbWU6IFwiUkVBQ1RfQVBQX1NFUlZFUl9JUFNcIixcclxuICAgIGRlZmF1bHRWYWx1ZTogXCJcIixcclxuICB9LFxyXG4gIHtcclxuICAgIG5hbWU6IFwiUkVBQ1RfQVBQX0JVTkRMRV9CVUlMVElOX1BMVUdJTlwiLFxyXG4gICAgZGVmYXVsdFZhbHVlOiBcIlwiLFxyXG4gIH0sXHJcbiAge1xyXG4gICAgbmFtZTogXCJSRUFDVF9BUFBfQlVORExFX1RZUEVcIixcclxuICAgIGRlZmF1bHRWYWx1ZTogXCJhcHBcIixcclxuICB9LFxyXG4gIHtcclxuICAgIG5hbWU6IFwiUkVBQ1RfQVBQX0RJU0FCTEVfSlNfU0FOREJPWFwiLFxyXG4gICAgZGVmYXVsdFZhbHVlOiBcIlwiLFxyXG4gIH0sXHJcbiAge1xyXG4gICAgbmFtZTogXCJSRUFDVF9BUFBfVklFV19NT0RFXCIsXHJcbiAgICBkZWZhdWx0VmFsdWU6IFwiYWRtaW5cIixcclxuICB9LFxyXG5dO1xyXG4iLCAiY29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2Rpcm5hbWUgPSBcIkY6XFxcXFByb2plY3RzXFxcXGxvd2NvZGVyXFxcXGNsaWVudFxcXFxwYWNrYWdlc1xcXFxsb3djb2RlclxcXFxzcmNcXFxcZGV2LXV0aWxzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCJGOlxcXFxQcm9qZWN0c1xcXFxsb3djb2RlclxcXFxjbGllbnRcXFxccGFja2FnZXNcXFxcbG93Y29kZXJcXFxcc3JjXFxcXGRldi11dGlsc1xcXFxleHRlcm5hbC5qc1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vRjovUHJvamVjdHMvbG93Y29kZXIvY2xpZW50L3BhY2thZ2VzL2xvd2NvZGVyL3NyYy9kZXYtdXRpbHMvZXh0ZXJuYWwuanNcIjsvKipcclxuICogbGlicyB0byBpbXBvcnQgYXMgZ2xvYmFsIHZhclxyXG4gKiBuYW1lOiBtb2R1bGUgbmFtZVxyXG4gKiBtZXJnZURlZmF1bHRBbmROYW1lRXhwb3J0czogd2hldGhlciB0byBtZXJnZSBkZWZhdWx0IGFuZCBuYW1lZCBleHBvcnRzXHJcbiAqL1xyXG5leHBvcnQgY29uc3QgbGlicyA9IFtcclxuICBcImF4aW9zXCIsXHJcbiAgXCJyZWR1eFwiLFxyXG4gIFwicmVhY3Qtcm91dGVyXCIsXHJcbiAgXCJyZWFjdC1yb3V0ZXItZG9tXCIsXHJcbiAgXCJyZWFjdC1yZWR1eFwiLFxyXG4gIFwicmVhY3RcIixcclxuICBcInJlYWN0LWRvbVwiLFxyXG4gIFwibG9kYXNoXCIsXHJcbiAgXCJoaXN0b3J5XCIsXHJcbiAgXCJhbnRkXCIsXHJcbiAgXCJAZG5kLWtpdC9jb3JlXCIsXHJcbiAgXCJAZG5kLWtpdC9tb2RpZmllcnNcIixcclxuICBcIkBkbmQta2l0L3NvcnRhYmxlXCIsXHJcbiAgXCJAZG5kLWtpdC91dGlsaXRpZXNcIixcclxuICB7XHJcbiAgICBuYW1lOiBcIm1vbWVudFwiLFxyXG4gICAgZXh0cmFjdERlZmF1bHQ6IHRydWUsXHJcbiAgfSxcclxuICB7XHJcbiAgICBuYW1lOiBcImRheWpzXCIsXHJcbiAgICBleHRyYWN0RGVmYXVsdDogdHJ1ZSxcclxuICB9LFxyXG4gIHtcclxuICAgIG5hbWU6IFwibG93Y29kZXItc2RrXCIsXHJcbiAgICBmcm9tOiBcIi4vc3JjL2luZGV4LnNkay50c1wiLFxyXG4gIH0sXHJcbiAge1xyXG4gICAgbmFtZTogXCJzdHlsZWQtY29tcG9uZW50c1wiLFxyXG4gICAgbWVyZ2VEZWZhdWx0QW5kTmFtZUV4cG9ydHM6IHRydWUsXHJcbiAgfSxcclxuXTtcclxuXHJcbi8qKlxyXG4gKiBnZXQgZ2xvYmFsIHZhciBuYW1lIGZyb20gbW9kdWxlIG5hbWVcclxuICogQHBhcmFtIHtzdHJpbmd9IG5hbWVcclxuICogQHJldHVybnNcclxuICovXHJcbmV4cG9ydCBjb25zdCBnZXRMaWJHbG9iYWxWYXJOYW1lID0gKG5hbWUpID0+IHtcclxuICByZXR1cm4gXCIkXCIgKyBuYW1lLnJlcGxhY2UoL0AvZywgXCIkXCIpLnJlcGxhY2UoL1tcXC9cXC1dL2csIFwiX1wiKTtcclxufTtcclxuXHJcbmV4cG9ydCBjb25zdCBnZXRMaWJOYW1lcyA9ICgpID0+IHtcclxuICByZXR1cm4gbGlicy5tYXAoKGkpID0+IHtcclxuICAgIGlmICh0eXBlb2YgaSA9PT0gXCJvYmplY3RcIikge1xyXG4gICAgICByZXR1cm4gaS5uYW1lO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIGk7XHJcbiAgfSk7XHJcbn07XHJcblxyXG5leHBvcnQgY29uc3QgZ2V0QWxsTGliR2xvYmFsVmFyTmFtZXMgPSAoKSA9PiB7XHJcbiAgY29uc3QgcmV0ID0ge307XHJcbiAgbGlicy5mb3JFYWNoKChsaWIpID0+IHtcclxuICAgIGxldCBuYW1lID0gbGliO1xyXG4gICAgaWYgKHR5cGVvZiBsaWIgPT09IFwib2JqZWN0XCIpIHtcclxuICAgICAgbmFtZSA9IGxpYi5uYW1lO1xyXG4gICAgfVxyXG4gICAgcmV0W25hbWVdID0gZ2V0TGliR2xvYmFsVmFyTmFtZShuYW1lKTtcclxuICB9KTtcclxuICByZXR1cm4gcmV0O1xyXG59O1xyXG5cclxuZXhwb3J0IGNvbnN0IGxpYnNJbXBvcnRDb2RlID0gKGV4Y2x1ZGUgPSBbXSkgPT4ge1xyXG4gIGNvbnN0IGltcG9ydExpbmVzID0gW107XHJcbiAgY29uc3QgYXNzaWduTGluZXMgPSBbXTtcclxuICBsaWJzLmZvckVhY2goKGkpID0+IHtcclxuICAgIGxldCBuYW1lID0gaTtcclxuICAgIGxldCBtZXJnZSA9IGZhbHNlO1xyXG4gICAgbGV0IGZyb20gPSBuYW1lO1xyXG4gICAgbGV0IGV4dHJhY3REZWZhdWx0ID0gZmFsc2U7XHJcblxyXG4gICAgaWYgKHR5cGVvZiBpID09PSBcIm9iamVjdFwiKSB7XHJcbiAgICAgIG5hbWUgPSBpLm5hbWU7XHJcbiAgICAgIG1lcmdlID0gaS5tZXJnZURlZmF1bHRBbmROYW1lRXhwb3J0cyA/PyBmYWxzZTtcclxuICAgICAgZnJvbSA9IGkuZnJvbSA/PyBuYW1lO1xyXG4gICAgICBleHRyYWN0RGVmYXVsdCA9IGkuZXh0cmFjdERlZmF1bHQgPz8gZmFsc2U7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKGV4Y2x1ZGUuaW5jbHVkZXMobmFtZSkpIHtcclxuICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IHZhck5hbWUgPSBnZXRMaWJHbG9iYWxWYXJOYW1lKG5hbWUpO1xyXG4gICAgaWYgKG1lcmdlKSB7XHJcbiAgICAgIGltcG9ydExpbmVzLnB1c2goYGltcG9ydCAqIGFzICR7dmFyTmFtZX1fbmFtZWRfZXhwb3J0cyBmcm9tICcke2Zyb219JztgKTtcclxuICAgICAgaW1wb3J0TGluZXMucHVzaChgaW1wb3J0ICR7dmFyTmFtZX0gZnJvbSAnJHtmcm9tfSc7YCk7XHJcbiAgICAgIGFzc2lnbkxpbmVzLnB1c2goYE9iamVjdC5hc3NpZ24oJHt2YXJOYW1lfSwgJHt2YXJOYW1lfV9uYW1lZF9leHBvcnRzKTtgKTtcclxuICAgIH0gZWxzZSBpZiAoZXh0cmFjdERlZmF1bHQpIHtcclxuICAgICAgaW1wb3J0TGluZXMucHVzaChgaW1wb3J0ICR7dmFyTmFtZX0gZnJvbSAnJHtmcm9tfSc7YCk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBpbXBvcnRMaW5lcy5wdXNoKGBpbXBvcnQgKiBhcyAke3Zhck5hbWV9IGZyb20gJyR7ZnJvbX0nO2ApO1xyXG4gICAgfVxyXG4gICAgYXNzaWduTGluZXMucHVzaChgd2luZG93LiR7dmFyTmFtZX0gPSAke3Zhck5hbWV9O2ApO1xyXG4gIH0pO1xyXG4gIHJldHVybiBpbXBvcnRMaW5lcy5jb25jYXQoYXNzaWduTGluZXMpLmpvaW4oXCJcXG5cIik7XHJcbn07XHJcbiIsICJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiRjpcXFxcUHJvamVjdHNcXFxcbG93Y29kZXJcXFxcY2xpZW50XFxcXHBhY2thZ2VzXFxcXGxvd2NvZGVyXFxcXHNyY1xcXFxkZXYtdXRpbHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIkY6XFxcXFByb2plY3RzXFxcXGxvd2NvZGVyXFxcXGNsaWVudFxcXFxwYWNrYWdlc1xcXFxsb3djb2RlclxcXFxzcmNcXFxcZGV2LXV0aWxzXFxcXGdsb2JhbERlcFBsZ3Vpbi5qc1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vRjovUHJvamVjdHMvbG93Y29kZXIvY2xpZW50L3BhY2thZ2VzL2xvd2NvZGVyL3NyYy9kZXYtdXRpbHMvZ2xvYmFsRGVwUGxndWluLmpzXCI7aW1wb3J0IHsgbGlic0ltcG9ydENvZGUgfSBmcm9tIFwiLi9leHRlcm5hbC5qc1wiO1xyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGdsb2JhbERlcFBsdWdpbihleGNsdWRlID0gW10pIHtcclxuICBjb25zdCB2aXJ0dWFsTW9kdWxlSWQgPSBcInZpcnR1YWw6Z2xvYmFsc1wiO1xyXG4gIHJldHVybiB7XHJcbiAgICBuYW1lOiBcImxvd2NvZGVyLWdsb2JhbC1wbHVnaW5cIixcclxuICAgIHJlc29sdmVJZChpZCkge1xyXG4gICAgICBpZiAoaWQgPT09IHZpcnR1YWxNb2R1bGVJZCkge1xyXG4gICAgICAgIHJldHVybiBpZDtcclxuICAgICAgfVxyXG4gICAgfSxcclxuICAgIGxvYWQoaWQpIHtcclxuICAgICAgaWYgKGlkID09PSB2aXJ0dWFsTW9kdWxlSWQpIHtcclxuICAgICAgICByZXR1cm4gbGlic0ltcG9ydENvZGUoZXhjbHVkZSk7XHJcbiAgICAgIH1cclxuICAgIH0sXHJcbiAgfTtcclxufVxyXG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQXVVLE9BQU8sWUFBWTtBQUMxVixTQUFTLG9CQUErQztBQUN4RCxPQUFPLFdBQVc7QUFDbEIsT0FBTyx1QkFBdUI7QUFDOUIsT0FBTyxnQkFBZ0I7QUFDdkIsT0FBTyxhQUFhO0FBQ3BCLFNBQVMsa0JBQWtCO0FBQzNCLE9BQU8sVUFBVTtBQUNqQixPQUFPLFdBQVc7QUFDbEIsU0FBUyx3QkFBd0I7QUFDakMsT0FBTyxtQkFBbUI7OztBQ0NuQixTQUFTLGdCQUFnQixLQUFLO0FBQ25DLE1BQUksQ0FBQyxLQUFLO0FBQ1IsV0FBTztBQUFBLEVBQ1Q7QUFDQSxNQUFJLENBQUMsSUFBSSxTQUFTLEdBQUcsR0FBRztBQUN0QixXQUFPLEdBQUcsR0FBRztBQUFBLEVBQ2Y7QUFDQSxTQUFPO0FBQ1Q7OztBQ25Cc1gsSUFBTSxZQUFZO0FBQUEsRUFDdFk7QUFBQSxJQUNFLE1BQU07QUFBQSxJQUNOLGNBQWM7QUFBQSxFQUNoQjtBQUFBLEVBQ0E7QUFBQSxJQUNFLE1BQU07QUFBQSxJQUNOLGNBQWM7QUFBQSxFQUNoQjtBQUFBLEVBQ0E7QUFBQSxJQUNFLE1BQU07QUFBQSxJQUNOLGNBQWM7QUFBQSxFQUNoQjtBQUFBLEVBQ0E7QUFBQSxJQUNFLE1BQU07QUFBQSxJQUNOLGNBQWM7QUFBQSxFQUNoQjtBQUFBLEVBQ0E7QUFBQSxJQUNFLE1BQU07QUFBQSxJQUNOLGNBQWM7QUFBQSxFQUNoQjtBQUFBLEVBQ0E7QUFBQSxJQUNFLE1BQU07QUFBQSxJQUNOLGNBQWM7QUFBQSxFQUNoQjtBQUFBLEVBQ0E7QUFBQSxJQUNFLE1BQU07QUFBQSxJQUNOLGNBQWM7QUFBQSxFQUNoQjtBQUFBLEVBQ0E7QUFBQSxJQUNFLE1BQU07QUFBQSxJQUNOLGNBQWM7QUFBQSxFQUNoQjtBQUFBLEVBQ0E7QUFBQSxJQUNFLE1BQU07QUFBQSxJQUNOLGNBQWM7QUFBQSxFQUNoQjtBQUFBLEVBQ0E7QUFBQSxJQUNFLE1BQU07QUFBQSxJQUNOLGNBQWM7QUFBQSxFQUNoQjtBQUFBLEVBQ0E7QUFBQSxJQUNFLE1BQU07QUFBQSxJQUNOLGNBQWM7QUFBQSxFQUNoQjtBQUFBLEVBQ0E7QUFBQSxJQUNFLE1BQU07QUFBQSxJQUNOLGNBQWM7QUFBQSxFQUNoQjtBQUFBLEVBQ0E7QUFBQSxJQUNFLE1BQU07QUFBQSxJQUNOLGNBQWM7QUFBQSxFQUNoQjtBQUFBLEVBQ0E7QUFBQSxJQUNFLE1BQU07QUFBQSxJQUNOLGNBQWM7QUFBQSxFQUNoQjtBQUFBLEVBQ0E7QUFBQSxJQUNFLE1BQU07QUFBQSxJQUNOLGNBQWM7QUFBQSxFQUNoQjtBQUNGOzs7QUN4RE8sSUFBTSxPQUFPO0FBQUEsRUFDbEI7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLElBQ0UsTUFBTTtBQUFBLElBQ04sZ0JBQWdCO0FBQUEsRUFDbEI7QUFBQSxFQUNBO0FBQUEs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
