/**
 * OpenTelemetry Configuration for Lowcoder Application
 *
 * This file sets up OpenTelemetry auto-instrumentation for traces and metrics.
 *
 * How to use:
 * 1. Save this file as `otel-config.js` in your application's root directory.
 * 2. Ensure you have the necessary OpenTelemetry packages installed:
 * @opentelemetry/sdk-node
 * @opentelemetry/api
 * @opentelemetry/exporter-trace-otlp-http (or -grpc)
 * @opentelemetry/exporter-metrics-otlp-http (or -grpc)
 * @opentelemetry/resources
 * @opentelemetry/semantic-conventions
 * @opentelemetry/auto-instrumentations-node (CRITICAL for auto-instrumentation)
 *
 * Install @opentelemetry/auto-instrumentations-node if you haven't:
 * `npm install @opentelemetry/auto-instrumentations-node`
 * or
 * `yarn add @opentelemetry/auto-instrumentations-node`
 *
 * 3. Start your application using the `-r` flag to preload this configuration:
 * `export NODE_OPTIONS="-r ./otel-config.js"`
 *
 * Environment Variables for Configuration:
 * - OTEL_EXPORTER_OTLP_ENDPOINT: Base URL for OTLP HTTP exporters (e.g., http://localhost:4318).
 * If not set, defaults to http://localhost:4318.
 * - OTEL_EXPORTER_OTLP_TRACES_ENDPOINT: Specific URL for OTLP HTTP traces exporter (e.g., http://localhost:4318/v1/traces).
 * - OTEL_EXPORTER_OTLP_METRICS_ENDPOINT: Specific URL for OTLP HTTP metrics exporter (e.g., http://localhost:4318/v1/metrics).
 * - OTEL_SERVICE_NAME: Name of your service (e.g., 'node-service'). Defaults to 'unknown_service:nodejs'.
 * - OTEL_LOG_LEVEL: Set OpenTelemetry diagnostic logging level (e.g., 'debug', 'info', 'warn', 'error').
 * - OTEL_EXPORTER_PROTOCOL: 'http/protobuf' (default) or 'grpc'.
 */

const process = require('process');
const { NodeSDK } = require('@opentelemetry/sdk-node');
const { OTLPTraceExporter: OTLPTraceExporterHttp } = require('@opentelemetry/exporter-trace-otlp-http');
const { OTLPTraceExporter: OTLPTraceExporterGrpc } = require('@opentelemetry/exporter-trace-otlp-grpc');
const { OTLPMetricExporter: OTLPMetricExporterHttp } = require('@opentelemetry/exporter-metrics-otlp-http');
const { OTLPMetricExporter: OTLPMetricExporterGrpc } = require('@opentelemetry/exporter-metrics-otlp-grpc');
const { BatchSpanProcessor } = require('@opentelemetry/sdk-trace-node'); // Using BatchSpanProcessor for better performance
const { PeriodicExportingMetricReader } = require('@opentelemetry/sdk-metrics');
const { Resource } = require('@opentelemetry/resources');
const { SemanticResourceAttributes } = require('@opentelemetry/semantic-conventions');
const { getNodeAutoInstrumentations } = require('@opentelemetry/auto-instrumentations-node');
const { DiagConsoleLogger, DiagLogLevel, diag } = require('@opentelemetry/api');

// --- Configuration ---
const SERVICE_NAME = process.env.OTEL_SERVICE_NAME || 'lowcoder-node-service';
const OTLP_EXPORTER_PROTOCOL = process.env.OTEL_EXPORTER_PROTOCOL || 'http/protobuf'; // 'http/protobuf' or 'grpc'

const DEFAULT_OTLP_HTTP_ENDPOINT = 'http://localhost:4318';
const DEFAULT_OTLP_GRPC_ENDPOINT = 'http://localhost:4317';

const OTLP_ENDPOINT = process.env.OTEL_EXPORTER_OTLP_ENDPOINT ||
    (OTLP_EXPORTER_PROTOCOL === 'grpc' ? DEFAULT_OTLP_GRPC_ENDPOINT : DEFAULT_OTLP_HTTP_ENDPOINT);

const TRACES_ENDPOINT = process.env.OTEL_EXPORTER_OTLP_TRACES_ENDPOINT ||
    (OTLP_EXPORTER_PROTOCOL === 'grpc' ? OTLP_ENDPOINT : `${OTLP_ENDPOINT}/v1/traces`);
const METRICS_ENDPOINT = process.env.OTEL_EXPORTER_OTLP_METRICS_ENDPOINT ||
    (OTLP_EXPORTER_PROTOCOL === 'grpc' ? OTLP_ENDPOINT : `${OTLP_ENDPOINT}/v1/metrics`);

// Optional: Set OpenTelemetry diagnostic logging level
const otelLogLevel = process.env.OTEL_LOG_LEVEL?.toUpperCase();
if (otelLogLevel && DiagLogLevel[otelLogLevel]) {
    diag.setLogger(new DiagConsoleLogger(), DiagLogLevel[otelLogLevel]);
} else {
    diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.INFO); // Default to INFO
}

diag.info(`OpenTelemetry SDK configured for service: ${SERVICE_NAME}`);
diag.info(`Using OTLP protocol: ${OTLP_EXPORTER_PROTOCOL}`);
diag.info(`Traces Exporter Endpoint: ${TRACES_ENDPOINT}`);
diag.info(`Metrics Exporter Endpoint: ${METRICS_ENDPOINT}`);

// --- Resource Definition ---
const resource = Resource.default().merge(
    new Resource({
        [SemanticResourceAttributes.SERVICE_NAME]: SERVICE_NAME,
        // [SemanticResourceAttributes.SERVICE_VERSION]: '1.0.0', // Optional
    })
);

// --- Exporter Configuration ---
let traceExporter;
let metricExporter;

if (OTLP_EXPORTER_PROTOCOL === 'grpc') {
    diag.info('Using gRPC Exporters');
    traceExporter = new OTLPTraceExporterGrpc({ url: TRACES_ENDPOINT });
    metricExporter = new OTLPMetricExporterGrpc({ url: METRICS_ENDPOINT });
} else {
    diag.info('Using HTTP/protobuf Exporters');
    traceExporter = new OTLPTraceExporterHttp({ url: TRACES_ENDPOINT });
    metricExporter = new OTLPMetricExporterHttp({ url: METRICS_ENDPOINT });
}

// --- SDK Initialization ---
const sdk = new NodeSDK({
    resource: resource,
    traceExporter: traceExporter,
    spanProcessor: new BatchSpanProcessor(traceExporter), // Recommended for most cases
    metricReader: new PeriodicExportingMetricReader({
        exporter: metricExporter,
        exportIntervalMillis: 10000, // Export metrics every 10 seconds
    }),
    instrumentations: [
        getNodeAutoInstrumentations({
            // Configuration for specific instrumentations can be added here if needed
            // Example:
            // '@opentelemetry/instrumentation-http': {
            //   applyCustomAttributesOnSpan: (span, request, response) => {
            //     span.setAttribute('custom.attribute', 'value');
            //   },
            // },
        }),
    ],
});

// --- Start SDK and Graceful Shutdown ---
try {
    sdk.start();
    diag.info('OpenTelemetry SDK started successfully for traces and metrics.');
} catch (error) {
    diag.error('Error starting OpenTelemetry SDK:', error);
    process.exit(1);
}

// Graceful shutdown
const shutdown = () => {
    diag.info('Shutting down OpenTelemetry SDK...');
    sdk.shutdown()
        .then(() => diag.info('OpenTelemetry SDK shut down successfully.'))
        .catch(error => diag.error('Error shutting down OpenTelemetry SDK:', error))
        .finally(() => process.exit(0));
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);