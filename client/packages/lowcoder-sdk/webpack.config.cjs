const path = require("path");
const TerserPlugin = require('terser-webpack-plugin');
const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin');
// const RemarkHTML = require("remark-html")
const webpack = require("webpack");
const BundleAnalyzerPlugin = require("webpack-bundle-analyzer").BundleAnalyzerPlugin
const { buildVars } = require("./src/dev-utils/buildVars.cjs");

// import path from "path";
// import { fileURLToPath } from 'url';
// import TerserPlugin from "terser-webpack-plugin";
// import TsconfigPathsPlugin from "tsconfig-paths-webpack-plugin";
// // const RemarkHTML = require("remark-html")
// import webpack from "webpack";

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// const buildVars = [
//   {
//     name: "PUBLIC_URL",
//     defaultValue: "/",
//   },
//   {
//     name: "REACT_APP_EDITION",
//     defaultValue: "community",
//   },
//   {
//     name: "REACT_APP_LANGUAGES",
//     defaultValue: "",
//   },
//   {
//     name: "REACT_APP_COMMIT_ID",
//     defaultValue: "00000",
//   },
//   {
//     name: "REACT_APP_API_HOST",
//     defaultValue: "",
//   },
//   {
//     name: "LOWCODER_NODE_SERVICE_URL",
//     defaultValue: "",
//   },
//   {
//     name: "REACT_APP_ENV",
//     defaultValue: "production",
//   },
//   {
//     name: "REACT_APP_BUILD_ID",
//     defaultValue: "",
//   },
//   {
//     name: "REACT_APP_LOG_LEVEL",
//     defaultValue: "error",
//   },
//   {
//     name: "REACT_APP_IMPORT_MAP",
//     defaultValue: "{}",
//   },
//   {
//     name: "REACT_APP_SERVER_IPS",
//     defaultValue: "",
//   },
//   {
//     name: "REACT_APP_BUNDLE_BUILTIN_PLUGIN",
//     defaultValue: "",
//   },
//   {
//     name: "REACT_APP_BUNDLE_TYPE",
//     defaultValue: "app",
//   },
//   {
//     name: "REACT_APP_DISABLE_JS_SANDBOX",
//     defaultValue: "",
//   },
// ];

const define = {};
buildVars.forEach(({ name, defaultValue }) => {
  define[name] = JSON.stringify(process.env[name] || defaultValue);
});

const apiBaseUrl = "http://localhost:8000";

module.exports = {
  stats: 'verbose',
  mode: 'production',
  entry: "./index-bundle.jsx",
  externals: {
    'react': 'React',
    'react-dom': 'ReactDOM'
  },
  // entry: {
  //   index: "./src/index.jsx",
  //   another: "./node_modules/lowcoder-sdk/dist/index.js",
  // },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: [
          {
            loader: 'ts-loader',
            options: {
              transpileOnly: true,
            },
          },
        ],
        exclude: /node_modules/,
      },
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: ["babel-loader"],
      },
      {
        test: /\.css$/,
        use: ["style-loader", "css-loader"],
      },
      {
        test: /\.less$/,
        use: ["style-loader", "css-loader", "less-loader"],
      },
      {
        test: /\.svg$/i,
        issuer: /\.[jt]sx?$/,
        use: [
          {
            loader: '@svgr/webpack',
            options: {
              svgoConfig: {
                svgo: false,
              },
            },
          },
          'url-loader'
        ]
      },
      {
        test: /\.(pdf|jpg|png|gif|ico)$/,
        use: [
          {
            loader: "url-loader",
          },
        ],
      },
      {
        test: /\.(woff|woff2|eot|ttf|otf)$/,
        loader: "file-loader",
      },
      {
        test: /\.md$/,
        use: 'raw-loader'
      }
    ],
  },
  resolve: {
    extensions: [".*", ".js", ".jsx", ".ts", ".tsx"],
    alias: {
      "lowcoder-sdk": path.resolve(__dirname, "../lowcoder/src/index.sdk"),
      "@lowcoder-ee": path.resolve(__dirname, "../lowcoder/src"),
    },
    plugins: [new TsconfigPathsPlugin({
      configFile: "../lowcoder/tsconfig.json"
    })]
  },
  output: {
    // path: __dirname + "/dist",
    path: path.resolve(__dirname, 'bundle'),
    // publicPath: "https://sdk.lowcoder.cloud/",
    publicPath: "/",
    // filename: "bundle.js",
    filename: '[name].bundle.js',
  },
  plugins: [
    new webpack.DefinePlugin({
      ...define,
      REACT_APP_API_HOST: JSON.stringify(apiBaseUrl),
      REACT_APP_BUNDLE_TYPE: JSON.stringify("sdk"),
    }),
    new webpack.IgnorePlugin({
      resourceRegExp: /.test.(ts|tsx)$/,
    }),
    new BundleAnalyzerPlugin()
  ],
  optimization: {
    minimize: true,
    minimizer: [new TerserPlugin({
      // Your customization if any
    })],
    sideEffects: true,
    splitChunks: {
      chunks: 'all',
    },
    // splitChunks: {
    //   cacheGroups: {
    //     vendor: {
    //       test: /[\\/]node_modules[\\/]/,
    //       name: 'vendors',
    //       chunks: 'all',
    //     },
    //   },
    // },
    // splitChunks: {
    //   chunks: 'all',
    //   minSize: 10000,
    //   minRemainingSize: 0,
    //   minChunks: 1,
    //   maxAsyncRequests: 30,
    //   maxInitialRequests: 30,
    //   enforceSizeThreshold: 50000,
    //   cacheGroups: {
    //     default: {
    //       minChunks: 2,
    //       priority: -20,
    //       reuseExistingChunk: true,
    //     },
    //     defaultVendors: {
    //       test: /[\\/]node_modules[\\/]/,
    //       priority: -10,
    //       reuseExistingChunk: true,
    //       // name(module) {
    //       //   // get the name. E.g. node_modules/packageName/not/this/part.js
    //       //   // or node_modules/packageName
    //       //   const packageName = module.context.match(/[\\/]node_modules[\\/](.*?)([\\/]|$)/)[1];
    //       //   // if (packageName === 'antd') {
    //       //   //   return 'antd';
    //       //   // }
    //       //   // if (packageName === 'antd-mobile') {
    //       //   //   return 'antd-mobile';
    //       //   // }
    //       //   // if (packageName === 'lodash') {
    //       //   //   return 'lodash';
    //       //   // }
    //       //   // if (packageName === 'moment') {
    //       //   //   return 'moment';
    //       //   // }
    //       //   // if (packageName === 'dayjs') {
    //       //   //   return 'dayjs';
    //       //   // }
    //       //   // npm package names are URL-safe, but some servers don't like @ symbols
    //       //   // return `npm.${packageName.replace('@', '')}`;
    //       //   // return `npm.${packageName.replace('@', '')}`;
    //       //   return `vendor`;
    //       // },
    //     },
    //   },
    // },
    runtimeChunk: 'single',
    // splitChunks: {
    //   chunks: 'all',
    // }
    // splitChunks: {
    //   minSize: 0,
    //   cacheGroups: {
    //     // reuseExistingChunk: true,
    //     vendor: {
    //       test: /[\\/]node_modules[\\/]/,
    //       name: 'vendors',
    //       chunks: 'all'
    //     }
    //   }
    // }
  },
  devServer: {
    static: {
      directory: path.join(__dirname, "dist"),
    },
  },
};
