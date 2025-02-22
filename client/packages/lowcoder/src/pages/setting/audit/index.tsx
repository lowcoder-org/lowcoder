import { Card, Form, Select, Input, Button, message, Divider, Skeleton, Table, Flex } from "antd";
import React, { useEffect, useState, useCallback, useMemo } from "react";
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
import { DatePicker } from "antd";
import dayjs from "dayjs";

const { RangePicker } = DatePicker;

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
  { value: "USER_LOGIN", label: trans("enterprise.USER_LOGIN") },
  { value: "USER_LOGOUT", label: trans("enterprise.USER_LOGOUT") },
  { value: "APPLICATION_CREATE", label: trans("enterprise.APPLICATION_CREATE") },
  { value: "APPLICATION_DELETE", label: trans("enterprise.APPLICATION_DELETE") },
  { value: "APPLICATION_UPDATE", label: trans("enterprise.APPLICATION_UPDATE") },
  { value: "APPLICATION_MOVE", label: trans("enterprise.APPLICATION_MOVE") },
  { value: "APPLICATION_RECYCLED", label: trans("enterprise.APPLICATION_RECYCLED") },
  { value: "APPLICATION_RESTORE", label: trans("enterprise.APPLICATION_RESTORE") },
  { value: "APPLICATION_PUBLISH", label: trans("enterprise.APPLICATION_PUBLISH") },
  { value: "APPLICATION_VERSION_CHANGE", label: trans("enterprise.APPLICATION_VERSION_CHANGE") },
  { value: "APPLICATION_SHARING_CHANGE", label: trans("enterprise.APPLICATION_SHARING_CHANGE") },
  { value: "APPLICATION_PERMISSION_CHANGE", label: trans("enterprise.APPLICATION_PERMISSION_CHANGE") },
  { value: "FOLDER_CREATE", label: trans("enterprise.FOLDER_CREATE") },
  { value: "FOLDER_DELETE", label: trans("enterprise.FOLDER_DELETE") },
  { value: "FOLDER_UPDATE", label: trans("enterprise.FOLDER_UPDATE") },
  { value: "QUERY_EXECUTION", label: trans("enterprise.QUERY_EXECUTION") },
  { value: "GROUP_CREATE", label: trans("enterprise.GROUP_CREATE") },
  { value: "GROUP_UPDATE", label: trans("enterprise.GROUP_UPDATE") },
  { value: "GROUP_DELETE", label: trans("enterprise.GROUP_DELETE") },
  { value: "GROUP_MEMBER_ADD", label: trans("enterprise.GROUP_MEMBER_ADD") },
  { value: "GROUP_MEMBER_ROLE_UPDATE", label: trans("enterprise.GROUP_MEMBER_ROLE_UPDATE") },
  { value: "GROUP_MEMBER_LEAVE", label: trans("enterprise.GROUP_MEMBER_LEAVE") },
  { value: "GROUP_MEMBER_REMOVE", label: trans("enterprise.GROUP_MEMBER_REMOVE") },
  { value: "SERVER_START_UP", label: trans("enterprise.SERVER_START_UP") },
  { value: "SERVER_INFO", label: trans("enterprise.SERVER_INFO") },
  { value: "DATA_SOURCE_CREATE", label: trans("enterprise.DATA_SOURCE_CREATE") },
  { value: "DATA_SOURCE_UPDATE", label: trans("enterprise.DATA_SOURCE_UPDATE") },
  { value: "DATA_SOURCE_DELETE", label: trans("enterprise.DATA_SOURCE_DELETE") },
  { value: "DATA_SOURCE_PERMISSION_GRANT", label: trans("enterprise.DATA_SOURCE_PERMISSION_GRANT") },
  { value: "DATA_SOURCE_PERMISSION_UPDATE", label: trans("enterprise.DATA_SOURCE_PERMISSION_UPDATE") },
  { value: "DATA_SOURCE_PERMISSION_DELETE", label: trans("enterprise.DATA_SOURCE_PERMISSION_DELETE") },
  { value: "LIBRARY_QUERY_CREATE", label: trans("enterprise.LIBRARY_QUERY_CREATE") },
  { value: "LIBRARY_QUERY_UPDATE", label: trans("enterprise.LIBRARY_QUERY_UPDATE") },
  { value: "LIBRARY_QUERY_DELETE", label: trans("enterprise.LIBRARY_QUERY_DELETE") },
  { value: "LIBRARY_QUERY_PUBLISH", label: trans("enterprise.LIBRARY_QUERY_PUBLISH") },
  { value: "API_CALL_EVENT", label: trans("enterprise.API_CALL_EVENT") },
];

export function AuditLog() {
  const currentUser = useSelector(getUser);
  const dispatch = useDispatch();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  // Add state to store date range
  const [dateRange, setDateRange] = useState<{ fromTimestamp?: string; toTimestamp?: string }>({});

  // Fetch Logs with all form values if set
  const fetchLogs = async () => {
    const formValues = form.getFieldsValue();
    const cleanedParams = Object.fromEntries(
      Object.entries({
        ...formValues,
        fromTimestamp: formValues.dateRange?.[0] ? formValues.dateRange[0].toISOString() : undefined,
        toTimestamp: formValues.dateRange?.[1] ? formValues.dateRange[1].toISOString() : undefined,
      }).filter(([_, value]) => value !== undefined && value !== null && value !== "")
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

  // Handle date range selection
  const handleDateChange = (dates: any) => {
    if (dates?.[0] && dates?.[1]) {
      form.setFieldsValue({
        fromTimestamp: dates[0].toISOString(),
        toTimestamp: dates[1].toISOString(),
      });
    } else {
      form.resetFields(["fromTimestamp", "toTimestamp"]);
    }
    fetchLogs();
  };

  // Handle chart zoom
  const handleChartZoom = ({ fromTimestamp, toTimestamp }: { fromTimestamp: string; toTimestamp: string }) => {
    console.log("Zoom applied:", fromTimestamp, toTimestamp);
  
    const startDate = dayjs(fromTimestamp);
    const endDate = dayjs(toTimestamp);
    form.setFieldsValue({ dateRange: [startDate, endDate] });
    fetchLogs();
  };
  

  // Debounce handler for input fields
  const handleInputChange = useCallback(
    debounce(() => fetchLogs(), 300),
    []
  );

  // Initial Fetch on Mount
  useEffect(() => {
    fetchLogs();
  }, [currentUser.currentOrgId]);
  
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

  const hierarchicalData = useMemo(() => generateHierarchy(logs), [logs]);

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
              onValuesChange={(changedValue) => {
                const key = Object.keys(changedValue)[0];

                if (key === "dateRange") {
                  handleDateChange(changedValue.dateRange);
                } else if (["environmentId", "orgId", "userId", "appId"].includes(key)) {
                  handleInputChange();
                } else {
                  fetchLogs();
                }
              }}
            >
              <Flex gap="middle" vertical>
                <Flex>
                  <Form.Item name="dateRange">
                    <RangePicker 
                      showTime 
                      format="YYYY-MM-DD 00:00:00" 
                      onChange={handleDateChange}
                      value={form.getFieldValue("dateRange")}/>
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
                </Flex>
                
                <Flex>
                  <Form.Item name="environmentId">
                    <Input placeholder="Environment ID" allowClear />
                  </Form.Item>
                  <Form.Item name="orgId">
                    <Input placeholder="Org ID" allowClear />
                  </Form.Item>
                  <Form.Item name="userId">
                    <Input placeholder="User ID" allowClear />
                  </Form.Item>
                  <Form.Item name="appId">
                    <Input placeholder="App ID" allowClear />
                  </Form.Item>
                </Flex>
              </Flex>
            </Form>
          </Card>
          <Card title="Audit Logs">
            {loading ? (
              <Skeleton active paragraph={{ rows: 5 }} />
            ) : logs.length > 0 ? (
              <>
                <EventTypeTimeChart 
                  data={logs} 
                  eventTypeLabels={eventTypeLabels} 
                  setDateRange={handleChartZoom} 
                />
                <Divider />
                <Table
                  columns={columns}
                  dataSource={loading ? [] : hierarchicalData}
                  pagination={{ pageSize: 10 }}
                  loading={loading}
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