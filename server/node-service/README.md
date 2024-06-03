# Welcome to Lowcoder Node Service

Lowcoder Node Service is a powerful tool to develop and host data source plugins using TypeScript.

## Getting Started

To start developing data source plugins, follow these simple steps:

1. Clone the Repository

You can clone the Repository from Github: https://github.com/lowcoder-org/lowcoder

```shell
git@github.com:lowcoder-org/lowcoder.git
```

2. Navigate to the Node Service directory in the Lowcoder Repository.

```bash
cd server/node-service
```

3. Install dependencies.

```bash
yarn install
```

4. Start the development server.

```bash
yarn dev
```

## What is a Data Source Plugin?

A data source plugin in Lowcoder is a JavaScript Object that defines various aspects of a data source, including its basic information, configuration form, validation logic, query configurations, and execution logic.

### Overall Definition of a Plugin

Each plugin is described by an object conforming to the `DataSourcePlugin` interface. Here's a brief overview:

- `id`: A unique identifier for the plugin.
- `name`: Display name of the plugin.
- `description`: Brief description of the plugin.
- `icon`: File name of the icon representing the plugin.
- `category`: Category of the data source (e.g., database, API).
- `dataSourceConfig`: Configuration form of the data source.
- `queryConfig`: Configuration for data source queries.
- `validateDataSourceConfig`: Validation logic for the data source configuration.
- `run`: Execution logic for data source queries.

## Developing Data Source Plugins

To develop a data source plugin, you'll mainly focus on:

- **Defining the basic information** of the plugin.
- **Defining the configuration form** of the data source.
- **Implementing the validation logic** for the configuration.
- **Defining the action list** for data source queries.
- **Implementing the execution logic** for actions.

### All plugins reside in the directory server/node-service/src/plugins

For detailed information on how to develop a plugin, refer to our [detailed Guide](https://docs.lowcoder.cloud/lowcoder-documentation/lowcoder-extension/develop-data-source-plugins).

For information on how to contribute to Lowcoder, please view our [Contribution Guide](https://docs.lowcoder.cloud/lowcoder-documentation/lowcoder-extension/opensource-contribution).


## Testing Your Plugin

Before publishing your plugin, it's crucial to test it thoroughly. Follow these steps:

1. Ensure your plugin is added to the plugin list in `src/plugins/index.ts`.
2. Start the `node-service` server by executing `yarn dev`.
3. Modify the backend configuration using the provided commands in the testing section of the guide.

---

Feel free to modify this readme according to your needs. If you have any questions or need further assistance, don't hesitate to reach out!

## Run the Node Service in Production

```bash
yarn build
yarn start
```
