import { Dropdown, ValueFromOption } from "components/Dropdown";
import { QueryConfigItemWrapper, QueryConfigLabel, QueryConfigWrapper } from "components/query";
import { valueComp, withDefault } from "comps/generators";
import { trans } from "i18n";
import { includes } from "lodash";
import { CompAction, MultiBaseComp } from "lowcoder-core";
import { keyValueListControl } from "../../controls/keyValueListControl";
import { ParamsJsonControl, ParamsStringControl, ParamsControlType } from "../../controls/paramsControl";
import { withTypeAndChildrenAbstract } from "../../generators/withType";
import { QueryResult } from "../queryComp";
import { QUERY_EXECUTION_ERROR, QUERY_EXECUTION_OK } from "constants/queryConstants";
import { JSONValue } from "util/jsonTypes";
import { FunctionProperty } from "../queryCompUtils";
import {
  HttpHeaderPropertyView,
  HttpParametersPropertyView,
  HttpPathPropertyView,
} from "./httpQueryConstants";

const BodyTypeOptions = [
  { label: "JSON", value: "application/json" },
  { label: "Raw", value: "text/plain" },
  {
    label: "x-www-form-urlencoded",
    value: "application/x-www-form-urlencoded",
  },
  { label: "Form Data", value: "multipart/form-data" },
  { label: "None", value: "none" },
] as const;
type BodyTypeValue = ValueFromOption<typeof BodyTypeOptions>;

const HttpMethodOptions = [
  { label: "GET", value: "GET" },
  { label: "POST", value: "POST" },
  { label: "PUT", value: "PUT" },
  { label: "DELETE", value: "DELETE" },
  { label: "PATCH", value: "PATCH" },
  { label: "HEAD", value: "HEAD" },
  { label: "OPTIONS", value: "OPTIONS" },
  { label: "TRACE", value: "TRACE" },
] as const;
type HttpMethodValue = ValueFromOption<typeof HttpMethodOptions>;

const CommandMap = {
  "application/json": ParamsJsonControl,
  "text/plain": ParamsStringControl,
  "application/x-www-form-urlencoded": ParamsStringControl,
  "multipart/form-data": ParamsStringControl,
  none: ParamsStringControl,
};

const childrenMap = {
  httpMethod: valueComp<HttpMethodValue>("GET"),
  path: ParamsStringControl,
  headers: withDefault(keyValueListControl(), [{ key: "", value: "" }]),
  params: withDefault(keyValueListControl(), [{ key: "", value: "" }]),
  bodyFormData: withDefault(
    keyValueListControl(true, [
      { label: trans("httpQuery.text"), value: "text" },
      { label: trans("httpQuery.file"), value: "file" },
    ] as const),
    [{ key: "", value: "", type: "text" }]
  ),
};

const SseHttpTmpQuery = withTypeAndChildrenAbstract(
  CommandMap,
  "none",
  childrenMap,
  "bodyType",
  "body"
);

export class SseHttpQuery extends SseHttpTmpQuery {
  private eventSource: EventSource | undefined;
  private controller: AbortController | undefined;

  isWrite(action: CompAction) {
    return (
      action.path.includes("httpMethod") && "value" in action && !includes(["GET"], action.value)
    );
  }

  override getView() {
    const children = this.children;
    const params = [
      ...children.headers.getQueryParams(),
      ...children.params.getQueryParams(),
      ...children.bodyFormData.getQueryParams(),
      ...children.path.getQueryParams(),
      ...children.body.getQueryParams(),
    ];
    
    return this.createStreamingQueryView(params);
  }

  private createStreamingQueryView(params: FunctionProperty[]) {
    return async (props: {
      queryId: string;
      applicationId: string;
      applicationPath: string[];
      args?: Record<string, unknown>;
      variables?: any;
      timeout: InstanceType<ParamsControlType>;
      callback?: (result: QueryResult) => void;
    }): Promise<QueryResult> => {
      
      try {
        const timer = performance.now();
        
        // Process parameters like toQueryView does
        const processedParams = this.processParameters(params, props);
        
        // Build request from processed parameters
        const { url, headers, method, body } = this.buildRequestFromParams(processedParams, props.args);
        
        // Execute streaming logic
        if (method === "GET") {
          return this.handleEventSource(url, headers, props, timer);
        } else {
          return this.handleStreamingFetch(url, headers, method, body, props, timer);
        }
        
      } catch (error) {
        return this.createErrorResponse((error as Error).message);
      }
    };
  }

  private processParameters(params: FunctionProperty[], props: any) {
    let mappedVariables: Array<{key: string, value: string}> = [];
    Object.keys(props.variables || {})
      .filter(k => k !== "$queryName")
      .forEach(key => {
        const value = Object.hasOwn(props.variables[key], 'value') ? props.variables[key].value : props.variables[key];
        mappedVariables.push({
          key: `${key}.value`,
          value: value || ""
        });
      });

    return [
      ...params.filter(param => {
        return !mappedVariables.map(v => v.key).includes(param.key);
      }).map(({ key, value }) => ({ key, value: value(props.args) })),
      ...Object.entries(props.timeout.getView()).map(([key, value]) => ({
        key,
        value: (value as any)(props.args),
      })),
      ...mappedVariables,
    ];
  }

  private buildRequestFromParams(processedParams: Array<{key: string, value: any}>, args: Record<string, unknown> = {}) {
    // Hardcoded values from the screenshot for testing
    const url = "http://localhost:11434/api/generate";
    const headers = {
      "Content-Type": "application/json",
      "Accept": "text/event-stream"
    };
    const method = "POST";
    const body = JSON.stringify({
      "model": "gemma3",
      "prompt": "Tell me a short story about a robot",
      "stream": true
    });

    console.log("Hardcoded request:", { url, headers, method, body });
    
    return { url, headers, method, body };
  }

  private async handleEventSource(
    url: string, 
    headers: Record<string, string>, 
    props: any, 
    timer: number
  ): Promise<QueryResult> {
    return new Promise((resolve, reject) => {
      // Clean up any existing connection
      this.cleanup();
      
      this.eventSource = new EventSource(url);
      
      this.eventSource.onopen = () => {
        resolve(this.createSuccessResponse("SSE connection established", timer));
      };
      
      this.eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          props.callback?.(this.createSuccessResponse(data));
        } catch (error) {
          // Handle non-JSON data
          props.callback?.(this.createSuccessResponse(event.data));
        }
      };
      
      this.eventSource.onerror = (error) => {
        this.cleanup();
        reject(this.createErrorResponse("SSE connection error"));
      };
    });
  }

  private async handleStreamingFetch(
    url: string, 
    headers: Record<string, string>, 
    method: string, 
    body: string | FormData | undefined,
    props: any, 
    timer: number
  ): Promise<QueryResult> {
    // Clean up any existing connection
    this.cleanup();
    
    this.controller = new AbortController();
    
    const response = await fetch(url, {
      method,
      headers: {
        ...headers,
        'Accept': 'text/event-stream',
      },
      body,
      signal: this.controller.signal,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    // Handle streaming response
    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    
    if (!reader) {
      throw new Error("No readable stream available");
    }

    // Process stream in background
    this.processStream(reader, decoder, props.callback);
    
    return this.createSuccessResponse("Stream connection established", timer);
  }

  private async processStream(
    reader: ReadableStreamDefaultReader<Uint8Array>, 
    decoder: TextDecoder, 
    callback?: (result: QueryResult) => void
  ) {
    let buffer = '';
    
    try {
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        
        // Process complete JSON objects or SSE events
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        
        for (const line of lines) {
          if (line.trim()) {
            try {
              // Handle SSE format: data: {...}
              let jsonData = line.trim();
              if (jsonData.startsWith('data: ')) {
                jsonData = jsonData.substring(6);
              }
              
              // Skip SSE control messages
              if (jsonData === '[DONE]' || jsonData.startsWith('event:') || jsonData.startsWith('id:')) {
                continue;
              }
              
              const data = JSON.parse(jsonData);
              callback?.(this.createSuccessResponse(data));
            } catch (error) {
              // Handle non-JSON lines or plain text
              if (line.trim() !== '') {
                callback?.(this.createSuccessResponse(line.trim()));
              }
            }
          }
        }
      }
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        callback?.(this.createErrorResponse((error as Error).message));
      }
    } finally {
      reader.releaseLock();
    }
  }

  private createSuccessResponse(data: JSONValue, runTime?: number): QueryResult {
    return {
      data,
      runTime: runTime || 0,
      success: true,
      code: QUERY_EXECUTION_OK,
    };
  }

  private createErrorResponse(message: string): QueryResult {
    return {
      message,
      data: "",
      success: false,
      code: QUERY_EXECUTION_ERROR,
    };
  }

  public cleanup() {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = undefined;
    }
    if (this.controller) {
      this.controller.abort();
      this.controller = undefined;
    }
  }

  propertyView(props: {
    datasourceId: string;
    urlPlaceholder?: string;
    supportHttpMethods?: HttpMethodValue[];
    supportBodyTypes?: BodyTypeValue[];
  }) {
    return <SseHttpQueryPropertyView {...props} comp={this} />;
  }

  getHttpMethod() {
    return this.children.httpMethod.getView();
  }
}

type ChildrenType = InstanceType<typeof SseHttpQuery> extends MultiBaseComp<infer X> ? X : never;

const ContentTypeKey = "Content-Type";

const showBodyConfig = (children: ChildrenType) => {
  switch (children.bodyType.getView() as BodyTypeValue) {
    case "application/x-www-form-urlencoded":
      return children.bodyFormData.propertyView({});
    case "multipart/form-data":
      return children.bodyFormData.propertyView({
        showType: true,
        typeTooltip: trans("httpQuery.bodyFormDataTooltip", {
          type: `"${trans("httpQuery.file")}"`,
          object: "{ data: base64 string, name: string }",
          example: "{{ {data: file1.value[0], name: file1.files[0].name} }}",
        }),
      });
    case "application/json":
    case "text/plain":
      return children.body.propertyView({ styleName: "medium", width: "100%" });
    default:
      return <></>;
  }
};

const SseHttpQueryPropertyView = (props: {
  comp: InstanceType<typeof SseHttpQuery>;
  datasourceId: string;
  urlPlaceholder?: string;
  supportHttpMethods?: HttpMethodValue[];
  supportBodyTypes?: BodyTypeValue[];
}) => {
  const { comp, supportHttpMethods, supportBodyTypes } = props;
  const { children, dispatch } = comp;

  return (
    <>
      <Dropdown
        placement={"bottom"}
        value={children.httpMethod.value}
        options={HttpMethodOptions.filter(
          (o) => !supportHttpMethods || supportHttpMethods.includes(o.value)
        )}
        label={"HTTP Method"}
        onChange={(value: HttpMethodValue) => {
          children.httpMethod.dispatchChangeValueAction(value);
        }}
      />

      <HttpPathPropertyView 
        {...props} 
        comp={comp} 
        urlPlaceholder={props.urlPlaceholder || "https://api.example.com/stream"}
      />

      <HttpHeaderPropertyView comp={comp} />

      <HttpParametersPropertyView comp={comp} />

      <Dropdown
        label={"Body"}
        placement={"bottom"}
        options={BodyTypeOptions.filter(
          (o) => !supportBodyTypes || supportBodyTypes?.includes(o.value)
        )}
        value={children.bodyType.getView()}
        onChange={(value) => {
          let headers = children.headers
            .toJsonValue()
            .filter((header) => header.key !== ContentTypeKey);
          if (value !== "none") {
            headers = [
              {
                key: ContentTypeKey,
                value: value,
              },
              ...headers,
            ];
          }

          dispatch(
            comp.changeValueAction({ ...comp.toJsonValue(), bodyType: value, headers: headers })
          );
        }}
      />

      <QueryConfigWrapper>
        <QueryConfigLabel />
        <QueryConfigItemWrapper>{showBodyConfig(children)}</QueryConfigItemWrapper>
      </QueryConfigWrapper>
    </>
  );
};