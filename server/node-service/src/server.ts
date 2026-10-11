import http from "http";
import "./common/logger";
import "express-async-errors";
import express, { Response, Request, NextFunction } from "express";
import { ServiceError } from "./common/error";
import path from "node:path";
import morgan from "morgan";
import { collectDefaultMetrics } from "prom-client";
import apiRouter from "./routes/apiRouter";
import systemRouter from "./routes/systemRouter";
import cors, { CorsOptions } from "cors";
import bodyParser from "body-parser";
collectDefaultMetrics();

const prefix = "/node-service";

const router = express();

router.get("/", (req, res) => {
  res.status(200).json({
    code: 1,
    message: "Lowcoder Node Service is up and running",
    success: true
  });
});

/** Static */
router.use(prefix, express.static(path.join(__dirname, "static")));

/** Logging */
router.use(morgan("dev"));

const MAX_REQUEST_SIZE_BYTES = parseRequestLimitNoLib(
  process.env.LOWCODER_MAX_REQUEST_SIZE,
  "50mb"
);

/** Parse the request */
router.use(express.urlencoded({ extended: false, limit: MAX_REQUEST_SIZE_BYTES }));

/** Custom middleware: use raw body for encrypted requests */
router.use((req, res, next) => {
  if (req.headers["x-encrypted"]) {
    bodyParser.text({ type: "*/*", limit: MAX_REQUEST_SIZE_BYTES })(req, res, next);
  } else {
    bodyParser.json({ limit: MAX_REQUEST_SIZE_BYTES })(req, res, next);
  }
});

/** Takes care of JSON data */
router.use(express.json({ limit: MAX_REQUEST_SIZE_BYTES }));

/** RULES OF OUR API */

const corsOptions: CorsOptions = {
  origin: (origin: string | undefined, callback: any) => {
    callback(null, true);
  },
  credentials: true,
  allowedHeaders: [
    'origin',
    'X-Requested-With',
    'Lowcoder-Ce-Selfhost-Token',
    'Authorization',
    'Accept',
    'Content-Type'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS']
};

router.use(cors(corsOptions));

/** Routes */
router.use(`${prefix}/api`, apiRouter);
router.use(`${prefix}/system`, systemRouter);

// service err
router.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  let message = err.message || "";
  let status = 500;
  console.error(err);
  if (err instanceof ServiceError) {
    status = err.code;
    message = err.message;
  }
  res.status(status).json({
    message,
  });
});

/** Error handling */
router.use((req, res, next) => {
  const error = new Error("not found");
  return res.status(404).json({
    message: error.message,
  });
});

/** Server */
const httpServer = http.createServer(router);
const PORT = process.env.NODE_SERVICE_PORT ?? 6060;
httpServer.listen(PORT, () => logger.info(`The server is running on port: ${PORT}`));

/**
 * Parses request size strings into bytes.
 *
 * Accepts:
 *  - "52428800"                 => bytes
 *  - "50mb", "128kb", "1gb"     => bytes (binary base 1024)
 *  - "50m", "128k", "1g"        => Spring short units (treated as mb/kb/gb)
 *  - "1.5m", "0.25gb"           => decimals supported
 *  - "50 m"                     => whitespace tolerated
 *
 * Units are binary (KiB/MiB/GiB) using 1024 multipliers, which matches Node conventions well.
 * (If you want decimal SI units (1000), adjust multipliers accordingly.)
 */
function parseRequestLimitNoLib(input: unknown, fallback: string = "50mb"): number {
  const raw = input ?? fallback;

  // Direct number => bytes
  if (typeof raw === "number") {
    if (!Number.isFinite(raw) || raw <= 0) throw new Error(`Invalid request size number: ${raw}`);
    return Math.floor(raw);
  }

  const s0 = String(raw).trim();
  if (!s0) return parseRequestLimitNoLib(fallback);

  // Remove whitespace and lowercase
  const s = s0.replace(/\s+/g, "").toLowerCase();

  // Pure integer bytes
  if (/^\d+$/u.test(s)) {
    const n = Number(s);
    if (!Number.isFinite(n) || n <= 0) throw new Error(`Invalid request size: ${s0}`);
    return n;
  }

  // Match: number + unit (unit may be k|kb|m|mb|g|gb|t|tb|p|pb|b)
  const m = s.match(/^(\d+(?:\.\d+)?)(b|kb|k|mb|m|gb|g|tb|t|pb|p)$/u);
  if (!m) {
    throw new Error(
      `Invalid LOWCODER_MAX_REQUEST_SIZE: "${s0}". ` +
      `Use bytes ("52428800"), long units ("50mb"), or Spring units ("50m").`
    );
  }

  const value = Number(m[1]);
  const unit = m[2];

  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`Invalid LOWCODER_MAX_REQUEST_SIZE numeric value: "${m[1]}"`);
  }

  // Binary multipliers (base 1024)
  const KB = 1024;
  const MB = 1024 * KB;
  const GB = 1024 * MB;
  const TB = 1024 * GB;
  const PB = 1024 * TB;

  let bytes: number;

  switch (unit) {
    case "b":
      bytes = value;
      break;

    case "k":
    case "kb":
      bytes = value * KB;
      break;

    case "m":
    case "mb":
      bytes = value * MB;
      break;

    case "g":
    case "gb":
      bytes = value * GB;
      break;

    case "t":
    case "tb":
      bytes = value * TB;
      break;

    case "p":
    case "pb":
      bytes = value * PB;
      break;

    default:
      // Should be unreachable because of regex, but keep safe:
      throw new Error(`Unsupported unit: "${unit}"`);
  }

  // Guard: must fit into a safe integer
  if (!Number.isFinite(bytes) || bytes <= 0 || !Number.isSafeInteger(Math.floor(bytes))) {
    throw new Error(`LOWCODER_MAX_REQUEST_SIZE too large or invalid: "${s0}"`);
  }

  return Math.floor(bytes);
}