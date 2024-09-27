import { DataSourcePlugin, DataSourcePluginFactory } from "lowcoder-sdk/dataSource";
import s3Plugin from "./s3";
import n8nPlugin from "./n8n";
import openApiPlugin from "./openApi";
import dynamoDBPlugin from "./dynamodb";
import firebasePlugin from "./firebase";
import couchdbPlugin from "./couchdb";
import wooCommercePlugin from "./woocommerce";
import openAiPlugin from "./openAi";
import athenaPlugin from "./athena";
// import duckdbPlugin from "./duckdb";
import lambdaPlugin from "./lambda";
import googleCloudStorage from "./googleCloudStorage";
import stripePlugin from "./stripe";
import asanaPlugin from "./asana";
import circleCiPlugin from "./circleCi";
import frontPlugin from "./front";
import githubPlugin from "./github";
import huggingFacePlugin from "./huggingFaceEndpoint";
import jiraPlugin from "./jira";
import oneSignalPlugin from "./oneSignal";
import sendGridPlugin from "./sendGrid";
import shopifyPlugin from "./shopify";
import slackPlugin from "./slack";
import supabasePlugin from "./supabase";
import cloudinaryPlugin from "./cloudinary";
import notionPlugin from "./notion";
import datadogPlugin from "./datadog";
import twilioPlugin from "./twilio";
import gitlabPlugin from "./gitlab";
import faunaPlugin from "./fauna";
import huggingFaceInferencePlugin from "./huggingFaceInference";
import didPlugin from "./did";
import bigQueryPlugin from "./bigQuery";
import ossPlugin from "./aliyunOss";
import appConfigPlugin from "./appconfig";
import tursoPlugin from "./turso";
import postmanEchoPlugin from "./postmanEcho";
import lowcoderPlugin from "./lowcoder";
import supabaseApiPlugin from "./supabaseApi";
import firebirdsqlPlugin from "./firebirdsql";

let plugins: (DataSourcePlugin | DataSourcePluginFactory)[] = [
  
  // Databases
  dynamoDBPlugin,
  couchdbPlugin,
  // duckdbPlugin,
  faunaPlugin,
  tursoPlugin,
  firebirdsqlPlugin,

  // Big Data
  athenaPlugin,
  bigQueryPlugin,

  // AI
  openAiPlugin,
  huggingFacePlugin,
  huggingFaceInferencePlugin,
  didPlugin,

  //DevOps
  appConfigPlugin,
  datadogPlugin,
  circleCiPlugin,

  // App Development
  openApiPlugin,
  postmanEchoPlugin,
  lowcoderPlugin,
  githubPlugin,
  gitlabPlugin,
  lambdaPlugin,
  firebasePlugin,
  supabaseApiPlugin,
  
  // Workflow
  n8nPlugin,

  // Messaging
  twilioPlugin,
  sendGridPlugin,
  oneSignalPlugin,
  
  // Assets
  s3Plugin,
  googleCloudStorage,
  supabasePlugin,
  cloudinaryPlugin,
  ossPlugin,
  
  // Project Management
  asanaPlugin,
  jiraPlugin,
  notionPlugin,
  slackPlugin,

  // CRM
  frontPlugin,

  // E-commerce
  stripePlugin,
  shopifyPlugin,
  wooCommercePlugin,
];

try {
  plugins = require("../ee/plugins").default;
  console.info("using ee plugins");
} catch { }

export default plugins;
