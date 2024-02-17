import react from "@vitejs/plugin-react";
import svgrPlugin from "vite-plugin-svgr";
import global from "rollup-plugin-external-globals";
import { buildVars } from "../dev-utils/buildVars.js";
import injectCss from "vite-plugin-css-injected-by-js";
import dynamicImport from 'vite-plugin-dynamic-import';
import { getLibNames, getAllLibGlobalVarNames } from "../dev-utils/external.js";
import paths from "./paths.js";
import { defineConfig } from "vite";
import { readJson } from "../dev-utils/util.js";

const isProduction = process.env.NODE_ENV === "production";
const packageJson = readJson(paths.appPackageJson);

const define = {};
buildVars.forEach(({ name, defaultValue }) => {
  define[name] = JSON.stringify(process.env[name] || defaultValue);
});

export default defineConfig({
  define: {
    ...define,
    "process.env.NODE_ENV": JSON.stringify(process.env.NODE_ENV || "development"),
    __LOWCODER_ORG__: JSON.stringify({}),
  },
  assetsInclude: ["**/*.md"],
  resolve: {
    extensions: [".mjs", ".js", ".ts", ".jsx", ".tsx", ".json"],
  },
  build: {
    target: "es2015",
    cssTarget: "chrome63",
    outDir: paths.appOutPath,
    emptyOutDir: true,
    lib: {
      formats: ["es"],
      entry: paths.compsIndexJs,
      fileName: "index",
    },
    rollupOptions: {
      external: getLibNames(),
      output: {
        chunkFileNames: "[name].js",
        inlineDynamicImports: false,
        manualChunks: (id) => {
          if (id.includes('node_modules')) {
            return id.toString().split('node_modules/')[1].split('/')[0].toString();
          }
        },
      },
      onwarn: (warning, warn) => {
        if (warning.code === 'MODULE_LEVEL_DIRECTIVE') {
          return
        }
        warn(warning)
      },
    },
  },
  plugins: [
    react({
      babel: {
        compact: false,
        parserOpts: {
          plugins: ["decorators-legacy"],
        },
      },
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
    dynamicImport(),
    isProduction && global(getAllLibGlobalVarNames(), { exclude: [/\.css$/] }),
    isProduction && injectCss({ styleId: `${packageJson.name}-${packageJson.version}` }),
  ].filter(Boolean),
});
