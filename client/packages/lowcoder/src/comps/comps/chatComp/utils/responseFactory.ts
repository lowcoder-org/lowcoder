// client/packages/lowcoder/src/comps/comps/chatComp/utils/responseFactory.ts
import { 
    queryResponseHandler, 
    directApiResponseHandler, 
    mockResponseHandler 
  } from './responseHandlers';
  
  export const createResponseHandler = (type: string, config: any) => {
    const sendMessage = async (message: string) => {
      switch (type) {
        case "query":
          return await queryResponseHandler(message, config);
        
        case "direct-api":
        case "n8n":
          return await directApiResponseHandler(message, config);
        
        case "mock":
          return await mockResponseHandler(message, config);
        
        default:
          throw new Error(`Unknown response type: ${type}`);
      }
    };
    
    return { sendMessage };
  };