# Lowcoder

Lowcoder is a developer-friendly open-source low code platform to build internal apps within minutes.

[Overview of Lowcoder](https://docs.lowcoder.org/)

## Introduction

This chart bootstraps an Lowcoder deployment on a [Kubernetes](https://kubernetes.io) cluster using the [Helm](https://helm.sh) package manager.

It installs these services, each with its own Deployment and Service:

| Service | Image | Enabled by default |
| ------- | ----- | ------------------ |
| api-service | `lowcoderorg/lowcoder-ce-api-service` | always |
| node-service | `lowcoderorg/lowcoder-ce-node-service` | always |
| frontend | `lowcoderorg/lowcoder-ce-frontend` | always |
| proxy-service | `lowcoderorg/lowcoder-proxy-service` | `proxyService.enabled: true` |
| hocuspocus | `lowcoderorg/lowcoder-hocuspocus` | `hocuspocus.enabled: true` |
| agora-token-service | `lowcoderorg/lowcoder-agora-token-service` | `agoraTokenService.enabled: true` |
| MongoDB (Bitnami subchart) | `bitnamilegacy/mongodb` | `mongodb.enabled: true` |
| Redis (Bitnami subchart) | `bitnamilegacy/redis` | `redis.enabled: true` |

## Prerequisites

- Kubernetes 1.23+ (the HorizontalPodAutoscalers use `autoscaling/v2`)
- Helm 3.8.0+ (the Bitnami dependencies are pulled from an OCI registry)
- PV provisioner support in the underlying infrastructure

## Installing the Chart

To install the chart with the release name `my-lowcoder` into namespace `lowcoder`:

```bash
# Pull the redis and mongodb charts (oci://registry-1.docker.io/bitnamicharts) into charts/
$ helm dependency update

# Install the chart
$ helm install -n lowcoder my-lowcoder .
```

## Uninstalling the Chart

To uninstall/delete the `my-lowcoder` deployment from namespace `lowcoder`:

```bash
$ helm delete -n lowcoder my-lowcoder
```

## Images of the new services

proxy-service, hocuspocus and agora-token-service images are published only as `:dev` (built from the `dev`
branch) and `:latest` (built from `main`); there are no version tags. The chart uses `:latest`:

- Until the new services are merged to `main`, `lowcoder-proxy-service:latest` and
  `lowcoder-agora-token-service:latest` do not exist, so a default install has those two pods in
  `ImagePullBackOff`, and `lowcoder-hocuspocus:latest` is an older amd64-only image that answers its first
  `/health` request and then exits (`ERR_HTTP_HEADERS_SENT`), so its pod restarts after every probe. Set
  `<service>.image.tag: dev` or `<service>.enabled: false` until then.
- The default frontend and api-service images (`appVersion` 2.7.6) do not use them yet: 2.7.6 has no `/proxy/`
  route and no ChatBox hocuspocus client. proxy-service and hocuspocus run, but nothing calls them.

## Exposing the new services

With `ingress.enabled: true` the chart adds, on **every** `ingress.hosts[]` entry and **before** its configured
paths (controllers that use the first matching path would otherwise send them to a catch-all `/`):

| Path (`pathType: Prefix`) | Service | Condition |
| ------------------------- | ------- | --------- |
| `hocuspocus.ingress.path` (default `/hocuspocus`) | hocuspocus | `hocuspocus.enabled` and `hocuspocus.ingress.enabled` |
| `/rte` (fixed: the service only answers `/rte/<channel>/<role>/<tokentype>/<uid>`) | agora-token-service | `agoraTokenService.enabled` and `agoraTokenService.ingress.enabled` |

The paths are not rewritten. proxy-service is not exposed: the frontend reaches it through its nginx under
`/proxy/` (`LOWCODER_PROXY_SERVICE_URL`).

### Through the frontend

Frontend images built from this repository's current `deploy/docker/frontend` (not the default 2.7.6 image)
also forward, in their nginx:

| Frontend path | Service | Frontend env (set by the chart when the service is enabled) |
| ------------- | ------- | ----------------------------------------------------------- |
| `/hocuspocus` (websocket, path unchanged) | hocuspocus | `LOWCODER_HOCUSPOCUS_SERVICE_URL` |
| `/agora-token-service/` (prefix removed: `/agora-token-service/rte/...` reaches the service as `/rte/...`) | agora-token-service | `LOWCODER_AGORA_TOKEN_SERVICE_URL` |

So hocuspocus and the token service are reachable wherever the frontend is (e.g. `kubectl port-forward`, a
LoadBalancer Service, an ingress controller that routes only `/` to the frontend), and the
[hocuspocus URL](#hocuspocus-url) `<scheme>://<host>/hocuspocus` works through the ingress route and through
the frontend alike. The chart sets the two variables only for enabled services: nginx does not start when the
host of an upstream does not resolve.

**Websocket timeout**: hocuspocus connections are websockets. ingress-nginx closes a proxied connection after
`proxy-read-timeout` (60 seconds by default) without traffic, so raise it:

```yaml
ingress:
  annotations:
    nginx.ingress.kubernetes.io/proxy-read-timeout: "3600"
    nginx.ingress.kubernetes.io/proxy-send-timeout: "3600"
```

### Hocuspocus URL

There is one public hocuspocus URL per deployment, used in two places:

- The ChatBox component of the frontend has its URL and secret **baked in at build time**
  (`REACT_APP_HOCUSPOCUS_URL`, `REACT_APP_HOCUSPOCUS_SECRET`). A published frontend image uses
  `ws://localhost:3006`, so ChatBox works in Kubernetes only with a frontend image built with this URL and
  `hocuspocus.secret`.
- proxy-service hands the URL to the Typeform, Google Forms and website bridges (`LOWCODER_HOCUSPOCUS_URL`).

`hocuspocus.publicUrl` sets it, e.g. `wss://lowcoder.example.com/hocuspocus`. When it is empty and the ingress,
hocuspocus and its ingress path are enabled, the chart derives `ws://<host><hocuspocus.ingress.path>` from the
single ingress host (`wss://` when that host is listed in `ingress.tls[].hosts`). The render **fails** when it
cannot derive the URL and `hocuspocus.publicUrl` is empty:

- not exactly one `ingress.hosts` entry: `hocuspocus.publicUrl must be set: it cannot be derived from N ingress hosts`
- a rule without `host`: `hocuspocus.publicUrl must be set: it cannot be derived from an ingress rule without host`

Without ingress and without `hocuspocus.publicUrl`, proxy-service gets no URL and uses its default
`ws://localhost:3006`, rewritten to the host of each request.

hocuspocus runs as a single replica with `strategy: Recreate`: documents live in the memory of one process, a
second replica would split them. `hocuspocus.secret` is visible in the frontend JS bundle, so it only keeps
out clients that did not load this frontend.

### Agora token service

agora-token-service has **no authentication**. Once `agoraTokenService.appId` and
`agoraTokenService.appCertificate` are set, anyone who reaches `/rte` through the ingress gets RTC/RTM tokens
for any channel and uid of that Agora project; `agoraTokenService.corsAllowOrigin` only limits browser callers.
With a current frontend image the service is also reachable under `/agora-token-service/` of the frontend,
so `agoraTokenService.ingress.enabled: false` alone does not hide it; set `agoraTokenService.enabled: false` if
you do not use the meeting components. Without credentials `/rte/...` answers HTTP 400.

## Upgrading to 3.0.0

- **Three new services start by default** (proxy-service, hocuspocus, agora-token-service). See
  [Images of the new services](#images-of-the-new-services); set `<service>.enabled: false` to skip one.
- **Bitnami images**: Bitnami removed the versioned images from `docker.io/bitnami`, so the redis and mongodb
  subcharts now pull from `docker.io/bitnamilegacy`. Legacy images receive no updates, and `bitnamilegacy/mongodb`
  is amd64 only. Subchart images you enable yourself (sentinel, metrics exporters, `os-shell`, `kubectl`) need
  the same `image.repository` override.
- **Secrets**: `LOWCODER_REDIS_URL` and `LOWCODER_ADMIN_SMTP_PASSWORD` moved from the api-service ConfigMap to its
  Secret. The environment variable names in the pod are unchanged.
- **Redis host**: the in-chart redis URL now points to the redis Service of the release
  (`<release>-redis-master`, honouring `redis.nameOverride`/`redis.fullnameOverride`). Before, it was only
  correct when the release name contained `lowcoder`.
- **`redis.externalUrl`**: a value starting with `redis://` or `rediss://` is used as given; anything else is
  `host[:port]`. Before, `redis://` was always prepended.
- **Redis auth**: with `redis.auth.enabled: true` the chart puts the password into the URL and needs
  `redis.auth.password` or `redis.auth.existingSecret`; the render fails without one of them.
- **`false` and `0`** values (e.g. `global.config.enableEmailAuth: false`, `global.defaults.apiRateLimit: 0`) now
  take effect; before, they were replaced by the defaults.
- **SMTP port** default is `587` (was `578`).
- **Resources**: each service has its own `resources`; the top-level `resources` is still used as fallback.
- **Pod restarts**: the pods carry checksums of their ConfigMap/Secret, so a changed value restarts them.
- **`existingSecret`**: with `redis.auth.existingSecret` or `mongodb.auth.existingSecret` the password is read
  with `lookup` at install/upgrade time; `helm template` and `--dry-run` cannot read it and render an empty
  password. For the in-chart mongodb this is new: before, `mongodb.auth.passwords[0]` was used even when the
  subchart took its passwords from `existingSecret`.
- **`global.config.apiKeySecret`** must not be empty while proxy-service is enabled (the render fails):
  proxy-service accepts any token without it.

## Parameters

### Common

| Name                 | Description                                                              | Value |
| -------------------- | ------------------------------------------------------------------------ | ----- |
| `imagePullSecrets`   | Image pull secrets of all pods                                           | `[]`  |
| `nameOverride`       | Overrides the chart name in resource names                               | `""`  |
| `fullnameOverride`   | Overrides the full resource name prefix                                  | `""`  |
| `annotations`        | Annotations added to the ConfigMaps and Secrets of all services          | `{}`  |
| `serviceAccount.create` | Create a service account                                              | `true` |
| `serviceAccount.annotations` | Annotations of the service account                               | `{}`  |
| `serviceAccount.name` | Name of the service account (generated from the fullname when empty)    | `""`  |
| `podAnnotations`     | Annotations added to all pods                                            | `{}`  |
| `resources`          | Default container resources for services without their own `resources`  | `{}`  |
| `podSecurityContext` | Pod security context of all pods                                         | `{}`  |
| `securityContext`    | Container security context of all containers                            | `{}`  |
| `nodeSelector`       | Node selector of all pods                                                | `{}`  |
| `tolerations`        | Tolerations of all pods                                                  | `[]`  |
| `affinity`           | Affinity of all pods                                                     | `{}`  |

### Global

| Name                                    | Description                                                                       | Value          |
| --------------------------------------- | --------------------------------------------------------------------------------- | -------------- |
| `global.config.publicUrl`               | URL of the public User Interface (used eg. in invitation links)                   | `https://somedomain.com/` |
| `global.config.createWorkspaceOnSignup` | If workspaceMode = SAAS, controls if own workspace is created for the user after sign up | `true`  |
| `global.config.workspaceMode`           | Sets the workspace mode. Possible types are: SAAS, ENTERPRISE                     | `SAAS`         |
| `global.config.userId`                  | User ID of user running Lowcoder server application in container                  | `9001`         |
| `global.config.groupId`                 | Group ID of user running Lowcoder server application in container                 | `9001`         |
| `global.config.corsAllowedDomains`      | CORS allowed domains                                                              | `*`            |
| `global.config.enableUserSignUp`        | Enable users signing up to lowcoder via login page                                | `true`         |
| `global.config.enableEmailAuth`         | Controls whether authentication via email is enabled                              | `true`         |
| `global.config.emailNotificationSender` | Email used in notifications from lowcoder                                         | `info@localhost` |
| `global.config.encryption.password`     | Encryption password  - CHANGE IT!                                                 | `lowcoder.org` |
| `global.config.encryption.salt`         | Encryption salt      - CHANGE IT!                                                 | `lowcoder.org` |
| `global.config.superuser.username`      | Lowcoder superadmin username                                                      | `admin@localhost` |
| `global.config.superuser.password`      | Lowcoder superadmin password - if not supplied, it will be generated              |                |
| `global.config.apiKeySecret`            | API-KEY secret, should be a string of at least 32 random characters - CHANGE IT   | `5a41b0905...` |
| `global.config.maxQueryTimeout`         | Maximum query timeout in seconds                                                  | `120`          |
| `global.config.maxRequestSize`          | Maximum request size                                                              | `20mb`         |
| `global.config.snapshotRetentionTime`   | Lowcoder application snapshot retention time (in days)                            | `30`           |
| `global.config.marketplacePrivateMode`  | Controls whether to show Apps on the local Marketplace to anonymous users         | `true`         |
| `global.config.nodeServiceUrl`          | URL to node-service server if using external one (disabled by default)            |                |
| `global.config.nodeServiceSecret`       | Secret used for encrypting traffic between API service and Node service - CHANGE IT! |                |
| `global.config.nodeServiceSalt`         | Salt used for encrypting traffic between API service and Node service   - CHANGE IT! |                |
| `global.config.apiServiceUrl`           | URL to api-service server if using external one (disabled by default)             |                |
| `global.config.proxyServiceUrl`         | URL to proxy-service server if using external one (empty = the in-chart proxy-service) |           |
| `global.cookie.name`                    | Name of the lowcoder application cookie                                           | `LOWCODER_CE_SELFHOST_TOKEN` |
| `global.cookie.maxAge`                  | Lowcoder application cookie max age in hours                                      | `24`           |
| `global.defaults.maxOrgsPerUser`        | Maximum allowed organizations per user                                            | `100`          |
| `global.defaults.maxMembersPerOrg`      | Maximum allowed members per organization                                          | `1000`         |
| `global.defaults.maxGroupsPerOrg`       | Maximum groups allowed per organization                                           | `100`          |
| `global.defaults.maxAppsPerOrg`         | Maximum allowed applications per organization                                     | `1000`         |
| `global.defaults.maxDevelopers`         | Maximum allowed developer accounts                                                | `50`           |
| `global.defaults.apiRateLimit`          | Number of max Request per Second - set to 0 to disable rate limiting              | `100`          |
| `global.defaults.queryTimeout`          | Default lowcoder query timeout                                                    | `10`           |
| `global.mailServer.host`                | Mail server host (used for sending lowcoder emails)                               | `localhost`    |
| `global.mailServer.port`                | Mail server port                                                                  | `587`          |
| `global.mailServer.smtpAuth`            | Use SMPT authentication when sending mails                                        | `false`        |
| `global.mailServer.authUsername`        | Username (email) used for SMTP authentication                                     |                |
| `global.mailServer.authPassword`        | Password used for authentication (stored in the api-service Secret)               |                |
| `global.mailServer.useSSL`              | Enable SSL for connetion to the mail server                                       | `false`        |
| `global.mailServer.useStartTLS`         | Enable STARTTLS                                                                   | `true`         |
| `global.mailServer.requireStartTLS`     | Require STARTTLS                                                                  | `true`         |
| `global.plugins.folder`                 | Folder from which to load lowcoder plugins                                        | `/plugins`     |

### Redis

| Name                                 | Description                                                                 | Value            |
| ------------------------------------ | --------------------------------------------------------------------------- | ---------------- |
| `redis.enabled`                      | Install our own instance of redis                                           | `true`           |
| `redis.externalUrl`                  | External redis when `redis.enabled` is `false`: a full `redis://` or `rediss://` URL, used as given (include credentials yourself), or `host[:port]`, from which the chart builds `redis://[:<password>@]host[:port]` | |
| `redis.image.repository`             | Redis image (Bitnami keeps the versioned images only in `bitnamilegacy`)    | `bitnamilegacy/redis` |
| `redis.auth.enabled`                 | Redis requires a password (in-chart redis, and the password the chart puts into a built external URL) | `false` |
| `redis.auth.password`                | Redis password                                                              |                  |
| `redis.auth.existingSecret`          | Secret holding the redis password, read with `lookup` at install/upgrade time |                |
| `redis.auth.existingSecretPasswordKey` | Key of the password in `redis.auth.existingSecret`                        | `redis-password` |

With `redis.auth.enabled: true` one of `redis.auth.password` and `redis.auth.existingSecret` is required (unless
`redis.externalUrl` is a full URL): Bitnami would otherwise generate a random password this chart cannot know.

All available parameters can be found in [Bitnami Redis Chart](https://github.com/bitnami/charts/tree/main/bitnami/redis/#parameters)

### MongoDB

| Name                                 | Description                                                                 | Value            |
| ------------------------------------ | --------------------------------------------------------------------------- | ---------------- |
| `mongodb.enabled`                    | Install our own instance of mongo database                                  | `true`           |
| `mongodb.service.externalUrl`        | `host[:port]` of the external mongo database when `mongodb.enabled` is `false` | |
| `mongodb.image.repository`           | MongoDB image (Bitnami keeps the versioned images only in `bitnamilegacy`; amd64 only) | `bitnamilegacy/mongodb` |
| `mongodb.service.nameOverride`       | Name of the in-chart mongodb Service                                        | `lowcoder-mongodb` |
| `mongodb.useSrv`                     | Use `mongodb+srv://` in the connection string                               | `false`          |
| `mongodb.useSSL`                     | Use SSL for the external mongo database                                     | `false`          |
| `mongodb.auth.usernames[0]`          | Lowcoder database user                                                      | `lowcoder`       |
| `mongodb.auth.passwords[0]`          | Password of the Lowcoder database user                                      | `supersecret`    |
| `mongodb.auth.databases[0]`          | Lowcoder database                                                           | `lowcoder`       |
| `mongodb.auth.existingSecret`        | Secret with the password of `usernames[0]`, read with `lookup` at install/upgrade time; wins over `passwords[0]`. In-chart mongodb: first entry of key `mongodb-passwords` (the Bitnami subchart's key, comma-separated); external mongodb: key `password` | |

All available parameters can be found in [Bitnami MongoDB Chart](https://github.com/bitnami/charts/tree/main/bitnami/mongodb/#parameters)

### api-service, node-service, frontend

`<service>` is `apiService`, `nodeService` or `frontend`.

| Name                                         | Description                                                    | Value          |
| -------------------------------------------- | -------------------------------------------------------------- | -------------- |
| `<service>.image.repository`                 | Image                                                          | `lowcoderorg/lowcoder-ce-api-service`, `lowcoderorg/lowcoder-ce-node-service`, `lowcoderorg/lowcoder-ce-frontend` |
| `<service>.image.tag`                        | Image tag                                                      | chart `appVersion` |
| `<service>.image.pullPolicy`                 | Image pull policy                                              | `Always`       |
| `<service>.service.type`                     | Service type                                                   | `ClusterIP`    |
| `<service>.service.port`                     | Service port                                                   | `80`           |
| `<service>.service.nodePort`                 | Node port when `service.type` is `NodePort`                    |                |
| `<service>.replicaCount`                     | Replicas when autoscaling is disabled                          | `1`            |
| `<service>.autoscaling.enabled`              | Create a HorizontalPodAutoscaler                               | `false`        |
| `<service>.autoscaling.minReplicas`          | Minimum replicas                                               | `1`            |
| `<service>.autoscaling.maxReplicas`          | Maximum replicas                                               | `100`          |
| `<service>.autoscaling.targetCPUUtilizationPercentage` | Target CPU utilization                               | `80`           |
| `<service>.autoscaling.targetMemoryUtilizationPercentage` | Target memory utilization                         |                |
| `<service>.resources`                        | Container resources (falls back to the top-level `resources`)  | `{}`           |

### proxy-service

| Name                                         | Description                                                    | Value          |
| -------------------------------------------- | -------------------------------------------------------------- | -------------- |
| `proxyService.enabled`                       | Install proxy-service                                          | `true`         |
| `proxyService.image.repository`              | Image                                                          | `lowcoderorg/lowcoder-proxy-service` |
| `proxyService.image.tag`                     | Image tag (`latest` or `dev`)                                  | `latest`       |
| `proxyService.image.pullPolicy`              | Image pull policy                                              | `Always`       |
| `proxyService.service.type`                  | Service type                                                   | `ClusterIP`    |
| `proxyService.service.port`                  | Service port                                                   | `80`           |
| `proxyService.service.nodePort`              | Node port when `service.type` is `NodePort`                    |                |
| `proxyService.replicaCount`                  | Replicas when autoscaling is disabled                          | `1`            |
| `proxyService.autoscaling.*`                 | Same keys as for api-service                                   | disabled       |
| `proxyService.resources`                     | Container resources (falls back to the top-level `resources`)  | `{}`           |
| `proxyService.config.rateLimit`              | Requests per minute per client IP (`LOWCODER_PROXY_RATE_LIMIT`) | `120`         |
| `proxyService.config.allowedHosts`           | Upstream hosts of the Typeform proxy, comma separated          | `form.typeform.com,embed.typeform.com,admin.typeform.com` |
| `proxyService.config.googleFormsAllowedHosts` | Upstream hosts of the Google Forms proxy, comma separated     | `docs.google.com` |
| `proxyService.config.websiteAllowedHosts`    | Upstream hosts of the website proxy, comma separated (empty = none) | `""`      |

proxy-service gets `global.config.apiKeySecret` (it verifies the Lowcoder API tokens of its callers with it),
`hocuspocus.secret` and the [hocuspocus URL](#hocuspocus-url). The frontend gets `LOWCODER_PROXY_SERVICE_URL`
pointing to it, or to `global.config.proxyServiceUrl`.

### hocuspocus

| Name                                         | Description                                                    | Value          |
| -------------------------------------------- | -------------------------------------------------------------- | -------------- |
| `hocuspocus.enabled`                         | Install hocuspocus                                             | `true`         |
| `hocuspocus.image.repository`                | Image                                                          | `lowcoderorg/lowcoder-hocuspocus` |
| `hocuspocus.image.tag`                       | Image tag (`latest` or `dev`)                                  | `latest`       |
| `hocuspocus.image.pullPolicy`                | Image pull policy                                              | `Always`       |
| `hocuspocus.service.type`                    | Service type                                                   | `ClusterIP`    |
| `hocuspocus.service.port`                    | Service port                                                   | `80`           |
| `hocuspocus.service.nodePort`                | Node port when `service.type` is `NodePort`                    |                |
| `hocuspocus.resources`                       | Container resources (falls back to the top-level `resources`)  | `{}`           |
| `hocuspocus.secret`                          | Shared secret of the websocket clients (empty = no authentication); must equal `REACT_APP_HOCUSPOCUS_SECRET` of the frontend build | `""` |
| `hocuspocus.publicUrl`                       | Websocket URL browsers use, see [Hocuspocus URL](#hocuspocus-url) | `""`        |
| `hocuspocus.ingress.enabled`                 | Route `hocuspocus.ingress.path` on every ingress host to hocuspocus | `true`    |
| `hocuspocus.ingress.path`                    | Ingress path of hocuspocus                                     | `/hocuspocus`  |

hocuspocus has no `replicaCount` and no autoscaling: it always runs one replica.

### agora-token-service

| Name                                         | Description                                                    | Value          |
| -------------------------------------------- | -------------------------------------------------------------- | -------------- |
| `agoraTokenService.enabled`                  | Install agora-token-service                                    | `true`         |
| `agoraTokenService.image.repository`         | Image                                                          | `lowcoderorg/lowcoder-agora-token-service` |
| `agoraTokenService.image.tag`                | Image tag (`latest` or `dev`)                                  | `latest`       |
| `agoraTokenService.image.pullPolicy`         | Image pull policy                                              | `Always`       |
| `agoraTokenService.service.type`             | Service type                                                   | `ClusterIP`    |
| `agoraTokenService.service.port`             | Service port                                                   | `80`           |
| `agoraTokenService.service.nodePort`         | Node port when `service.type` is `NodePort`                    |                |
| `agoraTokenService.replicaCount`             | Replicas when autoscaling is disabled                          | `1`            |
| `agoraTokenService.autoscaling.*`            | Same keys as for api-service                                   | disabled       |
| `agoraTokenService.resources`                | Container resources (falls back to the top-level `resources`)  | `{}`           |
| `agoraTokenService.appId`                    | Agora App ID (stored in a Secret)                              | `""`           |
| `agoraTokenService.appCertificate`           | Agora App Certificate (stored in a Secret)                     | `""`           |
| `agoraTokenService.corsAllowOrigin`          | `CORS_ALLOW_ORIGIN` of the token service                       | `*`            |
| `agoraTokenService.ingress.enabled`          | Route `/rte` on every ingress host to the token service (no authentication, see [Agora token service](#agora-token-service)) | `true` |

### Ingress

| Name                     | Description                                                                     | Value                 |
| ------------------------ | ------------------------------------------------------------------------------- | --------------------- |
| `ingress.enabled`        | Create an Ingress for the frontend and the routes of the new services           | `false`               |
| `ingress.className`      | Ingress class name                                                              | `""`                  |
| `ingress.contextPath`    | Path prefix the frontend is served under (used by its probes)                   | `""`                  |
| `ingress.annotations`    | Ingress annotations (see the websocket timeout above)                           | `{}`                  |
| `ingress.hosts`          | Hosts with their frontend `paths` (`path`, `pathType`)                          | `chart-example.local`, path `/` |
| `ingress.tls`            | TLS entries (`secretName`, `hosts`); a listed host makes the derived hocuspocus URL `wss://` | `[]`     |
