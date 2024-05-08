import { useEffect, useMemo, useState } from "react";
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
import { default as Form } from "antd/es/form";
import { default as Input } from "antd/es/input";
import { default as Select } from "antd/es/select";
import { default as Tooltip } from "antd/es/tooltip";
import IdSourceApi, { ConfigItem } from "api/idSourceApi";
import { validateResponse } from "api/apiUtils";
import { authConfig, AuthType, clientIdandSecretConfig, ItemType } from "./idSourceConstants";
import { ServerAuthTypeInfo } from "constants/authConstants";
import { GeneralLoginIcon } from "assets/icons";
import _ from "lodash";
import Steps from "antd/es/steps";
import Flex from "antd/es/flex";
import Button from "antd/es/button";
import axios from "axios";

const steps = [
  {
    title: 'Step 1',
    description: 'Provider endpoint',
  },
  {
    title: 'Step 2',
    description: 'Provider details',
  },
  {
    title: 'Step 3',
    description: 'Mapping',
  },
];

interface OpenIdProvider {
  issuer: string,
  authorization_endpoint: string,
  token_endpoint: string,
  userinfo_endpoint: string,
  jwks_uri?: string,
  scopes_supported: string[],
}

interface ConfigProvider {
  authType: string,
  source: string,
  sourceName: string,
  sourceDescription?: string,
  sourceIcon?: string,
  sourceCategory?: string,
  issuerUri: string,
  authorizationEndpoint: string,
  tokenEndpoint: string,
  userInfoEndpoint: string,
  jwksUri?: string,
  scope: string,
}

type AddGenericOauthModalProp = {
  modalVisible: boolean;
  oauthProvidersList: AuthType[],
  closeModal: () => void;
  onConfigCreate: () => void;
};

function AddGenericOauthModal(props: AddGenericOauthModalProp) {
  const {
    modalVisible,
    oauthProvidersList,
    closeModal,
    onConfigCreate
  } = props;
  const [form1] = Form.useForm();
  const [form2] = Form.useForm();
  const [form3] = Form.useForm();
  const [saveLoading, setSaveLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(2);
  const [issuerDetails, setIssuerDetails] = useState<ConfigProvider>();

  function saveAuthProvider(values: ConfigItem) {
    setSaveLoading(true);
    const config = {
      ...values,
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
        // onConfigCreate();
      });
  }

  const handleStep1Save = () => {
    form1.validateFields().then(async (values) => {
      setSaveLoading(true);
      const { issuerEndpoint } = values;
      const res = await axios.get<OpenIdProvider>(`${issuerEndpoint}/.well-known/openid-configuration`);
      setSaveLoading(false);

      if (res.status >= 400) {
        return null;
      }
      setIssuerDetails(() => {
        const issuer = {
          authType: AuthType.Generic,
          source: '',
          sourceName: '',
          issuerUri: res.data.issuer,
          authorizationEndpoint: res.data.authorization_endpoint,
          tokenEndpoint: res.data.token_endpoint,
          userInfoEndpoint: res.data.userinfo_endpoint,
          jwksUri: res.data.jwks_uri,
          scope: res.data.scopes_supported.join(','),
        };
        form2.setFieldsValue(issuer);
        return issuer;
      })
      setCurrentStep(currentStep => currentStep + 1);
    })
  }

  const handleStep2Save = () => {
    form2.validateFields().then(values => {
      // saveAuthProvider(values)
      setIssuerDetails(issuerDetails => ({
        ...issuerDetails,
        ...values,
      }))
      setCurrentStep(currentStep => currentStep + 1);
    })
  }

  const handleStep3Save = () => {
    form3.validateFields().then(values => {
      setIssuerDetails((issuerDetails: any) => {
        const updatedDetails = {
          ...issuerDetails,
          sourceMappings: {
            ...values,
          }
          // ...values,
        };
        // saveAuthProvider(updatedDetails);
        console.log('save details', updatedDetails);
        return updatedDetails;
      });
    })
  }

  const handleSave = () => {
    if (currentStep === 0) {
      return handleStep1Save();
    }
    if (currentStep === 1) {
      return handleStep2Save();
    }
    if (currentStep === 2) {
      return handleStep3Save();
    }
  }

  function handleCancel() {
    if (currentStep === 0) {
      closeModal();
      return form1.resetFields();
    }
    setCurrentStep(currentStep => currentStep - 1);
  }

  const authConfigOptions = Object.values(authConfig)
    .filter(config => {
      return !(oauthProvidersList.indexOf(config.sourceValue) > -1)
    })
    .map(config => ({
      label: config.sourceName,
      value: config.sourceValue,
    }));

  const selectedAuthType = Form.useWatch('authType', form1);;

  const authConfigForm = authConfig[AuthType.Generic].form;

  // useEffect(() => {
  //   if (!issuerDetails) return;

  //   console.log(issuerDetails);
  //   form2.setFieldsValue({
  //     ...issuerDetails,
  //   });
  // }, [issuerDetails]);

  return (
    <CustomModalStyled
      width="500px"
      title={"Add Generic OAuth Provider"}
      open={modalVisible}
      showOkButton={false}
      showCancelButton={false}
      // okText={"Save and Enable"}
      // okButtonProps={{
      //   loading: saveLoading
      // }}
      // onOk={handleOk}
      // onCancel={handleCancel}
      destroyOnClose
      onCancel={closeModal}
      afterClose={() => {
        setCurrentStep(0);
        form1.resetFields();
        form2.resetFields();
      }}
    >
      <Steps
        current={currentStep}
        items={steps}
        style={{marginBottom: '16px'}}
      />
      
      {currentStep === 0 && (
        <FormStyled
          form={form1}
          name="basic"
          layout="vertical"
          style={{ maxWidth: '100%' }}
          autoComplete="off"
        >
          <Form.Item
            name="issuerEndpoint"
            label="Well-Known / Issuer Endpoint"
            rules={[{ required: true }]}
          >
            <Input
              placeholder={trans("idSource.formPlaceholder", {
                label: 'Issuer Endpoint',
              })}
            />
          </Form.Item>
          <Flex justify="end" gap={'8px'}>
            <Button type="default" style={{margin: 0}} onClick={handleCancel}>
              Cancel
            </Button>
            <Button type="primary" style={{margin: 0}} onClick={handleSave} loading={saveLoading}>
              Save
            </Button>
          </Flex>
        </FormStyled>
      )}
      {currentStep === 1 && (
        <>
          <FormStyled
            form={form2}
            name="basic"
            layout="vertical"
            style={{ maxWidth: '100%' }}
            autoComplete="off"
          >
            {Object.entries(authConfigForm).map(([key, value]) => {
              const valueObject = _.isObject(value) ? (value as ItemType) : false;
              const required = true;
              const label = valueObject ? valueObject.label : value as string;
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
          </FormStyled>
          <Flex justify="end" gap={'8px'}>
            <Button type="default" style={{margin: 0}} onClick={handleCancel}>
              Cancel
            </Button>
            <Button type="primary" style={{margin: 0}} onClick={handleSave} loading={saveLoading}>
              Save
            </Button>
          </Flex>
        </>
      )}
      { currentStep === 2 && (
        <FormStyled
          form={form3}
          name="basic"
          layout="horizontal"
          style={{ maxWidth: '100%' }}
          autoComplete="off"
        >
          <Flex gap="10px" align="start">
            <Input
              readOnly
              value='UID'
              style={{flex: 1}}
            />
            <span> &#8594; </span>
            <Form.Item
              name="uid"
              rules={[{ required: true }]}
              style={{flex: 1}}
            >
              <Input
                placeholder={trans("idSource.formPlaceholder", {
                  label: 'UID',
                })}
              />
            </Form.Item>
          </Flex>
          <Flex gap="10px" align="start">
            <Input
              readOnly
              value='Email'
              style={{flex: 1}}
            />
            <span> &#8594; </span>
            <Form.Item
              name="email"
              // label="Email"
              rules={[{ required: true }]}
              style={{flex: 1}}
            >
              <Input
                placeholder={trans("idSource.formPlaceholder", {
                  label: 'Email',
                })}
              />
            </Form.Item>
          </Flex>
          <Flex gap="10px" align="start">
            <Input
              readOnly
              value='Username'
              style={{flex: 1}}
            />
            <span> &#8594; </span>
            <Form.Item
              name="username"
              // label="Username"
              rules={[{ required: true }]}
              style={{flex: 1}}
            >
              <Input
                placeholder={trans("idSource.formPlaceholder", {
                  label: 'Username',
                })}
              />
            </Form.Item>
          </Flex>
          <Flex gap="10px" align="start">
            <Input
              readOnly
              value='Avatar'
              style={{flex: 1}}
            />
            <span> &#8594; </span>
            <Form.Item
              name="avatar"
              // label="Avatar"
              rules={[{ required: true }]}
              style={{flex: 1}}
            >
              <Input
                placeholder={trans("idSource.formPlaceholder", {
                  label: 'Avatar',
                })}
              />
            </Form.Item>
          </Flex>
          <Flex justify="end" gap={'8px'}>
            <Button type="default" style={{margin: 0}} onClick={handleCancel}>
              Cancel
            </Button>
            <Button type="primary" style={{margin: 0}} onClick={handleSave} loading={saveLoading}>
              Save
            </Button>
          </Flex>
        </FormStyled>
      )}
    </CustomModalStyled>
  );
}

export default AddGenericOauthModal;
