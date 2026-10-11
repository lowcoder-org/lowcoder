// jsdom does not implement the WHATWG Streams API, but some dependencies
// (e.g. assistant-stream via @assistant-ui/react) touch it at module load time.
const streams = require("node:stream/web");

for (const name of ["ReadableStream", "WritableStream", "TransformStream"]) {
  if (typeof globalThis[name] === "undefined") {
    globalThis[name] = streams[name];
  }
}

if (typeof window !== "undefined") {
  require("whatwg-fetch");
}
