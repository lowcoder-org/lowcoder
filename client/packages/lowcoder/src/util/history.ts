import { createBrowserHistory } from "history";
const nodeEnv = process.env.NODE_ENV ?? "development";
const isDev = nodeEnv === "development";
const basename = isDev ? "/" : "/__LOWCODER_BASEPATH_PLACEHOLDER__";

export default createBrowserHistory({basename});
