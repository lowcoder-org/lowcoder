import express from "express";
import * as pluginControllers from "../controllers/plugins";
import jsControllers from "../controllers/runJavascript";
import * as npmControllers from "../controllers/npm";
import querystring from "querystring";
import { ParsedQs } from 'qs';

const apiRouter = express.Router();

// In-memory cache object
const cache: { [key: string]: any } = {};

// Helper function to flatten Request Query object
function flatQuery(query: ParsedQs) {
    let result: {[key: string]: string | number | boolean | string[] | null} = {};

    for (let key in query) {
        if (typeof query[key] === 'object' && !Array.isArray(query[key])) {
            result[key] = JSON.stringify(query[key]);
        } else {
            result[key] = query[key] as any;
        }
    }

    return result;
}

// Middleware to cache responses for specific routes
function cacheMiddleware(req: express.Request, res: express.Response, next: express.NextFunction) {

    let cacheKey = req.path + "?" + querystring.stringify(flatQuery(req.query));

    if (req.method === "POST" && req.is("application/json") && req.body) {
        cacheKey += JSON.stringify(req.body);
    }

    // Check if the response is already cached
    if (cache[cacheKey]) {
        return res.json(cache[cacheKey]); // Return cached JSON object if it exists
    }

    // Override res.json instead of res.send to store response in cache as JSON
    const originalJson = res.json.bind(res);
    res.json = (body: any) => {
        cache[cacheKey] = body; // Cache the JSON response
        originalJson(body); // Send the JSON response
        return res;
    };

    next();
}

apiRouter.post("/runJs", jsControllers.runJavascript);
apiRouter.post("/batchRunJs", jsControllers.batchRunJavascript);

apiRouter.get("/plugins", cacheMiddleware, pluginControllers.listPlugins);
apiRouter.post("/runPluginQuery", pluginControllers.runPluginQuery);
apiRouter.post("/getPluginDynamicConfig", cacheMiddleware, pluginControllers.getDynamicDef);
apiRouter.post("/validatePluginDataSourceConfig", pluginControllers.validatePluginDataSourceConfig);

// routes for npm registry and package fetching with config called by the api-service
apiRouter.post("/npm/registry/*", npmControllers.fetchRegistryWithConfig);
apiRouter.post("/npm/package/*", npmControllers.fetchPackageFileWithConfig);

// temporary routes for testing npm registry and package routes by directly calling the node-service
// apiRouter.get("/npm/registry/*", npmControllers.fetchRegistry);
// apiRouter.get("/npm/package/*", npmControllers.fetchPackageFile);

export default apiRouter;
