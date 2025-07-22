// SSEHTTPQUERY.tsx
import { Dropdown, ValueFromOption } from "components/Dropdown";
import { QueryConfigItemWrapper, QueryConfigLabel, QueryConfigWrapper } from "components/query";
import { valueComp, withDefault } from "comps/generators";
import { trans } from "i18n";
import { includes } from "lodash";
import { CompAction, MultiBaseComp } from "lowcoder-core";
import { keyValueListControl } from "../../controls/keyValueListControl";
import { ParamsJsonControl, ParamsStringControl } from "../../controls/paramsControl";
import { withTypeAndChildrenAbstract } from "../../generators/withType";
import { toSseQueryView } from "../queryCompUtils";
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
  headers: withDefault(keyValueListControl(), [
    { key: "Accept", value: "text/event-stream" }
  ]),
  params: withDefault(keyValueListControl(), [{ key: "", value: "" }]),
  bodyFormData: withDefault(
    keyValueListControl(true, [
      { label: trans("httpQuery.text"), value: "text" },
      { label: trans("httpQuery.file"), value: "file" },
    ] as const),
    [{ key: "", value: "", type: "text" }]
  ),
  // Add SSE-specific configuration
  streamingEnabled: valueComp<boolean>(true),
};

const SseHttpTmpQuery = withTypeAndChildrenAbstract(
  CommandMap,
  "none",
  childrenMap,
  "bodyType",
  "body"
);

export class SseHttpQuery extends SseHttpTmpQuery {
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
      // Add streaming flag to params
      { key: "_streaming", value: () => "true" },
      { key: "_streamingEnabled", value: () => children.streamingEnabled.getView() }
    ];
    
    // Use SSE-specific query view
    return toSseQueryView(params);
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
          
          // Always ensure Accept: text/event-stream for SSE
          const hasAcceptHeader = headers.some(h => h.key === "Accept");
          if (!hasAcceptHeader) {
            headers.push({ key: "Accept", value: "text/event-stream" });
          }
          
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
      
      <QueryConfigWrapper>
        <QueryConfigLabel>Streaming Options</QueryConfigLabel>
        <QueryConfigItemWrapper>
          <div style={{ fontSize: "13px", color: "#8B8FA3" }}>
            This query will establish a Server-Sent Events connection for real-time data streaming.
          </div>
        </QueryConfigItemWrapper>
      </QueryConfigWrapper>
    </>
  );
};