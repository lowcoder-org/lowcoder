import express from "express";
import * as pluginControllers from "../controllers/plugins";
import jsControllers from "../controllers/runJavascript";
import * as npmControllers from "../controllers/npm";

const apiRouter = express.Router();

apiRouter.post("/runJs", jsControllers.runJavascript);
apiRouter.post("/batchRunJs", jsControllers.batchRunJavascript);

apiRouter.get("/plugins", pluginControllers.listPlugins);
apiRouter.post("/runPluginQuery", pluginControllers.runPluginQuery);
apiRouter.post("/getPluginDynamicConfig", pluginControllers.getDynamicDef);
apiRouter.post("/validatePluginDataSourceConfig", pluginControllers.validatePluginDataSourceConfig);

apiRouter.get("/npm/registry/*", npmControllers.fetchRegistry);
apiRouter.get("/npm/package/*", npmControllers.fetchPackageFile);

apiRouter.post("/npm/registry/*", npmControllers.fetchRegistryWithConfig);
apiRouter.post("/npm/package/*", npmControllers.fetchPackageFileWithConfig);

export default apiRouter;
