// client/packages/lowcoder/src/comps/comps/chatComp/handlers/messageHandlers.ts

import { MessageHandler, MessageResponse, N8NHandlerConfig, QueryHandlerConfig } from "../types/chatTypes";
import { CompAction, routeByNameAction, executeQueryAction } from "lowcoder-core";
import { getPromiseAfterDispatch } from "util/promiseUtils";

// ============================================================================
// N8N HANDLER (for Bottom Panel)
// ============================================================================

export class N8NHandler implements MessageHandler {
  constructor(private config: N8NHandlerConfig) {}

  async sendMessage(message: string): Promise<MessageResponse> {
    const { modelHost, systemPrompt, streaming } = this.config;
    
    if (!modelHost) {
      throw new Error("Model host is required for N8N calls");
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
        throw new Error(`N8N call failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      // Extract content from various possible response formats
      const content = data.response || data.message || data.content || data.text || String(data);
      
      return { content };
    } catch (error) {
      throw new Error(`N8N call failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

// ============================================================================
// QUERY HANDLER (for Canvas Components)
// ============================================================================

export class QueryHandler implements MessageHandler {
  constructor(private config: QueryHandlerConfig) {}

  async sendMessage(message: string): Promise<MessageResponse> {
    const { chatQuery, dispatch } = this.config;
    
    // If no query selected or dispatch unavailable, return mock response
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

      // Extract reply text from the query result (same logic as your current implementation)
      let content: string;
      if (typeof result === "string") {
        content = result;
      } else if (result && typeof result === "object") {
        content =
          (result as any).response ??
          (result as any).message ??
          (result as any).content ??
          JSON.stringify(result);
      } else {
        content = String(result);
      }

      return { content };
    } catch (e: any) {
      throw new Error(e?.message || "Query execution failed");
    }
  }
}

// ============================================================================
// MOCK HANDLER (for testing/fallbacks)
// ============================================================================

export class MockHandler implements MessageHandler {
  constructor(private delay: number = 1000) {}

  async sendMessage(message: string): Promise<MessageResponse> {
    await new Promise(resolve => setTimeout(resolve, this.delay));
    return { content: `Mock response: ${message}` };
  }
}

// ============================================================================
// HANDLER FACTORY (creates the right handler based on type)
// ============================================================================

export function createMessageHandler(
  type: "n8n" | "query" | "mock",
  config: N8NHandlerConfig | QueryHandlerConfig
): MessageHandler {
  switch (type) {
    case "n8n":
      return new N8NHandler(config as N8NHandlerConfig);
    
    case "query":
      return new QueryHandler(config as QueryHandlerConfig);
    
    case "mock":
      return new MockHandler();
    
    default:
      throw new Error(`Unknown message handler type: ${type}`);
  }
}