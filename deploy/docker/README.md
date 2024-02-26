# Lowcoder docker image

Included Dockerfile can be used to build an **all-in-one** image with all required services installed and running within one container, or separate images for frontend and backend services.

For examples on running the all-in-one image or the multi image deployment see **deploy/docker/docker-compose.yaml** and **deploy/docker/docker-compose-multi.yaml**


## all-in-one image

This image contains all services needed to run Lowcoder platform in one container.

### Building the image

This is the default target and can be built by running following command from project root:

```
DOCKER_BUILDKIT=1 docker build -f deploy/docker/Dockerfile -t lowcoderorg/lowcoder-ce .
```

### Configuration

Image can be configured by setting environment variables.

| Environment variable                | Description                                                             | Value                                                 |
|-------------------------------------| ----------------------------------------------------------------------- | ----------------------------------------------------- |
| `LOWCODER_REDIS_ENABLED`            | If **true** redis server is started in the container                    | `true`                                                |
| `LOWCODER_MONGODB_ENABLED`          | If **true** mongo database is started in the container                  | `true`                                                |
| `LOWCODER_API_SERVICE_ENABLED`      | If **true** lowcoder api-service is started in the container            | `true`                                                |
| `LOWCODER_NODE_SERVICE_ENABLED`     | If **true** lowcoder node-service is started in the container           | `true`                                                |
| `LOWCODER_FRONTEND_ENABLED`         | If **true** lowcoder web frontend is started in the container           | `true`                                                |
| `LOWCODER_PUID`                     | ID of user running services. It will own all created logs and data.     | `9001`                                                |
| `LOWCODER_PGID`                     | ID of group of the user running services.                               | `9001`                                                |
| `LOWCODER_MONGODB_URL`              | Mongo database connection string                                        | `mongodb://localhost:27017/lowcoder?authSource=admin` |
| `LOWCODER_REDIS_URL`                | Redis server URL                                                        | `redis://localhost:6379`                              |
| `LOWCODER_DB_ENCRYPTION_PASSWORD`   | Encryption password                                                     | `lowcoder.org`                                        |
| `LOWCODER_DB_ENCRYPTION_SALT`       | Salt used for encrypting password                                       | `lowcoder.org`                                        |
| `LOWCODER_CORS_DOMAINS`             | CORS allowed domains                                                    | `*`                                                   |
| `LOWCODER_MAX_REQUEST_SIZE`         | Lowcoder max request size                                               | `20m`                                                 |
| `LOWCODER_MAX_QUERY_TIMEOUT`        | Lowcoder max query timeout (in seconds)                                 | `120`                                                 |
| `LOWCODER_API_SERVICE_URL`          | Lowcoder API service URL                                                | `http://localhost:8080`                               |
| `LOWCODER_NODE_SERVICE_URL`         | Lowcoder Node service (js executor) URL                                 | `http://localhost:6060`                               |
| `LOWCODER_MAX_ORGS_PER_USER`        | Default maximum organizations per user                                  | `100`                                                 |
| `LOWCODER_MAX_MEMBERS_PER_ORG`      | Default maximum members per organization                                | `1000`                                                |
| `LOWCODER_MAX_GROUPS_PER_ORG`       | Default maximum groups per organization                                 | `100`                                                 |
| `LOWCODER_MAX_APPS_PER_ORG`         | Default maximum applications per organization                           | `1000`                                                |
| `LOWCODER_MAX_DEVELOPERS`           | Default maximum developers                                              | `100`                                                 |
| `LOWCODER_WORKSPACE_MODE`           | SAAS to activate, ENTERPRISE to switch off - Workspaces                 | `SAAS`                                                |
| `LOWCODER_EMAIL_SIGNUP_ENABLED`     | Control if users create their own Workspace automatic when Sign Up      | `true`                                                |
| `LOWCODER_EMAIL_AUTH_ENABLED`       | Control to show the eMail Login after Admin user is set                 | `true`                                                |
| `LOWCODER_CREATE_WORKSPACE_ON_SIGNUP`       | IF LOWCODER_WORKSPACE_MODE = SAAS, controls if a own workspace is created for the user after sign up                 | `true`                                                |
| `LOWCODER_MARKETPLACE_PRIVATE_MODE` | Control if not to show Apps on the local Marketplace to anonymous users | `true`                                                |




## Building api-service image

Standalone Lowcoder api-service image.

### Building the image

From project root run:

```
DOCKER_BUILDKIT=1 docker build -f deploy/docker/Dockerfile -t lowcoderorg/lowcoder-ce-api-service --target lowcoder-ce-api-service .
```

### Configuration

Image can be configured by setting environment variables.

| Environment variable            | Description                                                         | Value                                                 |
| --------------------------------| --------------------------------------------------------------------| ------------------------------------------------------|
| `LOWCODER_PUID`                 | ID of user running services. It will own all created logs and data. | `9001`                                                |
| `LOWCODER_PGID`                 | ID of group of the user running services.                           | `9001`                                                |
| `LOWCODER_MONGODB_URL`          | Mongo database connection string                                    | `mongodb://localhost:27017/lowcoder?authSource=admin` |
| `LOWCODER_REDIS_URL`            | Redis server URL                                                    | `redis://localhost:6379`                              |
| `LOWCODER_DB_ENCRYPTION_PASSWORD`           | Encryption password                                                 | `lowcoder.org`                                        |
| `LOWCODER_DB_ENCRYPTION_SALT`               | Salt used for encrypting password                                   | `lowcoder.org`                                        |
| `LOWCODER_CORS_DOMAINS`         | CORS allowed domains                                                | `*`                                                   |
| `LOWCODER_MAX_ORGS_PER_USER`    | Default maximum organizations per user                              | `100`                                                 |
| `LOWCODER_MAX_MEMBERS_PER_ORG`  | Default maximum members per organization                            | `1000`                                                |
| `LOWCODER_MAX_GROUPS_PER_ORG`   | Default maximum groups per organization                             | `100`                                                 |
| `LOWCODER_MAX_APPS_PER_ORG`     | Default maximum applications per organization                       | `1000`                                                |
| `LOWCODER_MAX_DEVELOPERS`       | Default maximum developers                                          | `100`                                                 |
| `LOWCODER_MAX_QUERY_TIMEOUT`    | Lowcoder max query timeout (in seconds)                             | `120`                                                 |
| `LOWCODER_MAX_REQUEST_SIZE`     | Lowcoder max request size                                           | `20m`                                                 |
| `LOWCODER_WORKSPACE_MODE`       | SAAS to activate, ENTERPRISE to switch off - Workspaces             | `SAAS`                                                |
| `LOWCODER_EMAIL_SIGNUP_ENABLED` | Control is users can create their own Workspace when Sign Up        | `true`                                                |
| `LOWCODER_EMAIL_AUTH_ENABLED`   | Control to show the eMail Login after Admin user is set             | `true`                                                |

## Building node-service image

Standalone Lowcoder node-service (JS executor) image.

### Building the image

From project root run:

```
DOCKER_BUILDKIT=1 docker build -f deploy/docker/Dockerfile -t lowcoderorg/lowcoder-ce-node-service --target lowcoder-ce-node-service .
```

### Configuration

Image can be configured by setting environment variables.

| Environment variable            | Description                                                         | Value                                                   |
| --------------------------------| --------------------------------------------------------------------| ------------------------------------------------------- |
| `LOWCODER_PUID`                 | ID of user running services. It will own all created logs and data. | `9001`                                                  |
| `LOWCODER_PGID`                 | ID of group of the user running services.                           | `9001`                                                  |
| `LOWCODER_API_SERVICE_URL`      | Lowcoder API service URL                                            | `http://localhost:8080`                                 |

## Building web frontend image

Standalone Lowcoder web frontend image.

### Building the image

From project root run:

```
DOCKER_BUILDKIT=1 docker build -f deploy/docker/Dockerfile -t lowcoderorg/lowcoder-ce-frontend --target lowcoder-ce-frontend .
```

### Configuration

Image can be configured by setting environment variables.

| Environment variable            | Description                                                         | Value                                                   |
| --------------------------------| --------------------------------------------------------------------| ------------------------------------------------------- |
| `LOWCODER_PUID`                 | ID of user running services. It will own all created logs and data. | `9001`                                                  |
| `LOWCODER_PGID`                 | ID of group of the user running services.                           | `9001`                                                  |
| `LOWCODER_MAX_QUERY_TIMEOUT`    | Lowcoder max query timeout (in seconds)                             | `120`                                                 |
| `LOWCODER_MAX_REQUEST_SIZE`     | Lowcoder max request size                                           | `20m`                                                   |
| `LOWCODER_API_SERVICE_URL`      | Lowcoder API service URL                                            | `http://localhost:8080`                                 |
| `LOWCODER_NODE_SERVICE_URL`     | Lowcoder Node service (js executor) URL                             | `http://localhost:6060`                                 |


