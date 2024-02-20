import { default as Button } from "antd/es/button";
import { DeleteWrapper } from "pages/setting/idSource/styledComponents";
import { trans } from "i18n";
import { useState } from "react";
import { validateResponse } from "api/apiUtils";
import IdSourceApi from "api/idSourceApi";
import { DangerIcon, CustomModal } from "lowcoder-design";
import history from "util/history";
import { OAUTH_PROVIDER_SETTING } from "constants/routesURL";
import { messageInstance } from "lowcoder-design";

export const DeleteConfig = (props: { id: string }) => {
  const [deleteLoading, setDeleteLoading] = useState(false);
  const handleDelete = () => {
    CustomModal.confirm({
      title: trans("idSource.disableTip"),
      content: trans("idSource.disableContent"),
      onConfirm: () => {
        setDeleteLoading(true);
        IdSourceApi.deleteConfig(props.id)
          .then((resp) => {
            if (validateResponse(resp)) {
              messageInstance.success(trans("idSource.disableSuccess"), 0.8, () =>
                history.push(OAUTH_PROVIDER_SETTING)
              );
            }
          })
          .catch((e) => messageInstance.error(e.message))
          .finally(() => setDeleteLoading(false));
      },
    });
  };
  return (
    <DeleteWrapper>
      <div>{trans("idSource.dangerLabel")}</div>
      <div className="danger-tip">
        <DangerIcon />
        {trans("idSource.dangerTip")}
      </div>
      <Button loading={deleteLoading} onClick={() => handleDelete()}>
        {trans("idSource.disable")}
      </Button>
    </DeleteWrapper>
  );
};
