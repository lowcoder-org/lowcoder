# Server Setup

This document explains how to start Lowcoder server locally.

## System Prerequisites

Java - OpenJDK 17 Maven - Version 3+ (preferably 3.8+)

### MongoDB

If you don't have an available MongoDB, you can start a local MongoDB service with docker:

```shell
docker run -d  --name lowcoder-mongodb -p 27017:27017 -e MONGO_INITDB_DATABASE=lowcoder mongo
```

Configure the MongoDB connection URI in the server/api-service/lowcoder-server/src/main/resources/application-lowcoder.yml


### Redis

If you don't have an available Redis, you can start a local Redis service with docker:

```shell
docker run -d --name lowcoder-redis -p 6379:6379 redis
```

Configure the Redis connection URI in the server/api-service/lowcoder-server/src/main/resources/application-lowcoder.yml

## Clone the Repository

Now you can clone the Repository from Github: https://github.com/lowcoder-org/lowcoder

```shell
git@github.com:lowcoder-org/lowcoder.git
```

## Using VS Code

Create a launch.json file in the .vscode folder of your new opened workspace.
The contents should look like this:

```JSON
{
    "version": "0.0.1",
    "configurations": [
        {
            "type": "java",
            "name": "ServerApplication",
            "request": "launch",
            "mainClass": "org.lowcoder.api.ServerApplication",
            "projectName": "Lowcoder API Service",
            "vmArgs": "-Dpf4j.mode=development -Dpf4j.pluginsDir=lowcoder-plugins -Dspring.profiles.active=lowcoder -XX:+AllowRedefinitionToAddDeleteMethods --add-opens java.base/java.nio=ALL-UNNAMED"
        }
    ],
}
```

Important is here the command -Dspring.profiles.active= - as it is responsible for the selection of the right apllication settings file too. 

## Build locally

Next action is to build the project, so all lowcoder-plugins are built. This is a precondition for the lowcoder-server to start.

```shell
cd server/api-service

mvn clean package
```

## Start the debug locally

Make sure that the apllication settings file contains the full local configuration you need. The apllication settings file is named application-\<profile>.yaml and reside in server/api-service/lowcoder-server/src/main/resources. The profile relates to your setting in the launch file. For example: -Dspring.profiles.active=lowcoder would make sure, lowcoder seeks the right config at application-lowcoder.yaml

Navigate to the file server/api-service/lowcoder-server/src/main/java/org/lowcoder/api/ServerApplication.java 
This is the main class. Now you can use the IDE to "run" it or "debug it".

You should see after approx a minute "Server Started" in the Logs and can then access the API via http://localhost:8080

Before v2.4.0 you will get a HTTP Status 404 (which is ok in case).

From v2.4.1 on you should see the status message:

```JSON
{
    "code": 1,
    "message": "Lowcoder API is up and runnig",
    "success": true
}
```

## Using IntelliJ IDEA

Configure the Run/Debug configuration as shown below.

<table>
    <tr>
        <td style="width: 115px">JDK version</td>
        <td>Java 17  </td>
    </tr>
    <tr>
        <td>-cp </td>
        <td>lowcoder-server </td>
    </tr>
    <tr>
        <td>VM options </td>
        <td>-Dpf4j.mode=development -Dpf4j.pluginsDir=lowcoder-plugins -Dspring.profiles.active=lowcoder -XX:+AllowRedefinitionToAddDeleteMethods --add-opens java.base/java.nio=ALL-UNNAMED</td>
    </tr>
    <tr>
        <td>Main class </td>
        <td>com.lowcoder.api.ServerApplication </td>
    </tr>
</table>

## Build locally

Next action is to build the project, so all lowcoder-plugins are built. This is a precondition for the lowcoder-server to start.

```shell
cd server/api-service

mvn clean package
```

After Maven package runs successfully, you can start the Lowcoder server with IntelliJ IDEA.


## Start the Lowcoder server jar

```shell
java -Dpf4j.mode=development -Dspring.profiles.active=lowcoder -Dpf4j.pluginsDir=lowcoder-plugins -jar lowcoder-server/target/lowcoder-api-service.jar
```
or respective for debugging: Navigate to the file server/api-service/lowcoder-server/src/main/java/org/lowcoder/api/ServerApplication.java This is the main class. Now you can use the IDE to "run" it or "debug it".


Now, you can check the status of the service by visiting http://localhost:8080 through your browser.

For information on how to contribute to Lowcoder, please view our [Contribution Guide](https://docs.lowcoder.cloud/lowcoder-documentation/lowcoder-extension/opensource-contribution).