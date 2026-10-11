import { useEffect, useMemo, useState } from "react";
import {
  messageInstance,
  CustomSelect,
  CloseEyeIcon,
  CustomModal,
  UnderlineCss,
} from "lowcoder-design";
import { trans } from "i18n";
import { default as Form } from "antd/es/form";
import { default as Input } from "antd/es/input";
import { validateResponse } from "api/apiUtils";
import _ from "lodash";
import { styled } from "styled-components";
import UserApi, { ApiKeyPayload } from "api/userApi";
import { ApiKeyType } from "./UserApiKeysCard";

const CustomModalStyled = styled(CustomModal)`
  button {
    margin-top: 20px;
  }
`;

const FormStyled = styled(Form)`
  .ant-form-item-control-input-content > input,
  .ant-input-password {
    &:hover {
      border-color: #8b8fa3;
    }

    &:focus,
    &.ant-input-affix-wrapper-focused {
      border-color: #3377ff;
    }
  }

  .ant-form-item-label > label {
    font-size: 13px;
    line-height: 19px;
    .has-tip {
      ${UnderlineCss};
    }
  }

  .ant-input-password-icon.anticon {
    color: #8b8fa3;

    &:hover {
      color: #222;
    }
  }

  &.ant-form-vertical .ant-form-item-label {
    padding-bottom: 4px;
  }

  .ant-form-item-explain-error {
    font-size: 12px;
    color: #f73131;
    line-height: 20px;
  }

  .ant-form-item-label
    > label.ant-form-item-required:not(.ant-form-item-required-mark-optional)::before {
    color: #f73131;
  }

  .ant-input-status-error:not(.ant-input-disabled):not(.ant-input-borderless).ant-input,
  .ant-input-status-error:not(.ant-input-disabled):not(.ant-input-borderless).ant-input:hover {
    border-color: #f73131;
  }

  .register {
    margin: -4px 0 20px 0;
  }

  .ant-input-prefix {
    margin-right: 8px;
    svg {
      path,
      rect:nth-of-type(1) {
        stroke: #8b8fa3;
      }
      rect:nth-of-type(2) {
        fill: #8b8fa3;
      }
    }
  }
`;

type CreateApiKeyModalProps = {
  modalVisible: boolean;
  closeModal: () => void;
  onConfigCreate: (apiKey?: ApiKeyType) => void;
};

function CreateApiKeyModal(props: CreateApiKeyModalProps) {
  const {
    modalVisible,
    closeModal,
    onConfigCreate
  } = props;
  const [form] = Form.useForm();
  const [saveLoading, setSaveLoading] = useState(false);
  const [apiKey, setApiKey] = useState<{id: string, token: string}>();

  const handleOk = () => {
    form.validateFields().then(values => {
      // console.log(values)
      createApiKey(values)
    })
  }
  function createApiKey(values: ApiKeyPayload) {
    setSaveLoading(true);

    UserApi.createApiKey(values)
      .then((resp) => {
        if (validateResponse(resp)) {
          messageInstance.success(trans("idSource.saveSuccess"));
          onConfigCreate(resp.data.data);
        }
      })
      .catch((e) => {
        messageInstance.error(e.message);
        onConfigCreate();
      })
      .finally(() => {
        setSaveLoading(false);
      });
  }

  function handleCancel() {
    closeModal();
    form.resetFields();
  }

  return (
    <CustomModalStyled
      width="500px"
      title={"Create API Key"}
      open={modalVisible}
      showOkButton
      showCancelButton
      okText={"Save"}
      okButtonProps={{
        loading: saveLoading
      }}
      onOk={handleOk}
      onCancel={handleCancel}
      destroyOnHidden
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
          name="name"
          label="Name"
          rules={[{ required: true }]}
        >
          <Input
            placeholder={trans("idSource.formPlaceholder", {
              label: 'Name'
            })}
          />
        </Form.Item>
        <Form.Item
          name="description"
          label="Description"
        >
          <Input
            placeholder={trans("idSource.formPlaceholder", {
              label: 'Description'
            })}
          />
        </Form.Item>
      </FormStyled>
    </CustomModalStyled>
  );
}

export default CreateApiKeyModal;
