# Lowcoder

Lowcoder is a developer-friendly open-source low code platform to build internal apps within minutes.

[Overview of Lowcoder](https://docs.lowcoder.org/)

## Introduction

This chart bootstraps an Lowcoder deployment on a [Kubernetes](https://kubernetes.io) cluster using the [Helm](https://helm.sh) package manager.

## Prerequisites

- Kubernetes 1.19+
- Helm 3.2.0+
- PV provisioner support in the underlying infrastructure
- Bitnami helm chart repository (if mongodb and/or redis is installed)

## Installing the Chart

To install the chart with the release name `my-lowcoder` into namespace `lowcoder`:

```bash
# If installing mongodb and/or redis, add bitnami chart repository and update chart dependenices
$ helm repo add bitnami https://charts.bitnami.com/bitnami
$ helm dependency update

# Install the chart
$ helm install -n lowcoder my-lowcoder .
```

## Uninstalling the Chart

To uninstall/delete the `my-lowcoder` deployment from namespace `lowcoder`:

```bash
$ helm delete -n lowcoder my-lowcoder
```

## Parameters

### Redis

| Name                                 | Description                                                                 | Value            |
| ------------------------------------ | --------------------------------------------------------------------------- | ---------------- |
| `redis.enabled`                      | Install our own instance of redis                                           | `true`           |
| `redis.externalUrl`                  | External Redis URL used when `redis.enabled` is `false`                     | `""`             |

All available parameters can be found in [Bitnami Redis Chart](https://github.com/bitnami/charts/tree/main/bitnami/redis/#parameters)

### MongoDB

| Name                                 | Description                                                                 | Value            |
| ------------------------------------ | --------------------------------------------------------------------------- | ---------------- |
| `mongodb.enabled`                    | Install our own instance of mongo database                                  | `true`           |
| `mongodb.externalUrl`                | External mongo database connection string when `mongodb.enabled` is `false` | `""`             |

All available parameters can be found in [Bitnami MongoDB Chart](https://github.com/bitnami/charts/tree/main/bitnami/mongodb/#parameters)

### Lowcoder server api-service

| Name                                    | Description                                                                 | Value            |
| --------------------------------------- | --------------------------------------------------------------------------- | ---------------- |
| `apiService.config.userId`              | User ID of user running Lowcoder server application in container          | `9001`           |
| `apiService.config.groupId`             | Group ID of user running Lowcoder server application in container         | `9001`           |
| `apiService.config.corsAllowedDomains`  | CORS allowed domains                                                        | `*`              |
| `apiService.config.encryption.password` | Encryption password                                                         | `lowcoder.org` |
| `apiService.config.encryption.salt`     | Encryption salt                                                             | `lowcoder.org` |
| `apiService.config.enableUserSignUp`    | Enable users signing up to lowcoder via login page                        | `true`           |
| `apiService.config.nodeServiceUrl`      | URL to node-service server if using external Lowcoder server              |                  |

### Lowcoder server node-service

| Name                                    | Description                                                                 | Value            |
| --------------------------------------- | --------------------------------------------------------------------------- | ---------------- |
| `nodeService.config.userId`             | User ID of user running Lowcoder service application in container         | `9001`           |
| `nodeService.config.groupId`            | Group ID of user running Lowcoder service application in container        | `9001`           |
| `nodeService.config.apiServiceUrl`      | URL to api-service server if using external Lowcoder server               |                  |

### Lowcoder frontend (client)

| Name                                    | Description                                                                 | Value            |
| --------------------------------------- | --------------------------------------------------------------------------- | ---------------- |
| `frontend.config.userId`                | User ID of nginx user running Lowcoder client application in container    | `9001`           |
| `frontend.config.groupId`               | Group ID of nginx user running Lowcoder client application in container   | `9001`           |
| `frontend.config.apiServiceUrl`         | URL to api-service server if using external Lowcoder server               | `""`             |
| `frontend.config.nodeServiceUrl`        | URL to node-service server if using external Lowcoder server              |                  |

