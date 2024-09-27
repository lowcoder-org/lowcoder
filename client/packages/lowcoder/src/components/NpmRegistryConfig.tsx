import { useEffect, useState } from "react";
import { HelpText } from "./HelpText";
import { FormInputItem, FormSelectItem, TacoSwitch } from "lowcoder-design";
import { Form } from "antd";
import { trans } from "@lowcoder-ee/i18n";
import { FormStyled } from "@lowcoder-ee/pages/setting/idSource/styledComponents";
import { SaveButton } from "@lowcoder-ee/pages/setting/styled";
import { NpmRegistryConfigEntry } from "@lowcoder-ee/redux/reducers/uiReducers/commonSettingsReducer";

type NpmRegistryConfigEntryInput = {
  url: string;
  scope: "global" | "organization" | "package";
  pattern: string;
  authType: "none" | "basic" | "bearer";
  credentials: string;
};

const initialRegistryConfig: NpmRegistryConfigEntryInput = {
  scope: "global",
  pattern: "",
  url: "",
  authType: "none",
  credentials: "",
};

interface NpmRegistryConfigProps {
  initialData?: NpmRegistryConfigEntry;
  onSave: (registryConfig: NpmRegistryConfigEntry|null) => void;
}

export function NpmRegistryConfig(props: NpmRegistryConfigProps) {
  const [initialConfigSet, setItialConfigSet] = useState<boolean>(false);
  const [enableRegistry, setEnableRegistry] = useState<boolean>(!!props.initialData);
  const [registryConfig, setRegistryConfig] = useState<NpmRegistryConfigEntryInput>(initialRegistryConfig);

  useEffect(() => {
    if (props.initialData && !initialConfigSet) {
      let initConfig: NpmRegistryConfigEntryInput = {...initialRegistryConfig};
      if (props.initialData) {
        const {scope} = props.initialData;
        const {type: scopeTye, pattern} = scope;
        const {url, auth} = props.initialData.registry;
        const {type: authType, credentials} = props.initialData.registry.auth;
        initConfig.scope = scopeTye;
        initConfig.pattern = pattern || "";
        initConfig.url = url;
        initConfig.authType = authType;
        initConfig.credentials = credentials || "";
      }

      form.setFieldsValue(initConfig);
      setRegistryConfig(initConfig);
      setEnableRegistry(true);
      setItialConfigSet(true);
    }
  }, [props.initialData, initialConfigSet]);

  useEffect(() => {
    if (!enableRegistry) {
      form.resetFields();
      setRegistryConfig(initialRegistryConfig);
    }
  }, [enableRegistry]);

  const [form] = Form.useForm();

  const handleRegistryConfigChange = async (key: string, value: string) => {      
    let keyConfg = { [key]: value };
    form.validateFields([key]);

    // Reset the pattern field if the scope is global
    if (key === "scope") {
      if (value !== "global") {
        registryConfig.scope !== "global" && form.validateFields(["pattern"]);
      } else {
        form.resetFields(["pattern"]);
        keyConfg = {
          ...keyConfg,
          pattern: ""
        };
      }
    }

    // Reset the credentials field if the auth type is none
    if (key === "authType") { 
      if (value !== "none") {
        registryConfig.authType !== "none" && form.validateFields(["credentials"]);
      } else {
        form.resetFields(["credentials"]);
        keyConfg = {
          ...keyConfg,
          credentials: ""
        };
      }
    }

    // Update the registry config
    setRegistryConfig((prevConfig) => ({
      ...prevConfig,
      ...keyConfg,
    }));
  };

  const scopeOptions = [
    {
      value: "global",
      label: "Global",
    },
    {
      value: "organization",
      label: "Organization",
    },
    {
      value: "package",
      label: "Package",
    },
  ];

  const authOptions = [
    {
      value: "none",
      label: "None",
    },
    {
      value: "basic",
      label: "Basic",
    },
    {
      value: "bearer",
      label: "Token",
    },
  ];

  const onFinsish = () => {
    const registryConfigEntry: NpmRegistryConfigEntry = {
      scope: {
        type: registryConfig.scope,
        pattern: registryConfig.pattern,
      },
      registry: {
        url: registryConfig.url,
        auth: {
          type: registryConfig.authType,
          credentials: registryConfig.credentials,
        },
      },
    };
    props.onSave(registryConfigEntry);
  }

  return (
    <FormStyled
          form={form}
          name="basic"
          layout="vertical"
          style={{ maxWidth: 440 }}
          initialValues={initialRegistryConfig}
          autoComplete="off"
          onValuesChange={(changedValues, allValues) => {
            for (const key in changedValues) {
              handleRegistryConfigChange(key, changedValues[key]);
            }
          }}
          onFinish={onFinsish}
        >
      <div style={{ paddingBottom: "10px"}}>
        <TacoSwitch  checked={enableRegistry} label={trans("npmRegistry.npmRegistryEnable")} onChange={function (checked: boolean): void {
          setEnableRegistry(checked);
          if (!checked) {
            form.resetFields();
          }
        } }></TacoSwitch>
      </div>
      <div hidden={!enableRegistry}>
        <div className="ant-form-item-label" style={{ paddingBottom: "10px" }}>
          <label>Registry</label>
        </div>
        <FormInputItem
          name={"url"}
          placeholder={trans("npmRegistry.npmRegistryUrl")}
          style={{ width: "544px", height: "32px", marginBottom: 12 }}
          value={registryConfig.url}
          rules={[{
              required: true,
              message: trans("npmRegistry.npmRegistryUrlRequired"),
            },
            {
              type: "url",
              message: trans("npmRegistry.npmRegistryUrlInvalid"),
            }
          ]}
        />
        <div className="ant-form-item-label" style={{ paddingBottom: "10px" }}>
          <label>Scope</label>
        </div>
        <div
          style={{ display: "flex", alignItems: "baseline", maxWidth: "560px" }}
        >
          <div style={{ flex: 1, paddingRight: "8px" }}>
            <FormSelectItem
              name={"scope"}
              placeholder={trans("npmRegistry.npmRegistryScope")}
              style={{ width: "264px", height: "32px", marginBottom: 12 }}
              initialValue={registryConfig.scope}
              options={scopeOptions}
            />
          </div>
          <div style={{ flex: 1, paddingRight: "8px" }}>
            <FormInputItem
              name={"pattern"}
              placeholder={trans("npmRegistry.npmRegistryPattern")}
              style={{ width: "264px", height: "32px", marginBottom: 12 }}
              hidden={
                registryConfig.scope !== "organization" &&
                registryConfig.scope !== "package"
              }
              value={registryConfig.pattern}
              rules={[{
                required: registryConfig.scope === "organization" || registryConfig.scope === "package",
                message: "Please input the package scope pattern",
              },
              {
                message: trans("npmRegistry.npmRegistryPatternInvalid"),
                validator: async (_, value) => {
                  if (registryConfig.scope === "global") {
                    return;
                  }

                  if (registryConfig.scope === "organization") {
                    if(!/^\@[a-zA-Z0-9-_.]+$/.test(value)) {
                      throw new Error("Input pattern not starting with @");
                    }
                  } else {
                    if(!/^[a-zA-Z0-9-_.]+$/.test(value)) {
                      throw new Error("Input pattern not valid");
                    }
                  }
                 }
              }
            ]}
            />
          </div>
        </div>
        <div className="ant-form-item-label" style={{ padding: "10px 0" }}>
          <label>{trans("npmRegistry.npmRegistryAuth")}</label>
        </div>
        <HelpText style={{ marginBottom: 12 }} hidden={registryConfig.authType === "none"}>
          {trans("npmRegistry.npmRegistryAuthCredentialsHelp")}
          </HelpText>
        <div style={{ display: "flex", alignItems: "baseline", maxWidth: "560px" }}>
          <div style={{ flex: 1, paddingRight: "8px" }}>
            <FormSelectItem
              name={"authType"}
              placeholder={trans("npmRegistry.npmRegistryAuthType")}
              style={{ width: "264px", height: "32px", marginBottom: 12 }}
              initialValue={registryConfig.authType}
              options={authOptions}
            />
          </div>
          <div style={{ flex: 1, paddingRight: "8px" }}>
            <Form.Item rules={[{required: true}]}>
              <FormInputItem
                name={"credentials"}
                placeholder={trans("npmRegistry.npmRegistryAuthCredentials")}
                style={{ width: "264px", height: "32px", marginBottom: 12 }}
                hidden={registryConfig.authType === "none"}
                value={registryConfig.credentials}
                rules={[{
                  message: trans("npmRegistry.npmRegistryAuthCredentialsRequired"),
                  validator: async (_, value) => {
                    if (registryConfig.authType === "none") {
                      return;
                    } 
                    if (!value) {
                      throw new Error("No credentials provided");
                    }
                   }
                }]}
              />
            </Form.Item>
          </div>
        </div>
      </div>
      <Form.Item>
        <SaveButton
          buttonType="primary"
          htmlType="submit"
          onClick={() => {
            if (!enableRegistry) {
              return props.onSave(null);
            }
          }
        }>
          {trans("advanced.saveBtn")}
        </SaveButton>
      </Form.Item>
    </FormStyled>
  );
}
