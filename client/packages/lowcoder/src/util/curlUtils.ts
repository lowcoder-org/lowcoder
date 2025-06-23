/**
 * Utility to convert parsed cURL data from @bany/curl-to-json library
 * to the format expected by REST API query components
 */

// Body type mapping to match the dropdown values in httpQuery.tsx
const CONTENT_TYPE_TO_BODY_TYPE: Record<string, string> = {
  "application/json": "application/json",
  "text/plain": "text/plain", 
  "text/html": "text/plain",
  "text/xml": "text/plain",
  "application/xml": "text/plain",
  "application/x-www-form-urlencoded": "application/x-www-form-urlencoded",
  "multipart/form-data": "multipart/form-data",
};

/**
 * Parse URL-encoded form data - handles both string and object input
 */
function parseUrlEncodedData(data: string | object): Array<{ key: string; value: string; type: string }> {
  if (!data) {
    return [{ key: "", value: "", type: "text" }];
  }

  try {
    let result: Array<{ key: string; value: string; type: string }> = [];

    if (typeof data === 'object') {
      // @bany/curl-to-json already parsed it into an object
      Object.entries(data).forEach(([key, value]) => {
        result.push({
          key: key,
          value: decodeURIComponent(String(value).replace(/\+/g, ' ')), // Handle URL encoding
          type: "text"
        });
      });
    } else if (typeof data === 'string') {
      // Raw URL-encoded string - use URLSearchParams
      const params = new URLSearchParams(data);
      params.forEach((value, key) => {
        result.push({
          key: key,
          value: value,
          type: "text"
        });
      });
    }

    return result.length > 0 ? result : [{ key: "", value: "", type: "text" }];
  } catch (error) {
    console.warn('Failed to parse URL-encoded data:', error);
    return [{ key: "", value: "", type: "text" }];
  }
}

export function processCurlData(curlData: any) {
  if (!curlData) return null;

  console.log("Raw cURL data:", curlData); // Debug log

  // Convert headers object to key-value array format expected by UI
  const headers = curlData.header 
    ? Object.entries(curlData.header).map(([key, value]) => ({ key, value }))
    : [{ key: "", value: "" }];

  // Convert query params object to key-value array format expected by UI
  const params = curlData.params
    ? Object.entries(curlData.params).map(([key, value]) => ({ key, value }))
    : [{ key: "", value: "" }];

  // Get request body - @bany/curl-to-json may use 'body' or 'data'
  const bodyContent = curlData.body !== undefined ? curlData.body : curlData.data;

  // Determine body type based on Content-Type header or content structure
  let bodyType = "none";
  let bodyFormData = [{ key: "", value: "", type: "text" }];
  let processedBody = "";

  if (bodyContent !== undefined && bodyContent !== "") {
    const contentTypeHeader = curlData.header?.["Content-Type"] || curlData.header?.["content-type"];
    
    if (contentTypeHeader) {
      // Extract base content type (remove charset, boundary, etc.)
      const baseContentType = contentTypeHeader.split(';')[0].trim().toLowerCase();
      bodyType = CONTENT_TYPE_TO_BODY_TYPE[baseContentType] || "text/plain";
    } else {
      // Fallback: infer from content structure
      if (typeof bodyContent === "object") {
        bodyType = "application/json";
      } else {
        bodyType = "text/plain";
      }
    }

    // Handle different body types
    if (bodyType === "application/x-www-form-urlencoded") {
      bodyFormData = parseUrlEncodedData(bodyContent);
      processedBody = ""; // Form data goes in bodyFormData, not body
      console.log("Parsed form data:", bodyFormData); // Debug log
    } else if (typeof bodyContent === "object") {
      processedBody = JSON.stringify(bodyContent, null, 2);
    } else {
      processedBody = bodyContent;
    }
  }

  return {
    method: curlData.method || "GET",
    url: curlData.url || "",
    headers,
    params,
    bodyType,
    body: processedBody,
    bodyFormData,
  };
} 