# OpenTelemetry Integration for Lowcoder

This document provides comprehensive instructions for enabling, configuring, and verifying OpenTelemetry tracing and metrics for the Lowcoder application, which includes both Java backend services and Node.js components. OpenTelemetry enables unified observability, distributed tracing, and metrics collection across your stack, supporting integration with Tempo, Prometheus, Grafana, and other observability backends.

---

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Configuration](#configuration)
  - [Common Environment Variables](#common-environment-variables)
  - [Java API Service](#java-api-service)
  - [Node.js Service](#nodejs-service)
- [Monitoring and Visualization](#monitoring-and-visualization)
  - [Distributed Tracing (Tempo + Grafana)](#distributed-tracing-tempo--grafana)
  - [Grafana](#grafana-dashboards)
  - [Prometheus](#prometheus-metrics-collection)
- [Advanced Configuration](#advanced-configuration)
- [Troubleshooting](#troubleshooting)
- [Production Considerations](#production-considerations)
- [Support](#support)
- [Contributing](#contributing)

---

## Overview

Lowcoder leverages OpenTelemetry auto-instrumentation for both Java and Node.js services, providing:

- **Distributed Tracing:** End-to-end visibility of requests across services.
- **Metrics Collection:** Performance and health metrics for all components.
- **Flexible Export:** Support for Tempo, Prometheus, Grafana, Datadog, New Relic, and more.

---

## Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Lowcoder      │    │  OpenTelemetry   │    │  Observability  │
│   Application   │───▶│    Collector     │──▶│    Backends     │
│ (Java + Node.js)│    │                  │    │ (Jaeger/Grafana)│
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

---

## Prerequisites

- **Docker** and **Docker Compose**
- At least **4GB RAM** for the full observability stack
- An OpenTelemetry Collector instance (included in docker-compose)
- Access to Jaeger, Prometheus, and Grafana (included in docker-compose)

---

## Quick Start

### 1. Clone and Build

```bash
git clone https://github.com/lowcoder-org/lowcoder.git
cd lowcoder/deploy/docker
docker-compose -f ./docker-compose-multi-otel.yaml up -d
```

### 2. Access Services

- **Lowcoder Application:** http://localhost:8080
- **Jaeger UI (Traces):** http://localhost:16686
- **Grafana (Dashboards):** http://localhost:3000 (admin/admin)
- **Prometheus (Metrics):** http://localhost:9090

### 3. Generate Traffic

Use the Lowcoder app to generate telemetry data, then view traces and metrics in Jaeger, Grafana, and Prometheus.

---

## Configuration

### Common Environment Variables

| Variable                       | Description                        | Default/Example                        |
|---------------------------------|------------------------------------|----------------------------------------|
| `OTEL_SDK_DISABLED`             | Disable all telemetry              | `false`                                |
| `OTEL_SERVICE_NAME`             | Java service name                  | `lowcoder-java-backend`                |
| `OTEL_NODE_SERVICE_NAME`        | Node.js service name               | `lowcoder-node-service`                |
| `OTEL_EXPORTER_OTLP_ENDPOINT`   | Collector endpoint                 | `http://otel-collector:4317`           |
| `OTEL_RESOURCE_ATTRIBUTES`      | Additional resource attributes     | `deployment.environment=production`    |
| `OTEL_TRACES_EXPORTER`          | Trace exporter                     | `otlp`, `jaeger`, `none`               |
| `OTEL_METRICS_EXPORTER`         | Metrics exporter                   | `otlp`, `prometheus`, `none`           |
| `OTEL_LOGS_EXPORTER`            | Logs exporter                      | `otlp`, `none`                         |
| `OTEL_TRACES_SAMPLER`           | Sampling strategy                  | `traceidratio`                         |
| `OTEL_TRACES_SAMPLER_ARG`       | Sampling parameter                 | `0.1` (10%)                            |

#### Example (docker-compose.yml):

```yaml
environment:
  - OTEL_EXPORTER_OTLP_ENDPOINT=http://otel-collector:4317
  - OTEL_SERVICE_NAME=lowcoder-java-backend
  - OTEL_NODE_SERVICE_NAME=lowcoder-node-service
  - OTEL_RESOURCE_ATTRIBUTES=deployment.environment=production
  - OTEL_TRACES_SAMPLER=traceidratio
  - OTEL_TRACES_SAMPLER_ARG=0.1
```

---

### Java API Service

- Uses OpenTelemetry SDK with auto-instrumentation.
- Service name and resource attributes are set via environment variables or configuration.
- Traces and metrics are exported to the OpenTelemetry Collector.

**Custom Spans Example:**
```java
import io.opentelemetry.api.GlobalOpenTelemetry;
import io.opentelemetry.api.trace.Tracer;

Tracer tracer = GlobalOpenTelemetry.getTracer("my-service");
Span span = tracer.spanBuilder("custom-operation").startSpan();
try {
    // Your business logic here
} finally {
    span.end();
}
```

---

### Node.js Service

- Uses `@opentelemetry/sdk-node` and `@opentelemetry/auto-instrumentations-node`.
- Configuration is handled in `otel.config.js` and via environment variables.
- Traces and metrics are exported to the OpenTelemetry Collector.

**Custom Spans Example:**
```javascript
const { trace } = require('@opentelemetry/api');

const tracer = trace.getTracer('my-service');
const span = tracer.startSpan('custom-operation');
try {
    // Your business logic here
} finally {
    span.end();
}
```

---

## Monitoring and Visualization

### Distributed Tracing (Tempo + Grafana)

- **Trace Storage:** [Grafana Tempo](https://grafana.com/oss/tempo/) is used as the distributed tracing backend.
- **Visualization:** Traces are visualized and explored via [Grafana](https://grafana.com/).
- **URL:** http://localhost:3001 (Grafana, default login: admin/admin)
- **Features:**
  - View end-to-end traces and span timelines
  - Analyze service dependencies and request flows
  - Debug errors and identify bottlenecks
  - Correlate traces with metrics and logs

### Grafana (Dashboards)

- **URL:** http://localhost:3001 (admin/admin)
- Visualize metrics, create dashboards, set up alerts, and monitor application health.
- Add Prometheus as a data source (`http://prometheus:9090`).
- Explore traces via the Tempo data source.

### Prometheus (Metrics Collection)

- **URL:** http://localhost:9090
- Query raw metrics, set up recording and alerting rules, and monitor collector health.

---

## Advanced Configuration

### Customizing Service Names and Attributes

```yaml
environment:
  - OTEL_SERVICE_NAME=lowcoder-api-service
```

### Adjusting Sampling

```yaml
environment:
  - OTEL_TRACES_SAMPLER=traceidratio
  - OTEL_TRACES_SAMPLER_ARG=0.05  # 5% sampling
```

### Custom Collector Configuration

Edit `otel-collector-config.yaml` to:

- Add receivers (e.g., filelog)
- Configure exporters (e.g., Jaeger, Datadog, New Relic)
- Add processors and filtering rules

**Example for log collection:**
```yaml
receivers:
  filelog:
    include: [/var/log/lowcoder/*.log]
    operators:
      - type: json_parser

service:
  pipelines:
    logs:
      receivers: [filelog, otlp]
      processors: [batch]
      exporters: [logging]
```

### External Backend Integration

**Datadog Example:**
```yaml
exporters:
  datadog:
    api:
      key: "${DD_API_KEY}"
      site: datadoghq.com
```

**New Relic Example:**
```yaml
exporters:
  otlp:
    endpoint: https://otlp.nr-data.net:4317
    headers:
      api-key: "${NEW_RELIC_LICENSE_KEY}"
```

---

## Troubleshooting

### Common Issues

#### No Traces Appearing

- Ensure the OpenTelemetry Collector is running (`docker-compose ps`)
- Verify the collector endpoint (`curl http://localhost:4317`)
- Check application logs for OTEL errors
- Ensure `OTEL_SDK_DISABLED` is not set to `true`

#### High Memory Usage

- Reduce sampling rate (`OTEL_TRACES_SAMPLER_ARG=0.01`)
- Adjust collector memory limits
- Configure batch processing in the collector

#### Missing Node.js Traces

- Check Node.js service logs
- Verify `NODE_OPTIONS` is set correctly
- Ensure OpenTelemetry Node.js packages are installed

### Debugging Commands

```bash
docker-compose ps
docker-compose logs lowcoder
docker-compose logs otel-collector
curl -v http://localhost:4318/v1/traces
curl http://localhost:16686/api/services
```

### Log Analysis

Enable debug logging:

```yaml
environment:
  - OTEL_LOG_LEVEL=debug
  - OTEL_JAVAAGENT_DEBUG=true
```

---

## Production Considerations

### Security

- Use TLS for collector communication
- Store API keys and credentials securely
- Restrict collector network access
- Sanitize sensitive data in telemetry

### Performance

- Use appropriate sampling rates
- Set resource limits for all services
- Configure efficient batch sizes in the collector
- Plan for trace and metrics retention

### Scaling

- Deploy multiple collector instances for high throughput
- Ensure observability backends can handle data volume
- Use load balancers for collector endpoints
- Consider sharding for large deployments

### Example Production Configuration

```yaml
# docker-compose.prod.yml
version: '3'
services:
  lowcoder-api-service:
    environment:
      - OTEL_TRACES_SAMPLER=traceidratio
      - OTEL_TRACES_SAMPLER_ARG=0.01  # 1% sampling
      - OTEL_EXPORTER_OTLP_ENDPOINT=https://your-collector.company.com:4317
      - OTEL_SERVICE_VERSION="2.6.5"
      - OTEL_RESOURCE_ATTRIBUTES=deployment.environment=production
```

### Monitoring the Monitoring

Set up alerts for:

- Collector health and availability
- High error rates in telemetry processing
- Backend storage capacity
- Unusual trace volume patterns

**Example Prometheus Alert:**
```yaml
groups:
  - name: otel-collector
    rules:
      - alert: CollectorDown
        expr: up{job="opentelemetry-collector"} == 0
        for: 5m
        annotations:
          summary: "OpenTelemetry Collector is down"
```

---

## Support

- Review the [troubleshooting section](#troubleshooting)
- Consult OpenTelemetry documentation
- Submit issues to the project repository
- Join the OpenTelemetry community discussions

---

## Contributing

- Test changes locally with the full stack
- Document any new environment variables
- Update this README with configuration changes
- Ensure backward compatibility where possible

---
