import { DataSourcePlugin } from "lowcoder-sdk/dataSource";
import dataSourceConfig, { DataSourceDataType } from "./dataSourceConfig";
import queryConfig, { ActionDataType } from "./queryConfig";
import {
  AppConfigClient,
  CreateApplicationCommand,
  CreateConfigurationProfileCommand,
  CreateDeploymentStrategyCommand,
  CreateEnvironmentCommand,
  CreateExtensionAssociationCommand,
  CreateExtensionCommand,
  CreateHostedConfigurationVersionCommand,
  DeleteApplicationCommand,
  DeleteConfigurationProfileCommand,
  DeleteDeploymentStrategyCommand,
  DeleteEnvironmentCommand,
  GetApplicationCommand,
  GetEnvironmentCommand,
  GrowthType,
  ListApplicationsCommand,
  ListConfigurationProfilesCommand,
  ListEnvironmentsCommand,
  ReplicateTo,
  StartDeploymentCommand,
  UpdateApplicationCommand,
  UpdateConfigurationProfileCommand
} from "@aws-sdk/client-appconfig";
import {
  AppConfigDataClient,
  GetLatestConfigurationCommand,
  StartConfigurationSessionCommand
} from "@aws-sdk/client-appconfigdata";


function getClient(dataSourceConfig: DataSourceDataType) {
  const { accessKey, secretKey, region } = dataSourceConfig;
  return new AppConfigClient({
    credentials: {
      accessKeyId: accessKey,
      secretAccessKey: secretKey
    },
    region: region
  });
}

function getAppConfigDataClient(dataSourceConfig: DataSourceDataType) {
  const { accessKey, secretKey, region } = dataSourceConfig;
  return new AppConfigDataClient({
    credentials: {
      accessKeyId: accessKey,
      secretAccessKey: secretKey
    },
    region: region
  });
}

const appConfigPlugin: DataSourcePlugin<ActionDataType, DataSourceDataType> = {
  id: "appconfig",
  name: "AppConfig",
  category: "api",
  icon: "appconfig.svg",
  dataSourceConfig,
  queryConfig,
  validateDataSourceConfig: async function(dataSourceConfig) {
    const client = getClient(dataSourceConfig);
    const ret = await client.send(new ListApplicationsCommand({}));
    return {
      success: Array.isArray(ret.Items)
    };
  },
  run: async function(actionData, dataSourceConfig): Promise<any> {
    const client = getClient(dataSourceConfig);
    const appConfigDataClient = getAppConfigDataClient(dataSourceConfig);
    let input;
    switch (actionData.actionName) {
      case "ListApplications":
        logger.info("AppConfig ListApplications");
        return await client.send(
          new ListApplicationsCommand({
            MaxResults: actionData.MaxResults || undefined,
            NextToken: actionData.NextToken || undefined
          })
        );
      case "GetApplicationCommand":
        logger.info("AppConfig GetApplicationCommand");
        return await client.send(
          new GetApplicationCommand({
            ApplicationId: actionData.applicationId
          })
        );
      case "GetConfigurationCommand (Deprecated)":
        // input = { // GetConfigurationRequest
        //   Application: "STRING_VALUE", // required
        //   Environment: "STRING_VALUE", // required
        //   Configuration: "STRING_VALUE", // required
        //   ClientId: "STRING_VALUE", // required
        //   ClientConfigurationVersion: "STRING_VALUE",
        // };
        // return await client.send(
        //   new GetConfigurationCommand(input)
        // )
        break;
      case "GetLatestConfiguration":
        logger.info("AppConfig GetLatestConfiguration");
        let startConfigurationSessionInput = {
          ApplicationIdentifier: actionData.ApplicationIdentifier,
          EnvironmentIdentifier: actionData.EnvironmentIdentifier,
          ConfigurationProfileIdentifier: actionData.ConfigurationProfileIdentifier,
          RequiredMinimumPollIntervalInSeconds: actionData.RequiredMinimumPollIntervalInSeconds || undefined
        };
        let session = await appConfigDataClient.send(new StartConfigurationSessionCommand(startConfigurationSessionInput));

        input = { ConfigurationToken: session.InitialConfigurationToken };
        let output = await appConfigDataClient.send(new GetLatestConfigurationCommand(input));
        var decodedConfiguration = new TextDecoder().decode(output.Configuration);
        return JSON.parse(decodedConfiguration);
      case "CreateApplicationCommand":
        logger.info("AppConfig CreateApplicationCommand");
        return await client.send(new CreateApplicationCommand({
          Description: actionData.Description,
          Name: actionData.Name,
          Tags: actionData.Tags
        }));
      case "StartConfigurationSession":
        logger.info("AppConfig StartConfigurationSession");
      {
        let startConfigurationSessionInput = {
          ApplicationIdentifier: actionData.ApplicationIdentifier,
          EnvironmentIdentifier: actionData.EnvironmentIdentifier,
          ConfigurationProfileIdentifier: actionData.ConfigurationProfileIdentifier,
          RequiredMinimumPollIntervalInSeconds: actionData.RequiredMinimumPollIntervalInSeconds || undefined
        };
        return await appConfigDataClient.send(new StartConfigurationSessionCommand(startConfigurationSessionInput));
      }
      case "CreateConfigurationProfileCommand":
        logger.info("AppConfig CreateConfigurationProfileCommand");
        return await client.send(new CreateConfigurationProfileCommand({
          ApplicationId: actionData.ApplicationID,
          Description: actionData.Description,
          KmsKeyIdentifier: actionData.KmsKeyIdentifier || undefined,
          LocationUri: actionData.LocationUri,
          Name: actionData.Name,
          RetrievalRoleArn: actionData.RetrievalRoleArn || undefined,
          Tags: actionData.Tags,
          Type: actionData.Type,
          Validators: actionData.Validators
        }));
      case "CreateDeploymentStrategyCommand":
        logger.info("AppConfig CreateDeploymentStrategyCommand");
        return await client.send(new CreateDeploymentStrategyCommand({
          DeploymentDurationInMinutes: actionData.DeploymentDurationInMinutes,
          Description: actionData.Description,
          FinalBakeTimeInMinutes: actionData.FinalBakeTimeInMinutes,
          GrowthFactor: actionData.GrowthFactor,
          GrowthType: GrowthType[actionData.GrowthType as keyof typeof GrowthType],
          Name: actionData.Name,
          ReplicateTo: ReplicateTo[actionData.ReplicateTo as keyof typeof ReplicateTo],
          Tags: actionData.Tags
        }));
      case "CreateEnvironmentCommand":
        logger.info("AppConfig CreateEnvironmentCommand");
        return await client.send(new CreateEnvironmentCommand({
          ApplicationId: actionData.ApplicationId,
          Description: actionData.Description,
          Monitors: actionData.Monitors,
          Name: actionData.Name,
          Tags: actionData.Tags
        }));
      case "CreateExtensionAssociationCommand":
        logger.info("AppConfig CreateExtensionAssociationCommand");
        return await client.send(new CreateExtensionAssociationCommand({
          ExtensionIdentifier: actionData.ExtensionIdentifier,
          ExtensionVersionNumber: actionData.ExtensionVersionNumber,
          Parameters: actionData.Parameters,
          ResourceIdentifier: actionData.ResourceIdentifier,
          Tags: actionData.Tags
        }));
      case "CreateExtensionCommand":
        logger.info("AppConfig CreateExtensionCommand");
        return await client.send(new CreateExtensionCommand({
          Actions: actionData.Actions,
          Description: actionData.Description,
          LatestVersionNumber: actionData.LatestVersionNumber,
          Name: actionData.Name,
          Parameters: actionData.Parameters,
          Tags: actionData.Tags
        }));
      case "CreateHostedConfigurationVersionCommand":
        logger.info("AppConfig CreateHostedConfigurationVersionCommand");
        let content = new TextEncoder().encode(actionData.Content);
        return await client.send(new CreateHostedConfigurationVersionCommand({
          ApplicationId: actionData.ApplicationId,
          ConfigurationProfileId: actionData.ConfigurationProfileId,
          Content: content,
          ContentType: actionData.ContentType,
          Description: actionData.Description,
          LatestVersionNumber: actionData.LatestVersionNumber || undefined,
          VersionLabel: actionData.VersionLabel
        }));
      case "DeleteApplicationCommand":
        logger.info("AppConfig DeleteApplicationCommand");
        return await client.send(new DeleteApplicationCommand({ ApplicationId: actionData.applicationId }));
      case "DeleteConfigurationProfileCommand":
        logger.info("AppConfig DeleteConfigurationProfileCommand");
        return await client.send(new DeleteConfigurationProfileCommand({
          ApplicationId: actionData.ApplicationId,
          ConfigurationProfileId: actionData.ConfigurationProfileId
        }));
      case "DeleteDeploymentStrategyCommand":
        logger.info("AppConfig DeleteDeploymentStrategyCommand");
        return await client.send(new DeleteDeploymentStrategyCommand({ DeploymentStrategyId: actionData.DeploymentStrategyId }));
      case "DeleteEnvironmentCommand":
        logger.info("AppConfig DeleteEnvironmentCommand");
        return await client.send(new DeleteEnvironmentCommand({
          ApplicationId: actionData.ApplicationId,
          EnvironmentId: actionData.EnvironmentId,
        }));
      case "DeleteExtensionAssociationCommand":
        logger.info("AppConfig DeleteExtensionAssociationCommand");
        break;
      case "DeleteExtensionCommand":
        logger.info("AppConfig DeleteExtensionCommand");
        break;
      case "DeleteHostedConfigurationVersionCommand":
        logger.info("AppConfig DeleteHostedConfigurationVersionCommand");
        break;
      case "GetConfigurationProfileCommand":
        logger.info("AppConfig GetConfigurationProfileCommand");
        break;
      case "GetDeploymentCommand":
        logger.info("AppConfig GetDeploymentCommand");
        break;
      case "GetDeploymentStrategyCommand":
        logger.info("AppConfig GetDeploymentStrategyCommand");
        break;
      case "GetEnvironmentCommand":
        logger.info("AppConfig GetEnvironmentCommand");
        return await client.send(new GetEnvironmentCommand({
          ApplicationId: actionData.ApplicationId,
          EnvironmentId: actionData.EnvironmentId
        }));
      case "GetExtensionAssociationCommand":
        logger.info("AppConfig GetExtensionAssociationCommand");
        break;
      case "GetExtensionCommand":
        logger.info("AppConfig GetExtensionCommand");
        break;
      case "GetHostedConfigurationVersionCommand":
        logger.info("AppConfig GetHostedConfigurationVersionCommand");
        break;
      case "ListApplicationsCommand":
        logger.info("AppConfig ListApplicationsCommand");
        break;
      case "ListConfigurationProfilesCommand":
        logger.info("AppConfig ListConfigurationProfilesCommand");
        return await client.send(new ListConfigurationProfilesCommand({
          ApplicationId: actionData.ApplicationId
        }));
      case "ListDeploymentStrategiesCommand":
        logger.info("AppConfig ListDeploymentStrategiesCommand");
        break;
      case "ListDeploymentsCommand":
        logger.info("AppConfig ListDeploymentsCommand");
        break;
      case "ListEnvironmentsCommand":
        logger.info("AppConfig ListEnvironmentsCommand");
        return await client.send(new ListEnvironmentsCommand({
          ApplicationId: actionData.ApplicationId
        }));
      case "ListExtensionAssociationsCommand":
        logger.info("AppConfig ListExtensionAssociationsCommand");
        break;
      case "ListExtensionsCommand":
        logger.info("AppConfig ListExtensionsCommand");
        break;
      case "ListHostedConfigurationVersionsCommand":
        logger.info("AppConfig ListHostedConfigurationVersionsCommand");
        break;
      case "ListTagsForResourceCommand":
        logger.info("AppConfig ListTagsForResourceCommand");
        break;
      case "StartDeploymentCommand":
        logger.info("AppConfig StartDeploymentCommand");
        return await client.send(new StartDeploymentCommand({
          ApplicationId: actionData.ApplicationId,
          ConfigurationProfileId: actionData.ConfigurationProfileId,
          ConfigurationVersion: actionData.ConfigurationVersion || undefined,
          DeploymentStrategyId: actionData.DeploymentStrategyId,
          Description: actionData.Description,
          DynamicExtensionParameters: actionData.DynamicExtensionParameters,
          EnvironmentId: actionData.EnvironmentId,
          KmsKeyIdentifier: actionData.KmsKeyIdentifier || undefined,
          Tags: actionData.Tags
        }));
      case "StopDeploymentCommand":
        logger.info("AppConfig StopDeploymentCommand");
        break;
      case "TagResourceCommand":
        logger.info("AppConfig TagResourceCommand");
        break;
      case "UntagResourceCommand":
        logger.info("AppConfig UntagResourceCommand");
        break;
      case "UpdateApplicationCommand":
        logger.info("AppConfig UpdateApplicationCommand");
        return await client.send(new UpdateApplicationCommand({
          ApplicationId: actionData.ApplicationId,
          Name: actionData.Name,
          Description: actionData.Description
        }));
      case "UpdateConfigurationProfileCommand":
        logger.info("AppConfig UpdateConfigurationProfileCommand");
        return await client.send(new UpdateConfigurationProfileCommand({
          ApplicationId: actionData.ApplicationId,
          ConfigurationProfileId: actionData.ConfigurationProfileId,
          Description: actionData.Description,
          KmsKeyIdentifier: actionData.KmsKeyIdentifier,
          Name: actionData.Name,
          RetrievalRoleArn: actionData.RetrievalRoleArn,
          Validators: actionData.Validators
        }));
      case "UpdateDeploymentStrategyCommand":
        logger.info("AppConfig UpdateDeploymentStrategyCommand");
        break;
      case "UpdateEnvironmentCommand":
        logger.info("AppConfig UpdateEnvironmentCommand");
        break;
      case "UpdateExtensionAssociationCommand":
        logger.info("AppConfig UpdateExtensionAssociationCommand");
        break;
      case "UpdateExtensionCommand":
        logger.info("AppConfig UpdateExtensionCommand");
        break;
      case "ValidateConfigurationCommand":
        logger.info("AppConfig ValidateConfigurationCommand");
        break;
      default:
        logger.info(`Unable to find action ${actionData}`);
        break;
    }
  }
};

export default appConfigPlugin;
