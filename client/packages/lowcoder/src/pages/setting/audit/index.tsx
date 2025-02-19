import { Card, Form, Select, Input, Button, message, Divider, Spin, Table } from "antd";
import React, { useEffect, useState, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import styled from "styled-components";
import { trans } from "i18n";
import {
    DetailContainer,
    DetailContent,
    Header,
  } from "../theme/styledComponents";
import { HeaderBack } from "pages/setting/permission/styledComponents";
import { getUser } from "@lowcoder-ee/redux/selectors/usersSelectors";
import { fetchCommonSettings } from "@lowcoder-ee/redux/reduxActions/commonSettingsActions";
import ReactECharts from "echarts-for-react";
import { getAuditLogs } from "api/enterpriseApi";
import EventTypeTimeChart from "./charts/eventTypesTime";
import { debounce } from "lodash";

const AuditContent = styled.div`
  font-size: 14px;
  color: #8b8fa3;
  flex-grow: 1;
  padding-top: 0px;
  padding-left: 0px;
  max-width: 100%;
`;

const StyleThemeSettingsCover = styled.div`
  display: flex;
  flex-direction: row;
  background: linear-gradient(34deg, rgba(2, 0, 36, 1) 0%, rgba(102, 9, 121, 1) 35%, rgba(0, 255, 181, 1) 100%);
  padding: 15px;
  height: 80px;
  border-radius: 10px 10px 0 0;
`;

const eventTypes = [
  { value: "USER_LOGIN", label: "User Login" },
  { value: "USER_LOGOUT", label: "User Logout" },
  { value: "APPLICATION_VIEW", label: "View Application" },
  { value: "APPLICATION_CREATE", label: "Create Application" },
  { value: "APPLICATION_DELETE", label: "Delete Application" },
  { value: "APPLICATION_UPDATE", label: "Update Application" },
  { value: "APPLICATION_MOVE", label: "Move Application" },
  { value: "APPLICATION_RECYCLED", label: "Recycle Application" },
  { value: "APPLICATION_RESTORE", label: "Restore Application" },
  { value: "FOLDER_CREATE", label: "Create Folder" },
  { value: "FOLDER_DELETE", label: "Delete Folder" },
  { value: "FOLDER_UPDATE", label: "Update Folder" },
  { value: "QUERY_EXECUTION", label: "Execute Query" },
  { value: "GROUP_CREATE", label: "Create Group" },
  { value: "GROUP_UPDATE", label: "Update Group" },
  { value: "GROUP_DELETE", label: "Delete Group" },
  { value: "GROUP_MEMBER_ADD", label: "Add Group Member" },
  { value: "GROUP_MEMBER_ROLE_UPDATE", label: "Update Group Member Role" },
  { value: "GROUP_MEMBER_LEAVE", label: "Leave Group" },
  { value: "GROUP_MEMBER_REMOVE", label: "Remove Group Member" },
  { value: "SERVER_START_UP", label: "Server Startup" },
  { value: "SERVER_INFO", label: "View Server Info" },
  { value: "DATA_SOURCE_CREATE", label: "Create Datasource" },
  { value: "DATA_SOURCE_UPDATE", label: "Update Datasource" },
  { value: "DATA_SOURCE_DELETE", label: "Delete Datasource" },
  { value: "DATA_SOURCE_PERMISSION_GRANT", label: "Grant Datasource Permission" },
  { value: "DATA_SOURCE_PERMISSION_UPDATE", label: "Update Datasource Permission" },
  { value: "DATA_SOURCE_PERMISSION_DELETE", label: "Delete Datasource Permission" },
  { value: "LIBRARY_QUERY_CREATE", label: "Create Library Query" },
  { value: "LIBRARY_QUERY_UPDATE", label: "Update Library Query" },
  { value: "LIBRARY_QUERY_DELETE", label: "Delete Library Query" },
  { value: "LIBRARY_QUERY_PUBLISH", label: "Publish Library Query" },
  { value: "API_CALL_EVENT", label: "API Call Event" },
];

export function AuditLog() {
  const currentUser = useSelector(getUser);
  const dispatch = useDispatch();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    // Fetch logs automatically on component mount
    fetchLogs({ orgId: currentUser.currentOrgId });
  }, [currentUser.currentOrgId]);

  const fetchLogs = async (params = {}) => {
    const cleanedParams = Object.fromEntries(
      Object.entries(params).filter(([_, value]) => value !== undefined && value !== "")
    );
    setLoading(true);
    try {
      const data = await getAuditLogs(cleanedParams);
      setLogs(data.data);
    } catch (error) {
      message.error("Failed to fetch audit logs.");
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = (values: any) => {
    const queryParams = {
      ...values,
      orgId: currentUser.currentOrgId,
    };
    fetchLogs(queryParams);
  };

  interface ValueType {
    [key: string]: string | any[]; // replace any[] with the actual data type if known
  }
  // Debounce handler for input fields
  const handleInputChange = useCallback(
    debounce((changedValue: ValueType, allValues) => {
      if (Object.values(changedValue)[0]?.length >= 3) {
        handleFormSubmit(allValues);
      }
    }, 300),
    [] // Ensures debounce doesn't recreate on every render
  );

  const handleSelectChange = (changedValue: any, allValues: any) => {
    handleFormSubmit(allValues);
  };

  // Generate hierarchical data for the table
  const generateHierarchy = (data: any[]) => {
    const orgMap = new Map();

    data.forEach((log) => {
      const org = orgMap.get(log.orgId) || { key: log.orgId, orgId: log.orgId, children: [] };
      const user = org.children.find((u: any) => u.userId === log.userId) || { key: `${log.orgId}-${log.userId}`, userId: log.userId, children: [] };
      const app = user.children.find((a: any) => a.appId === log.appId) || { key: `${log.orgId}-${log.userId}-${log.appId}`, appId: log.appId, children: [] };

      app.children.push({
        key: `${log.orgId}-${log.userId}-${log.appId}-${log.eventType}-${log.eventTime}`,
        eventType: log.eventType,
        eventTime: log.eventTime,
      });

      if (!user.children.some((a: any) => a.appId === log.appId)) {
        user.children.push(app);
      }

      if (!org.children.some((u: any) => u.userId === log.userId)) {
        org.children.push(user);
      }

      if (!orgMap.has(log.orgId)) {
        orgMap.set(log.orgId, org);
      }
    });

    return Array.from(orgMap.values());
  };

  const hierarchicalData = generateHierarchy(logs);

  const columns = [
    { title: "Org ID", dataIndex: "orgId", key: "orgId" },
    { title: "User ID", dataIndex: "userId", key: "userId" },
    { title: "App ID", dataIndex: "appId", key: "appId" },
    { title: "Event Type", dataIndex: "eventType", key: "eventType" },
    { title: "Event Time", dataIndex: "eventTime", key: "eventTime" },
  ];

  const eventTypeLabels = Object.fromEntries(eventTypes.map((et) => [et.value, et.label]));

  return (
    <DetailContainer>
      <Header>
        <HeaderBack>
          <span>{trans("enterprise.AuditLogTitle")}</span>
        </HeaderBack>
      </Header>

      <DetailContent>
        <AuditContent>
          <StyleThemeSettingsCover>
            <h2 style={{ color: "#ffffff", marginTop: "8px" }}>{trans("enterprise.AuditLogOverview")}</h2>
          </StyleThemeSettingsCover>
          <Card title="Filter Audit Logs" size="small" style={{ marginBottom: "20px" }}>
            <Form
              form={form}
              layout="inline"
              onValuesChange={(changedValue, allValues) => {
                const key = Object.keys(changedValue)[0];
                if (key === "eventType") {
                  handleSelectChange(changedValue, allValues);
                } else {
                  handleInputChange(changedValue, allValues);
                }
              }}
              onFinish={handleFormSubmit}
            >
              <Form.Item name="environmentId">
                <Input placeholder="Environment ID" allowClear />
              </Form.Item>
              <Form.Item name="userId">
                <Input placeholder="User ID" allowClear />
              </Form.Item>
              <Form.Item name="appId">
                <Input placeholder="App ID" allowClear />
              </Form.Item>
              <Form.Item name="eventType">
                <Select
                  allowClear
                  showSearch
                  placeholder="Event Type"
                  options={eventTypes}
                  style={{ width: 200 }}
                />
              </Form.Item>
              <Form.Item>
                <Button type="primary" htmlType="submit" loading={loading}>
                  Fetch Logs
                </Button>
              </Form.Item>
            </Form>
          </Card>
          <Card title="Audit Logs">
            {loading ? (
              <Spin />
            ) : logs.length > 0 ? (
              <>
                <EventTypeTimeChart data={logs} eventTypeLabels={eventTypeLabels} />
                <Divider />
                <Table
                  columns={columns}
                  dataSource={hierarchicalData}
                  pagination={{ pageSize: 10 }}
                />
              </>
            ) : (
              <p>No logs found. Adjust the filters and try again.</p>
            )}
          </Card>
        </AuditContent>
      </DetailContent>
    </DetailContainer>
  );
}