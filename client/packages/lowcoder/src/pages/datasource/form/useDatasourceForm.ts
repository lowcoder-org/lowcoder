import { default as Form } from "antd/es/form";
import { DatasourceApi } from "../../../api/datasourceApi";
import _ from "lodash";
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getUser } from "../../../redux/selectors/usersSelectors";
import { createDatasource, updateDatasource } from "../../../redux/reduxActions/datasourceActions";
import { trans } from "i18n";
import { registryDataSourcePlugin } from "constants/queryConstants";
import { DatasourceType } from "@lowcoder-ee/constants/queryConstants";
import { Datasource } from "@lowcoder-ee/constants/datasourceConstants";
import { getSnowflakeFormParams } from "pages/datasource/form/snowflakeDatasourceForm";
import { messageInstance } from "lowcoder-design";

export function useDatasourceForm() {
  const [testLoading, setTestLoading] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [isReadyToSubmit, setIsReadyToSubmit] = useState(true);
  const currentUser = useSelector(getUser);
  const orgId = currentUser.currentOrgId;
  const [form] = Form.useForm();
  const dispatch = useDispatch();

  return {
    testLoading: testLoading,
    createLoading: createLoading,
    form: form,
    isReadyToSubmit,
    setIsReadyToSubmit,
    genRequest: ({
      datasourceId,
      datasourceType,
    }: {
      datasourceId?: string;
      datasourceType: DatasourceType;
    }): Partial<Datasource> => {
      let config = {
        ...(_.omit(form.getFieldsValue(), ["name"]) as any),
      };
      switch (datasourceType) {
        case "mongodb":
        case "redis":
          config = {
            ...config,
            usingUri: form.getFieldsValue()["usingUri"] === "uri",
          };
          break;
        case "restApi":
          config = {
            ...config,
            authConfig: {
              type: form.getFieldsValue()["authConfigType"],
              authId: form.getFieldsValue()["authId"],
              username: form.getFieldsValue()["username"],
              password: form.getFieldsValue()["password"],
            },
            sslConfig: {
              sslCertVerificationType: form.getFieldValue("sslCertVerificationType"),
              selfSignedCert: form.getFieldValue("selfSignedCert"),
            },
          };
          break;
        case "graphql":
          config = {
            ...config,
            authConfig: {
              type: form.getFieldsValue()["authConfigType"],
              authId: form.getFieldsValue()["authId"],
            },
            sslConfig: {
              sslCertVerificationType: form.getFieldValue("sslCertVerificationType"),
              selfSignedCert: form.getFieldValue("selfSignedCert"),
            },
          };
          break;
        case "oracle":
          if (form.getFieldsValue()["usingSid"]) {
            config["sid"] = config["serviceName"];
            delete config["serviceName"];
          }
          break;
        case "snowflake":
          config = getSnowflakeFormParams(form);
      }

      return {
        name: form.getFieldsValue()["name"],
        type: datasourceType,
        organizationId: orgId,
        id: datasourceId,
        datasourceConfig: config,
      };
    },
    resolveTest: (request: Partial<Datasource>) => {
      form.validateFields().then(() => {
        setTestLoading(true);
        messageInstance.destroy();

        DatasourceApi.testDatasource(request)
          .then((response) => {
            response.data.code === 1
              ? messageInstance.success(trans("query.connectSuccessfully"))
              : messageInstance.error(response.data.message);
          })
          .catch((e) => {
            messageInstance.error(JSON.stringify(e));
          })
          .finally(() => setTestLoading(false));
      });
    },
    resolveCreate: ({
      datasourceId,
      request,
      afterCreate,
    }: {
      datasourceId?: string;
      request: Partial<Datasource>;
      afterCreate?: (datasource: Datasource) => void;
    }) => {
      form.validateFields().then(() => {
        setCreateLoading(true);
        messageInstance.destroy();

        const onSuccessCallback = (response: any) => {
          messageInstance.success(trans("query.saveSuccessfully"));
          const dataSource: Datasource = response.data.data;
          afterCreate?.(dataSource);
          if (dataSource.pluginDefinition) {
            registryDataSourcePlugin(dataSource.type, dataSource.id, dataSource.pluginDefinition);
          }
          setCreateLoading(false);
        };

        if (!datasourceId) {
          dispatch(createDatasource(request, onSuccessCallback, () => setCreateLoading(false)));
        } else {
          dispatch(updateDatasource(request, onSuccessCallback, () => setCreateLoading(false)));
        }
      });
    },
  };
}
