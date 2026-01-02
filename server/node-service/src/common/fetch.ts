import { ProxyAgent } from "proxy-agent";
import nodeFetch, { RequestInit } from "node-fetch";

const proxyAgent = new ProxyAgent();

export function fetch(url: string, init: RequestInit = {}) {
  return nodeFetch(url, {
    ...init,
    agent: proxyAgent,
  });
}
