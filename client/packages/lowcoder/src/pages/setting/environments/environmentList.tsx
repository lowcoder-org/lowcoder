// environmentList.tsx - Main listing page for environments
import React, { useState } from "react";
import { ADMIN_ROLE, SUPER_ADMIN_ROLE } from "constants/orgConstants";
import { AddIcon, CustomModal, DangerIcon, EditPopover } from "lowcoder-design";
import { useDispatch, useSelector } from "react-redux";
// Replace these with actual actions when available
// import { createEnvironmentAction, deleteEnvironmentAction, updateEnvironmentApiKeyAction } from "redux/reduxActions/environmentActions";
import styled from "styled-components";
import { trans, transToNode } from "i18n";
import { buildEnvironmentId } from "constants/routesURL";
import {
  CreateButton,
  EditBtn,
  OperationWrapper,
  PopoverIcon,
} from "../permission/styledComponents";
import { Table } from "components/Table";
import history from "util/history";
import { Level1SettingPageContentWithList, Level1SettingPageTitleWithBtn } from "../styled";
import { timestampToHumanReadable } from "util/dateTimeUtils";
import { isSaasMode } from "util/envUtils";
import { selectSystemConfig } from "redux/selectors/configSelectors";
import { default as Form } from "antd/es/form";
import { default as Input } from "antd/es/input";
import { default as Modal } from "antd/es/modal";
import { default as Tooltip } from "antd/es/tooltip";
import { getUser } from "redux/selectors/usersSelectors";
// Replace with actual selector when available
// import { getEnvironmentCreateStatus } from "redux/selectors/environmentSelectors";
import { StyledTag } from "./styledComponents";

const EnvironmentName = styled.div`
  display: flex;
  align-items: center;

  > span {
    font-size: 14px;
    color: #333;
    font-weight: 500;
  }
`;

const DomainName = styled.div`
  font-size: 13px;
  color: #8B8FA3;
`;

const TableStyled = styled(Table)`
  .ant-table-tbody > tr > td {
    padding: 11px 12px;
  }
`;

const Content = styled.div`
  &,
  .ant-form-item-label,
  .ant-form-item-label label {
    font-size: 13px;
    line-height: 19px;
  }

  .ant-input {
    font-size: 13px;
    line-height: 20px;
    padding: 5px 11px;

    &::-webkit-input-placeholder {
      color: #b8b9bf;
    }
  }

  .ant-form-item-label {
    margin-top: 13px;
    padding-bottom: 5px;

    label {
      display: inline;

      ::before {
        vertical-align: bottom;
      }
    }
  }

  .ant-form-item {
    margin-bottom: 12px;
  }

  .ant-form-item-explain-error {
    font-size: 13px;
    line-height: 12px;
    margin-top: 4px;
    position: absolute;
  }
`;

const Tip = styled.div`
  background: #fff3f1;
  border-radius: 4px;
  color: #333333;
  padding: 8px 13px 8px 16px;
  display: flex;
  line-height: 20px;
  margin-top: 8px;

  span {
    margin-left: 8px;
  }

  svg {
    min-width: 16px;
    width: 16px;
    height: 16px;
    margin-top: 2px;
  }
`;

const ApiKeyStatusIcon = styled.div`
  display: inline-flex;
  align-items: center;
  margin-left: 8px;
  
  svg {
    width: 16px;
    height: 16px;
    color: ${props => props.color || "#8B8FA3"};
  }
`;

type DataItemInfo = {
  id: string;
  name: string;
  domain: string;
  stage: string;
  isMaster: boolean;
  hasApiKey: boolean;
  createTime: string;
  del: boolean;
};

function EnvironmentSetting() {
  // For now, use mock data until we have Redux actions and selectors for environments
  const mockEnvironments = [
    {
      id: "env1",
      name: "Development",
      domain: "lowcoder-dev.company.com",
      stage: "development",
      isMaster: true,
      hasApiKey: true,
      createTime: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "env2",
      name: "Testing",
      domain: "lowcoder-test.company.com",
      stage: "testing",
      isMaster: false,
      hasApiKey: true,
      createTime: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "env3",
      name: "Production",
      domain: "lowcoder-prod.company.com", 
      stage: "production",
      isMaster: false,
      hasApiKey: false,
      createTime: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ];

  const user = useSelector(getUser);
  const environments = mockEnvironments; // Replace with actual environments from Redux when available
  const dispatch = useDispatch();
  const sysConfig = useSelector(selectSystemConfig);
  const [form] = Form.useForm();
  const [apiKeyForm] = Form.useForm();
  const [isApiKeyModalVisible, setIsApiKeyModalVisible] = useState(false);
  const [currentEnvironment, setCurrentEnvironment] = useState<DataItemInfo | null>(null);

  // Mock state for environment creation (replace with actual selector when available)
  const environmentCreateStatus = "idle"; // useSelector(getEnvironmentCreateStatus);

  const dataSource = environments.map((env) => ({
    id: env.id,
    name: env.name,
    domain: env.domain,
    stage: env.stage,
    isMaster: env.isMaster,
    hasApiKey: env.hasApiKey,
    createTime: env.createTime,
    del: environments.length > 1 && !env.isMaster, // Only allow deletion if there's more than one environment and not master
  }));

  // Function to get stage tag color
  const getStageColor = (stage: string) => {
    switch (stage.toLowerCase()) {
      case "development":
        return "#52C41A"; // Green
      case "testing":
        return "#FAAD14"; // Yellow/Orange
      case "production":
        return "#1890FF"; // Blue
      default:
        return "#8C8C8C"; // Gray
    }
  };

  const handleApiKeyModalOpen = (environment: DataItemInfo) => {
    setCurrentEnvironment(environment);
    setIsApiKeyModalVisible(true);
  };

  const handleApiKeyModalClose = () => {
    setIsApiKeyModalVisible(false);
    apiKeyForm.resetFields();
  };

  const handleApiKeySubmit = () => {
    apiKeyForm.submit();
    apiKeyForm.validateFields().then((values) => {
      // Replace with actual action when available
      // dispatch(updateEnvironmentApiKeyAction({
      //   environmentId: currentEnvironment.id,
      //   apiKey: values.apiKey
      // }));
      console.log("Update API Key for environment", currentEnvironment?.id, values.apiKey);
      handleApiKeyModalClose();
    });
  };

  return (
    <Level1SettingPageContentWithList>
      <Level1SettingPageTitleWithBtn>
        {trans("settings.environments")}
        {/* Adding API Keys is handled via existing environments */}
      </Level1SettingPageTitleWithBtn>
      <div>
        <TableStyled
          tableLayout={"auto"}
          scroll={{ x: "100%" }}
          pagination={false}
          onRow={(record) => ({
            onClick: () => history.push(buildEnvironmentId((record as DataItemInfo).id)),
          })}
          columns={[
            {
              title: trans("environmentSettings.name"),
              dataIndex: "name",
              ellipsis: true,
              render: (_, record: any) => {
                return (
                  <EnvironmentName>
                    <span>{record.name}</span>
                    {record.isMaster && (
                      <Tooltip title={trans("environmentSettings.masterEnvironment")}>
                        <StyledTag color="#722ED1">Master</StyledTag>
                      </Tooltip>
                    )}
                  </EnvironmentName>
                );
              },
            },
            {
              title: trans("environmentSettings.domain"),
              dataIndex: "domain",
              ellipsis: true,
              render: (value) => <DomainName>{value}</DomainName>,
            },
            {
              title: trans("environmentSettings.stage"),
              dataIndex: "stage",
              ellipsis: true,
              render: (value) => (
                <StyledTag color={getStageColor(value)}>
                  {value}
                </StyledTag>
              ),
            },
            {
              title: trans("environmentSettings.apiKey"),
              dataIndex: "hasApiKey",
              ellipsis: true,
              render: (hasApiKey) => (
                <span>
                  {hasApiKey ? 
                    <span style={{ color: "#52C41A" }}>
                      {trans("environmentSettings.apiKeyConfigured")}
                      <Tooltip title={trans("environmentSettings.apiKeyValid")}>
                        <ApiKeyStatusIcon color="#52C41A">
                          {/* <KeyIcon /> */}
                        </ApiKeyStatusIcon>
                      </Tooltip>
                    </span> : 
                    <span style={{ color: "#FF4D4F" }}>
                      {trans("environmentSettings.noApiKey")}
                      <Tooltip title={trans("environmentSettings.apiKeyMissing")}>
                        <ApiKeyStatusIcon color="#FF4D4F">
                          {/* <KeyIcon /> */}
                        </ApiKeyStatusIcon>
                      </Tooltip>
                    </span>
                  }
                </span>
              ),
            },
            {
              title: trans("environmentSettings.id"),
              dataIndex: "id",
              ellipsis: true,
              render: (value) => <span style={{ color: "#8B8FA3" }}>{value}</span>,
            },
            {
              title: trans("memberSettings.createTime"),
              dataIndex: "createTime",
              ellipsis: true,
              render: (value) => (
                <span style={{ color: "#8B8FA3" }}>{timestampToHumanReadable(value)}</span>
              ),
            },
            { title: " ", dataIndex: "operation", width: "260px" },
          ]}
          dataSource={dataSource.map((item, i) => ({
            ...item,
            key: i,
            operation: (
              <OperationWrapper>
                <EditBtn
                  className={"api-key-button"}
                  buttonType={"primary"}
                  ghost={true}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleApiKeyModalOpen(item);
                  }}
                >
                  {item.hasApiKey ? trans("environmentSettings.updateApiKey") : trans("environmentSettings.addApiKey")}
                </EditBtn>
                <EditBtn
                  className={"environment-edit-button"}
                  buttonType={"primary"}
                  onClick={(e) => {
                    e.stopPropagation();
                    history.push(buildEnvironmentId(item.id));
                  }}
                >
                  {trans("edit")}
                </EditBtn>
                {item.del && (
                  <EditPopover
                    del={() => {
                      CustomModal.confirm({
                        width: "384px",
                        title: trans("environmentSettings.deleteModalTitle"),
                        bodyStyle: { marginTop: 0 },
                        content: (
                          <Content>
                            <Tip>
                              <DangerIcon />
                              <span>
                                {transToNode("environmentSettings.deleteModalContent", {
                                  permanentlyDelete: (
                                    <b>{trans("environmentSettings.permanentlyDelete")}</b>
                                  ),
                                  notRestored: <b>{trans("environmentSettings.notRestored")}</b>,
                                })}
                              </span>
                            </Tip>
                            <Form layout="vertical" form={form}>
                              <Form.Item
                                name="name"
                                label={transToNode("environmentSettings.deleteModalLabel", {
                                  name: (
                                    <span style={{ color: "#4965F2", margin: "0 5px" }}>
                                      {item.name}
                                    </span>
                                  ),
                                })}
                                rules={[
                                  {
                                    required: true,
                                    message: trans("environmentSettings.deleteModalTip"),
                                  },
                                ]}
                              >
                                <Input placeholder={trans("environmentSettings.name")} />
                              </Form.Item>
                            </Form>
                          </Content>
                        ),
                        onConfirm: () => {
                          form.submit();
                          return form.validateFields().then(() => {
                            const name = form.getFieldValue("name");
                            if (name === item.name) {
                              // Replace with actual action when available
                              // dispatch(deleteEnvironmentAction(item.id));
                              console.log("Delete environment", item.id);
                              form.resetFields();
                            } else {
                              form.setFields([
                                {
                                  name: "name",
                                  errors: [trans("environmentSettings.deleteModalErr")],
                                },
                              ]);
                              throw new Error();
                            }
                          });
                        },
                        onCancel: () => {
                          form.resetFields();
                        },
                        confirmBtnType: "delete",
                        okText: trans("environmentSettings.deleteModalBtn"),
                      });
                    }}
                  >
                    <PopoverIcon tabIndex={-1} />
                  </EditPopover>
                )}
              </OperationWrapper>
            ),
          }))}
        />
      </div>

      {/* API Key Modal */}
      <Modal
        title={currentEnvironment?.hasApiKey 
          ? trans("environmentSettings.updateApiKeyTitle") 
          : trans("environmentSettings.addApiKeyTitle")}
        visible={isApiKeyModalVisible}
        onCancel={handleApiKeyModalClose}
        onOk={handleApiKeySubmit}
        okText={currentEnvironment?.hasApiKey 
          ? trans("environmentSettings.updateApiKeyButton") 
          : trans("environmentSettings.addApiKeyButton")}
      >
        <Content>
          <p>{transToNode("environmentSettings.apiKeyModalDescription", {
            domain: currentEnvironment?.domain ? (
              <span style={{ fontWeight: 500 }}>{currentEnvironment.domain}</span>
            ) : ""
          })}</p>
          <Form layout="vertical" form={apiKeyForm}>
            <Form.Item
              name="apiKey"
              label={trans("environmentSettings.apiKeyLabel")}
              rules={[
                {
                  required: true,
                  message: trans("environmentSettings.apiKeyRequired"),
                },
              ]}
            >
              <Input.Password placeholder={trans("environmentSettings.apiKeyPlaceholder")} />
            </Form.Item>
          </Form>
        </Content>
      </Modal>
    </Level1SettingPageContentWithList>
  );
}

export const EnvironmentList = EnvironmentSetting;