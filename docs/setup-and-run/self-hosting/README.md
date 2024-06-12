# Self-hosting

In this article, you will be guided through how to host Lowcoder on your own server using Docker-Compose or Docker.

There are multiple ways of installation. We directly support:

* [Single Docker Image](https://github.com/lowcoder-org/lowcoder/tree/main/deploy/docker) to run with a single line of command.
* Multi-Docker Image deployment for scaling scenarios with [Docker Compose](https://github.com/lowcoder-org/lowcoder/blob/main/deploy/docker/docker-compose-multi.yaml)
* Kubernetes-based deployment with [HELM Charts](https://github.com/lowcoder-org/lowcoder/tree/main/deploy/helm).
* [Heroku based deployment](heroku.md)
* [Google Cloud Platform](google-cloud-platform.md)
* [Raspberry Pi](raspberry-pi.md)

## 1) Start easy:

For easy setup and deployment, we provide an [all-in-one image](https://hub.docker.com/r/lowcoderorg/lowcoder-ce) that bundles frontend, backend, and data persistence services altogether in one single container.

{% embed url="https://lowcoder.cloud/images/Screenshot-2023-08-27-at-21.50.36.png" %}

### All-in-one image <a href="#all-in-one" id="all-in-one"></a>

#### Prerequisites

* [Docker](https://docs.docker.com/get-docker/) (version 20.10.7 or above)
* [Docker-Compose](https://docs.docker.com/compose/install/) (version 1.29.2 or above)

{% hint style="info" %}
Recommended system spec: 1-core CPU and 2 GB RAM.

Windows users are recommended to use PowerShell for running the commands below.
{% endhint %}

In your working directory, run the following commands to make a directory named `Lowcoder` to store the data of Lowcoder:

```bash
mkdir lowcoder
cd lowcoder
```

#### Deploy

{% tabs %}
{% tab title="Docker-Compose (Recommended)" %}
Follow the steps below:

1. Download the configuration file by clicking [docker-compose.yml](https://github.com/lowcoder-org/lowcoder/blob/main/deploy/docker/docker-compose.yaml) or running the curl command:

{% code overflow="wrap" %}
```
curl https://raw.githubusercontent.com/lowcoder-org/lowcoder/main/deploy/docker/docker-compose.yaml -o $PWD/docker-compose.yml
```
{% endcode %}

2.  Start the Docker container by running this command:

    ```bash
    docker-compose up -d
    ```

    \
    The docker image, about 400 MB, is downloaded during the initial start-up.

    After downloading, it usually takes less than 30 seconds to start the service.
3.  Check the logs by running this command:

    ```bash
    docker logs -f lowcoder
    ```

    When you see `frontend`, `backend`, `redis`, and `mongo` `entered the RUNNING state`, the Lowcoder service has officially started:
4. Visit [**http://localhost:3000**](http://localhost:3000) and click **Sign up**. Lowcoder will automatically create a workspace for you, then you can start building your apps and invite members to your workspace.
{% endtab %}

{% tab title="Docker" %}
Run the command below:

{% code overflow="wrap" %}
```bash
docker run -d --name lowcoder -p 3000:3000 -v "$PWD/stacks:/lowcoder-stacks" lowcoderorg/lowcoder-ce
```
{% endcode %}
{% endtab %}
{% endtabs %}

#### Update to the latest version

{% tabs %}
{% tab title="Docker-Compose" %}
Run the following commands to update to the latest Lowcoder image:

```bash
docker-compose pull
docker-compose rm -fsv lowcoder
docker-compose up -d
```
{% endtab %}

{% tab title="Docker" %}
Run the following commands to update to the latest Lowcoder image:

{% code overflow="wrap" %}
```bash
docker pull lowcoderorg/lowcoder-ce
docker rm -fv Lowcoder
docker run -d --name Lowcoder -p 3000:3000 -v "$PWD/stacks:/Lowcoder-stacks" lowcoderorg/lowcoder-ce
```
{% endcode %}
{% endtab %}
{% endtabs %}

## 2) Scale

For bigger expected loads that need scaling in a cluster environment, we provide [separate images of backend and frontend services](https://hub.docker.com/u/lowcoderorg) with a customizable Dockerfile.

{% embed url="https://lowcoder.cloud/images/Screenshot-2023-08-27-at-21.56.51.png" %}
Multi-Image Installation to scale. API-Service & Node-Service can get scaled independently.
{% endembed %}

### Separate images: services in stateless containers <a href="#multi" id="multi"></a>

For bigger expected loads that need scaling in a cluster environment, we offer separate images for stateless containers of the backend and frontend service with a customizable Dockerfile. A well-functioning Lowcoder deployment consists of below services:

* **api-service**: Backend service.
* **node-service**: Backend service.
* **frontend**: Frontend service.
* **MongoDB**: Used for persisting data of users, apps, data sources, etc.
* **Redis**: Used for maintaining user sessions, rate-limiter, etc.

#### Prerequisites

* [Docker-Compose](https://docs.docker.com/compose/install/) (version 1.29.2 or above)

#### Deploy

1.  In your working directory, run the following commands to make a directory named `lowcoder` to store the data of Lowcoder:

    ```bash
    mkdir lowcoder
    cd lowcoder
    ```
2.  Download the configuration file by clicking [docker-compose-multi.yml](https://github.com/lowcoder-org/lowcoder/blob/main/deploy/docker/docker-compose-multi.yaml) or running the curl command:

    <pre class="language-bash" data-overflow="wrap"><code class="lang-bash"><strong>curl https://raw.githubusercontent.com/lowcoder-org/lowcoder/main/deploy/docker/docker-compose-multi.yaml -o $PWD/docker-compose-multi.yml
    </strong></code></pre>
3. Modify service configurations in the downloaded Dockerfile according to your needs:
   * **mongodb**: Start a new MongoDB instance on your host. You can delete this part and modify the environment variable `MONGODB_URI` of the **api-service** to use your own MongoDB.
   * **redis**: Start a new Redis instance on your host. You can delete this part and modify the environment variable `REDIS_URI` of the **api-service** to use your own Redis.
   * **api-service**: Required.
   * **node-service**: Required.
   * **frontend**: Required. Can be optional if you deploy the frontend on CDN.
4.  Start Docker containers by running this command:

    ```bash
    docker-compose -f docker-compose-multi.yml up -d
    ```
5. Visit [**http://localhost:3000**](http://localhost:3000) and click **Sign up**. Lowcoder will automatically create a workspace for you, then you can start building your apps and invite members to your workspace.

## 3) Update to the latest version <a href="#update-multi" id="update-multi"></a>

Run the following commands to update services to the latest in a Docker Compose installation:

{% hint style="info" %}
Please also have a look at this [migration / update guide](lowcoder-version-update.md)
{% endhint %}

```bash
docker-compose -f docker-compose-multi.yml pull
docker-compose -f docker-compose-multi.yml up -d
```

## 4) Customize the deployment

This section shows how to customize deployment configurations by setting environment variables.

If you have already started Docker containers, you need to restart the containers for new configurations to take effect. For example, the way to **restart** your container running an all-in-one image is:

{% tabs %}
{% tab title="Docker-Compose (Recommend)" %}
One single command:

```bash
docker-compose down
docker-compose up -d
```

It picks up configuration changes by stopping containers already in service and recreating new ones.
{% endtab %}

{% tab title="Docker" %}
Run the following commands to stop, remove the container already in service, and start up a new one using the newly customized deployment command.

```bash
docker stop lowcoder
docker rm lowcoder
# run your new docker run command
```
{% endtab %}
{% endtabs %}

Below are examples of configuring the all-in-one image by setting environment variables in `docker-compose.yml`. If you are self-hosting with separate images, modify the `lowcoder-api-service` part of the `docker-compose-multi.yml` file instead.

{% hint style="info" %}
For more information about configurations and environment variables, see [Configuration](https://github.com/lowcoder-org/lowcoder/tree/main/deploy/docker).
{% endhint %}

### Use your own MongoDB and Redis

By default, Lowcoder uses the built-in MongoDB and Redis installed inside the container, and you can replace them with your own MongoDB and Redis clusters.

{% tabs %}
{% tab title="Docker-Compose" %}
Add environment variables `MONGODB_URI` and `REDIS_URI` in `docker-compose.yml` downloaded in your working directory.\

{% endtab %}

{% tab title="Docker" %}
Add environment variables `MONGODB_URI` and `REDIS_URI` to the deployment command, as shown below:

{% code overflow="wrap" %}
```bash
docker run -d --name lowcoder -e MONGODB_URI=YOUR_MONGODB_URI REDIS_URI=YOUR_REDIS_URI -p 3000:3000 -v "$PWD/stacks:/lowcoder-stacks lowcoderorg/lowcoder-ce
```
{% endcode %}
{% endtab %}
{% endtabs %}

### Run as non-root user

By default, the supervisor will run under the user `uid=9001`. You can specify the uid by adding a docker environment variable `LOCAL_USER_ID` and setting its value to a different **number**, such as `10010`.

{% tabs %}
{% tab title="Docker-Compose" %}
Add an environment variable `LOCAL_USER_ID` in `docker-compose.yml` downloaded in your working directory.\

{% endtab %}

{% tab title="Docker" %}
Add an environment variable `LOCAL_USER_ID` to the deployment command, as shown below:

{% code overflow="wrap" %}
```bash
docker run -d --name lowcoder -e LOCAL_USER_ID=10010 -p 3000:3000 -v "$PWD/stacks:/lowcoder-stacks" lowcoderorg/lowcoder-ce
```
{% endcode %}
{% endtab %}
{% endtabs %}

## 5) Secure your deployment

### Install SSL certificate

With an SSL certificate, you can securely visit self-hosted Lowcoder with HTTPS protocol. Here are the steps to install your SSL certificate before starting a container:

{% tabs %}
{% tab title="Docker-Compose" %}
1. Copy `fullchain.pem` and `privkey.pem` to the `$PWD/stacks/ssl` directory.
2. In `$PWD/docker-compose.yml`, change the value of `ports` to `"3443:3443"`.\

{% endtab %}

{% tab title="Docker" %}
1. Copy `fullchain.pem` and `privkey.pem` to the `$PWD/stacks/ssl` directory.
2. Change the `ports` in the deployment command to `3443:3443`, as shown below:

{% code overflow="wrap" %}
```bash
docker run -d --name lowcoder -p 3443:3443 -v "$PWD/stacks:/lowcoder-stacks" lowcoderorg/lowcoder-ce
```
{% endcode %}
{% endtab %}
{% endtabs %}

{% hint style="info" %}
In cases where you have certificates with names: `server.crt` and `server.key`, you need to rename them first as follows:\
`server.crt` => `fullchain.pem`\
`server.key` => `privkey.pem`
{% endhint %}

## 6) Configure the Environment

{% hint style="info" %}
ENV Variables for Helm, Docker Compose, and Docker installations are to find in the most current version on our Github Repository.
{% endhint %}

### ENV Variables for the all-in-one image

This image contains all services needed to run Lowcoder platform in one container.

<table><thead><tr><th width="355">Environment variable</th><th width="263">Description</th><th>Default-Value</th></tr></thead><tbody><tr><td><code>LOWCODER_REDIS_ENABLED</code></td><td>If <strong>true</strong> redis server is started in the container</td><td><code>true</code></td></tr><tr><td><code>LOWCODER_MONGODB_ENABLED</code></td><td>If <strong>true</strong> mongo database is started in the container</td><td><code>true</code></td></tr><tr><td><code>LOWCODER_MONGODB_EXPOSED</code></td><td>If <strong>true</strong> mongo database accept connections from outside the docker</td><td><code>false</code></td></tr><tr><td><code>LOWCODER_API_SERVICE_ENABLED</code></td><td>If <strong>true</strong> lowcoder api-service is started in the container</td><td><code>true</code></td></tr><tr><td><code>LOWCODER_NODE_SERVICE_ENABLED</code></td><td>If <strong>true</strong> lowcoder node-service is started in the container</td><td><code>true</code></td></tr><tr><td><code>LOWCODER_FRONTEND_ENABLED</code></td><td>If <strong>true</strong> lowcoder web frontend is started in the container</td><td><code>true</code></td></tr><tr><td><code>LOWCODER_PUID</code></td><td>ID of user running services. It will own all created logs and data.</td><td><code>9001</code></td></tr><tr><td><code>LOWCODER_PGID</code></td><td>ID of group of the user running services.</td><td><code>9001</code></td></tr><tr><td><code>LOWCODER_MONGODB_URL</code></td><td>Mongo database connection string</td><td><code>mongodb://localhost:27017/lowcoder?authSource=admin</code></td></tr><tr><td><code>LOWCODER_REDIS_URL</code></td><td>Redis server URL</td><td><code>redis://localhost:6379</code></td></tr><tr><td><code>LOWCODER_DB_ENCRYPTION_PASSWORD</code></td><td>Encryption password</td><td><code>lowcoder.org</code></td></tr><tr><td><code>LOWCODER_DB_ENCRYPTION_SALT</code></td><td>Salt used for encrypting password</td><td><code>lowcoder.org</code></td></tr><tr><td><code>LOWCODER_CORS_DOMAINS</code></td><td>CORS allowed domains</td><td><code>*</code></td></tr><tr><td><code>LOWCODER_MAX_REQUEST_SIZE</code></td><td>Lowcoder max request size</td><td><code>20m</code></td></tr><tr><td><code>LOWCODER_MAX_QUERY_TIMEOUT</code></td><td>Lowcoder max query timeout (in seconds)</td><td><code>120</code></td></tr><tr><td><code>LOWCODER_API_SERVICE_URL</code></td><td>Lowcoder API service URL</td><td><code>http://localhost:8080</code></td></tr><tr><td><code>LOWCODER_NODE_SERVICE_URL</code></td><td>Lowcoder Node service (js executor) URL</td><td><code>http://localhost:6060</code></td></tr><tr><td><code>LOWCODER_MAX_ORGS_PER_USER</code></td><td>Default maximum organizations per user</td><td><code>100</code></td></tr><tr><td><code>LOWCODER_MAX_MEMBERS_PER_ORG</code></td><td>Default maximum members per organization</td><td><code>1000</code></td></tr><tr><td><code>LOWCODER_MAX_GROUPS_PER_ORG</code></td><td>Default maximum groups per organization</td><td><code>100</code></td></tr><tr><td><code>LOWCODER_MAX_APPS_PER_ORG</code></td><td>Default maximum applications per organization</td><td><code>1000</code></td></tr><tr><td><code>LOWCODER_MAX_DEVELOPERS</code></td><td>Default maximum developers</td><td><code>100</code></td></tr><tr><td><code>LOWCODER_WORKSPACE_MODE</code></td><td>SAAS to activate, ENTERPRISE to switch off - Workspaces</td><td><code>SAAS</code></td></tr><tr><td><code>LOWCODER_EMAIL_SIGNUP_ENABLED</code></td><td>Control if users create their own Workspace automatic when Sign Up</td><td><code>true</code></td></tr><tr><td><code>LOWCODER_CREATE_WORKSPACE_ON_SIGNUP</code></td><td>IF LOWCODER_WORKSPACE_MODE = SAAS, controls if a own workspace is created for the user after sign up</td><td><code>true</code></td></tr><tr><td><code>LOWCODER_MARKETPLACE_PRIVATE_MODE</code></td><td>Control if not to show Apps on the local Marketplace to anonymous users</td><td><code>true</code></td></tr></tbody></table>

Also, you should set the API-KEY secret, whcih should be a string of at least 32 random characters On linux/mac, generate one eg. with: head /dev/urandom | head -c 30 | shasum -a 256

<table><thead><tr><th width="354">Environment variable</th><th width="263">Description</th><th>Default-Value</th></tr></thead><tbody><tr><td><code>LOWCODER_API_KEY_SECRET</code></td><td>String to encrypt/sign API Keys that users may create</td><td></td></tr></tbody></table>

### ENV Variables for the api-service image

<table><thead><tr><th width="352">Environment variable</th><th width="267">Description</th><th>Default-Value</th></tr></thead><tbody><tr><td><code>LOWCODER_PUID</code></td><td>ID of user running services. It will own all created logs and data.</td><td><code>9001</code></td></tr><tr><td><code>LOWCODER_PGID</code></td><td>ID of group of the user running services.</td><td><code>9001</code></td></tr><tr><td><code>LOWCODER_MONGODB_URL</code></td><td>Mongo database connection string</td><td><code>mongodb://localhost:27017/lowcoder?authSource=admin</code></td></tr><tr><td><code>LOWCODER_REDIS_URL</code></td><td>Redis server URL</td><td><code>redis://localhost:6379</code></td></tr><tr><td><code>LOWCODER_DB_ENCRYPTION_PASSWORD</code></td><td>Encryption password</td><td><code>lowcoder.org</code></td></tr><tr><td><code>LOWCODER_DB_ENCRYPTION_SALT</code></td><td>Salt used for encrypting password</td><td><code>lowcoder.org</code></td></tr><tr><td><code>LOWCODER_CORS_DOMAINS</code></td><td>CORS allowed domains</td><td><code>*</code></td></tr><tr><td><code>LOWCODER_MAX_ORGS_PER_USER</code></td><td>Default maximum organizations per user</td><td><code>100</code></td></tr><tr><td><code>LOWCODER_MAX_MEMBERS_PER_ORG</code></td><td>Default maximum members per organization</td><td><code>1000</code></td></tr><tr><td><code>LOWCODER_MAX_GROUPS_PER_ORG</code></td><td>Default maximum groups per organization</td><td><code>100</code></td></tr><tr><td><code>LOWCODER_MAX_APPS_PER_ORG</code></td><td>Default maximum applications per organization</td><td><code>1000</code></td></tr><tr><td><code>LOWCODER_MAX_DEVELOPERS</code></td><td>Default maximum developers</td><td><code>100</code></td></tr><tr><td><code>LOWCODER_MAX_QUERY_TIMEOUT</code></td><td>Lowcoder max query timeout (in seconds)</td><td><code>120</code></td></tr><tr><td><code>LOWCODER_MAX_REQUEST_SIZE</code></td><td>Lowcoder max request size</td><td><code>20m</code></td></tr><tr><td><code>LOWCODER_WORKSPACE_MODE</code></td><td>SAAS to activate, ENTERPRISE to switch off - Workspaces</td><td><code>SAAS</code></td></tr><tr><td><code>LOWCODER_EMAIL_SIGNUP_ENABLED</code></td><td>Control is users can create their own Workspace when Sign Up</td><td><code>true</code></td></tr></tbody></table>

### ENV Variables for the node-service image

<table><thead><tr><th width="358">Environment variable</th><th width="263">Description</th><th>Default-Value</th></tr></thead><tbody><tr><td><code>LOWCODER_PUID</code></td><td>ID of user running services. It will own all created logs and data.</td><td><code>9001</code></td></tr><tr><td><code>LOWCODER_PGID</code></td><td>ID of group of the user running services.</td><td><code>9001</code></td></tr><tr><td><code>LOWCODER_API_SERVICE_URL</code></td><td>Lowcoder API service URL</td><td><code>http://localhost:8080</code></td></tr></tbody></table>

### ENV Variables for the web frontend image

<table><thead><tr><th width="360">Environment variable</th><th width="263">Description</th><th>Default-Value</th></tr></thead><tbody><tr><td><code>LOWCODER_PUID</code></td><td>ID of user running services. It will own all created logs and data.</td><td><code>9001</code></td></tr><tr><td><code>LOWCODER_PGID</code></td><td>ID of group of the user running services.</td><td><code>9001</code></td></tr><tr><td><code>LOWCODER_MAX_QUERY_TIMEOUT</code></td><td>Lowcoder max query timeout (in seconds)</td><td><code>120</code></td></tr><tr><td><code>LOWCODER_MAX_REQUEST_SIZE</code></td><td>Lowcoder max request size</td><td><code>20m</code></td></tr><tr><td><code>LOWCODER_API_SERVICE_URL</code></td><td>Lowcoder API service URL</td><td><code>http://localhost:8080</code></td></tr><tr><td><code>LOWCODER_NODE_SERVICE_URL</code></td><td>Lowcoder Node service (js executor) URL</td><td><code>http://localhost:6060</code></td></tr></tbody></table>

## Health checks

The API Service has an included health check endpoint from v2.4.1 on.

You can check the health of the running API Service and it's connected MongoDB & Redis by the following HTTP Call:

````bash
```
GET /api/status/health HTTP/1.1
```
````

In response, you will get a 200 Status code if the service is up and running and a JSON like this:

```json
{
    "status": "UP",
    "components": {
        "mongo": {
            "status": "UP",
            "components": {
                "reactiveMongoSlaveTemplate": {
                    "status": "UP"
                },
                "reactiveMongoTemplate": {
                    "status": "UP"
                }
            }
        },
        "ping": {
            "status": "UP"
        },
        "redis": {
            "status": "UP"
        }
    }
}
```

