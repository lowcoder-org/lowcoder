import esbuild from "esbuild";
import { mkdirSync } from "node:fs";

mkdirSync("build/bridge", { recursive: true });

await Promise.all(
  [
    ["src/bridge/typeform-bridge.ts", "build/bridge/typeform-bridge.js"],
    ["src/bridge/google-forms-bridge.ts", "build/bridge/google-forms-bridge.js"],
    ["src/bridge/website-bridge.ts", "build/bridge/website-bridge.js"],
  ].map(([entryPoint, outfile]) =>
    esbuild.build({
      entryPoints: [entryPoint],
      bundle: true,
      format: "iife",
      platform: "browser",
      target: ["es2020"],
      outfile,
      logLevel: "info",
    })
  )
);
