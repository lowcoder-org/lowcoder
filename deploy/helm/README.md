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

## Global

| Name                                    | Description                                                                       | Value          |
| --------------------------------------- | --------------------------------------------------------------------------------- | -------------- |
| `global.config.workspaceMode`           | Sets the workspace mode. Possible types are: SAAS, ENTERPRISE                     | `SAAS`         |
| `global.config.userId`                  | User ID of user running Lowcoder server application in container                  | `9001`         |
| `global.config.groupId`                 | Group ID of user running Lowcoder server application in container                 | `9001`         |
| `global.config.corsAllowedDomains`      | CORS allowed domains                                                              | `*`            |
| `global.config.enableUserSignUp`        | Enable users signing up to lowcoder via login page                                | `true`         |
| `global.config.encryption.password`     | Encryption password  - CHANGE IT!                                                 | `lowcoder.org` |
| `global.config.encryption.salt`         | Encryption salt      - CHANGE IT!                                                 | `lowcoder.org` |
| `global.config.apiKeySecret`            | API-KEY secret, should be a string of at least 32 random characters - CHANGE IT   | `5a41b090758b39b226603177ef48d73ae9839dd458ccb7e66f7e7cc028d5a50b` |
| `global.config.maxQueryTimeout`         | Maximum query timeout in seconds                                                  | `120`          |
| `global.config.maxRequestSize`          | Maximum request size                                                              | `20m`          |
| `global.config.nodeServiceUrl`          | URL to node-service server if using external one (disabled by default)            |                |
| `global.config.apiServiceUrl`           | URL to api-service server if using external one (disabled by default)             |                |
| `global.defaults.maxOrgsPerUser`        | Maximum allowed organizations per user                                            | `100`          |
| `global.defaults.maxMembersPerOrg`      | Maximum allowed members per organization                                          | `1000`         |
| `global.defaults.maxGroupsPerOrg`       | Maximum groups allowed per organization                                           | `100`          |
| `global.defaults.maxAppsPerOrg`         | Maximum allowed applications per organization                                     | `1000`         |
| `global.defaults.maxDevelopers`         | Maximum allowed developer accounts                                                | `100`          |

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

