import path, { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { buildVars } from "../../scripts/buildVars.js";

export function currentDirName(importMetaUrl) {
  return dirname(fileURLToPath(importMetaUrl));
}


const globals = {};
buildVars.forEach(({ name, defaultValue }) => {
  globals[name] = process.env[name] || defaultValue;
});
const edition = process.env.REACT_APP_EDITION;
const isEEGlobal = edition === "enterprise-global";
const isEE = edition === "enterprise" || isEEGlobal;
const currentDir = currentDirName(import.meta.url);

export default {
  testEnvironment: "jsdom",
  moduleNameMapper: {
    "react-markdown": path.resolve(currentDir, "./mocks/react-markdown.js"),
    "react-redux": path.resolve(currentDir, "./mocks/react-redux.js"),
    "react-draggable": path.resolve(currentDir, "./mocks/react-draggable.js"),
    "react-resize-detector": path.resolve(currentDir, "./mocks/react-resize-detector.js"),
    "react-virtualized": path.resolve(currentDir, "./mocks/react-virtualized.js"),
    "@dnd-kit/sortable": path.resolve(currentDir, "./mocks/dnd-kit-sortable.js"),
    "@dnd-kit/core": path.resolve(currentDir, "./mocks/dnd-kit-core.js"),
    "antd": path.resolve(currentDir, "./mocks/antd.js"),
    "history": path.resolve(currentDir, "./mocks/history.js"),
    "\\.md\\?url$": path.resolve(currentDir, "./mocks/markdown-url-module.js"),
    "^@lowcoder-ee(.*)$": path.resolve(
      currentDir,
      isEE ? "../../packages/lowcoder/src/ee/$1" : "../../packages/lowcoder/src/$1"
    ),
    "lowcoder-sdk": path.resolve(currentDir, "../../packages/lowcoder/src/index.sdk"),
  },
  globals,
  // roots: ["<rootDir>/src"],
  modulePaths: [
    "<rootDir>/src",
    path.resolve(currentDir, "../../packages/lowcoder/src"),
    path.resolve(currentDir, "../../packages/lowcoder-comps/src"),
    path.resolve(currentDir, "../../packages/lowcoder-design/src"),
  ],
  // moduleDirectories: [
  //   "<rootDir>/client/node_modules",
  //   path.resolve(currentDir, "../../node_modules"),
  //   path.resolve(currentDir, "../../packages/lowcoder/node_modules"),
  //   path.resolve(currentDir, "../../packages/lowcoder-comps/node_modules"),
  //   path.resolve(currentDir, "../../packages/lowcoder-design/node_modules"),
  // ],
  setupFiles: [path.resolve(currentDir, "./jest.setup.js")],
  setupFilesAfterEnv: [path.resolve(currentDir, "./jest.setup-after-env.js"), 'jest-canvas-mock'],
  transform: {
    "^.+\\.(js|jsx|mjs|cjs|ts|tsx)$": path.resolve(currentDir, "./transform/babelTransform.js"),
    "^.+\\.css$": path.resolve(currentDir, "./transform/cssTransform.js"),
    "^(?!.*\\.(js|jsx|mjs|cjs|ts|tsx|css|json)$)": path.resolve(
      currentDir,
      "./transform/fileTransform.js"
    ),
  },
  transformIgnorePatterns: [],
  resetMocks: true,
};
