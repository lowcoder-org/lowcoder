import { badRequest } from "../common/error";
import { Request, Response } from "express";
import _ from "lodash";
import { Config } from "lowcoder-sdk/dataSource";
import * as pluginServices from "../services/plugin";
// Add import for decryption utility
import { decryptString } from "../utils/encryption"; // <-- implement this utility as needed

async function getDecryptedBody(req: Request): Promise<any> {
  if (req.headers["x-encrypted"]) {
    // Assume body is a raw encrypted string, decrypt and parse as JSON
    const encrypted = typeof req.body === "string" ? req.body : req.body?.toString?.();
    if (!encrypted) throw badRequest("Missing encrypted body");
    const decrypted = await decryptString(encrypted);
    try {
      return JSON.parse(decrypted);
    } catch (e) {
      throw badRequest("Failed to parse decrypted body as JSON");
    }
  }
  return req.body;
}

export async function listPlugins(req: Request, res: Response) {
  let ids = req.query["id"] || [];
  if (typeof ids === "string") {
    ids = [ids];
  }
  const ctx = pluginServices.getPluginContext(req);
  const result = pluginServices.listPlugins(ctx, ids as string[]);
  return res.status(200).json(result);
}

export async function runPluginQuery(req: Request, res: Response) {
  const body = await getDecryptedBody(req);
  const { pluginName, dsl, context, dataSourceConfig } = body;
  const ctx = pluginServices.getPluginContext(req);

  const result = await pluginServices.runPluginQuery(
    pluginName,
    dsl,
    context,
    dataSourceConfig,
    ctx
  );
  return res.status(200).json(result);
}

export async function validatePluginDataSourceConfig(req: Request, res: Response) {
  const body = await getDecryptedBody(req);
  const { pluginName, dataSourceConfig } = body;
  const ctx = pluginServices.getPluginContext(req);
  const result = await pluginServices.validatePluginDataSourceConfig(
    pluginName,
    dataSourceConfig,
    ctx
  );
  return res.status(200).json(result);
}

type GetDynamicDefReqBody = {
  pluginName: string;
  path: string;
  dataSourceConfig: any;
}[];

export async function getDynamicDef(req: Request, res: Response) {
  const ctx = pluginServices.getPluginContext(req);
  const body = await getDecryptedBody(req);
  if (!Array.isArray(body)) {
    throw badRequest("request body is not a valid array");
  }
  const fields = body as GetDynamicDefReqBody;
  const result: Config[] = [];
  for (const item of fields) {
    const def = await pluginServices.getDynamicConfigDef(
      item.pluginName,
      item.path,
      item.dataSourceConfig,
      ctx
    );
    result.push(def);
  }
  return res.status(200).json(result);
}
