import { Card, Form, Select, Input, Button, message, Divider, Skeleton, Table, Flex, Tag, TableProps } from "antd";
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
  { value: "USER_LOGIN", label: trans("enterprise.USER_LOGIN"), color: "#1890ff" },
  { value: "USER_LOGOUT", label: trans("enterprise.USER_LOGOUT"), color: "#1d39c4" },
  { value: "APPLICATION_CREATE", label: trans("enterprise.APPLICATION_CREATE"), color: "#52c41a" },
  { value: "APPLICATION_DELETE", label: trans("enterprise.APPLICATION_DELETE"), color: "#389e0d" },
  { value: "APPLICATION_UPDATE", label: trans("enterprise.APPLICATION_UPDATE"), color: "#237804" },
  { value: "APPLICATION_MOVE", label: trans("enterprise.APPLICATION_MOVE"), color: "#135200" },
  { value: "APPLICATION_RECYCLED", label: trans("enterprise.APPLICATION_RECYCLED"), color: "#00474f" },
  { value: "APPLICATION_RESTORE", label: trans("enterprise.APPLICATION_RESTORE"), color: "#003a8c" },
  { value: "APPLICATION_PUBLISH", label: trans("enterprise.APPLICATION_PUBLISH"), color: "#002766" },
  { value: "APPLICATION_VERSION_CHANGE", label: trans("enterprise.APPLICATION_VERSION_CHANGE"), color: "#0050b3" },
  { value: "APPLICATION_SHARING_CHANGE", label: trans("enterprise.APPLICATION_SHARING_CHANGE"), color: "#1890ff" },
  { value: "APPLICATION_PERMISSION_CHANGE", label: trans("enterprise.APPLICATION_PERMISSION_CHANGE"), color: "#1d39c4" },
  { value: "FOLDER_CREATE", label: trans("enterprise.FOLDER_CREATE"), color: "#faad14" },
  { value: "FOLDER_DELETE", label: trans("enterprise.FOLDER_DELETE"), color: "#d48806" },
  { value: "FOLDER_UPDATE", label: trans("enterprise.FOLDER_UPDATE"), color: "#ad6800" },
  { value: "QUERY_EXECUTION", label: trans("enterprise.QUERY_EXECUTION"), color: "#722ed1" },
  { value: "GROUP_CREATE", label: trans("enterprise.GROUP_CREATE"), color: "#f5222d" },
  { value: "GROUP_UPDATE", label: trans("enterprise.GROUP_UPDATE"), color: "#cf1322" },
  { value: "GROUP_DELETE", label: trans("enterprise.GROUP_DELETE"), color: "#a8071a" },
  { value: "GROUP_MEMBER_ADD", label: trans("enterprise.GROUP_MEMBER_ADD"), color: "#820014" },
  { value: "GROUP_MEMBER_ROLE_UPDATE", label: trans("enterprise.GROUP_MEMBER_ROLE_UPDATE"), color: "#5c0011" },
  { value: "GROUP_MEMBER_LEAVE", label: trans("enterprise.GROUP_MEMBER_LEAVE"), color: "#8c8c8c" },
  { value: "GROUP_MEMBER_REMOVE", label: trans("enterprise.GROUP_MEMBER_REMOVE"), color: "#595959" },
  { value: "SERVER_START_UP", label: trans("enterprise.SERVER_START_UP"), color: "#8c8c8c" },
  { value: "SERVER_INFO", label: trans("enterprise.SERVER_INFO"), color: "#595959" },
  { value: "DATA_SOURCE_CREATE", label: trans("enterprise.DATA_SOURCE_CREATE"), color: "#f5222d" },
  { value: "DATA_SOURCE_UPDATE", label: trans("enterprise.DATA_SOURCE_UPDATE"), color: "#cf1322" },
  { value: "DATA_SOURCE_DELETE", label: trans("enterprise.DATA_SOURCE_DELETE"), color: "#a8071a" },
  { value: "DATA_SOURCE_PERMISSION_GRANT", label: trans("enterprise.DATA_SOURCE_PERMISSION_GRANT"), color: "#820014" },
  { value: "DATA_SOURCE_PERMISSION_UPDATE", label: trans("enterprise.DATA_SOURCE_PERMISSION_UPDATE"), color: "#5c0011" },
  { value: "DATA_SOURCE_PERMISSION_DELETE", label: trans("enterprise.DATA_SOURCE_PERMISSION_DELETE"), color: "#8c8c8c" },
  { value: "LIBRARY_QUERY_CREATE", label: trans("enterprise.LIBRARY_QUERY_CREATE"), color: "#722ed1" },
  { value: "LIBRARY_QUERY_UPDATE", label: trans("enterprise.LIBRARY_QUERY_UPDATE"), color: "#531dab" },
  { value: "LIBRARY_QUERY_DELETE", label: trans("enterprise.LIBRARY_QUERY_DELETE"), color: "#391085" },
  { value: "LIBRARY_QUERY_PUBLISH", label: trans("enterprise.LIBRARY_QUERY_PUBLISH"), color: "#22075e" },
  { value: "API_CALL_EVENT", label: trans("enterprise.API_CALL_EVENT"), color: "#8c8c8c" },
];

export function AuditLog() {

  type AuditLog = {
    eventType: string;
    eventTime: string;
    environmentId: string;
    orgId: string;
    userId: string;
    appId: string;
  };

  const currentUser = useSelector(getUser);

  const [allLogs, setAllLogs] = useState<AuditLog[]>([]); 
  const [currentPageLogs, setCurrentPageLogs] = useState<AuditLog[]>([]);

  // const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const [pagination, setPagination] = useState({ pageSize: 20, current: 1 });

  // Add state to store date range
  const [dateRange, setDateRange] = useState<{ fromTimestamp?: string; toTimestamp?: string }>({});

  // Fetch Logs with all form values if set
  const fetchLogs = async (newPage: number, resetData: boolean = false) => {
    const formValues = form.getFieldsValue();
  
    const cleanedParams = Object.fromEntries(
      Object.entries({
        ...formValues,
        pageSize: 500, // Always fetch 500 from API
        pageNum: newPage, // API page number
        fromTimestamp: formValues.dateRange?.[0] ? formValues.dateRange[0].toISOString() : undefined,
        toTimestamp: formValues.dateRange?.[1] ? formValues.dateRange[1].toISOString() : undefined,
      }).filter(([_, value]) => value !== undefined && value !== null && value !== "")
    );
  
    setLoading(true);
    try {
      const data = await getAuditLogs(cleanedParams);
  
      if (resetData) {
        setAllLogs(data.data);
        setPagination({ pageSize: 25, current: 1 }); // Reset pagination
      } else {
        setAllLogs((prevLogs) => [...prevLogs, ...data.data]);
      }
  
      setTotal(data.totalCount);
    } catch (error) {
      message.error("Failed to fetch audit logs.");
    } finally {
      setLoading(false);
    }
  };

  // Handle chart zoom
  const handleChartZoom = ({ fromTimestamp, toTimestamp }: { fromTimestamp: string; toTimestamp: string }) => {
    console.log("Zoom applied:", fromTimestamp, toTimestamp);
  
    const startDate = dayjs(fromTimestamp);
    const endDate = dayjs(toTimestamp);
    form.setFieldsValue({ dateRange: [startDate, endDate] });

    setPagination({ pageSize: 25, current: 1 });
    setAllLogs([]);
    setCurrentPageLogs([]);
    fetchLogs(1, true);
  };
  
  // Debounce handler for input fields
  const handleInputChange = useCallback(
    debounce(() => {
      setPagination({ pageSize: 25, current: 1 });
      setAllLogs([]); 
      setCurrentPageLogs([]); 
      fetchLogs(1, true); 
    }, 300),
    []
  );
  
  const handleClickFilter = (field: any, value: any) => {
    form.setFieldsValue({ [field]: value });
    
    setPagination({ pageSize: 25, current: 1 });
    setAllLogs([]);
    setCurrentPageLogs([]);
    fetchLogs(1, true);
  };
  
  const handleDateChange = (dates: any) => {
    if (dates?.[0] && dates?.[1]) {
      form.setFieldsValue({
        fromTimestamp: dates[0].toISOString(),
        toTimestamp: dates[1].toISOString(),
      });
    } else {
      form.resetFields(["fromTimestamp", "toTimestamp"]);
    }
  
    // Reset pagination and clear logs BEFORE calling fetchLogs
    setPagination({ pageSize: 25, current: 1 });
    setAllLogs([]);
    setCurrentPageLogs([]);
  
    // Ensure fetchLogs is called only ONCE
    fetchLogs(1, true);
  };
  
  
  // Handle page change
  const handleTableChange: TableProps<any>["onChange"] = (newPagination) => {
  const newPage = newPagination.current ?? 1;
  const pageSize = newPagination.pageSize ?? 25;
  const startIndex = (newPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;

  console.log(
    `New Page: ${newPage}, StartIndex: ${startIndex}, EndIndex: ${endIndex}, AllLogs Length: ${allLogs.length}, Total: ${total}`
  );

  if (endIndex <= allLogs.length) {
    // ✅ Correctly slice logs and update state
    setCurrentPageLogs(allLogs.slice(startIndex, endIndex));
  } else if (allLogs.length < total) {
    // ✅ Fetch next set of logs and update state after fetch
    const nextApiPage = Math.floor(allLogs.length / 500) + 1;
    fetchLogs(nextApiPage).then(() => {
      setCurrentPageLogs(allLogs.slice(startIndex, endIndex));
    });
  }

  setPagination({ pageSize, current: newPage });
};
  
useEffect(() => {
  if (allLogs.length > 0) {
    const startIndex = (pagination.current - 1) * pagination.pageSize;
    const endIndex = startIndex + pagination.pageSize;

    console.log(`Updating displayed logs: StartIndex ${startIndex}, EndIndex ${endIndex}`);
    setCurrentPageLogs(allLogs.slice(startIndex, endIndex));
  }
}, [pagination, allLogs]);
  
  
  // Initial Fetch on Mount
  useEffect(() => {
    fetchLogs(1);
  }, [currentUser.currentOrgId]);

  const getEventColor = (eventType: string): string => {
    const matchedType = eventTypes.find((et) => et.value === eventType);
    return matchedType ? matchedType.color : "#8c8c8c";
  };

  const getEventLabel = (eventType: string): string => {
    const matchedType = eventTypes.find((et) => et.value === eventType);
    return matchedType ? matchedType.label : "unknown";
  };
  
  const columns = [
    {
      title: "Event Type",
      dataIndex: "eventType",
      key: "eventType",
      render: (text: string) => text ? <Tag color={getEventColor(text)}>{getEventLabel(text)}</Tag> : null,
    },
    {
      title: "Event Time",
      dataIndex: "eventTime",
      key: "eventTime",
      render: (text: string) => {
        if (!text) return null;
        const date = new Date(text);
        return new Intl.DateTimeFormat(navigator.language, {
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          timeZoneName: "short",
        }).format(date);
      },
    },
    {
      title: "Environment ID",
      dataIndex: "environmentId",
      key: "environmentId",
      render: (text: string) => (
        <a onClick={() => handleClickFilter("environmentId", text)}>{text}</a>
      ),
    },
    {
      title: "Org ID",
      dataIndex: "orgId",
      key: "orgId",
      render: (text: string) => <a onClick={() => handleClickFilter("orgId", text)}>{text}</a>,
    },
    {
      title: "User ID",
      dataIndex: "userId",
      key: "userId",
      render: (text: string) => <a onClick={() => handleClickFilter("userId", text)}>{text}</a>,
    },
    {
      title: "App ID",
      dataIndex: "appId",
      key: "appId",
      render: (text: string) => <a onClick={() => handleClickFilter("appId", text)}>{text}</a>,
    }
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
          <Card size="small" style={{ marginBottom: "20px" }}>
            <Form
              form={form}
              layout="inline"
              onValuesChange={(changedValue) => {
                const key = Object.keys(changedValue)[0];
                if (key === "dateRange") {
                  handleDateChange(changedValue.dateRange);
                } else if (["environmentId", "orgId", "userId", "appId"].includes(key)) {
                  handleInputChange(); // Debounced input change
                } else {
                  // Avoid calling fetchLogs if `handleDateChange` already did
                  fetchLogs(1, true);
                }
              }}
            >
              <Flex gap="middle" vertical>
                <Flex>
                  <Form.Item name="dateRange">
                    <RangePicker 
                      showTime 
                      format="YYYY-MM-DD 00:00:00" 
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
          <Card>
            {loading ? (
              <Skeleton active paragraph={{ rows: 5 }} />
            ) : currentPageLogs.length > 0 ? (
              <>
                <EventTypeTimeChart 
                  data={allLogs} 
                  eventTypeLabels={eventTypeLabels} 
                  eventTypes={eventTypes}
                  setDateRange={handleChartZoom} 
                />
                <Divider />
                <div style={{ overflowX: "auto", width: "100%" }}>
                <Table
                  columns={columns}
                  dataSource={currentPageLogs}
                  size="small" // Compact Layout
                  pagination={{
                    pageSize: 25,
                    current: pagination.current,
                    total: total, 
                  }}
                  style={{ width: "95%", whiteSpace: "nowrap" }} // Fixed width, prevent line break
                  onChange={handleTableChange} // Handle pagination
                  loading={loading}
                />
              </div>
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