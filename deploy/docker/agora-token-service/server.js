const http = require("http");
const { RtcRole, RtcTokenBuilder, RtmTokenBuilder } = require("agora-token");

const PORT = Number(process.env.SERVER_PORT || process.env.PORT || 8080);
const APP_ID = process.env.APP_ID || "";
const APP_CERTIFICATE = process.env.APP_CERTIFICATE || "";
const CORS_ALLOW_ORIGIN = process.env.CORS_ALLOW_ORIGIN || "*";

function json(res, status, body) {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": CORS_ALLOW_ORIGIN,
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Origin, Content-Type",
    "Cache-Control": "private, no-cache, no-store, must-revalidate",
  });
  res.end(payload);
}

function buildTokens(channelName, roleName, tokenType, uid, expire) {
  if (!APP_ID || !APP_CERTIFICATE) {
    throw new Error("APP_ID and APP_CERTIFICATE must be set");
  }

  const role =
    String(roleName).toLowerCase() === "publisher"
      ? RtcRole.PUBLISHER
      : RtcRole.SUBSCRIBER;

  let rtcToken;
  if (tokenType === "uid") {
    rtcToken = RtcTokenBuilder.buildTokenWithUid(
      APP_ID,
      APP_CERTIFICATE,
      channelName,
      Number(uid) || 0,
      role,
      expire
    );
  } else {
    rtcToken = RtcTokenBuilder.buildTokenWithUserAccount(
      APP_ID,
      APP_CERTIFICATE,
      channelName,
      String(uid),
      role,
      expire
    );
  }

  const rtmToken = RtmTokenBuilder.buildToken(
    APP_ID,
    APP_CERTIFICATE,
    String(uid),
    expire
  );

  return { rtcToken, rtmToken };
}

const server = http.createServer((req, res) => {
  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": CORS_ALLOW_ORIGIN,
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Origin, Content-Type",
    });
    res.end();
    return;
  }

  const url = new URL(req.url, `http://${req.headers.host}`);
  const parts = url.pathname.split("/").filter(Boolean);

  if (req.method === "GET" && (url.pathname === "/ping" || url.pathname === "/")) {
    json(res, 200, { message: "pong" });
    return;
  }

  if (req.method === "GET" && parts[0] === "rte" && parts.length >= 4) {
    try {
      const [, channelName, role, tokenType, uid] = parts;
      const expire = Number(url.searchParams.get("expiry") || 3600);
      const tokens = buildTokens(channelName, role, tokenType, uid, expire);
      json(res, 200, tokens);
    } catch (error) {
      json(res, 400, {
        status: 400,
        message: error instanceof Error ? error.message : "Token generation failed",
      });
    }
    return;
  }

  json(res, 404, { message: "not found" });
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Agora token service listening on ${PORT}`);
});
