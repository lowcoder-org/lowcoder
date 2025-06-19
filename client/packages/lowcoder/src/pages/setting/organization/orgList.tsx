import { ADMIN_ROLE, SUPER_ADMIN_ROLE } from "constants/orgConstants";
import { AddIcon, CustomModal, DangerIcon, EditPopover, SearchIcon } from "lowcoder-design";
import { useDispatch, useSelector } from "react-redux";
import { createOrgAction, deleteOrgAction } from "redux/reduxActions/orgActions";
import styled from "styled-components";
import { trans, transToNode } from "i18n";
import { buildOrgId } from "constants/routesURL";
import {
  CreateButton,
  EditBtn,
  OperationWrapper,
  PopoverIcon,
} from "../permission/styledComponents";
import { Table } from "components/Table";
import history from "util/history";
import { StyledOrgLogo } from "./styledComponents";
import { Level1SettingPageContentWithList, Level1SettingPageTitleWithBtn } from "../styled";
import { isSaasMode } from "util/envUtils";
import { selectSystemConfig } from "redux/selectors/configSelectors";
import { default as Form } from "antd/es/form";
import { default as Input } from "antd/es/input";
import { Pagination, Spin } from "antd";
import { getUser } from "redux/selectors/usersSelectors";
import { getOrgCreateStatus } from "redux/selectors/orgSelectors";
import { useWorkspaceManager } from "util/useWorkspaceManager";
import { Org } from "constants/orgConstants";
import { useState } from "react";

const OrgName = styled.div`
  display: flex;
  align-items: center;

  > div {
    width: 34px;
    min-width: 34px;
    height: 34px;
    margin-right: 12px;
    border: 1px solid rgba(0, 0, 0, 0.1);
    border-radius: 4px;

    span {
      font-size: 12px;
    }
  }

  > span {
    font-size: 14px;
    color: #333;
    font-weight: 500;
  }
`;

const TableStyled = styled(Table)`
  .ant-table-tbody > tr > td {
    padding: 11px 12px;
  }
`;

const SearchContainer = styled.div`
  margin-bottom: 16px;
  max-width: 320px;
`;

const StyledSearchInput = styled(Input)`
  .ant-input {
    border: 1px solid #e1e3eb;
    border-radius: 6px;
    font-size: 13px;
    
    &:focus {
      border-color: #4965f2;
      box-shadow: 0 0 0 2px rgba(73, 101, 242, 0.1);
    }
  }
`;

const PaginationContainer = styled.div`
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
`;

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  padding: 40px 0;
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

type DataItemInfo = {
  id: string;
  del: boolean;
  orgName: string;
  logoUrl: string;
};

function OrganizationSetting() {
  const user = useSelector(getUser);
  const orgCreateStatus = useSelector(getOrgCreateStatus);
  const dispatch = useDispatch();
  const sysConfig = useSelector(selectSystemConfig);
  const [form] = Form.useForm();

  // Use the workspace manager hook for search and pagination
  const {
    searchTerm,
    currentPage,
    totalCount,
    isLoading,
    displayWorkspaces,
    handleSearchChange,
    handlePageChange,
    pageSize,
  } = useWorkspaceManager({ 
    pageSize: 10 
  });


  // Filter to only show orgs where user has admin permissions
  const adminOrgs = displayWorkspaces.filter((org: Org) => {
    const role = user.orgRoleMap.get(org.id);
    return role === ADMIN_ROLE || role === SUPER_ADMIN_ROLE;
  });

  const dataSource = adminOrgs.map((org: Org) => ({
    id: org.id,
    del: adminOrgs.length > 1,
    orgName: org.name,
    logoUrl: org.logoUrl || "",
  }));

  return (
    <Level1SettingPageContentWithList>
      <Level1SettingPageTitleWithBtn>
        {trans("settings.organization")}
        {isSaasMode(sysConfig) && (
          <CreateButton
            loading={orgCreateStatus === "requesting"}
            buttonType={"primary"}
            icon={<AddIcon />}
            onClick={() => dispatch(createOrgAction(user.orgs))}
          >
            {trans("orgSettings.createOrg")}
          </CreateButton>
        )}
      </Level1SettingPageTitleWithBtn>
      
      {/* Search Input */}
      <SearchContainer>
        <StyledSearchInput
          placeholder="Search organizations..."
          value={searchTerm}
          onChange={(e) => handleSearchChange(e.target.value)}
          prefix={<SearchIcon style={{ color: "#8b8fa3" }} />}
          size="middle"
        />
      </SearchContainer>

      <div>
        {isLoading ? (
          <LoadingContainer>
            <Spin size="large" />
          </LoadingContainer>
        ) : (
          <>
            <TableStyled
              tableLayout={"auto"}
              scroll={{ x: "100%" }}
              pagination={false}
              onRow={(record) => ({
                onClick: () => history.push(buildOrgId((record as DataItemInfo).id)),
              })}
              columns={[
                {
                  title: trans("orgSettings.orgName"),
                  dataIndex: "orgName",
                  ellipsis: true,
                  render: (_, record: any) => {
                    return (
                      <OrgName>
                        <StyledOrgLogo source={record.logoUrl} orgName={record.orgName} />
                        <span>{record.orgName}</span>
                      </OrgName>
                    );
                  },
                },
                { title: " ", dataIndex: "operation", width: "208px" },
              ]}
              dataSource={dataSource.map((item, i) => ({
                ...item,
                key: i,
                operation: (
                  <OperationWrapper>
                    <EditBtn
                      className={"home-datasource-edit-button"}
                      buttonType={"primary"}
                      onClick={() => history.push(buildOrgId(item.id))}
                    >
                      {trans("edit")}
                    </EditBtn>
                    {item.del && (
                      <EditPopover
                        del={() => {
                          CustomModal.confirm({
                            width: "384px",
                            title: trans("orgSettings.deleteModalTitle"),
                            bodyStyle: { marginTop: 0 },
                            content: (
                              <Content>
                                <Tip>
                                  <DangerIcon />
                                  <span>
                                    {transToNode("orgSettings.deleteModalContent", {
                                      permanentlyDelete: (
                                        <b>{trans("orgSettings.permanentlyDelete")}</b>
                                      ),
                                      notRestored: <b>{trans("orgSettings.notRestored")}</b>,
                                    })}
                                  </span>
                                </Tip>
                                <Form layout="vertical" form={form}>
                                  <Form.Item
                                    name="name"
                                    label={transToNode("orgSettings.deleteModalLabel", {
                                      name: (
                                        <span style={{ color: "#4965F2", margin: "0 5px" }}>
                                          {item.orgName}
                                        </span>
                                      ),
                                    })}
                                    rules={[
                                      {
                                        required: true,
                                        message: trans("orgSettings.deleteModalTip"),
                                      },
                                    ]}
                                  >
                                    <Input placeholder={trans("orgSettings.orgName")} />
                                  </Form.Item>
                                </Form>
                              </Content>
                            ),
                            onConfirm: () => {
                              form.submit();
                              return form.validateFields().then(() => {
                                const name = form.getFieldValue("name");
                                if (name === item.orgName) {
                                  dispatch(deleteOrgAction(item.id));
                                  form.resetFields();
                                } else {
                                  form.setFields([
                                    {
                                      name: "name",
                                      errors: [trans("orgSettings.deleteModalErr")],
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
                            okText: trans("orgSettings.deleteModalBtn"),
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

            {/* Pagination */}
            {totalCount > pageSize && (
              <PaginationContainer>
                <Pagination
                  current={currentPage}
                  total={totalCount}
                  pageSize={pageSize}
                  showSizeChanger={false}
                  showQuickJumper={false}
                  showTotal={(total, range) => 
                    `${range[0]}-${range[1]} of ${total} organizations`
                  }
                  onChange={handlePageChange}
                />
              </PaginationContainer>
            )}
          </>
        )}
      </div>
    </Level1SettingPageContentWithList>
  );
}

export const OrgList = OrganizationSetting;
