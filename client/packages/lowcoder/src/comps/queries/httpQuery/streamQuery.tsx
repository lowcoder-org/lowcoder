import { simpleMultiComp } from "comps/generators/multi";
import {  ParamsStringControl } from "../../controls/paramsControl";
import {
  HttpPathPropertyView,
} from "./httpQueryConstants";
import { QueryResult } from "../queryComp";
import { QUERY_EXECUTION_ERROR, QUERY_EXECUTION_OK } from "constants/queryConstants";
import { FunctionControl } from "comps/controls/codeControl";
import { JSONValue } from "util/jsonTypes";

const socketConnection = async (socket: WebSocket, timeout = 10000) => {
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

const createSuccessResponse = (
  data: JSONValue,
  runTime?: number,
): QueryResult => {
  return {
    data,
    runTime,
    success: true,
    code: QUERY_EXECUTION_OK,
  }
}

const createErrorResponse = (
  message: string,
): QueryResult => {
  return {
    message,
    data: "",
    success: false,
    code: QUERY_EXECUTION_ERROR,
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
        const socketUrl = children.path.children.text.getView();
        
        this.socket = new WebSocket(socketUrl);
        this.socket.onopen = () => {
          console.log("[WebSocket] Connection established");
        }

        this.socket.onmessage = (event) => {
          console.log(`[WebSocket] Data received from server`);
          if(typeof JSON.parse(event.data) === 'object') {
            const result = createSuccessResponse(JSON.parse(event.data))
            p?.callback?.(result);
          }
        }

        this.socket.onclose = () => {
          console.log(`[WebSocket] Connection closed`);
        }

        this.socket.onerror = function(error) {
          throw new Error(error as any)
        }

        const isConnectionOpen = await socketConnection(this.socket);
        if(!isConnectionOpen) {
          return createErrorResponse("Socket connection failed")
        }

        return createSuccessResponse("", Number((performance.now() - timer).toFixed()))
      } catch (e) {
        return createErrorResponse((e as any).message || "")
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
