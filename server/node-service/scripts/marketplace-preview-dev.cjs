// Internal renderer for frontend/API development; no browser-facing capture endpoint.
const express = require("express");
const { createMarketplaceRenderHandler } = require("../src/services/marketplacePreview");
const app = express();
app.use(express.json({ limit: "12mb" }));
app.post("/node-service/api/marketplace/render", createMarketplaceRenderHandler());
app.listen(Number(process.env.LOWCODER_PREVIEW_PORT || 6061), "127.0.0.1", () =>
  console.log("Internal marketplace renderer ready"),
);
