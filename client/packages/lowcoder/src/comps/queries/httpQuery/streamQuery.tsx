import { ControlPropertyViewWrapper } from "components/control";
import { Input } from "components/Input";
import { KeyValueList } from "components/keyValueList";
import { QueryConfigItemWrapper, QueryConfigLabel, QueryConfigWrapper } from "components/query";
import { simpleMultiComp } from "comps/generators/multi";
import { ReactNode } from "react";
import { JSONValue } from "../../../util/jsonTypes";
import { keyValueListControl } from "../../controls/keyValueControl";
import { ParamsJsonControl, ParamsStringControl } from "../../controls/paramsControl";
import { list } from "../../generators/list";
import { valueComp, withDefault } from "../../generators/simpleGenerators";
import { FunctionProperty, toQueryView } from "../queryCompUtils";
import {
  HttpHeaderPropertyView,
  HttpParametersPropertyView,
  HttpPathPropertyView,
} from "./httpQueryConstants";
import { QueryResult } from "../queryComp";
import { QUERY_EXECUTION_ERROR, QUERY_EXECUTION_OK } from "constants/queryConstants";
import { FunctionControl } from "comps/controls/codeControl";

const connect = async (socket: WebSocket, timeout = 10000) => {
  const isOpened = () => (socket.readyState === WebSocket.OPEN)

  if (socket.readyState !== WebSocket.CONNECTING) {
    return isOpened()
  }
  else {
    const intrasleep = 100
    const ttl = timeout / intrasleep // time to loop
    let loop = 0
    while (socket.readyState === WebSocket.CONNECTING && loop < ttl) {
      await new Promise(resolve => setTimeout(resolve, intrasleep))
      loop++
    }
    return isOpened()
  }
}

const childrenMap = {
  path: ParamsStringControl,
  destroySocketConnection: FunctionControl,
};

const StreamTmpQuery = simpleMultiComp(childrenMap);

export class StreamQuery extends StreamTmpQuery {
  private socket: WebSocket | undefined;

  override getView() {
    return async (
      p: {
        args?: Record<string, unknown>,
        callback?: (result: QueryResult) => void
      }
    ): Promise<QueryResult> => {
      const children = this.children;

      try {
        const timer = performance.now();
        this.socket = new WebSocket(children.path.children.text.getView());

        this.socket.onopen = function(e) {
          console.log("[open] Connection established");
        };

        this.socket.onmessage = function(event) {
          console.log(`[message] Data received from server: ${event.data}`);
          if(typeof JSON.parse(event.data) === 'object') {
            const result = {
              data: JSON.parse(event.data),
              code: QUERY_EXECUTION_OK,
              success: true,
              runTime: Number((performance.now() - timer).toFixed()),
            }
            p?.callback?.(result);
          }
        };

        this.socket.onclose = function(event) {
          if (event.wasClean) {
            console.log(`[close] Connection closed cleanly, code=${event.code} reason=${event.reason}`);
          } else {
            console.log('[close] Connection died');
          }
        };

        this.socket.onerror = function(error) {
          throw new Error(error as any)
        };

        const isConnectionOpen = await connect(this.socket);
        if(!isConnectionOpen) {
          return {
            success: false,
            data: "",
            code: QUERY_EXECUTION_ERROR,
            message: "Socket connection failed",
          };
        }

        return {
          data: "",
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
    };
  }

  propertyView(props: { datasourceId: string }) {
    return <PropertyView {...props} comp={this} />;
  }

  destroy() {
    this.socket?.close();
  }
}

const PropertyView = (props: { comp: InstanceType<typeof StreamQuery>; datasourceId: string }) => {
  const { comp } = props;

  return (
    <>
      <HttpPathPropertyView
        {...props}
        comp={comp}
        urlPlaceholder="wss://www.example.com/socketserver"
      />
    </>
  );
};



// import { ParamsStringControl } from "comps/controls/paramsControl";
// import { FunctionControl, StringControl, codeControl } from "comps/controls/codeControl";
// import { MultiCompBuilder } from "comps/generators";
// import { QueryResult } from "../queryComp";
// import { QueryTutorials } from "util/tutorialUtils";
// import { DocLink } from "lowcoder-design";
// import { getGlobalSettings } from "comps/utils/globalSettings";
// import { trans } from "i18n";
// import { QUERY_EXECUTION_ERROR, QUERY_EXECUTION_OK } from "constants/queryConstants";

// const connect = async (socket: WebSocket, timeout = 10000) => {
//   const isOpened = () => (socket.readyState === WebSocket.OPEN)

//   if (socket.readyState !== WebSocket.CONNECTING) {
//     return isOpened()
//   }
//   else {
//     const intrasleep = 100
//     const ttl = timeout / intrasleep // time to loop
//     let loop = 0
//     while (socket.readyState === WebSocket.CONNECTING && loop < ttl) {
//       await new Promise(resolve => setTimeout(resolve, intrasleep))
//       loop++
//     }
//     return isOpened()
//   }
// }

// export const StreamQuery = (function () {
//   const childrenMap = {
//     path: StringControl,
//     destroySocketConnection: FunctionControl,
//   };
//   return new MultiCompBuilder(childrenMap, (props) => {
//     const { orgCommonSettings } = getGlobalSettings();
//     const runInHost = !!orgCommonSettings?.runJavaScriptInHost;

//     console.log(props.path);
//     return async (
//       p: {
//         args?: Record<string, unknown>,
//         callback?: (result: QueryResult) => void
//       }
//     ): Promise<QueryResult> => {
//       console.log('Stream Query', props)

//       try {
//         const timer = performance.now();
//         // const url = 'wss://free.blr2.piesocket.com/v3/1?api_key=yWUvGQggacrrTdXYjvTpRD5qhm4RIsglS7YJlKzp&notify_self=1'
//         const socket = new WebSocket(props.path);

//         props.destroySocketConnection = () => {
//           socket.close();
//         };

//         socket.onopen = function(e) {
//           console.log("[open] Connection established");
//         };

//         socket.onmessage = function(event) {
//           console.log(`[message] Data received from server: ${event.data}`);
//           console.log(JSON.parse(event.data))
//           if(typeof JSON.parse(event.data) === 'object') {
//             const result = {
//               data: JSON.parse(event.data),
//               code: QUERY_EXECUTION_OK,
//               success: true,
//               runTime: Number((performance.now() - timer).toFixed()),
//             }
//             p?.callback?.(result);
//           }
//         };

//         socket.onclose = function(event) {
//           if (event.wasClean) {
//             console.log(`[close] Connection closed cleanly, code=${event.code} reason=${event.reason}`);
//           } else {
//             // e.g. server process killed or network down
//             // event.code is usually 1006 in this case
//             console.log('[close] Connection died');
//           }
//         };

//         socket.onerror = function(error) {
//           throw new Error(error as any)
//         };
//         const isConnectionOpen = await connect(socket);
//         if(!isConnectionOpen) {
//           return {
//             success: false,
//             data: "",
//             code: QUERY_EXECUTION_ERROR,
//             message: "Socket connection failed",
//           };
//         }

//         // const data = await props.script(p.args, runInHost);
//         return {
//           data: "",
//           code: QUERY_EXECUTION_OK,
//           success: true,
//           runTime: Number((performance.now() - timer).toFixed()),
//         };
//       } catch (e) {
//         return {
//           success: false,
//           data: "",
//           code: QUERY_EXECUTION_ERROR,
//           message: (e as any).message || "",
//         };
//       }
//     };
//   })
//     .setPropertyViewFn((children) => {
//       return (
//         <>
//           {
//             children.path.propertyView({
//               label: "URL",
//               placement: "bottom",
//               placeholder:"wss://www.example.com/socketserver",
//             })
//           }

//           {/* TODO: Add docs for Stream Query
//           {QueryTutorials.js && (
//             <DocLink href={QueryTutorials.js}>{trans("query.jsQueryDocLink")}</DocLink>
//           )} */}
//         </>
//       );
//     })
//     .build();
// })();
