# create-lowcoder-plugin

## How to build a Component Plugin

This script helps you to create a skeleton Lowcoder Component, which you can then publish on npm and use it as imported Plugin in any app.

1) Navigate your terminal or bash to /client
```bash
cd /client
```
2) execute the Plugin Builder Script. PLease name your plugin with the prefix lowcoder-comp-

```bash
npm create lowcoder-plugin lowcoder-comp-my-plugin
```
3) Navigate your terminal or bash to the newly created Plugin folder
```bash
cd /lowcoder-comp-my-plugin
```
4) install all dependencies:
```bash
yarn install
```
Now you can start your Plugin in the playground, so during development you have a realtime preview.
4) install all dependencies:
```bash
yarn start
```
This will start the local development server and open a browser on http://localhost:9000 

## How to publish a Component Plugin

With the following command you can publish the script to the NPM repository:
```bash
yarn build --publish
```