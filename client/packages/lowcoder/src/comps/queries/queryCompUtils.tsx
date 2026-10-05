import _, { isObject } from "lodash";
import { QueryApi, QueryExecuteRequest } from "../../api/queryApi";
import { QueryResult, TriggerType } from "./queryComp";
import { Comp } from "lowcoder-core";
import { MultiCompBuilder, ToConstructor } from "../generators/multi";
import { Fragment } from "react";
import { ParamsControlType, ValueFunction } from "../controls/paramsControl";
import { getGlobalSettings } from "comps/utils/globalSettings";
import { ResourceType } from "@lowcoder-ee/constants/queryConstants";
import { evalFunc } from "lowcoder-core";
import { QUERY_EXECUTION_ERROR, QUERY_EXECUTION_OK } from "../../constants/queryConstants";
import type { SandBoxOption } from "lowcoder-core/src/eval/utils/evalScript";

export type FunctionProperty = {
  key: string;
  value: ValueFunction;
};

/**
 * public method for query request
 */
export function toQueryView(params: FunctionProperty[]) {
  /**
   * FIXME: queryComp unified plus timeout parameter
   */
  return async (props: {
    queryId: string;
    applicationId: string;
    applicationPath: string[];
    args?: Record<string, unknown>;
    variables?: any;
    timeout: InstanceType<ParamsControlType>;
  }): Promise<QueryResult> => {
    const { applicationId, isViewMode } = getGlobalSettings();

    // Check if this is a JS query
    const isJsQuery = props.queryId?.startsWith("js:");
    if (isJsQuery) {
      try {
        const { orgCommonSettings } = getGlobalSettings();
        const runInHost = !!orgCommonSettings?.runJavaScriptInHost;
        const timer = performance.now();
        const script = props.args?.script || "";
        const options: SandBoxOption = { disableLimit: runInHost };
        const data = await evalFunc(`return (${script}\n);`, props.args || {}, undefined, options);
        return {
          data: data,
          code: QUERY_EXECUTION_OK,
          success: true,
          runTime: Number((performance.now() - timer).toFixed()),
        };
      } catch (e) {
        return {
          success: false,
          data: "",
          code: QUERY_EXECUTION_ERROR,
          message: (e as any).message || "",
        };
      }
    }

    let mappedVariables: Array<{key: string, value: string}> = [];
    Object.keys(props.variables)
      .filter(k => k !== "$queryName")
      .forEach(key => {
        const value = Object.hasOwn(props.variables[key], 'value') ? props.variables[key].value : props.variables[key];
        mappedVariables.push({
          key: `${key}.value`,
          value: value || ""
        })
        mappedVariables.push({
          key: `${props.args?.$queryName}.variables.${key}`,
          value: value || ""
        })
      })

    let request: QueryExecuteRequest = {
      path: props.applicationPath,
      params: [
        ...params.filter(param => {
          return !mappedVariables.map(v => v.key).includes(param.key);
        }).map(({ key, value }) => ({ key, value: value(props.args) })),
        ...Object.entries(props.timeout.getView()).map(([key, value]) => ({
          key,
          value: (value as ValueFunction)(props.args),
        })),
        ...mappedVariables,
      ],
      viewMode: !!isViewMode,
    };
    if (!applicationId) {
      request = { ...request, libraryQueryId: props.queryId, libraryQueryRecordId: "latest" };
    } else {
      request = { ...request, applicationId: props.applicationId, queryId: props.queryId };
    }

    const response = await QueryApi.executeQuery(
      request,
      props.timeout.children.text.getView() as number
    );

    return {
      ...response.data,
      code: response.data.queryCode,
      extra: _.omit(response.data, ["code", "message", "data", "success", "runTime", "queryCode"]),
    };
  };
}

export function buildQueryCommand<ChildrenCompMap extends Record<string, Comp<unknown>>>(
  childrenMap: ToConstructor<ChildrenCompMap>
) {
  return new MultiCompBuilder(
    childrenMap,
    (props) =>
      Object.values(props)
        .filter((prop) => isObject(prop))
        .reduce(
          (result: FunctionProperty[], prop) => [
            ...result,
            ...Object.entries(prop).map((kv) => ({
              key: kv[0],
              value: kv[1],
            })),
          ],
          []
        ) as FunctionProperty[]
  )
    .setPropertyViewFn((children) => (
      <>
        {Object.entries(children).map((e) => (
          <Fragment key={e[0]}>{e[1].getPropertyView()}</Fragment>
        ))}
      </>
    ))
    .build();
}

export function onlyManualTrigger(type: ResourceType) {
  return false;
}

export function getTriggerType(comp: any): TriggerType {
  return comp.children.triggerType.getView();
}

// STREAMING QUERY

export interface SseQueryResult extends QueryResult {
  streamId?: string;
  isStreaming?: boolean;
}

export interface SseQueryViewProps {
  queryId: string;
  applicationId: string;
  applicationPath: string[];
  args?: Record<string, unknown>;
  variables?: any;
  timeout: any;
  onStreamData?: (data: any) => void;
  onStreamError?: (error: any) => void;
  onStreamEnd?: () => void;
}

/**
 * SSE-specific query view that handles streaming responses
 */
export function toSseQueryView(params: FunctionProperty[]) {
  // Store active connections
  const activeConnections = new Map<string, EventSource>();
  
  return async (props: SseQueryViewProps): Promise<SseQueryResult> => {
    const { applicationId, isViewMode } = getGlobalSettings();
    
    // Process parameters similar to toQueryView
    let mappedVariables: Array<{key: string, value: string}> = [];
    Object.keys(props.variables || {})
      .filter(k => k !== "$queryName")
      .forEach(key => {
        const value = Object.hasOwn(props.variables[key], 'value') 
          ? props.variables[key].value 
          : props.variables[key];
        mappedVariables.push({
          key: `${key}.value`,
          value: value || ""
        });
        mappedVariables.push({
          key: `${props.args?.$queryName}.variables.${key}`,
          value: value || ""
        });
      });

    let request: QueryExecuteRequest = {
      path: props.applicationPath,
      params: [
        ...params.filter(param => {
          return !mappedVariables.map(v => v.key).includes(param.key);
        }).map(({ key, value }) => ({ key, value: value(props.args) })),
        ...Object.entries(props.timeout.getView()).map(([key, value]) => ({
          key,
          value: (value as ValueFunction)(props.args),
        })),
        ...mappedVariables,
      ],
      viewMode: !!isViewMode,
    };
    
    if (!applicationId) {
      request = { ...request, libraryQueryId: props.queryId, libraryQueryRecordId: "latest" };
    } else {
      request = { ...request, applicationId: props.applicationId, queryId: props.queryId };
    }

    try {
      // For SSE queries, we need a different approach
      // Option 1: If your backend supports SSE proxying
      const streamId = `sse_${props.queryId}_${Date.now()}`;
      
      // First, initiate the SSE connection through your backend
      const initResponse = await QueryApi.executeQuery(
        {
          ...request,
          // Add SSE-specific flags
          params: [
            ...(request.params || []),
            { key: "_sseInit", value: "true" },
            { key: "_streamId", value: streamId }
          ]
        },
        props.timeout.children.text.getView() as number
      );

      if (!initResponse.data.success) {
        return {
          ...initResponse.data,
          code: initResponse.data.queryCode,
          extra: _.omit(initResponse.data, ["code", "message", "data", "success", "runTime", "queryCode"]),
        };
      }

      // Get the SSE endpoint from backend response
      const sseEndpoint = (initResponse.data.data as any)?.sseEndpoint;
      
      if (sseEndpoint) {
        // Establish SSE connection
        establishSseConnection(
          streamId,
          sseEndpoint,
          props.onStreamData,
          props.onStreamError,
          props.onStreamEnd,
          activeConnections
        );
        
        return {
          ...initResponse.data,
          code: QUERY_EXECUTION_OK,
          streamId,
          isStreaming: true,
          extra: {
            ..._.omit(initResponse.data, ["code", "message", "data", "success", "runTime", "queryCode"]),
            streamId,
            closeStream: () => closeSseConnection(streamId, activeConnections)
          }
        };
      }

      // Fallback to regular response if SSE not available
      return {
        ...initResponse.data,
        code: initResponse.data.queryCode,
        extra: _.omit(initResponse.data, ["code", "message", "data", "success", "runTime", "queryCode"]),
      };
      
    } catch (error) {
      return {
        success: false,
        data: "",
        code: QUERY_EXECUTION_ERROR,
        message: (error as any).message || "Failed to execute SSE query",
      };
    }
  };
}

function establishSseConnection(
  streamId: string,
  endpoint: string,
  onData?: (data: any) => void,
  onError?: (error: any) => void,
  onEnd?: () => void,
  connections?: Map<string, EventSource>
) {
  // Close any existing connection with the same ID
  if (connections?.has(streamId)) {
    connections.get(streamId)?.close();
  }
  
  const eventSource = new EventSource(endpoint);
  
  eventSource.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      onData?.(data);
    } catch (error) {
      // Handle non-JSON data
      onData?.(event.data);
    }
  };
  
  eventSource.onerror = (error) => {
    onError?.(error);
    eventSource.close();
    connections?.delete(streamId);
    onEnd?.();
  };
  
  eventSource.onopen = () => {
    console.log(`SSE connection established: ${streamId}`);
  };
  
  // Store the connection
  connections?.set(streamId, eventSource);
}

function closeSseConnection(streamId: string, connections?: Map<string, EventSource>) {
  const eventSource = connections?.get(streamId);
  if (eventSource) {
    eventSource.close();
    connections?.delete(streamId);
    console.log(`SSE connection closed: ${streamId}`);
  }
}

// Alternative implementation using fetch with ReadableStream
export function toSseQueryViewWithFetch(params: FunctionProperty[]) {
  const activeControllers = new Map<string, AbortController>();
  
  return async (props: SseQueryViewProps): Promise<SseQueryResult> => {
    const { applicationId, isViewMode } = getGlobalSettings();
    
    // Similar parameter processing as above...
    let mappedVariables: Array<{key: string, value: string}> = [];
    Object.keys(props.variables || {})
      .filter(k => k !== "$queryName")
      .forEach(key => {
        const value = Object.hasOwn(props.variables[key], 'value') 
          ? props.variables[key].value 
          : props.variables[key];
        mappedVariables.push({
          key: `${key}.value`,
          value: value || ""
        });
      });

    const processedParams = [
      ...params.filter(param => {
        return !mappedVariables.map(v => v.key).includes(param.key);
      }).map(({ key, value }) => ({ key, value: value(props.args) })),
      ...Object.entries(props.timeout.getView()).map(([key, value]) => ({
        key,
        value: (value as ValueFunction)(props.args),
      })),
      ...mappedVariables,
    ];

    // Build the request configuration from params
    const config = buildRequestConfig(processedParams);
    
    const streamId = `fetch_${props.queryId}_${Date.now()}`;
    const controller = new AbortController();
    activeControllers.set(streamId, controller);
    
    try {
      const response = await fetch(config.url, {
        method: config.method,
        headers: config.headers,
        body: config.body,
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // Process the stream
      if (response.body) {
        processStream(
          response.body,
          props.onStreamData,
          props.onStreamError,
          props.onStreamEnd
        );
      }

      return {
        success: true,
        data: { message: "Stream started" },
        code: QUERY_EXECUTION_OK,
        streamId,
        isStreaming: true,
        runTime: 0,
        extra: {
          streamId,
          closeStream: () => {
            controller.abort();
            activeControllers.delete(streamId);
          }
        }
      };
      
    } catch (error) {
      activeControllers.delete(streamId);
      return {
        success: false,
        data: "",
        code: QUERY_EXECUTION_ERROR,
        message: (error as any).message || "Failed to establish stream",
      };
    }
  };
}

function buildRequestConfig(params: Array<{key: string, value: any}>) {
  const config: any = {
    url: "",
    method: "GET",
    headers: {},
    body: undefined,
  };
  
  params.forEach(param => {
    if (param.key === "url" || param.key === "path") {
      config.url = param.value;
    } else if (param.key === "method") {
      config.method = param.value;
    } else if (param.key.startsWith("header.")) {
      const headerName = param.key.substring(7);
      config.headers[headerName] = param.value;
    } else if (param.key === "body") {
      config.body = param.value;
    }
  });
  
  return config;
}

async function processStream(
  readableStream: ReadableStream<Uint8Array>,
  onData?: (data: any) => void,
  onError?: (error: any) => void,
  onEnd?: () => void
) {
  const reader = readableStream.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  
  try {
    while (true) {
      const { done, value } = await reader.read();
      
      if (done) {
        onEnd?.();
        break;
      }
      
      buffer += decoder.decode(value, { stream: true });
      
      // Process complete lines
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';
      
      for (const line of lines) {
        if (line.trim()) {
          try {
            // Handle SSE format
            let data = line.trim();
            if (data.startsWith('data: ')) {
              data = data.substring(6);
            }
            
            // Skip control messages
            if (data === '[DONE]' || data.startsWith('event:') || data.startsWith('id:')) {
              continue;
            }
            
            const jsonData = JSON.parse(data);
            onData?.(jsonData);
          } catch (error) {
            // Handle non-JSON lines
            if (line.trim() !== '') {
              onData?.(line.trim());
            }
          }
        }
      }
    }
  } catch (error) {
    onError?.(error);
  } finally {
    reader.releaseLock();
  }
}