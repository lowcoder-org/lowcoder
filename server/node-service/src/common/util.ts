import yaml from "yaml";
import fs from "fs";
import { MultiOpenApiSpecItem } from "../plugins/openApi/parse";
import path from "path";
import { appendTags } from "../plugins/openApi/util";
import _ from "lodash";

export function kvToRecord(
  kvs: { key: string; value: string }[],
  trimEmpty: boolean = true
): Record<string, string> {
  const ret: Record<string, string> = {};
  (kvs || []).forEach(({ key, value }) => {
    if (trimEmpty && !value) {
      return;
    }
    ret[key] = value;
  });
  return ret;
}

export function toString(value: any): string {
  if (value === undefined || value === null) {
    return "";
  }
  if (typeof value === "string") {
    return value;
  }
  if (value instanceof Date) {
    return value.toISOString();
  }
  if (value instanceof RegExp) {
    return value.toString();
  }
  return JSON.stringify(value, (k, v) => {
    switch (typeof v) {
      case "bigint":
        return v.toString();
    }
    return v;
  });
}

export function toNumber(value: any): number {
  if (value === undefined || value === null || value === "" || isNaN(value)) {
    return 0;
  }
  if (typeof value === "number") {
    return value;
  }
  const result = Number(value);
  return Number.isFinite(result) ? result : 0;
}

export function toBoolean(value: any): boolean {
  if (value === "0" || value === "false") {
    return false;
  }
  return !!value;
}

export function readYaml<T = any>(path: string): T {
  try {
    const yamlContent = fs.readFileSync(path, "utf-8");
    return yaml.parse(yamlContent) as T;
  } catch (e) {
    console.info("invalid yaml:", e);
    return {} as T;
  }
}

export function safeJsonParse(json: string) {
  try {
    return JSON.parse(json);
  } catch (e) {
    console.warn("can not json parse:", json);
    return {};
  }
}

export function safeJsonStringify(data: any) {
  if (data === null || data === undefined) {
    return data;
  }
  try {
    return JSON.stringify(data, null, 4);
  } catch (e) {
    console.warn("can not json stringify:", data, e);
    return null;
  }
}

export function specsToOptions(specs: any) {
  return Object.keys(specs).map(k => ({value: k, label: k}));
}

export function version2spec(specs: any, version: any) {
  if(version == undefined || version == "") {
    const keys = Object.keys(specs);
    if(keys.length == 0) return;
    return specs[keys[0]];
  }
  return specs[version];
}

function genTagFromFileName(name: string) {
  const fileName = name.replace(/\.yaml|twilio_|\.json/g, "");
  const parts = fileName.split("_");
  return parts.reduce((a, b) => {
    if (/v\d+/.test(b)) {
      return `${a}(${b})`;
    }
    return a + _.upperFirst(b);
  }, "");
}

export function dirToSpecList(specDir: string) {
  const specList: MultiOpenApiSpecItem[] = [];

  const start = performance.now();
  const specFiles = fs.readdirSync(specDir);
  specFiles.forEach((specFile) => {
    const spec = readYaml(path.join(specDir, specFile));
    const tag = genTagFromFileName(specFile);
    appendTags(spec, tag);
    specList.push({
      id: tag,
      spec,
    });
  });
  logger.info("spec list loaded %s, duration: %d ms",specDir, performance.now() - start);
  return specList;
}