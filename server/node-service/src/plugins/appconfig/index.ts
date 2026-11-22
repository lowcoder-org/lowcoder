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
import { badRequest } from "../../common/error";


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
  name: "AWS AppConfig",
  category: "DevOps",
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
    const actionName: string = actionData.actionName;
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
      case "GetEnvironmentCommand":
        logger.info("AppConfig GetEnvironmentCommand");
        return await client.send(new GetEnvironmentCommand({
          ApplicationId: actionData.ApplicationId,
          EnvironmentId: actionData.EnvironmentId
        }));
      case "ListConfigurationProfilesCommand":
        logger.info("AppConfig ListConfigurationProfilesCommand");
        return await client.send(new ListConfigurationProfilesCommand({
          ApplicationId: actionData.ApplicationId
        }));
      case "ListEnvironmentsCommand":
        logger.info("AppConfig ListEnvironmentsCommand");
        return await client.send(new ListEnvironmentsCommand({
          ApplicationId: actionData.ApplicationId
        }));
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
      default:
        throw badRequest(`AppConfig action "${actionName}" is not supported`);
    }
  }
};

export default appConfigPlugin;
