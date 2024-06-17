# Opensource Contribution

By expanding the capabilities of Lowcode platforms through open source contributions, we not only broaden the spectrum of use cases but also exponentially increase their value to the community. We commit to supporting this growth in every way possible.

Here is a small guide on where to start and which style of development we prefer.

## Core System

Lowcoder has 3 main services, which are developed by the Community and us - the Lowcoder Team.

* [Frontend App](https://github.com/lowcoder-org/lowcoder/tree/main/client) - JavaScript, TypeScript, React, ANTd
* [API-Service](https://github.com/lowcoder-org/lowcoder/tree/main/server/api-service) - Java, Spring, Spring WebFlux - using MongoDB and Redis
* [Node-Service](https://github.com/lowcoder-org/lowcoder/tree/main/server/node-service) - Node.js, TypeScript

These 3 services are the main deliverables and the codebase of Lowcoder. We are happy to work with you on your contribution and express that Frontend App and API-Service are fairly complex systems. You would need to reserve a bit of time to get to know it and understand the details.

## Plugins and Extensions

Extension of Lowcoder for and with the Community happens mainly by the Plugins and Extensions at defined Interfaces. Lowcoder has the following Plugin Systems:

* [Visual Component Plugins](https://github.com/lowcoder-org/lowcoder-create-component-plugin)
* Plugin API of API Service
* [Data-Source Plugins in the Node-Service](https://github.com/lowcoder-org/lowcoder/tree/main/server/node-service/src/plugins)

{% hint style="success" %}
We suggest looking first into the development of these plugins, as they offer a good abstraction that speeds up development and offers a good and fast value for the community.
{% endhint %}

### Visual Component Plugin Builder

The main steps are:

* Fork of [this Repository](https://github.com/lowcoder-org/lowcoder-create-component-plugin)
* Local installation & preparation
* Developing & preview the Components
* Publish the Components to NPM

1. Forking of the Repository

To ensure you can develop your Component Plugin including as your repository, please fork (update) our lowcoder-org/lowcoder-create-component-plugin repository first.&#x20;

Find here more information: [https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/working-with-forks/fork-a-repo](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/working-with-forks/fork-a-repo)

2. Cloning of the new repository to work local

Now you can clone your new repository to develop local.

```
https://github.com/<your org>/lowcoder-create-component-plugin.git

or 

git@github.com:<your org>/lowcoder-create-component-plugin.git
```

3. Local Development preparation

Navigate your terminal or bash to your /root folder of the cloned repository to install general dependencies and the Lowcoder SDK

```bash
yarn install
```

Execute the Plugin Builder Script. Please name your plugin with the prefix **"lowcoder-comp-"** to make it easy for other users to find Lowcoder Component Pluins on NPM

```bash
npm create lowcoder-plugin lowcoder-comp-my-plugin
```

Navigate your terminal or bash to the newly created Plugin folder

```bash
cd lowcoder-comp-my-plugin
```

Install all dependencies:

```bash
yarn install
```

Start the Playground (Components Preview): Now you can start your Plugin in the playground, so during development you have a realtime preview.

```bash
yarn start
```

This will start the local development server and open a browser on [http://localhost:9000](http://localhost:9000/)

#### Start developing

After the preparation, a skeleton project for Lowcoder Component Plugin development was created and the SDK prepared. A new browser window should open at [http://localhost:9000](http://localhost:9000/) This is the Components Preview, which allows you to see your new component in action, as it would work in the Lowcoder Editor.

Data, methods, and properties are visible and interactive, so you can test your Component during development. The view will automatically refresh.

Find the /src folder in the new created project. Here are some demonstration files prepared. The Lowcoder Component Builder makes the development & publishing of multiple individual components as bundle possible. In the left navigation of the Components Preview you can switch between your components.

Before you publish, please cleanup all demonstration files like the "HelloWorldComp.tsx" and the references to HelloWorldComp.

Folder Structure:

**lowcoder-comp-my-plugin/**

* ├ icons/
* ├ locales/
* └ src/
  * └ index.ts

In "icons" you will place an SVG, which will later displayed to drag the component to the Lowcoder Editor Canvas. In "locales" you place translation files for all displayed texts of your components And in the "src" folder you place all code. Make sure, your Copmonent is referenced right in the index.ts file.

#### Publish a Component Plugin

With the following command you can publish the script to the NPM repository:

```bash
yarn build --publish
```

## Lowcoder Marketplace

Next to this direct code development contribution, we also encourage you to contribute smart solutions and reusable Apps and Modules on the [Lowcoder Marketplace](https://app.lowcoder.cloud/marketplace) so other users can see solution patterns and Application Building Blocks.&#x20;

You can follow the [Guide for Apps & Modules to publish on the Marketplace](../../workspaces-and-teamwork/lowcoder-marketplace.md)

## Code Contribution to Core System

We feel honored to work with you together on Lowcoder as a Platform! A good start and procedure that allows a smooth development process is like this:

1. [Fork the Repository](https://github.com/lowcoder-org/lowcoder/fork)
2. Clone it into your local environment / IDE
3. Create a workable local Development Environment
4. Create your Feature-Branch from **/main** branch to get the latest stable Environment
5. **Develop your magic and enjoy the ride!**
6. Raise a PR / Merge Request to [**/dev branch**](https://github.com/lowcoder-org/lowcoder/tree/dev) of the Lowcoder Main Repository
7. Follow up if / when we have questions at your Merge Request

Please ask us directly for any related questions so we can help you the fastest way. We kindly ask you to use our [Discord Server](https://discord.gg/An6PgWpegg) for these questions. Here, especially the [#contribute channel](https://discord.gg/An6PgWpegg).

### Frontend App

#### Start a local backend server

Simply run the below command to start a local backend server. This is the fasted way. The Backend typically changes less frequent, so you can just run the latest version&#x20;

```bash
docker run -d --name lowcoder -p 3000:3000 -v "$PWD/stacks:/lowcoder-stacks" lowcoderorg/lowcoder-ce
```

For more information, view our [docs](../../setup-and-run/self-hosting/)

**Build a Docker image from the source**

You also can build the image from the latest Source code or a special branch. However, for pure frontend development there are less reasons to go this way.

1. Check out the source code and change to source dir.
2. Use the command below to build a Docker image :

```bash
docker build -f ./deploy/docker/Dockerfile -t lowcoder-dev .
```

3. Start the fresh built Docker image

```bash
docker run -d --name lowcoder-dev -p 3000:3000 -v "$PWD/stacks:/lowcoder-stacks" lowcoder-dev
```

#### Start developing

As soon as the development server is ready you can access Lowcoder by [http://localhost:3000](http://localhost:3000). Now, you can start to develop locally.

1. Check out the source code.&#x20;

```bash
git@github.com:your-org/lowcoder.git
```

1. Change to **/client** dir in the source dir.

```bash
cd client
```

3. Run yarn to install dependencies.

```bash
yarn install
```

4. Start dev server:

```bash
LOWCODER_API_SERVICE_URL=http://localhost:3000 yarn start
```

After the dev server starts successfully, it will be automatically opened in the default browser. The local Frontend App is served by [Vite](https://vitejs.dev/). It chooses an available port automatically. Typically, it will open at [http://localhost:8000](http://localhost:8000)

Vite keeps the Browser for all changes current. That means you can see the effect of your development in most cases instantly. Sometimes, Vite rebuilds briefly and reloads the App in the Browser. In most cases, however, the changes are directly rendered. If you are not sure that your changes are already active in the Browser, you can stop and restart Vite at any time.

### API-Service

#### Preparation

To develop with us in the API-Service, you need to have Java - OpenJDK 17 Maven - Version 3+ (preferably 3.8+) installed. Also, it is helpful if you have knowledge of [Spring Webflux](https://docs.spring.io/spring-framework/reference/web/webflux.html)

You would need to have a MongoDB and a RedisDB ready and accessible.

If you don't have an available MongoDB, you can start a local MongoDB service with docker:

```bash
docker run -d  --name lowcoder-mongodb -p 27017:27017 -e MONGO_INITDB_DATABASE=lowcoder mongo
```

If you don't have an available Redis, you can start a local Redis service with docker:

```bash
docker run -d --name lowcoder-redis -p 6379:6379 redis
```

Both, you will need to register in the application-lowcoder.yml file.

```yaml
spring:
  data:
    mongodb:
      authentication-database: admin
      auto-index-creation: false
      uri: mongodb://localhost:27017/lowcoder?authSource=admin
    redis:
      url: redis://localhost:6379
```

{% hint style="info" %}
Configure the local runtime: \
./api-service/lowcoder-server/src/main/resources/application-lowcoder.yml
{% endhint %}

{% hint style="warning" %}
Add the VM Options:\
\-Dpf4j.mode=development -Dpf4j.pluginsDir=lowcoder-plugins -Dspring.profiles.active=lowcoder -XX:+AllowRedefinitionToAddDeleteMethods --add-opens java.base/java.nio=ALL-UNNAMED
{% endhint %}

#### Using VS Code <a href="#unsing-vs-code" id="unsing-vs-code"></a>

Create a launch.json file in the .vscode folder of your newly opened workspace. The contents should look like this:

```json
{
    "version": "0.0.1",
    "configurations": [
        {
            "type": "java",
            "name": "ServerApplication",
            "request": "launch",
            "mainClass": "org.lowcoder.api.ServerApplication",
            "projectName": "Lowcoder API Service",
            "vmArgs": "-Dpf4j.mode=development -Dpf4j.pluginsDir=./server/api-service/lowcoder-plugins -Dspring.profiles.active=lowcoder -XX:+AllowRedefinitionToAddDeleteMethods --add-opens java.base/java.nio=ALL-UNNAMED"
        }
    ],
}
```

Important is here the command -Dspring.profiles.active= - as it is responsible for the selection of the right apllication settings file too.

### Start the debug locally <a href="#start-the-debug-locally" id="start-the-debug-locally"></a>

Make sure that the apllication settings file contains the full local configuration you need.&#x20;

The apllication settings file is named application-\<profile>.yaml and reside in server/api-service/lowcoder-server/src/main/resources.&#x20;

The profile relates to your setting in the launch file. For example: -Dspring.profiles.active=lowcoder would make sure, lowcoder seeks the right config at application-lowcoder.yaml

Navigate to the file:\
server/api-service/lowcoder-server/src/main/java/org/lowcoder/api/ServerApplication.java \
\
This is the main class. Now you can use the IDE to "run" it or "debug it".

### Unsing IntelliJ IDEA <a href="#unsing-intellij-idea" id="unsing-intellij-idea"></a>

Configure the Run/Debug configuration as shown below.

| JDK version | Java 17                                                                                                                                                                          |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| -cp         | lowcoder-server                                                                                                                                                                  |
| VM options  | -Dpf4j.mode=development -Dpf4j.pluginsDir=lowcoder-plugins -Dspring.profiles.active=lowcoder -XX:+AllowRedefinitionToAddDeleteMethods --add-opens java.base/java.nio=ALL-UNNAMED |
| Main class  | com.lowcoder.api.ServerApplication                                                                                                                                               |

Next, execute the following commands in sequence

```shell
cd server
mvn clean package
```

After Maven package runs successfully, you can start the Lowcoder server with IntelliJ IDEA.

1. Check out the source code and change to source dir.
2. Use the Terminal of your IDE to execute the following commands. First, change to the server directory.

```bash
cd server/api-service
```

3. Now, you can build the sources.

```bash
mvn clean package -DskipTests

// or to include all Tests

mvn clean package
```

4. And run the Server

```bash
java -Dpf4j.mode=development -Dspring.profiles.active=lowcoder -Dpf4j.pluginsDir=lowcoder-plugins -jar lowcoder-server/target/lowcoder-server-1.0-SNAPSHOT.jar
```

{% hint style="info" %}
The main class is: com.lowcoder.api.ServerApplication
{% endhint %}

Now, you can check the status of the service by visiting [http://localhost:8080](http://localhost:8080) through your browser. By default, you should see an HTTP 404 error. (which, we know, is not the best welcome message ever).

{% hint style="warning" %}
If you run the Api-Service locally on Port 8080, remember the URL for the Frontend App would change to: LOWCODER\_API\_SERVICE\_URL=http://localhost:8080 yarn start
{% endhint %}

### Node Service

Please read more information in the following guides:

1. [How to develop a DataSouce Plugin](develop-data-source-plugins.md)
2. [Data Source Plugin Skeleton](https://github.com/lowcoder-org/lowcoder-datasource-plugin-skeleton)

#### Preparation

To develop and test Datasource Plugins locally in the Node-Service, you should have Node.js installed in Version from v14.18.0 or from v16.0.0.&#x20;

#### Start of Development

1. Check out the source code and change to source dir.
2. Use the Terminal of your IDE to execute the following commands. First, change to the server directory.

```bash
cd server/node-service
```

3. Install dependencies

```bash
yarn install
```

4. Now you can start the local development Server. We use Nodemon.

```bash
yarn dev
```

#### Bundle it for Production

```bash
yarn build 
yarn start
```

#### Plugin Skeleton Helper for OpenAPI Services

We have a helper script that enables you, based on an OpenAPI Specification, to bootstrap the development of a Datasource Plugin.&#x20;

If the data source you're going to develop as a plugin provides an [Open API Spec](https://en.wikipedia.org/wiki/OpenAPI\_Specification) definition file, then its plugin code can be quickly generated. Below is an example of generating Jira plugin code.

```
yarn genOpenApiPlugin --name Jira --url https://developer.atlassian.com/cloud/jira/platform/swagger-v3.v3.json
```

Sometimes, due to network issues, the spec file cannot be downloaded correctly. In this case, it can be manually downloaded to the file `src/plugins/<plugin id>/<plugin id>.spec.yaml(json)`.
