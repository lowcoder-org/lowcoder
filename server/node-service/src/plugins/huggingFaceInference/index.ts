import _ from "lodash";
import { ConfigToType, DataSourcePlugin } from "lowcoder-sdk/dataSource";
import { specsToOptions, version2spec } from "../../common/util";

const queryConfig = {
  type: "query",
  label: "Action",
  actions: [
    {
      actionName: "InvokeInferenceApi",
      category: "inferenceApi",
      label: "Inference API",
      params: [
        {
          key: "model",
          label: "Model Name",
          type: "textInput",
          placeholder: "deepset/roberta-base-squad2",
        },
        {
          key: "body",
          label: "Body",
          type: "jsonInput",
          defaultValue: JSON.stringify({ inputs: "" }, null, 4),
          tooltip:
            "Learn more about [Detailed Parameters](https://huggingface.co/docs/api-inference/detailed_parameters) of Hugging Face",
        },
      ],
    },
  ],
} as const;
const specs = {
  "v1.0": queryConfig
}
const dataSourceConfig = {
  type: "dataSource",
  params: [
    {
      type: "password",
      key: "token",
      label: "Access Token",
      rules: [{ required: true }],
      tooltip:
        "You can get an Access Token [in your profile setting page](https://huggingface.co/settings/tokens)",
    },
    {
      label: "Spec Version",
      key: "specVersion",
      type: "select",
      tooltip: "Version of the spec file.",
      placeholder: "v1.0",
      options: specsToOptions(specs)
    },
  ],
} as const;

type DataSourceConfigType = ConfigToType<typeof dataSourceConfig>;
type ActionConfigType = ConfigToType<typeof queryConfig>;

const huggingFaceInferencePlugin: DataSourcePlugin<ActionConfigType, DataSourceConfigType> = {
  id: "huggingFaceInference",
  name: "Hugging Face Inference",
  icon: "huggingFace.svg",
  category: "AI",
  dataSourceConfig,
  queryConfig: async (data) => {
    return version2spec(specs, data.specVersion);
  },
  run: async (actionData, dataSourceConfig) => {
    const response = await fetch(
      `https://api-inference.huggingface.co/models/${actionData.model}`,
      {
        headers: { Authorization: `Bearer ${dataSourceConfig.token}` },
        method: "POST",
        body: JSON.stringify(actionData.body),
      }
    );
    return response.json();
  },
};

export default huggingFaceInferencePlugin;
