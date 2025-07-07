// client/packages/lowcoder/src/comps/comps/chatComp/utils/responseHandlers.ts
import { CompAction, routeByNameAction, executeQueryAction } from "lowcoder-core";
import { getPromiseAfterDispatch } from "util/promiseUtils";

// Query response handler (your current logic)
export const queryResponseHandler = async (
  message: string,
  config: { chatQuery: string; dispatch?: (action: CompAction<any>) => void }
) => {
  const { chatQuery, dispatch } = config;
  
  // If no query selected or dispatch unavailable, fallback with mock response
  if (!chatQuery || !dispatch) {
    await new Promise((res) => setTimeout(res, 500));
    return { content: "(mock) You typed: " + message };
  }

  try {
    const result: any = await getPromiseAfterDispatch(
      dispatch,
      routeByNameAction(
        chatQuery,
        executeQueryAction({
          // Send the user prompt as variable named 'prompt' by default
          args: { prompt: { value: message } },
        })
      )
    );

    // Extract reply text from the query result
    let reply: string;
    if (typeof result === "string") {
      reply = result;
    } else if (result && typeof result === "object") {
      reply =
        (result as any).response ??
        (result as any).message ??
        (result as any).content ??
        JSON.stringify(result);
    } else {
      reply = String(result);
    }

    return { content: reply };
  } catch (e: any) {
    throw new Error(e?.message || "Query execution failed");
  }
};

// Direct API response handler (for bottom panel usage)
export const directApiResponseHandler = async (
  message: string,
  config: { modelHost: string; systemPrompt: string; streaming?: boolean }
) => {
  const { modelHost, systemPrompt, streaming } = config;
  
  if (!modelHost) {
    throw new Error("Model host is required for direct API calls");
  }

  try {
    const response = await fetch(modelHost, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
        systemPrompt: systemPrompt || "You are a helpful assistant.",
        streaming: streaming || false
      })
    });

    if (!response.ok) {
      throw new Error(`API call failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    // Extract content from various possible response formats
    const content = data.response || data.message || data.content || data.text || String(data);
    
    return { content };
  } catch (error) {
    throw new Error(`Direct API call failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// Mock response handler (for testing)
export const mockResponseHandler = async (
  message: string,
  config: { delay?: number; prefix?: string }
) => {
  const { delay = 1000, prefix = "Mock response" } = config;
  
  await new Promise(resolve => setTimeout(resolve, delay));
  
  return { content: `${prefix}: ${message}` };
};