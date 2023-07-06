import { DataSourceDataType } from "./dataSourceConfig";
import { ActionDataType } from "./queryConfig";
import { fetch } from "../../common/fetch";
import { ServiceError } from "../../common/error";

export default async function run(action: ActionDataType, dataSourceConfig: DataSourceDataType) {
  const params = new URLSearchParams();
  params.append("payload", JSON.stringify({ channel: action.channel, text: action.message }));

  return await fetch(dataSourceConfig.webhookURL, {
    method: "POST",
    body: params,
  }).then(async (value) => {
    const msg = await value.text();
    if (!value.ok) {
      throw new ServiceError(msg, value.status)
    }
    return msg;
  });
}
