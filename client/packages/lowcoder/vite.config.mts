import dotenv from "dotenv";
import { defineConfig, ServerOptions, UserConfig } from "vite";
import react from "@vitejs/plugin-react";
import viteTsconfigPaths from "vite-tsconfig-paths";
import svgrPlugin from "vite-plugin-svgr";
import checker from "vite-plugin-checker";
import { visualizer } from "rollup-plugin-visualizer";
import path from "path";
import chalk from "chalk";
import { createHtmlPlugin } from "vite-plugin-html";
import dynamicImport from 'vite-plugin-dynamic-import';
import { ensureLastSlash } from "./src/dev-utils/util";
import { buildVars } from "./src/dev-utils/buildVars";
import { globalDepPlugin } from "./src/dev-utils/globalDepPlguin";
// import { nodePolyfills } from 'vite-plugin-node-polyfills'

dotenv.config();

const apiServiceUrl = process.env.LOWCODER_API_SERVICE_URL;
const nodeServiceUrl = process.env.LOWCODER_NODE_SERVICE_URL;
const nodeEnv = process.env.NODE_ENV ?? "development";
const isDev = nodeEnv === "development";
const isVisualizerEnabled = !!process.env.ENABLE_VISUALIZER;
// the file was never created
// const browserCheckFileName = `browser-check-${process.env.REACT_APP_COMMIT_ID}.js`;
const browserCheckFileName = `browser-check.js`;
const base = ensureLastSlash(process.env.PUBLIC_URL);

if (!apiServiceUrl && isDev) {
  console.log();
  console.log(chalk.red`LOWCODER_API_SERVICE_URL is required.\n`);
  console.log(chalk.cyan`Start with command: LOWCODER_API_SERVICE_URL=\{backend-api-addr\} yarn start`);
  console.log();
  process.exit(1);
}

const proxyConfig: ServerOptions["proxy"] = {
  "/api": {
    target: apiServiceUrl,
    changeOrigin: false,
  },
};

if (nodeServiceUrl) {
  proxyConfig["/node-service"] = {
    target: nodeServiceUrl,
  };
}

const define = {};
buildVars.forEach(({ name, defaultValue }) => {
  define[name] = JSON.stringify(process.env[name] || defaultValue);
});

// https://vitejs.dev/config/
export const viteConfig: UserConfig = {
  define,
  assetsInclude: ["**/*.md"],
  resolve: {
    extensions: [".mjs", ".js", ".ts", ".jsx", ".tsx", ".json"],
    alias: {
      "@lowcoder-ee": path.resolve(
        __dirname, "../lowcoder/src"
      ),
    },
  },
  base,
  build: {
    manifest: true,
    target: "es2020",
    cssTarget: "chrome87",
    outDir: "build",
    assetsDir: "static",
    emptyOutDir: false,
    rollupOptions: {
      output: {
        chunkFileNames: "[hash].js",
      },
      onwarn: (warning, warn) => {
        if (warning.code === 'MODULE_LEVEL_DIRECTIVE') {
          return
        }
        warn(warning)
      },
    },
    commonjsOptions: {
      defaultIsModuleExports: (id) => {
        if (id.indexOf("antd/lib") !== -1) {
          return false;
        }
        return "auto";
      },
    },
  },
  optimizeDeps: {
    entries: ['./src/**/*.{js,jsx,ts,tsx}'],
    include: ['antd'],
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
          "@border-radius-base": "4px",
        },
        javascriptEnabled: true,
      },
    },
    modules: {
      // Configuration for CSS modules
      scopeBehaviour: 'local' // Ensures CSS modules are scoped locally by default
    }
  },
  server: {
    open: true,
    cors: true,
    port: 8000,
    host: "0.0.0.0",
    proxy: proxyConfig,
  },
  plugins: [
    checker({
      typescript: true,
      eslint: {
        lintCommand: 'eslint --quiet "./src/**/*.{ts,tsx}"',
        dev: {
          logLevel: ["error"],
        },
      },
    }),
    react({
      babel: {
        parserOpts: {
          plugins: ["decorators-legacy"],
        },
      },
    }),
    viteTsconfigPaths({
      projects: ["../lowcoder/tsconfig.json", "../lowcoder-design/tsconfig.json"],
    }),
    svgrPlugin({
      svgrOptions: {
        exportType: "named",
        prettier: false,
        svgo: false,
        titleProp: true,
        ref: true,
      },
    }),
    globalDepPlugin(),
    createHtmlPlugin({
      minify: true,
      inject: {
        data: {
          browserCheckScript: isDev ? "" : `<script src="${base}${browserCheckFileName}"></script>`,
        },
      },
    }),
    isVisualizerEnabled && visualizer(),
    dynamicImport(),
    ({ include: ['process'] }),
  ].filter(Boolean),
};

const browserCheckConfig: UserConfig = {
  ...viteConfig,
  define: {
    ...viteConfig.define,
    "process.env.NODE_ENV": JSON.stringify("production"),
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
      },
    },
  },
};

const buildTargets = {
  main: viteConfig,
  browserCheck: browserCheckConfig,
};

const buildTarget = buildTargets[process.env.BUILD_TARGET || "main"];

export default defineConfig(buildTarget || viteConfig);
