# Lowcoder docker image

Included Dockerfile can be used to build an **all-in-one** image with all required services installed and running within one container, or separate images for frontend and backend services.

For examples on running the all-in-one image or the multi image deployment see **deploy/docker/docker-compose.yaml** and **deploy/docker/docker-compose-multi.yaml**

Environment variables used to configure various aspects of the services are stored in **default.env**, **default-multi.env** and **override.env**. Look into the **default** files to see which variables can be set and what are the default values. To change the defaults, use **override.env**. You don't have to use **--env-file** parameter with **doker compose** because the files are loaded from within `docker-compose.yaml` and `docker-compose-multi.yaml`.

## all-in-one image

This image contains all services needed to run Lowcoder platform in one container.

### Building the image

This is the default target and can be built by running following command from project root:

```
DOCKER_BUILDKIT=1 docker build -f deploy/docker/Dockerfile -t lowcoderorg/lowcoder-ce .
```

The ChatBox component connects from the browser directly to hocuspocus. Its websocket URL and shared secret
are baked into the client at build time; without them the client uses `ws://localhost:3006` (works only for
a browser running on the docker host) and no authentication. To serve other machines, build with:

```
DOCKER_BUILDKIT=1 docker build -f deploy/docker/Dockerfile -t lowcoderorg/lowcoder-ce \
  --build-arg REACT_APP_HOCUSPOCUS_URL=ws://lowcoder.example.com:3006 \
  --build-arg REACT_APP_HOCUSPOCUS_SECRET=<secret> .
```

and run the container with `LOWCODER_HOCUSPOCUS_SECRET=<secret>`. The secret is part of the public JS bundle:
it only rejects clients that did not load this frontend, it does not protect documents from its users.
Hocuspocus on port 3006 speaks plain `ws://`. Browsers refuse `ws://` from a page served over HTTPS, so for an
HTTPS frontend put a TLS-terminating reverse proxy in front of port 3006 and build with its `wss://` URL.

The agora token service on port 8081 has no authentication: once `LOWCODER_AGORA_APP_ID` and
`LOWCODER_AGORA_APP_CERTIFICATE` are set, anyone who can reach the port can request RTC/RTM tokens for any
channel and uid of that Agora project. Restrict access to the port (firewall, reverse proxy) or disable the
service with `LOWCODER_AGORA_TOKEN_SERVICE_ENABLED=false`. `LOWCODER_AGORA_CORS_ALLOW_ORIGIN` only limits
which web pages may call it from a browser.

### Configuration

Image can be configured by setting environment variables.

| Environment variable                | Description                                                             | Default-Value                                                 |
|-------------------------------------| ----------------------------------------------------------------------- | ----------------------------------------------------- |
| `LOWCODER_REDIS_ENABLED`            | If **true** redis server is started in the container                    | `true`                                                |
| `LOWCODER_MONGODB_ENABLED`          | If **true** mongo database is started in the container                  | `true`                                                |
| `LOWCODER_MONGODB_EXPOSED`          | If **true** mongo database accept connections from outside the docker   | `false`                                               |
| `LOWCODER_API_SERVICE_ENABLED`      | If **true** lowcoder api-service is started in the container            | `true`                                                |
| `LOWCODER_NODE_SERVICE_ENABLED`     | If **true** lowcoder node-service is started in the container           | `true`                                                |
| `LOWCODER_PROXY_SERVICE_ENABLED`    | If **true** lowcoder proxy-service is started in the container (port 6070, served by the frontend under `/proxy/`) | `true`     |
| `LOWCODER_HOCUSPOCUS_ENABLED`       | If **true** hocuspocus real-time collaboration server is started in the container (port 3006) | `true`                  |
| `LOWCODER_AGORA_TOKEN_SERVICE_ENABLED` | If **true** agora token service is started in the container (port 8081) | `true`                                             |
| `LOWCODER_FRONTEND_ENABLED`         | If **true** lowcoder web frontend is started in the container           | `true`                                                |
| `LOWCODER_PUID`                     | ID of user running services. It will own all created logs and data.     | `9001`                                                |
| `LOWCODER_PGID`                     | ID of group of the user running services.                               | `9001`                                                |
| `LOWCODER_MONGODB_URL`              | Mongo database connection string                                        | `mongodb://localhost:27017/lowcoder?authSource=admin` |
| `LOWCODER_REDIS_URL`                | Redis server URL                                                        | `redis://localhost:6379`                              |
| `LOWCODER_DB_ENCRYPTION_PASSWORD`   | Encryption password                                                     | `lowcoder.org`                                        |
| `LOWCODER_DB_ENCRYPTION_SALT`       | Salt used for encrypting password                                       | `lowcoder.org`                                        |
| `LOWCODER_CORS_DOMAINS`             | CORS allowed domains                                                    | `*`                                                   |
| `LOWCODER_PUBLIC_URL`               | The URL of the public User Interface                                    | `localhost:3000`                                      |
| `LOWCODER_MAX_REQUEST_SIZE`         | Lowcoder max request size                                               | `20m`                                                 |
| `LOWCODER_MAX_QUERY_TIMEOUT`        | Lowcoder max query timeout (in seconds)                                 | `120`                                                 |
| `LOWCODER_DEFAULT_QUERY_TIMEOUT`    | Lowcoder default query timeout (in seconds)                             | `10`                                                  |
| `LOWCODER_API_RATE_LIMIT`           | Number of max Request per Second                                        | `100`                                                 |
| `LOWCODER_API_SERVICE_URL`          | Lowcoder API service URL                                                | `http://localhost:8080`                               |
| `LOWCODER_NODE_SERVICE_URL`         | Lowcoder Node service (js executor) URL                                 | `http://localhost:6060`                               |
| `LOWCODER_NODE_SERVICE_SECRET`      | Secret used for encrypting communication between API service and Node service - CHANGE IT! |                                    |
| `LOWCODER_NODE_SERVICE_SALT`        | Salt used for encrypting communication between API service and Node service   - CHANGE IT! |                                    |
| `LOWCODER_PROXY_SERVICE_URL`        | Lowcoder Proxy service URL                                              | `http://localhost:6070`                               |
| `LOWCODER_HOCUSPOCUS_URL`           | Hocuspocus websocket URL injected by proxy-service into form bridges; a localhost URL is replaced by the host the browser used to reach the proxy | `ws://localhost:3006` |
| `LOWCODER_HOCUSPOCUS_SECRET`        | Hocuspocus shared secret, must match the `REACT_APP_HOCUSPOCUS_SECRET` build argument (see above) | (empty - authentication disabled) |
| `LOWCODER_AGORA_APP_ID`             | App ID of the Agora project used by the agora token service             |                                                       |
| `LOWCODER_AGORA_APP_CERTIFICATE`    | App Certificate of the Agora project used by the agora token service    |                                                       |
| `LOWCODER_AGORA_CORS_ALLOW_ORIGIN`  | Access-Control-Allow-Origin returned by the agora token service         | `*`                                                   |
| `LOWCODER_MAX_ORGS_PER_USER`        | Default maximum organizations per user                                  | `100`                                                 |
| `LOWCODER_MAX_MEMBERS_PER_ORG`      | Default maximum members per organization                                | `1000`                                                |
| `LOWCODER_MAX_GROUPS_PER_ORG`       | Default maximum groups per organization                                 | `100`                                                 |
| `LOWCODER_MAX_APPS_PER_ORG`         | Default maximum applications per organization                           | `1000`                                                |
| `LOWCODER_MAX_DEVELOPERS`           | Default maximum developers                                              | `100`                                                 |
| `LOWCODER_WORKSPACE_MODE`           | SAAS to activate, ENTERPRISE to switch off - Workspaces                 | `SAAS`                                                |
| `LOWCODER_EMAIL_SIGNUP_ENABLED`     | Control if users create their own Workspace automatic when Sign Up      | `true`                                                |
| `LOWCODER_EMAIL_AUTH_ENABLED`       | Controls whether authentication via email is enabled                    | `true`                                                |
| `LOWCODER_CREATE_WORKSPACE_ON_SIGNUP` | IF LOWCODER_WORKSPACE_MODE = SAAS, controls if a own workspace is created for the user after sign up   | `true`               |
| `LOWCODER_MARKETPLACE_PRIVATE_MODE` | Control if not to show Apps on the local Marketplace to anonymous users | `true`                                                |
| `LOWCODER_SUPERUSER_USERNAME`       | Username of the Super-User of an Lowcoder Installation | `admin@localhost`                                                      |
| `LOWCODER_SUPERUSER_PASSWORD`       | Password of the Super-User, if not present or empty, it will be generated | `generated and printed into log file                |
| `LOWCODER_PLUGINS_DIR`              | Directory holding lowcoder plugins                                      | `/lowcoder-stacks/plugins`                            |
| `LOWCODER_COOKIE_NAME`              | Name of the lowcoder application cookie                                 | `LOWCODER_CE_SELFHOST_TOKEN`                          |
| `LOWCODER_COOKIE_MAX_AGE`           | Lowcoder application cookie max age in hours                            | `24`                                                  |
| `LOWCODER_APP_SNAPSHOT_RETENTIONTIME` | Application snapshots retention time in days                          | `30`                                                  |

Also you should set the API-KEY secret, whcih should be a string of at least 32 random characters. (from Lowcoder v2.3.x on)
On linux/mac, generate one eg. with: `head /dev/urandom | head -c 30 | shasum -a 256`

| Environment variable                | Description                                                             | Default-Value                                         |
|-------------------------------------| ----------------------------------------------------------------------- | ----------------------------------------------------- |
| `LOWCODER_API_KEY_SECRET`           | String to encrypt/sign API Keys that users may create                   |                                                       |


To enable secure Password Reset flow for the users, you need to configure your own SMTP Server. You can do this with the following Variables (from Lowcoder v2.4.x on):

| Environment Variable                      | Description                                             | Default Value        |
|-------------------------------------------|---------------------------------------------------------|----------------------|
| `LOWCODER_ADMIN_SMTP_HOST`                | SMTP Hostname of your Mail Relay Server                 |                      |
| `LOWCODER_ADMIN_SMTP_PORT`                | Port number for the SMTP service                        | `587`                |
| `LOWCODER_ADMIN_SMTP_USERNAME`            | Username for SMTP authentication                        |                      |
| `LOWCODER_ADMIN_SMTP_PASSWORD`            | Password for SMTP authentication                        |                      |
| `LOWCODER_ADMIN_SMTP_AUTH`                | Enable SMTP authentication                              | `true`               |
| `LOWCODER_ADMIN_SMTP_SSL_ENABLED`         | Enable SSL encryption                                   | `false`              |
| `LOWCODER_ADMIN_SMTP_STARTTLS_ENABLED`    | Enable STARTTLS encryption                              | `true`               |
| `LOWCODER_ADMIN_SMTP_STARTTLS_REQUIRED`   | Require STARTTLS encryption                             | `true`               |
| `LOWCODER_EMAIL_NOTIFICATIONS_SENDER`     | "from" Email address of the password Reset Email Sender | `info@localhost` |


## Building api-service image

Standalone Lowcoder api-service image.

### Building the image

From project root run:

```
DOCKER_BUILDKIT=1 docker build -f deploy/docker/Dockerfile -t lowcoderorg/lowcoder-ce-api-service --target lowcoder-ce-api-service .
```

### Configuration

Image can be configured by setting environment variables.

| Environment variable            | Description                                                         | Default-Value                                                 |
| --------------------------------| --------------------------------------------------------------------| ------------------------------------------------------|
| `LOWCODER_PUID`                 | ID of user running services. It will own all created logs and data. | `9001`                                                |
| `LOWCODER_PGID`                 | ID of group of the user running services.                           | `9001`                                                |
| `LOWCODER_MONGODB_URL`          | Mongo database connection string                                    | `mongodb://localhost:27017/lowcoder?authSource=admin` |
| `LOWCODER_REDIS_URL`            | Redis server URL                                                    | `redis://localhost:6379`                              |
| `LOWCODER_DB_ENCRYPTION_PASSWORD`           | Encryption password                                     | `lowcoder.org`                                        |
| `LOWCODER_DB_ENCRYPTION_SALT`               | Salt used for encrypting password                       | `lowcoder.org`                                        |
| `LOWCODER_CORS_DOMAINS`         | CORS allowed domains                                                | `*`                                                   |
| `LOWCODER_PUBLIC_URL`           | The URL of the public User Interface                                | `localhost:3000`                                      |
| `LOWCODER_MAX_ORGS_PER_USER`    | Default maximum organizations per user                              | `100`                                                 |
| `LOWCODER_MAX_MEMBERS_PER_ORG`  | Default maximum members per organization                            | `1000`                                                |
| `LOWCODER_MAX_GROUPS_PER_ORG`   | Default maximum groups per organization                             | `100`                                                 |
| `LOWCODER_MAX_APPS_PER_ORG`     | Default maximum applications per organization                       | `1000`                                                |
| `LOWCODER_MAX_DEVELOPERS`       | Default maximum developers                                          | `100`                                                 |
| `LOWCODER_MAX_REQUEST_SIZE`     | Lowcoder max request size                                           | `20m`                                                 |
| `LOWCODER_MAX_QUERY_TIMEOUT`    | Lowcoder max query timeout (in seconds)                             | `120`                                                 |
| `LOWCODER_DEFAULT_QUERY_TIMEOUT`| Lowcoder default query timeout (in seconds)                         | `10`                                                  |
| `LOWCODER_WORKSPACE_MODE`       | SAAS to activate, ENTERPRISE to switch off - Workspaces             | `SAAS`                                                |
| `LOWCODER_EMAIL_SIGNUP_ENABLED` | Control is users can create their own Workspace when Sign Up        | `true`                                                |
| `LOWCODER_CREATE_WORKSPACE_ON_SIGNUP` | IF LOWCODER_WORKSPACE_MODE = SAAS, controls if a own workspace is created for the user after sign up   | `true`               |
| `LOWCODER_MARKETPLACE_PRIVATE_MODE` | Control if not to show Apps on the local Marketplace to anonymous users | `true`                                                |
| `LOWCODER_SUPERUSER_USERNAME` | Username of the Super-User of an Lowcoder Installation | `admin@localhost`                                                    |
| `LOWCODER_SUPERUSER_PASSWORD` | Password of the Super-User, if not present or empty, it will be generated | `generated and printed into log file              |
| `LOWCODER_PLUGINS_DIR`              | Directory holding lowcoder plugins                                      | `/lowcoder-stacks/plugins`                            |
| `LOWCODER_COOKIE_NAME`              | Name of the lowcoder application cookie                                 | `LOWCODER_CE_SELFHOST_TOKEN`                          |
| `LOWCODER_COOKIE_MAX_AGE`           | Lowcoder application cookie max age in hours                            | `24`                                                  |
| `LOWCODER_APP_SNAPSHOT_RETENTIONTIME` | Application snapshots retention time in days                          | `30`                                                  |
| `LOWCODER_NODE_SERVICE_SECRET`      | Secret used for encrypting communication between API service and Node service - CHANGE IT! |                                    |
| `LOWCODER_NODE_SERVICE_SALT`        | Salt used for encrypting communication between API service and Node service   - CHANGE IT! |                                    |

Also you should set the API-KEY secret, whcih should be a string of at least 32 random characters. (from Lowcoder v2.3.x on)
On linux/mac, generate one eg. with: head /dev/urandom | head -c 30 | shasum -a 256

| Environment variable                | Description                                                             | Default-Value                                                 |
|-------------------------------------| ----------------------------------------------------------------------- | ----------------------------------------------------- |
| `LOWCODER_API_KEY_SECRET`           | String to encrypt/sign API Keys that users may create                   |                                                       |


To enable secure Password Reset flow for the users, you need to configure your own SMTP Server. You can do this with the following Variables (from Lowcoder v2.4.x on):

| Environment Variable                      | Description                                             | Default Value        |
|-------------------------------------------|---------------------------------------------------------|----------------------|
| `LOWCODER_ADMIN_SMTP_HOST`                | SMTP Hostname of your Mail Relay Server                 |                      |
| `LOWCODER_ADMIN_SMTP_PORT`                | Port number for the SMTP service                        | `587`                |
| `LOWCODER_ADMIN_SMTP_USERNAME`            | Username for SMTP authentication                        |                      |
| `LOWCODER_ADMIN_SMTP_PASSWORD`            | Password for SMTP authentication                        |                      |
| `LOWCODER_ADMIN_SMTP_AUTH`                | Enable SMTP authentication                              | `true`               |
| `LOWCODER_ADMIN_SMTP_SSL_ENABLED`         | Enable SSL encryption                                   | `false`              |
| `LOWCODER_ADMIN_SMTP_STARTTLS_ENABLED`    | Enable STARTTLS encryption                              | `true`               |
| `LOWCODER_ADMIN_SMTP_STARTTLS_REQUIRED`   | Require STARTTLS encryption                             | `true`               |
| `LOWCODER_EMAIL_NOTIFICATIONS_SENDER`     | "from" Email address of the password Reset Email Sender | `info@localhost` |

## Building node-service image

Standalone Lowcoder node-service (JS executor) image.

### Building the image

From project root run:

```
DOCKER_BUILDKIT=1 docker build -f deploy/docker/Dockerfile -t lowcoderorg/lowcoder-ce-node-service --target lowcoder-ce-node-service .
```

### Configuration

Image can be configured by setting environment variables.

| Environment variable            | Description                                                         | Default-Value                                                   |
| --------------------------------| --------------------------------------------------------------------| ------------------------------------------------------- |
| `LOWCODER_PUID`                 | ID of user running services. It will own all created logs and data. | `9001`                                                  |
| `LOWCODER_PGID`                 | ID of group of the user running services.                           | `9001`                                                  |
| `LOWCODER_API_SERVICE_URL`      | Lowcoder API service URL                                            | `http://localhost:8080`                                 |
| `LOWCODER_NODE_SERVICE_SECRET`      | Secret used for encrypting communication between API service and Node service - CHANGE IT! |                                    |
| `LOWCODER_NODE_SERVICE_SALT`        | Salt used for encrypting communication between API service and Node service   - CHANGE IT! |                                    |

## Building web frontend image

Standalone Lowcoder web frontend image.

### Building the image

From project root run:

```
DOCKER_BUILDKIT=1 docker build -f deploy/docker/Dockerfile -t lowcoderorg/lowcoder-ce-frontend --target lowcoder-ce-frontend .
```

The hocuspocus build arguments `REACT_APP_HOCUSPOCUS_URL` and `REACT_APP_HOCUSPOCUS_SECRET` described for the
all-in-one image apply to this image too.

### Configuration

Image can be configured by setting environment variables.

| Environment variable            | Description                                                         | Default-Value                                                   |
| --------------------------------| --------------------------------------------------------------------| ------------------------------------------------------- |
| `LOWCODER_PUID`                 | ID of user running services. It will own all created logs and data. | `9001`                                                  |
| `LOWCODER_PGID`                 | ID of group of the user running services.                           | `9001`                                                  |
| `LOWCODER_MAX_QUERY_TIMEOUT`    | Lowcoder max query timeout (in seconds)                             | `120`                                                 |
| `LOWCODER_MAX_REQUEST_SIZE`     | Lowcoder max request size                                           | `20m`                                                   |
| `LOWCODER_API_SERVICE_URL`      | Lowcoder API service URL                                            | `http://localhost:8080`                                 |
| `LOWCODER_NODE_SERVICE_URL`     | Lowcoder Node service (js executor) URL                             | `http://localhost:6060`                                 |
| `LOWCODER_PROXY_SERVICE_URL`    | Lowcoder Proxy service URL                                          | `http://localhost:6070`                                 |


