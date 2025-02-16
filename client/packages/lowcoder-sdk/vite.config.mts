import { defineConfig, UserConfig, PluginOption } from "vite";
import react from "@vitejs/plugin-react";
import viteTsconfigPaths from "vite-tsconfig-paths";
import svgrPlugin from "vite-plugin-svgr";
import path from "path";
import { ensureLastSlash } from "./src/dev-utils/util";
import { buildVars } from "./src/dev-utils/buildVars";
import { globalDepPlugin } from "./src/dev-utils/globalDepPlguin";
import dynamicImport from 'vite-plugin-dynamic-import';
import { visualizer } from "rollup-plugin-visualizer";
import { terser } from 'rollup-plugin-terser';
import strip from "@rollup/plugin-strip";

const isVisualizerEnabled = !!process.env.ENABLE_VISUALIZER;

const define = {};
buildVars.forEach(({ name, defaultValue }) => {
  define[name] = JSON.stringify(process.env[name] || defaultValue);
});

const apiBaseUrl = "http://localhost:8000";

export const viteConfig: UserConfig = {
  define: {
    ...define,
    REACT_APP_API_SERVICE_URL: JSON.stringify(apiBaseUrl),
    REACT_APP_BUNDLE_TYPE: JSON.stringify("sdk"),
  },
  assetsInclude: ["**/*.md"],
  resolve: {
    extensions: [".mjs", ".js", ".ts", ".jsx", ".tsx", ".json"],
    alias: {
      "lowcoder-sdk": path.resolve(__dirname, "../lowcoder/src/index.sdk"),
      "@lowcoder-ee": path.resolve(__dirname, "../lowcoder/src"),
    },
  },
  base: ensureLastSlash(process.env.PUBLIC_URL),
  build: {
    minify: "terser",
    chunkSizeWarningLimit: 500,
    lib: {
      formats: ["es"],
      entry: "./src/index.ts",
      name: "Lowcoder",
      fileName: "lowcoder-sdk",
    },
    rollupOptions: {
      treeshake: {
        moduleSideEffects: true, 
        propertyReadSideEffects: false,
        tryCatchDeoptimization: false, 
        unknownGlobalSideEffects: false, 
      },
      external: ["react", "react-dom"],
      output: {
        chunkFileNames: "chunks/[name]-[hash].js",
        entryFileNames: "lowcoder-sdk.js",
        assetFileNames: "style.css",
        manualChunks: (id) => {
          if (id.includes("node_modules")) {
            // UI LIBRARIES
            if (id.includes("@ant-design/icons")) return "ant-design-icons";
            if (id.includes("node_modules/antd")) return "antd";
            if (id.includes("styled-components")) return "styled-components";

            // 🔹 BARCODE & QR CODE PROCESSING
            if (id.includes("react-qr-barcode-scanner")) return "barcode";
        
            // TEXT EDITORS & PARSERS
            if (id.includes("codemirror")) return "codemirror";
            if (id.includes("quill")) return "quill";
            if (id.includes("react-json-view")) return "react-json-view";
            if (id.includes("react-quill")) return "react-quill";
            if (id.includes("remark-gfm")) return "remark-gfm";
            if (id.includes("rehype-raw")) return "rehype-raw";
            if (id.includes("rehype-sanitize")) return "rehype-sanitize";
        
            // DRAG & DROP
            if (id.includes("@dnd-kit")) return "dnd-kit";
            if (id.includes("react-draggable")) return "react-draggable";
            if (id.includes("react-grid-layout")) return "react-grid-layout";
            if (id.includes("react-sortable-hoc")) return "react-sortable-hoc";
        
            // ICONS & FONTS
            if (id.includes("@fortawesome")) return "fontawesome";
            if (id.includes("@remixicon")) return "remixicon";
        
            // DATE/TIME HANDLING
            if (id.includes("moment")) return "moment";
            if (id.includes("date-fns")) return "date-fns";
            if (id.includes("dayjs")) return "dayjs";
        
            // UTILITIES & HELPERS
            if (id.includes("clsx")) return "clsx";
            if (id.includes("immer")) return "immer";
            if (id.includes("lodash")) return "lodash";
            if (id.includes("lodash-es")) return "lodash-es";
            if (id.includes("uuid")) return "uuid";
            if (id.includes("ua-parser-js")) return "ua-parser-js";
            if (id.includes("html2canvas")) return "ua-parser-js";
            if (id.includes("numbro")) return "numbro";
        
            // FILE & DATA PROCESSING
            if (id.includes("buffer")) return "buffer";
            if (id.includes("file-saver")) return "file-saver";
            if (id.includes("papaparse")) return "papaparse";
            if (id.includes("parse5")) return "parse5";
            if (id.includes("xlsx")) return "xlsx";
            if (id.includes("alasql")) return "alasql";
            if (id.includes("sql-formatter")) return "sql-formatter";
        
            // NETWORK & HTTP
            if (id.includes("axios")) return "axios";
            if (id.includes("fetch")) return "fetch";
            if (id.includes("http")) return "http-modules";
            if (id.includes("https")) return "https-modules";
        
            // WEB SOCKETS & STREAMING
            if (id.includes("sockjs")) return "websockets";
            if (id.includes("websocket")) return "websockets";
        
            // STATE MANAGEMENT
            if (id.includes("react-error-boundary")) return "react-error-boundary";
            if (id.includes("redux-devtools-extension")) return "redux-devtools";
        
            // POLYFILLS & BROWSER COMPATIBILITY
            if (id.includes("core-js")) return "core-js";
            if (id.includes("regenerator-runtime")) return "regenerator-runtime";
            if (id.includes("eslint4b-prebuilt-2")) return "eslint4b-prebuilt-2";

            // MISCELLANEOUS
            if (id.includes("cnchar")) return "cnchar";
            if (id.includes("hotkeys-js")) return "hotkeys-js";
            if (id.includes("loglevel")) return "loglevel";
            if (id.includes("qrcode.react")) return "qrcode-react";
            if (id.includes("react-joyride")) return "react-joyride";
            if (id.includes("rc-trigger")) return "rc-trigger";
            if (id.includes("really-relaxed-json")) return "really-relaxed-json";
            if (id.includes("simplebar-react")) return "simplebar-react";
            if (id.includes("react-documents")) return "react-documents";
            if (id.includes("react-colorful")) return "react-colorful";
            if (id.includes("react-best-gradient-color-picker")) return "react-best-gradient-color-picker";
            if (id.includes("@supabase/supabase-js")) return "supabase";
            return null;
          }
          return null;
        }
      },
      experimental: {
        minChunkSize: 300000, // 📏 Force smaller chunks (~300KB)
      },
      plugins: [
        terser({
          compress: {
            drop_console: true,  
            drop_debugger: true, 
            pure_funcs: ["console.info", "console.debug", "console.log"], 
          },
          format: {
            comments: /(@vite-ignore|webpackIgnore)/
          },
        }) as PluginOption,
        strip({
          functions: ["console.log", "debugger"], // ✅ Remove logs
          sourceMap: true,
        }) as PluginOption,
      ],
      onwarn: (warning, warn) => {
        if (warning.code === 'MODULE_LEVEL_DIRECTIVE') {
          return
        }
        warn(warning)
      },
    },
    commonjsOptions: {
      transformMixedEsModules : true,
      defaultIsModuleExports: (id) => {
        if (id.indexOf("antd/lib") !== -1) {
          return false;
        }
        return "auto";
      },
    },
  },
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: false,
      },
    },
  },
  css: {
    preprocessorOptions: {
      less: {
        modifyVars: {
          "@primary-color": "#3377FF",
          "@link-color": "#3377FF",
          "@border-color-base": "#D7D9E0",
          "@border-radius-base": "4px",
        },
        javascriptEnabled: true,
      },
    },
  },
  plugins: [
    globalDepPlugin(["lowcoder-sdk"]),
    react({
      babel: {
        parserOpts: {
          plugins: ["decorators-legacy"],
        },
      },
    }),
    viteTsconfigPaths({
      projects: [
        "../lowcoder/tsconfig.json",
        "../lowcoder-comps/tsconfig.json",
        "../lowcoder-design/tsconfig.json",
      ],
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
    isVisualizerEnabled && visualizer({
      template: "treemap", // or sunburst
      open: true,
      gzipSize: true,
      brotliSize: true,
      filename: "analyse.html"
    }) as PluginOption,
  ],
};

export default defineConfig(viteConfig);
