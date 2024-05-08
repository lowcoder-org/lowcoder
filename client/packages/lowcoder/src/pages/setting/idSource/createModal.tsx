import { CustomSelect } from "lowcoder-design";
import {
  CustomModalStyled,
} from "../styled";
import { trans } from "i18n";
import {
  FormStyled,
  SpanStyled,
} from "./styledComponents";
import { default as Form } from "antd/es/form";
import { default as Select } from "antd/es/select";
import { authConfig, AuthType } from "./idSourceConstants";
import { ServerAuthTypeInfo } from "constants/authConstants";
import { GeneralLoginIcon } from "assets/icons";
import _ from "lodash";
import GenericOAuthForm from "./OAuthForms/GenericOAuthForm";
import GeneralOAuthForm from "./OAuthForms/GeneralOAuthForm";

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

  const handleSave = () => {
    onConfigCreate();
  }

  function handleCancel() {
    closeModal();
    form.resetFields();
  }

  const authConfigOptions = Object.values(authConfig)
    .filter(config => {
      return !(oauthProvidersList.indexOf(config.sourceValue) > -1)
        || config.sourceValue === AuthType.Generic
    })
    .map(config => ({
      label: config.sourceName,
      value: config.sourceValue,
    }));

  const selectedAuthType = Form.useWatch('authType', form);;

  return (
    <CustomModalStyled
      width="500px"
      title={"Add OAuth Provider"}
      open={modalVisible}
      onCancel={handleCancel}
      showOkButton={false}
      showCancelButton={false}
      destroyOnClose
      afterClose={() => form.resetFields()}
    >
      <FormStyled
        form={form}
        name="basic"
        layout="vertical"
        style={{ maxWidth: '100%' }}
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
      </FormStyled>
      
      {selectedAuthType === AuthType.Generic && (
        <GenericOAuthForm
          authType={selectedAuthType}
          onSave={handleSave}
          onCancel={handleCancel}
        />
      )}

      {selectedAuthType !== AuthType.Generic && (
        <GeneralOAuthForm
          authType={selectedAuthType}
          onSave={handleSave}
          onCancel={handleCancel}
        />
      )}
    </CustomModalStyled>
  );
}

export default CreateModal;
