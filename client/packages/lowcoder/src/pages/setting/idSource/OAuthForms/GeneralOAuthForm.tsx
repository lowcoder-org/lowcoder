import { useMemo, useState } from "react";
import { messageInstance, CloseEyeIcon } from "lowcoder-design";
import { trans } from "i18n";
import {
  FormStyled,
  PasswordLabel
} from "../styledComponents";
import { default as Form } from "antd/es/form";
import { default as Input } from "antd/es/input";
import { default as Tooltip } from "antd/es/tooltip";
import IdSourceApi, { ConfigItem } from "api/idSourceApi";
import { validateResponse } from "api/apiUtils";
import { authConfig, AuthType, clientIdandSecretConfig, ItemType } from "../idSourceConstants";
import _ from "lodash";
import Flex from "antd/es/flex";
import Button from "antd/es/button";

type GeneralOAuthFormProp = {
  authType: AuthType,
  onSave: () => void;
  onCancel: () => void;
};

function GeneralOAuthForm(props: GeneralOAuthFormProp) {
  const {
    authType,
    onSave,
    onCancel,
  } = props;
  const [form1] = Form.useForm();
  const [saveLoading, setSaveLoading] = useState(false);

  function saveAuthProvider(values: ConfigItem) {
    setSaveLoading(true);
    const config = {
      ...values,
      authType,
      enableRegister: true,
    }
    IdSourceApi.saveConfig(config)
      .then((resp) => {
        if (validateResponse(resp)) {
          messageInstance.success(trans("idSource.saveSuccess"));
        }
      })
      .catch((e) => messageInstance.error(e.message))
      .finally(() => {
        setSaveLoading(false);
        onSave();
      });
  }

  const handleSave = () => {
    form1.validateFields().then(values => {
      // console.log(values);
      saveAuthProvider(values);
    });
  }

  function handleCancel() {
    onCancel();
  }

  const authConfigForm = useMemo(() => {
    if(!authConfig[authType]) return clientIdandSecretConfig;
    return authConfig[authType].form;
  }, [authType])

  return (
    <FormStyled
      form={form1}
      name="general"
      layout="vertical"
      style={{ maxWidth: '100%' }}
      autoComplete="off"
    >
      {Object.entries(authConfigForm).map(([key, value]) => {
        const valueObject = _.isObject(value) ? (value as ItemType) : false;
        const required = true;
        const label = valueObject ? valueObject.label : value;
        const tip = valueObject && valueObject.tip;
        const isPassword = valueObject && valueObject.isPassword;
        return (
          <div key={key}>
            <Form.Item
              key={key}
              name={key}
              rules={[
                {
                  required,
                  message: trans("idSource.formPlaceholder", {
                    label,
                  }),
                },
              ]}
              label={
                isPassword ? (
                  <PasswordLabel>
                    <span>{label}:</span>
                    <CloseEyeIcon />
                  </PasswordLabel>
                ) : (
                  <Tooltip title={tip}>
                    <span className={tip ? "has-tip" : ""}>{label}</span>:
                  </Tooltip>
                )
              }
            >
              {isPassword ? (
                <Input
                  type={"password"}
                  placeholder={trans("idSource.encryptedServer")}
                  autoComplete={"one-time-code"}
                />
              ) : (
                <Input
                  placeholder={trans("idSource.formPlaceholder", {
                    label,
                  })}
                />
              )}
            </Form.Item>
          </div>
        );
      })}
      <Flex justify="end" gap={'8px'}>
        <Button
          type="default"
          style={{margin: 0}}
          onClick={handleCancel}
        >
          Cancel
        </Button>
        <Button
          type="primary"
          style={{margin: 0}}
          onClick={handleSave}
          loading={saveLoading}
        >
          Save
        </Button>
      </Flex>
    </FormStyled>
  );
}

export default GeneralOAuthForm;
