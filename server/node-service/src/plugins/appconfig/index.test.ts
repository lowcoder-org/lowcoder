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
  ListApplicationsCommand,
  ListConfigurationProfilesCommand,
  ListEnvironmentsCommand,
  StartDeploymentCommand,
  UpdateApplicationCommand,
  UpdateConfigurationProfileCommand,
} from "@aws-sdk/client-appconfig";
import {
  AppConfigDataClient,
  GetLatestConfigurationCommand,
  StartConfigurationSessionCommand,
} from "@aws-sdk/client-appconfigdata";
import appConfigPlugin from "./index";
import queryConfig from "./queryConfig";

/**
 * appconfig plugin: the SDK boundaries are AppConfigClient.prototype.send and
 * AppConfigDataClient.prototype.send. The fake records which client sent which command with which
 * input, and the credentials/region the client resolved, and answers per command class.
 */

const STATUS_BAD_REQUEST = 400;
const ACCESS_KEY = "AKIATESTKEY";
const SECRET_KEY = "test-secret-key";
const REGION = "ca-central-1";
const SESSION_TOKEN = "initial-token";
const CLIENT_CONFIG = "AppConfigClient";
const CLIENT_DATA = "AppConfigDataClient";

const dataSource = { accessKey: ACCESS_KEY, secretKey: SECRET_KEY, region: REGION };
type RunArgs = Parameters<typeof appConfigPlugin.run>;
const run = (a: Record<string, unknown>) => appConfigPlugin.run(a as unknown as RunArgs[0], dataSource, {} as RunArgs[2]);
const jsonBytes = (value: unknown) => Uint8Array.from(Buffer.from(typeof value === "string" ? value : JSON.stringify(value), "utf8"));

type Sent = { client: string; command: object; input: any; accessKeyId?: string; secretAccessKey?: string; region?: string };
let sent: Sent[];
let responders: Map<Function, (command: any) => any>;
let configSpy: jest.SpyInstance;
let dataSpy: jest.SpyInstance;
let infoSpy: jest.SpyInstance;

const respondTo = (commandClass: Function, responder: (command: any) => any) => responders.set(commandClass, responder);

function fakeSend(clientName: string) {
  return async function (this: any, command: any) {
    const credentials = await this.config.credentials();
    const region = await this.config.region();
    sent.push({
      client: clientName,
      command,
      input: command.input,
      accessKeyId: credentials.accessKeyId,
      secretAccessKey: credentials.secretAccessKey,
      region,
    });
    const responder = responders.get(command.constructor);
    if (!responder) {
      throw new Error(`unexpected command ${command.constructor.name}`);
    }
    return responder(command);
  } as any;
}

beforeEach(() => {
  sent = [];
  responders = new Map();
  infoSpy = jest.spyOn(logger, "info").mockImplementation(() => logger);
  configSpy = jest.spyOn(AppConfigClient.prototype, "send").mockImplementation(fakeSend(CLIENT_CONFIG));
  dataSpy = jest.spyOn(AppConfigDataClient.prototype, "send").mockImplementation(fakeSend(CLIENT_DATA));
});

afterEach(() => {
  configSpy.mockRestore();
  dataSpy.mockRestore();
  infoSpy.mockRestore();
});

/** one row per implemented action: the action as the UI sends it, and the exact input the SDK command must get */
type Row = { actionName: string; commandClass: Function; action: Record<string, unknown>; input: Record<string, unknown> };
const TAGS = { env: "test" };
const VALIDATORS = [{ Type: "JSON_SCHEMA", Content: "{}" }];
const MONITORS = [{ AlarmArn: "arn:aws:cloudwatch:alarm" }];
const CONTENT = "{\"key\": \"valüe €\"}";

const rows: Row[] = [
  {
    actionName: "ListApplications",
    commandClass: ListApplicationsCommand,
    action: { MaxResults: 5, NextToken: "tok" },
    input: { MaxResults: 5, NextToken: "tok" },
  },
  {
    actionName: "GetApplicationCommand",
    commandClass: GetApplicationCommand,
    action: { applicationId: "app-1" },
    input: { ApplicationId: "app-1" },
  },
  {
    actionName: "CreateApplicationCommand",
    commandClass: CreateApplicationCommand,
    action: { Name: "n", Description: "d", Tags: TAGS },
    input: { Name: "n", Description: "d", Tags: TAGS },
  },
  {
    actionName: "CreateConfigurationProfileCommand",
    commandClass: CreateConfigurationProfileCommand,
    action: {
      ApplicationID: "app-1", Description: "d", Name: "n", LocationUri: "hosted", RetrievalRoleArn: "arn:role",
      Type: "AWS.Freeform", Tags: TAGS, KmsKeyIdentifier: "kms-1", Validators: VALIDATORS,
    },
    input: {
      ApplicationId: "app-1", Description: "d", KmsKeyIdentifier: "kms-1", LocationUri: "hosted", Name: "n",
      RetrievalRoleArn: "arn:role", Tags: TAGS, Type: "AWS.Freeform", Validators: VALIDATORS,
    },
  },
  {
    actionName: "CreateDeploymentStrategyCommand",
    commandClass: CreateDeploymentStrategyCommand,
    action: {
      Name: "n", DeploymentDurationInMinutes: 10, Description: "d", FinalBakeTimeInMinutes: 5, GrowthFactor: 20,
      GrowthType: "LINEAR", ReplicateTo: "SSM_DOCUMENT", Tags: TAGS,
    },
    input: {
      DeploymentDurationInMinutes: 10, Description: "d", FinalBakeTimeInMinutes: 5, GrowthFactor: 20,
      GrowthType: "LINEAR", Name: "n", ReplicateTo: "SSM_DOCUMENT", Tags: TAGS,
    },
  },
  {
    actionName: "CreateEnvironmentCommand",
    commandClass: CreateEnvironmentCommand,
    action: { ApplicationId: "app-1", Name: "n", Description: "d", Monitors: MONITORS, Tags: TAGS },
    input: { ApplicationId: "app-1", Description: "d", Monitors: MONITORS, Name: "n", Tags: TAGS },
  },
  {
    actionName: "CreateExtensionAssociationCommand",
    commandClass: CreateExtensionAssociationCommand,
    action: { ExtensionIdentifier: "ext-1", ExtensionVersionNumber: 3, Parameters: { p: "v" }, ResourceIdentifier: "arn:res", Tags: TAGS },
    input: { ExtensionIdentifier: "ext-1", ExtensionVersionNumber: 3, Parameters: { p: "v" }, ResourceIdentifier: "arn:res", Tags: TAGS },
  },
  {
    actionName: "CreateExtensionCommand",
    commandClass: CreateExtensionCommand,
    action: { Name: "n", Description: "d", Parameters: { p: { Required: true } }, LatestVersionNumber: 2, Tags: TAGS, Actions: { PRE_START_DEPLOYMENT: [] } },
    input: {
      Actions: { PRE_START_DEPLOYMENT: [] }, Description: "d", LatestVersionNumber: 2, Name: "n",
      Parameters: { p: { Required: true } }, Tags: TAGS,
    },
  },
  {
    actionName: "CreateHostedConfigurationVersionCommand",
    commandClass: CreateHostedConfigurationVersionCommand,
    action: {
      ApplicationId: "app-1", ConfigurationProfileId: "prof-1", Content: CONTENT, ContentType: "application/json",
      LatestVersionNumber: 4, VersionLabel: "v1", Description: "d",
    },
    input: {
      ApplicationId: "app-1", ConfigurationProfileId: "prof-1", Content: jsonBytes(CONTENT), ContentType: "application/json",
      Description: "d", LatestVersionNumber: 4, VersionLabel: "v1",
    },
  },
  {
    actionName: "DeleteApplicationCommand",
    commandClass: DeleteApplicationCommand,
    action: { applicationId: "app-1" },
    input: { ApplicationId: "app-1" },
  },
  {
    actionName: "DeleteConfigurationProfileCommand",
    commandClass: DeleteConfigurationProfileCommand,
    action: { ApplicationId: "app-1", ConfigurationProfileId: "prof-1" },
    input: { ApplicationId: "app-1", ConfigurationProfileId: "prof-1" },
  },
  {
    actionName: "DeleteDeploymentStrategyCommand",
    commandClass: DeleteDeploymentStrategyCommand,
    action: { DeploymentStrategyId: "strat-1" },
    input: { DeploymentStrategyId: "strat-1" },
  },
  {
    actionName: "DeleteEnvironmentCommand",
    commandClass: DeleteEnvironmentCommand,
    action: { ApplicationId: "app-1", EnvironmentId: "env-1" },
    input: { ApplicationId: "app-1", EnvironmentId: "env-1" },
  },
  {
    actionName: "GetEnvironmentCommand",
    commandClass: GetEnvironmentCommand,
    action: { ApplicationId: "app-1", EnvironmentId: "env-1" },
    input: { ApplicationId: "app-1", EnvironmentId: "env-1" },
  },
  {
    actionName: "ListConfigurationProfilesCommand",
    commandClass: ListConfigurationProfilesCommand,
    action: { ApplicationId: "app-1" },
    input: { ApplicationId: "app-1" },
  },
  {
    actionName: "ListEnvironmentsCommand",
    commandClass: ListEnvironmentsCommand,
    action: { ApplicationId: "app-1" },
    input: { ApplicationId: "app-1" },
  },
  {
    actionName: "StartDeploymentCommand",
    commandClass: StartDeploymentCommand,
    action: {
      ApplicationId: "app-1", EnvironmentId: "env-1", DeploymentStrategyId: "strat-1", ConfigurationProfileId: "prof-1",
      ConfigurationVersion: "7", Description: "d", Tags: TAGS, KmsKeyIdentifier: "kms-1", DynamicExtensionParameters: { p: "v" },
    },
    input: {
      ApplicationId: "app-1", ConfigurationProfileId: "prof-1", ConfigurationVersion: "7", DeploymentStrategyId: "strat-1",
      Description: "d", DynamicExtensionParameters: { p: "v" }, EnvironmentId: "env-1", KmsKeyIdentifier: "kms-1", Tags: TAGS,
    },
  },
  {
    actionName: "UpdateApplicationCommand",
    commandClass: UpdateApplicationCommand,
    action: { ApplicationId: "app-1", Name: "n", Description: "d" },
    input: { ApplicationId: "app-1", Name: "n", Description: "d" },
  },
  {
    actionName: "UpdateConfigurationProfileCommand",
    commandClass: UpdateConfigurationProfileCommand,
    action: {
      ApplicationId: "app-1", ConfigurationProfileId: "prof-1", Description: "d", Name: "n", RetrievalRoleArn: "arn:role",
      KmsKeyIdentifier: "kms-1", Validators: VALIDATORS,
    },
    input: {
      ApplicationId: "app-1", ConfigurationProfileId: "prof-1", Description: "d", KmsKeyIdentifier: "kms-1", Name: "n",
      RetrievalRoleArn: "arn:role", Validators: VALIDATORS,
    },
  },
];

const IMPLEMENTED_ACTIONS = [...rows.map((r) => r.actionName), "StartConfigurationSession", "GetLatestConfiguration"].sort();

describe("implemented actions", () => {
  test.each(rows)("$actionName sends exactly one $commandClass.name through the AppConfig client and returns the result unchanged", async ({ actionName, commandClass, action, input }) => {
    const result = { marker: actionName };
    respondTo(commandClass, () => result);
    const returned = await run({ actionName, ...action });
    expect(returned).toBe(result);
    expect(sent).toHaveLength(1);
    expect(sent[0].client).toBe(CLIENT_CONFIG);
    expect(sent[0].command).toBeInstanceOf(commandClass);
    expect(sent[0].input).toStrictEqual(input);
    expect(sent[0].accessKeyId).toBe(ACCESS_KEY);
    expect(sent[0].secretAccessKey).toBe(SECRET_KEY);
    expect(sent[0].region).toBe(REGION);
  });

  test("an SDK error propagates", async () => {
    respondTo(GetApplicationCommand, () => {
      throw new Error("BadRequestException");
    });
    await expect(run({ actionName: "GetApplicationCommand", applicationId: "x" })).rejects.toThrow("BadRequestException");
  });

  test("CreateHostedConfigurationVersionCommand sends Content as the UTF-8 bytes of the text", async () => {
    respondTo(CreateHostedConfigurationVersionCommand, () => ({}));
    await run({ actionName: "CreateHostedConfigurationVersionCommand", Content: CONTENT });
    expect(Buffer.from(sent[0].input.Content).toString("hex")).toBe(Buffer.from(CONTENT, "utf8").toString("hex"));
  });
});

describe("falsy values that become undefined", () => {
  type Case = { actionName: string; commandClass: Function; actionKey: string; inputKey: string; falsy: unknown[]; value: unknown };
  const cases: Case[] = [
    { actionName: "ListApplications", commandClass: ListApplicationsCommand, actionKey: "MaxResults", inputKey: "MaxResults", falsy: [0, undefined], value: 7 },
    { actionName: "ListApplications", commandClass: ListApplicationsCommand, actionKey: "NextToken", inputKey: "NextToken", falsy: ["", undefined], value: "tok" },
    { actionName: "CreateConfigurationProfileCommand", commandClass: CreateConfigurationProfileCommand, actionKey: "KmsKeyIdentifier", inputKey: "KmsKeyIdentifier", falsy: ["", undefined], value: "kms" },
    { actionName: "CreateConfigurationProfileCommand", commandClass: CreateConfigurationProfileCommand, actionKey: "RetrievalRoleArn", inputKey: "RetrievalRoleArn", falsy: ["", undefined], value: "arn:role" },
    { actionName: "CreateHostedConfigurationVersionCommand", commandClass: CreateHostedConfigurationVersionCommand, actionKey: "LatestVersionNumber", inputKey: "LatestVersionNumber", falsy: [0, undefined], value: 3 },
    { actionName: "StartDeploymentCommand", commandClass: StartDeploymentCommand, actionKey: "ConfigurationVersion", inputKey: "ConfigurationVersion", falsy: ["", undefined], value: "9" },
    { actionName: "StartDeploymentCommand", commandClass: StartDeploymentCommand, actionKey: "KmsKeyIdentifier", inputKey: "KmsKeyIdentifier", falsy: ["", undefined], value: "kms" },
  ];
  const flat = cases.flatMap((c) => [
    ...c.falsy.map((f) => ({ ...c, label: `${JSON.stringify(f) ?? "undefined"} becomes undefined`, given: f, expected: undefined as unknown })),
    { ...c, label: `${JSON.stringify(c.value)} is passed`, given: c.value, expected: c.value },
  ]);

  test.each(flat)("$actionName $actionKey: $label", async ({ actionName, commandClass, actionKey, inputKey, given, expected }) => {
    respondTo(commandClass, () => ({}));
    await run({ actionName, [actionKey]: given });
    expect(sent).toHaveLength(1);
    expect(sent[0].input[inputKey]).toBe(expected);
  });

  test.each([
    ["GetLatestConfiguration"],
    ["StartConfigurationSession"],
  ])("%s: RequiredMinimumPollIntervalInSeconds 0 becomes undefined and a value is passed", async (actionName) => {
    respondTo(StartConfigurationSessionCommand, () => ({ InitialConfigurationToken: SESSION_TOKEN }));
    respondTo(GetLatestConfigurationCommand, () => ({ Configuration: jsonBytes({}) }));
    await run({ actionName, RequiredMinimumPollIntervalInSeconds: 0 });
    await run({ actionName, RequiredMinimumPollIntervalInSeconds: 45 });
    const sessions = sent.filter((s) => s.command instanceof StartConfigurationSessionCommand);
    expect(sessions).toHaveLength(2);
    expect(sessions[0].input.RequiredMinimumPollIntervalInSeconds).toBeUndefined();
    expect(sessions[1].input.RequiredMinimumPollIntervalInSeconds).toBe(45);
  });
});

describe("CreateDeploymentStrategyCommand enum mapping", () => {
  test.each([
    ["EXPONENTIAL", "EXPONENTIAL"],
    ["LINEAR", "LINEAR"],
    ["linear", undefined],
    ["", undefined],
    [undefined, undefined],
  ])("GrowthType %p is sent as %p", async (given, expected) => {
    respondTo(CreateDeploymentStrategyCommand, () => ({}));
    await run({ actionName: "CreateDeploymentStrategyCommand", GrowthType: given });
    expect(sent[0].input.GrowthType).toBe(expected);
  });

  test.each([
    ["NONE", "NONE"],
    ["SSM_DOCUMENT", "SSM_DOCUMENT"],
    ["ssm", undefined],
    [undefined, undefined],
  ])("ReplicateTo %p is sent as %p", async (given, expected) => {
    respondTo(CreateDeploymentStrategyCommand, () => ({}));
    await run({ actionName: "CreateDeploymentStrategyCommand", ReplicateTo: given });
    expect(sent[0].input.ReplicateTo).toBe(expected);
  });
});

describe("AppConfigData actions", () => {
  const sessionAction = {
    ApplicationIdentifier: "app-1",
    EnvironmentIdentifier: "env-1",
    ConfigurationProfileIdentifier: "prof-1",
    RequiredMinimumPollIntervalInSeconds: 30,
  };
  const sessionInput = {
    ApplicationIdentifier: "app-1",
    EnvironmentIdentifier: "env-1",
    ConfigurationProfileIdentifier: "prof-1",
    RequiredMinimumPollIntervalInSeconds: 30,
  };

  test("StartConfigurationSession sends one StartConfigurationSessionCommand through the AppConfigData client and returns its result", async () => {
    const result = { InitialConfigurationToken: SESSION_TOKEN };
    respondTo(StartConfigurationSessionCommand, () => result);
    expect(await run({ actionName: "StartConfigurationSession", ...sessionAction })).toBe(result);
    expect(sent).toHaveLength(1);
    expect(sent[0].client).toBe(CLIENT_DATA);
    expect(sent[0].input).toStrictEqual(sessionInput);
    expect(sent[0].accessKeyId).toBe(ACCESS_KEY);
    expect(sent[0].secretAccessKey).toBe(SECRET_KEY);
    expect(sent[0].region).toBe(REGION);
  });

  test("GetLatestConfiguration starts a session, passes its token to GetLatestConfiguration and returns the parsed JSON", async () => {
    respondTo(StartConfigurationSessionCommand, () => ({ InitialConfigurationToken: SESSION_TOKEN }));
    respondTo(GetLatestConfigurationCommand, () => ({ Configuration: jsonBytes({ feature: { enabled: true }, text: "valüe €" }) }));
    expect(await run({ actionName: "GetLatestConfiguration", ...sessionAction })).toStrictEqual({
      feature: { enabled: true },
      text: "valüe €",
    });
    expect(sent.map((s) => s.client)).toStrictEqual([CLIENT_DATA, CLIENT_DATA]);
    expect(sent[0].command).toBeInstanceOf(StartConfigurationSessionCommand);
    expect(sent[0].input).toStrictEqual(sessionInput);
    expect(sent[1].command).toBeInstanceOf(GetLatestConfigurationCommand);
    expect(sent[1].input).toStrictEqual({ ConfigurationToken: SESSION_TOKEN });
    for (const call of sent) {
      expect(call.accessKeyId).toBe(ACCESS_KEY);
      expect(call.secretAccessKey).toBe(SECRET_KEY);
      expect(call.region).toBe(REGION);
    }
  });

  test("GetLatestConfiguration with configuration bytes that are not JSON rejects with a SyntaxError", async () => {
    respondTo(StartConfigurationSessionCommand, () => ({ InitialConfigurationToken: SESSION_TOKEN }));
    respondTo(GetLatestConfigurationCommand, () => ({ Configuration: jsonBytes("plain: text") }));
    await expect(run({ actionName: "GetLatestConfiguration", ...sessionAction })).rejects.toThrow(SyntaxError);
  });
});

describe("validateDataSourceConfig", () => {
  const validate = () => appConfigPlugin.validateDataSourceConfig!(dataSource as any, {} as RunArgs[2]);

  test("sends ListApplications with an empty input through a client built from the data source; Items as an array is success", async () => {
    respondTo(ListApplicationsCommand, () => ({ Items: [] }));
    expect(await validate()).toStrictEqual({ success: true });
    expect(sent).toHaveLength(1);
    expect(sent[0].client).toBe(CLIENT_CONFIG);
    expect(sent[0].input).toStrictEqual({});
    expect(sent[0].accessKeyId).toBe(ACCESS_KEY);
    expect(sent[0].secretAccessKey).toBe(SECRET_KEY);
    expect(sent[0].region).toBe(REGION);
  });

  test("a response without Items is not success", async () => {
    respondTo(ListApplicationsCommand, () => ({}));
    expect(await validate()).toStrictEqual({ success: false });
  });
});

describe("actions that are offered but not implemented", () => {
  const UNIMPLEMENTED_ACTIONS = [
    "DeleteExtensionAssociationCommand",
    "DeleteExtensionCommand",
    "DeleteHostedConfigurationVersionCommand",
    "GetConfigurationCommand (Deprecated)",
    "GetConfigurationProfileCommand",
    "GetDeploymentCommand",
    "GetDeploymentStrategyCommand",
    "GetExtensionAssociationCommand",
    "GetExtensionCommand",
    "GetHostedConfigurationVersionCommand",
    "ListApplicationsCommand",
    "ListDeploymentStrategiesCommand",
    "ListDeploymentsCommand",
    "ListExtensionAssociationsCommand",
    "ListExtensionsCommand",
    "ListHostedConfigurationVersionsCommand",
    "ListTagsForResourceCommand",
    "StopDeploymentCommand",
    "TagResourceCommand",
    "UntagResourceCommand",
    "UpdateDeploymentStrategyCommand",
    "UpdateEnvironmentCommand",
    "UpdateExtensionAssociationCommand",
    "UpdateExtensionCommand",
    "ValidateConfigurationCommand",
    "NoSuchAction",
  ];

  test("the list is exactly the queryConfig actions that the implemented table does not cover (plus an unknown name for the default case)", () => {
    const offered = queryConfig.actions.map((a) => a.actionName as string);
    const unimplemented = offered.filter((n) => !IMPLEMENTED_ACTIONS.includes(n));
    expect([...unimplemented].sort()).toStrictEqual(UNIMPLEMENTED_ACTIONS.filter((n) => n !== "NoSuchAction").sort());
  });

  test.failing("B16: unimplemented actions reject with 400 and send nothing", async () => {
    // every action is run before anything is asserted, so one failure does not hide the others
    const outcomes: { actionName: string; rejected?: any; resolved?: unknown }[] = [];
    for (const actionName of UNIMPLEMENTED_ACTIONS) {
      outcomes.push(
        await run({ actionName }).then(
          (resolved) => ({ actionName, resolved }),
          (rejected) => ({ actionName, rejected })
        )
      );
    }
    const notRejectedWith400 = outcomes.filter((o) => o.rejected?.code !== STATUS_BAD_REQUEST).map((o) => o.actionName);
    expect(notRejectedWith400).toStrictEqual([]);
    expect(configSpy).not.toHaveBeenCalled();
    expect(dataSpy).not.toHaveBeenCalled();
  });
});
