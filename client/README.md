# Lowcoder frontend

## How to contribute

### Start a local backend server

#### Use prebuilt docker image

Simply run below command to start a backend server.

```bash
docker run -d --name lowcoder -p 3000:3000 -v "$PWD/stacks:/lowcoder-stacks" lowcoderorg/lowcoder-ce
```

For more information, view our [docs](../docs/self-hosting)

#### Build Docker image from source

1. Check out source code and change to source dir.
2. Use the command below to build Docker image :

```bash
docker build -f ./deploy/docker/Dockerfile -t lowcoder-dev .
```

3. Start

```bash
docker run -d --name lowcoder-dev -p 3000:3000 -v "$PWD/stacks:/lowcoder-stacks" lowcoder-dev
```

### Start develop

1. Check out source code.
2. Change to client dir in the repository root via cd client.
3. Run yarn to install dependencies: .
4. Start dev server: `LOWCODER_API_SERVICE_URL=http://localhost:3000 yarn start`.
5. After dev server starts successfully, it will be automatically opened in the default browser.

### Before submitting a pull request

In addition, before submitting a pull request, please make sure the following is done:

1. If you’ve fixed a bug or added code that should be tested and add unit test suite.
2. Run `yarn test` and ensure all test suites pass.
3. If you add new dependency, use yarn workspace lowcoder some-package to make sure yarn.lock is also updated.
