import { simpleMultiComp } from "comps/generators/multi";
import {  ParamsStringControl } from "comps/controls/paramsControl";
import {
  HttpPathPropertyView,
} from "./httpQueryConstants";
import { QueryResult } from "../queryComp";
import { QUERY_EXECUTION_ERROR, QUERY_EXECUTION_OK } from "constants/queryConstants";
import { FunctionControl } from "comps/controls/codeControl";
import { JSONValue } from "util/jsonTypes";
import { withMethodExposing } from "comps/generators/withMethodExposing";
import { stateComp } from "comps/generators";
import { multiChangeAction } from "lowcoder-core";

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
  isSocketConnected: stateComp<boolean>(false),
};

let StreamTmpQuery = simpleMultiComp(childrenMap);

StreamTmpQuery = withMethodExposing(StreamTmpQuery, [
  {
    method: {
      name: "broadcast",
      params: [{ name: "data", type: "JSON" }],
    },
    execute: (comp, params) => {
      return new Promise((resolve, reject) => {
        const tmpComp = (comp as StreamQuery);
        if(!tmpComp.getSocket()) {
          return reject('Socket message send failed')
        }
        tmpComp.broadcast(params[0]);
        resolve({});
      })
    },
  },
])

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

        this.socket.onerror = (error) => {
          this.destroy()
          throw new Error(error as any)
        }

        const isConnectionOpen = await socketConnection(this.socket);
        
        if(!isConnectionOpen) {
          this.destroy();
          return createErrorResponse("Socket connection failed")
        }

        this.dispatch(
          multiChangeAction({
            isSocketConnected: this.children.isSocketConnected.changeValueAction(true),
          })
        );
        return createSuccessResponse(
          "Socket connection successfull",
          Number((performance.now() - timer).toFixed())
        )
      } catch (e) {
        this.destroy();
        return createErrorResponse((e as any).message || "")
      }
    };
  }

  propertyView(props: { datasourceId: string }) {
    return <PropertyView {...props} comp={this} />;
  }

  destroy() {
    this.socket?.close();
    this.dispatch(
      multiChangeAction({
        isSocketConnected: this.children.isSocketConnected.changeValueAction(false),
      })
    );
  }

  broadcast(data: any) {
    this.socket?.send(JSON.stringify(data));
  }

  getSocket() {
    return this.socket;
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
