import { default as Button } from "antd/es/button";
import { DeleteWrapper } from "pages/setting/idSource/styledComponents";
import { trans } from "i18n";
import { useState } from "react";
import { validateResponse } from "api/apiUtils";
import IdSourceApi from "api/idSourceApi";
import { CustomModal } from "lowcoder-design";
import history from "util/history";
import { OAUTH_PROVIDER_SETTING } from "constants/routesURL";
import { messageInstance } from "lowcoder-design/src/components/GlobalInstances";
import Flex from "antd/es/flex";
import Alert from "antd/es/alert";

export const DeleteConfig = (props: {
  id: string,
  allowDelete?: boolean,
  allowDisable?: boolean,
  isLastEnabledConfig?: boolean,
}) => {
  const [disableLoading, setDisableLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const handleDelete = (deleteConfig?: boolean) => {
    const setLoading = deleteConfig ? setDeleteLoading : setDisableLoading;
    const action = deleteConfig ? trans("delete") : trans("idSource.disable");
    CustomModal.confirm({
      title: trans("idSource.disableTip"),
      content: trans("idSource.disableContent", {action}),
      onConfirm: () => {
        setLoading(true);
        IdSourceApi.deleteConfig(props.id, deleteConfig)
        .then((resp) => {
          if (validateResponse(resp)) {
              const successMsg = deleteConfig ? trans("home.deleteSuccessMsg") : trans("idSource.disableSuccess");
              messageInstance.success(successMsg, 0.8, () =>
                history.push(OAUTH_PROVIDER_SETTING)
              );
            }
          })
          .catch((e) => messageInstance.error(e.message))
          .finally(() => setLoading(false));
      },
    });
  };
  return (
    <DeleteWrapper>
      <h4>{trans("idSource.dangerLabel")}</h4>
      <Alert
        className="danger-tip"
        description={trans("idSource.dangerTip")}
        type="warning"
        showIcon
      />
      {props.isLastEnabledConfig && (
        <Alert
          className="danger-tip"
          description={trans("idSource.lastEnabledConfig")}
          type="warning"
          showIcon
        />
      )}
      <Flex gap={8}>
        {props.allowDisable && (
          <Button danger disabled={props.isLastEnabledConfig} loading={disableLoading}  onClick={() => handleDelete()}>
            {trans("idSource.disable")}
          </Button>
        )}
        {props.allowDelete && (
          <Button type="primary" danger disabled={props.isLastEnabledConfig} loading={deleteLoading} onClick={() => handleDelete(true)}>
            {trans("delete")}
          </Button>
        )}
      </Flex>
    </DeleteWrapper>
  );
};
