import { useState } from "react";
import { messageInstance, CustomSelect, CloseEyeIcon } from "lowcoder-design";
import {
  CustomModalStyled,
} from "../styled";
import { trans } from "i18n";
import {
  FormStyled,
  CheckboxStyled,
  SpanStyled,
  PasswordLabel
} from "./styledComponents";
import { Form, Input, Select } from "antd";
import IdSourceApi, { ConfigItem } from "api/idSourceApi";
import { validateResponse } from "api/apiUtils";
import { authConfig, AuthType } from "./idSourceConstants";
import { ServerAuthTypeInfo } from "constants/authConstants";
import { GeneralLoginIcon } from "assets/icons";

type CreateModalProp = {
  modalVisible: boolean;
  oauthProvidersList: AuthType[],
  closeModal: () => void;
  onConfigCreate: () => void;
};

function CreateModal(props: CreateModalProp) {
  const {
    modalVisible,
    oauthProvidersList,
    closeModal,
    onConfigCreate
  } = props;
  const [form] = Form.useForm();
  const [saveLoading, setSaveLoading] = useState(false);

  const handleOk = () => {
    form.validateFields().then(values => {
      console.log(values)
      saveAuthProvider(values)
    })
  }
  function saveAuthProvider(values: ConfigItem) {
    setSaveLoading(true);
    IdSourceApi.saveConfig(values)
      .then((resp) => {
        if (validateResponse(resp)) {
          messageInstance.success(trans("idSource.saveSuccess"));
        }
      })
      .catch((e) => messageInstance.error(e.message))
      .finally(() => {
        setSaveLoading(false);
        onConfigCreate();
      });
  }

  function handleCancel() {
    closeModal();
    form.resetFields();
  }

  const authConfigOptions = Object.values(authConfig)
    .filter(config => {
      return !(oauthProvidersList.indexOf(config.sourceValue) > -1)
    })
    .map(config => ({
      label: config.sourceName,
      value: config.sourceValue,
    }));

  return (
    <CustomModalStyled
      width="500px"
      title={"Add OAuth Provider"}
      open={modalVisible}
      okText={"Save and Enable"}
      okButtonProps={{
        loading: saveLoading
      }}
      onOk={handleOk}
      onCancel={handleCancel}
      destroyOnClose
      afterClose={() => form.resetFields()}
    >
      <FormStyled
        form={form}
        name="basic"
        layout="vertical"
        style={{ maxWidth: 440 }}
        autoComplete="off"
      >
        <Form.Item
          name="authType"
          label="Auth Type"
          rules={[{ required: true }]}
        >
          <CustomSelect
            placeholder={trans("idSource.formSelectPlaceholder", {
              label: 'Auth Type',
            })}
          >
            {authConfigOptions.map(config => (
              <Select.Option key={config.value} value={config.value}>
                <SpanStyled disabled={false}>
                  {
                    <img
                      src={ServerAuthTypeInfo[config.value]?.logo || GeneralLoginIcon}
                      alt={config.value}
                    />
                  }
                  <span>{config.label}</span>
                </SpanStyled>
              </Select.Option>
            ))}
          </CustomSelect>
        </Form.Item>
        <Form.Item
          name="clientId"
          label="Client ID"
          rules={[{ required: true }]}
        >
          <Input
            placeholder={trans("idSource.formPlaceholder", {
              label: 'Client ID',
            })}
            autoComplete="off"
          />
        </Form.Item>
        <Form.Item
          name="clientSecret"
          label={
            <PasswordLabel>
              <span>{"Client secret"}:</span>
              <CloseEyeIcon />
            </PasswordLabel>
          }
          rules={[{
            required: true,
            message: trans("idSource.formPlaceholder", {
              label: 'Client secret',
            })
          }]}
        >
          <Input
            type="password"
            placeholder={trans("idSource.encryptedServer")}
            autoComplete="off"
          />
        </Form.Item>
        <Form.Item className="register" name="enableRegister" valuePropName="checked">
          <CheckboxStyled>{trans("idSource.enableRegister")}</CheckboxStyled>
        </Form.Item>
      </FormStyled>
    </CustomModalStyled>
  );
}

export default CreateModal;
