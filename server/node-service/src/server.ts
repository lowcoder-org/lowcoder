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

/** Parse the request */
router.use(express.urlencoded({ extended: false }));

/** Custom middleware: use raw body for encrypted requests */
router.use((req, res, next) => {
  if (req.headers["x-encrypted"]) {
    bodyParser.text({ type: "*/*" })(req, res, next);
  } else {
    bodyParser.json()(req, res, next);
  }
});

/** Takes care of JSON data */
router.use(
  express.json({
    limit: 1024 * 1024 * 50, // 50 MB
  })
);

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
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']
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
