# Lowcoder frontend

## How to contribute

### Start a local backend server

#### Use prebuilt docker image

Simply run the below command to start a backend server.

```bash
docker run -d --name lowcoder -p 3000:3000 -v "$PWD/stacks:/lowcoder-stacks" lowcoderorg/lowcoder-ce
```

For more information, view our [docs](https://docs.lowcoder.cloud/lowcoder-documentation/setup-and-run/self-hosting)

#### Build Docker image from source

1. Check out the source code and change to source dir.
2. Use the command below to build a Docker image :

```bash
docker build -f ./deploy/docker/Dockerfile -t lowcoder-dev .
```

3. Start

```bash
docker run -d --name lowcoder-dev -p 3000:3000 -v "$PWD/stacks:/lowcoder-stacks" lowcoder-dev
```

### Start develop


1. Check out source code.
2. Change to **/client** dir in the source dir.

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

5. After dev server starts successfully, it will be automatically opened in the default browser.

### Before submitting a pull request

In addition, before submitting a pull request, please make sure the following is done:

1. If you’ve fixed a bug or added code that should be tested and add unit test suite.
2. Run test and ensure all test suites pass.

```bash
yarn test
```

3. If you add new dependency, use the yarn worspace tool to make sure yarn.lock is also updated.

```bash
yarn workspace lowcoder <package name>
```

### Developing and publishung UI components for Lowcoder

1. Initialization

Project initiation

```bash
yarn create Lowcoder-plugin <your plugin name>
```

Go to the project root

```bash
cd my-plugin
```

Start the development environment

```bash
yarn start
```

After executing yarn start, the browser is automatically opened and you enter the component development environment.
Please find more information in our [docs](https://docs.lowcoder.cloud/lowcoder-documentation/lowcoder-extension/develop-ui-components-for-apps)

2. Export components

To export all the components, use src/index.ts, for example:

```bash
import HelloWorldComp from "./HelloWorldComp";

export default {
  hello_world: HelloWorldComp,
};
```

import HelloWorldComp from "./HelloWorldComp";

3. Publish plugins

When you finish developing and testing the plugin, you can publish it into the npm registry. Login in to the npm registry locally, and then execute the following command:

```bash
yarn build --publish
```

You can check a code demo here:  [Code Demo on Github](https://github.com/lowcoder-org/lowcoder/tree/main/client/packages/lowcoder-plugin-demo)

# Deployment of the Lowcoder Frontend to Netlify (Local Build Flow)

## ⚙️ Prerequisites

* Node.js & Yarn installed
* Netlify CLI installed:

```bash
npm install -g netlify-cli
```

* Netlify CLI authenticated:

```bash
netlify login
```

* The project is linked to the correct Netlify site:

```bash
cd client
netlify link
```

---

## 🛠 Setup `netlify.toml` (only once)

Inside the `client/` folder, create or update `netlify.toml`:

```toml
[build]
  base = "client"
  command = "yarn workspace lowcoder build"
  publish = "client/packages/lowcoder/build"
```

This ensures Netlify uses the correct build and publish paths when building locally.

---

## 🚀 Deployment Steps

1️⃣ Navigate into the `client` folder:

```bash
cd client
```

2️⃣ Run local build (with Netlify environment variables injected):

```bash
netlify build
```

3️⃣ Deploy to production:

```bash
netlify deploy --prod --dir=packages/lowcoder/build
```

---

## 🔧 Notes

* This local build flow fully honors the environment variables configured in Netlify.
* No build happens on Netlify servers — only the deploy step runs on Netlify.
* This approach avoids Netlify’s build memory limits.