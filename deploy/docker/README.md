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

| Environment variable            | Description                                                         | Value                                                 |
| --------------------------------| --------------------------------------------------------------------| ----------------------------------------------------- |
| `REDIS_ENABLED`                 | If **true** redis server is started in the container                | `true`                                                |
| `MONGODB_ENABLED`               | If **true** mongo database is started in the container              | `true`                                                |
| `API_SERVICE_ENABLED`           | If **true** lowcoder api-service is started in the container        | `true`                                                |
| `NODE_SERVICE_ENABLED`          | If **true** lowcoder node-service is started in the container       | `true`                                                |
| `FRONTEND_ENABLED`              | If **true** lowcoder web frontend is started in the container       | `true`                                                |
| `PUID`                          | ID of user running services. It will own all created logs and data. | `9001`                                                |
| `PGID`                          | ID of group of the user running services.                           | `9001`                                                |
| `MONGODB_URL`                   | Mongo database connection string                                    | `mongodb://localhost:27017/lowcoder?authSource=admin` |
| `REDIS_URL`                     | Redis server URL                                                    | `redis://localhost:6379`                              |
| `ENABLE_USER_SIGN_UP`           | Enable registration of new users                                    | `true`                                                |
| `ENCRYPTION_PASSWORD`           | Encryption password                                                 | `lowcoder.org`                                        |
| `ENCRYPTION_SALT`               | Salt used for encrypting password                                   | `lowcoder.org`                                        |
| `CORS_ALLOWED_DOMAINS`          | CORS allowed domains                                                | `*`                                                   |
| `LOWCODER_MAX_REQUEST_SIZE`     | Lowcoder max request size                                           | `20m`                                                 |
| `LOWCODER_MAX_QUERY_TIMEOUT`    | Lowcoder max query timeout (in seconds)                             | `120`                                                 |
| `LOWCODER_API_SERVICE_URL`      | Lowcoder API service URL                                            | `http://localhost:8080`                               |
| `LOWCODER_NODE_SERVICE_URL`     | Lowcoder Node service (js executor) URL                             | `http://localhost:6060`                               |
| `DEFAULT_ORGS_PER_USER`         | Default maximum organizations per user                              | `100`                                                 |
| `DEFAULT_ORG_MEMBER_COUNT`      | Default maximum members per organization                            | `1000`                                                |
| `DEFAULT_ORG_GROUP_COUNT`       | Default maximum groups per organization                             | `100`                                                 |
| `DEFAULT_ORG_APP_COUNT`         | Default maximum applications per organization                       | `1000`                                                |
| `DEFAULT_DEVELOPER_COUNT`       | Default maximum developers                                          | `100`                                                 |


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
| `PUID`                          | ID of user running services. It will own all created logs and data. | `9001`                                                |
| `PGID`                          | ID of group of the user running services.                           | `9001`                                                |
| `MONGODB_URL`                   | Mongo database connection string                                    | `mongodb://localhost:27017/lowcoder?authSource=admin` |
| `REDIS_URL`                     | Redis server URL                                                    | `redis://localhost:6379`                              |
| `ENABLE_USER_SIGN_UP`           | Enable registration of new users                                    | `true`                                                |
| `ENCRYPTION_PASSWORD`           | Encryption password                                                 | `lowcoder.org`                                        |
| `ENCRYPTION_SALT`               | Salt used for encrypting password                                   | `lowcoder.org`                                        |
| `CORS_ALLOWED_DOMAINS`          | CORS allowed domains                                                | `*`                                                   |
| `DEFAULT_ORGS_PER_USER`         | Default maximum organizations per user                              | `100`                                                 |
| `DEFAULT_ORG_MEMBER_COUNT`      | Default maximum members per organization                            | `1000`                                                |
| `DEFAULT_ORG_GROUP_COUNT`       | Default maximum groups per organization                             | `100`                                                 |
| `DEFAULT_ORG_APP_COUNT`         | Default maximum applications per organization                       | `1000`                                                |
| `DEFAULT_DEVELOPER_COUNT`       | Default maximum developers                                          | `100`                                                 |
| `LOWCODER_MAX_QUERY_TIMEOUT`    | Lowcoder max query timeout (in seconds)                             | `120`                                                 |
| `LOWCODER_MAX_REQUEST_SIZE`     | Lowcoder max request size                                           | `20m`                                                 |



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
| `PUID`                          | ID of user running services. It will own all created logs and data. | `9001`                                                  |
| `PGID`                          | ID of group of the user running services.                           | `9001`                                                  |
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
| `PUID`                          | ID of user running services. It will own all created logs and data. | `9001`                                                  |
| `PGID`                          | ID of group of the user running services.                           | `9001`                                                  |
| `LOWCODER_MAX_QUERY_TIMEOUT`    | Lowcoder max query timeout (in seconds)                             | `120`                                                 |
| `LOWCODER_MAX_REQUEST_SIZE`     | Lowcoder max request size                                           | `20m`                                                   |
| `LOWCODER_API_SERVICE_URL`      | Lowcoder API service URL                                            | `http://localhost:8080`                                 |
| `LOWCODER_NODE_SERVICE_URL`     | Lowcoder Node service (js executor) URL                             | `http://localhost:6060`                                 |


