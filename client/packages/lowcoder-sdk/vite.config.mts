import { defineConfig, PluginOption, UserConfig } from "vite";
import react from "@vitejs/plugin-react";
import viteTsconfigPaths from "vite-tsconfig-paths";
import svgrPlugin from "vite-plugin-svgr";
import dynamicImport from 'vite-plugin-dynamic-import';
import path from "path";
import { ensureLastSlash } from "./src/dev-utils/util";
import { buildVars } from "./src/dev-utils/buildVars";
import { globalDepPlugin } from "./src/dev-utils/globalDepPlguin";
import { visualizer } from "rollup-plugin-visualizer";
import peerDepsExternal from 'rollup-plugin-peer-deps-external';
import resolve from '@rollup/plugin-node-resolve';

const isVisualizerEnabled = !!process.env.ENABLE_VISUALIZER;

const define = {};
buildVars.forEach(({ name, defaultValue }) => {
  define[name] = JSON.stringify(process.env[name] || defaultValue);
});

const apiBaseUrl = "http://localhost:8000";

export const viteConfig: UserConfig = {
  mode: 'production',
  define: {
    ...define,
    REACT_APP_API_HOST: JSON.stringify(apiBaseUrl),
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
    lib: {
      formats: ["es"],
      entry: "./src/index.ts",
      name: "Lowcoder",
      fileName: "lowcoder-sdk",
    },
    rollupOptions: {
      input: {
        'appView': '../lowcoder/src/appView/index.ts',
        'lowcoder-sdk': './src/index.ts',
      },
      // external: ["react", "react-dom"],
      external: (id) => {
        const externalMods = ['react', 'react-dom'];
        // if(externalMods.includes(id) || id.endsWith('.test.tsx')) {
        if(externalMods.includes(id) || id.endsWith('.test.tsx') || id.endsWith('index-test.tsx')) {
          // console.log(id);
          return true;
        }
        return false;
      },
      output: {
        // inlineDynamicImports: true,
        format: "esm",
        entryFileNames: '[name].js',
        chunkFileNames: "[name].js",
        // manualChunks: {
        //   'lodash': ['lodash'],
        //   'antd': ['antd'],
        //   'antd-mobile': ['antd-mobile']
        // }
        manualChunks: (id) => {
          if (id.includes('node_modules')) {
            return id.toString().split('node_modules/')[1].split('/')[0].toString();
            // return 'vendor';
          }
          // if(id.endsWith('.test.tsx')) {
          //   const tokens = id.toString().split('/');
          //   console.log(tokens[tokens.length - 1]);
          //   return tokens[tokens.length - 1];
          // }
        },
      },
      plugins: [
        peerDepsExternal(),
        resolve() as PluginOption,
        dynamicImport(),
      ],
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
    isVisualizerEnabled && visualizer({
      template: "treemap", // or sunburst
      open: true,
      gzipSize: true,
      brotliSize: true,
      filename: "analyse.html"
    }) as PluginOption,
    // dynamicImport(),
  ],
};

export default defineConfig(viteConfig);
