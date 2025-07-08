import React, { useState, useEffect } from "react";
import { DatasourceForm, FormInputItem, FormSection, FormSelectItem, FormInputPasswordItem, FormNumberInputItem, FormCheckboxItem } from "lowcoder-design";
import { DatabricksConfig } from "api/datasourceApi";
import { DatasourceFormProps } from "./datasourceFormRegistry";
import { useHostCheck } from "./useHostCheck";
import { trans } from "i18n";
import {
  DatabaseFormInputItem,
  DatasourceNameFormInputItem,
  encryptedPlaceholder,
  HostFormInputItem,
  PasswordFormInputItem,
  PortFormInputItem,
  SSLFormCheckboxItem,
  // UserNameFormInputItem, // removed
} from "../form";

export const DatabricksDatasourceForm = (props: DatasourceFormProps) => {
  const { form, datasource, size } = props;
  const datasourceConfig = datasource?.datasourceConfig as DatabricksConfig;
  const [usingUri, setUsingUri] = useState(datasourceConfig?.usingUri);
  const hostRule = useHostCheck();

  // Set username to "token" if Auth Mechanism is PAT (3)
  useEffect(() => {
    if (!usingUri && form.getFieldValue("authMechanism") === "3") {
      form.setFieldsValue({ username: "token" });
    }
  }, [usingUri, form.getFieldValue("authMechanism"), form]);

  return (
    <DatasourceForm form={form} preserve={false}>
      <FormSection $size={size}>
        <DatasourceNameFormInputItem
          placeholder={"My DatabricksDB1"}
          initialValue={datasource?.name}
        />
      </FormSection>

      <FormSection $size={size}>
        <FormSelectItem
          name={"usingUri"}
          label={trans("query.connectionType")}
          options={[
            { label: trans("query.regular"), value: "false" },
            { label: "JDBC URI", value: "true" },
          ]}
          initialValue={datasourceConfig?.usingUri ? "true" : "false"}
          afterChange={(value) => setUsingUri(value === "true")}
        />
      </FormSection>

      <FormSection $size={size}>
        {usingUri ? (
          <FormInputItem
            name={"jdbcUri"}
            label="JDBC URI"
            required={true}
            placeholder={encryptedPlaceholder}
            rules={[
              {
                required: !datasourceConfig?.usingUri && true,
                message: trans("query.uriRequiredMessage"),
              },
              {
                pattern: new RegExp(
                  "^jdbc:databricks:\/\/([a-zA-Z0-9\.-]+):([0-9]{2,5});httpPath=(?:sql\/1\.0\/warehouses\/[a-zA-Z0-9]+|sql\/protocolv1\/o\/[0-9]+\/[0-9]{4}-[0-9]{6}-[a-zA-Z0-9]+);AuthMech=(?:[0-9]+)(?:;[a-zA-Z0-9_]+=[^;]+)*;$"
                ),
                message: trans("query.uriErrorMessage"),
              },
              hostRule,
            ]}
          />
        ) : (
          <>

            <HostFormInputItem initialValue={datasourceConfig?.host} />
            <PortFormInputItem initialValue={"443"} port={datasourceConfig?.port} />

            
            <FormInputItem
              name={"httpPath"}
              label="Http Path"
              required={true}
              placeholder="/sql/1.0/warehouses/xxxxxxxxxxxxxxxx"
              initialValue={datasourceConfig?.httpPath}
              rules={[
                {
                  required: true,
                  message: "Http Path is required",
                },
              ]}
            />

            <FormSelectItem
              name={"authMechanism"}
              label={"Auth Mechanism"}
              options={[
                { label: "Personal Access Token", value: "3" }
              ]}
              initialValue={"3"}
              // Only one option, so no onChange needed
            />

            <FormInputPasswordItem
              name={"password"}
              label="Access Token"
              required={true}
              placeholder={encryptedPlaceholder}
              initialValue={datasourceConfig?.password}
              rules={[
                {
                  required: true,
                  message: "Personal Access Token is required",
                },
              ]}
            />

            <FormInputItem
              name={"catalog"}
              label="Catalog"
              required={false}
              placeholder="hive_metastore"
              initialValue={datasourceConfig?.catalog}
              rules={[]}
            />

            <DatabaseFormInputItem
              database={datasourceConfig?.database}
              label="Schema"
            />

            <SSLFormCheckboxItem usingSSl={datasourceConfig?.usingSsl} />
          </>
        )}
      </FormSection>
    </DatasourceForm>
  );
};
