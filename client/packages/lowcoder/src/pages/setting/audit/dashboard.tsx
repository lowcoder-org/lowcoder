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
import { getAuditLogs, getAuditLogStatistics, getEnvironmentsByIds, getMeta } from "api/enterpriseApi";
import EventTypeTimeChart from "./charts/eventTypesTime";
import { debounce, uniqBy } from "lodash";
import { DatePicker } from "antd";
import dayjs, { Dayjs } from "dayjs";
import { Link, useLocation } from "react-router-dom";
import history from "util/history";
import { SETTING_URL } from "@lowcoder-ee/constants/routesURL";
import { EyeOutlined } from "@ant-design/icons";
import { AuditLog, AuditLogStat, eventTypes } from "./auditContants";
import Statistics from "./components/statistics";
import { Level1SettingPageTitle } from "../styled";

const { RangePicker } = DatePicker;

const LOG_PAGE_SIZE = 100;

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

export const getEventColor = (eventType: string): string => {
  const matchedType = eventTypes.find((et) => et.value === eventType);
  return matchedType ? matchedType.color : "#8c8c8c";
};

export const getEventLabel = (eventType: string): string => {
  const matchedType = eventTypes.find((et) => et.value === eventType);
  return matchedType ? matchedType.label : "unknown";
};

export function AuditLogDashboard() {
  const currentUser = useSelector(getUser);
  const location = useLocation();

  const [allLogs, setAllLogs] = useState<AuditLog[]>([]); 
  const [currentPageLogs, setCurrentPageLogs] = useState<AuditLog[]>([]);
  const [statistics, setStatistics] = useState<AuditLogStat[]>([]);
  const [dataMap, setDataMap] = useState<Record<string, any>>({});

  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const [pagination, setPagination] = useState({ pageSize: 25, current: 1 });

  // Function to get URL parameters
  const getQueryParams = () => {
    const params = new URLSearchParams(location.search);
    let queryObject: Record<string, any> = {};
  
    // Convert search params into a JavaScript object
    params.forEach((value, key) => {
      if (key !== 'fromTimestamp' && key !== 'toTimestamp') {
        queryObject[key] = value;
      }
    });

    // set date range picker values
    let dateRange = new Array<Dayjs>(2);
    if (params.get('fromTimestamp')) {
      dateRange[0] = dayjs(params.get('fromTimestamp'));
    }
    if (params.get('toTimestamp')) {
      dateRange[1] = dayjs(params.get('toTimestamp'));
    }
    
    queryObject['dateRange'] = dateRange;
    return queryObject;
  };
  
  useEffect(() => {
    form.setFieldsValue(getQueryParams());
  }, []);

  const findUniqueDataIds = async () => {
    if (!allLogs.length) {
      return setDataMap({});
    }

    const uniqueOrgIds: string[] = uniqBy(allLogs, 'orgId').map(item => item.orgId);
    const uniqueUserIds: string[] = uniqBy(allLogs, 'userId').map(item => item.userId);
    const uniqueEnvIds: string[] = uniqBy(allLogs, 'environmentId').map(item => item.environmentId);

    const metaResponse = await getMeta({
      orgIds: uniqueOrgIds,
      userIds: uniqueUserIds,
      appIds: [],
      groupIds: [],
      bundleIds: [],
      datasourceIds: [],
      folderIds: [],
      libraryQueryIds: []
    });

    const envResponse = await getEnvironmentsByIds(uniqueEnvIds);

    const tempDataMap: Record<string, any> = {};
    metaResponse.data?.orgs?.forEach((org: { id: string; name: string; }) => {
      tempDataMap[org.id] = org.name;
    });
    metaResponse.data?.users?.forEach((user: { id: string; name: string; }) => {
      tempDataMap[user.id] = user.name;
    });
    envResponse.data?.forEach((env: { environmentId: string; environmentType: string; }) => {
      tempDataMap[env.environmentId] = env.environmentType;
    });
    setDataMap(tempDataMap);
  }

  useEffect(() => {
    findUniqueDataIds();
  }, [allLogs]);

  const getCleanedParams = (newPage?: number, newPageSize?: number) => {
    const formValues = form.getFieldsValue();
  
    let cleanedParams = Object.fromEntries(
      Object.entries({
        ...formValues,
        fromTimestamp: formValues.dateRange?.[0] ? formValues.dateRange[0].toISOString() : undefined,
        toTimestamp: formValues.dateRange?.[1] ? formValues.dateRange[1].toISOString() : undefined,
      }).filter(([key, value]) => value !== undefined && value !== null && value !== "" && key !== 'dateRange')
    );
    if (newPage) {
      cleanedParams = {
        ...cleanedParams,
        pageSize: newPageSize || LOG_PAGE_SIZE, // Always fetch 500 from API
        pageNum: newPage, // API page number
      }
    }

    return cleanedParams;
  }
  
  const handleQueryParams = (queryParams: Record<string, string>) => {
    const params = new URLSearchParams();
    Object.keys(queryParams).map((key) => {
      const value = queryParams[key];
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key); // Remove the key if the value is empty
      }
    })
    history.push({ search: params.toString() })
  }
  
  const fetchStatistics = async () => {
    const cleanedParams = getCleanedParams();

    const stats = await getAuditLogStatistics(cleanedParams);
    setStatistics(stats?.data || []);
  }

  // Fetch Logs with all form values if set
  const fetchLogs = async (
    newPage: number,
    newPageSize: number = LOG_PAGE_SIZE,
    resetData: boolean = false,
    resetDataOnly: boolean = false,
  ) => {
    const cleanedParams = getCleanedParams(newPage, newPageSize);

    handleQueryParams(cleanedParams as any);

    setLoading(true);
    try {
      const data = await getAuditLogs(cleanedParams);
      // fetch statistics only when page is 1
      if (newPage === 1 && !resetDataOnly) {
        fetchStatistics();
      }

      if (resetData) {
        setAllLogs(data.data || []);
        setPagination({ pageSize: 25, current: 1 }); // Reset pagination
      } if (resetDataOnly) {
        setAllLogs(data.data || []);
      } else {
        setAllLogs((prevLogs) => [...prevLogs, ...(data?.data || [])]);
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

    // setPagination({ pageSize: 25, current: 1 });
    setAllLogs([]);
    setCurrentPageLogs([]);
    fetchLogs(1, total, true);
  };
  
  // Debounce handler for input fields
  const handleInputChange = useCallback(
    debounce(() => {
      setPagination({ pageSize: 25, current: 1 });
      setAllLogs([]); 
      setCurrentPageLogs([]); 
      fetchLogs(1, LOG_PAGE_SIZE, true);
    }, 300),
    []
  );
  
  const handleClickFilter = (field: any, value: any) => {
    form.setFieldsValue({ [field]: value });
    
    setPagination({ pageSize: 25, current: 1 });
    setAllLogs([]);
    setCurrentPageLogs([]);
    fetchLogs(1, LOG_PAGE_SIZE, true);
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
    fetchLogs(1, LOG_PAGE_SIZE, true);
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
      const originalNextApiPage = Math.floor((newPage * pageSize) / 100) + 1;
      let nextApiPage = Math.floor(allLogs.length / 100) + 1;
      let logPageSize = LOG_PAGE_SIZE;
      let reset = false;
      if (originalNextApiPage - pagination.current > 1) {
        reset = true;
        nextApiPage = 1;
        logPageSize = newPage * pageSize; //(originalNextApiPage - pagination.current) * 100;
      }
      fetchLogs(nextApiPage, logPageSize, false, reset).then(() => {
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
  
  const columns = [
    {
      title: "",
      dataIndex: "eventDetail",
      key: "eventDetail",
      render: (_: string, record: any) => (
        <Link to={{
            pathname: `${SETTING_URL}/audit/${record.id}/detail`,
          }}
        >
          <EyeOutlined />
        </Link>
      ),
    },
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
        <a onClick={() => handleClickFilter("environmentId", text)}>{dataMap[text] ?? text}</a>
      ),
    },
    {
      title: "Org ID",
      dataIndex: "orgId",
      key: "orgId",
      render: (text: string) => (
        <a onClick={() => handleClickFilter("orgId", text)}>{dataMap[text] ?? text}</a>
      ),
    },
    {
      title: "User ID",
      dataIndex: "userId",
      key: "userId",
      render: (text: string) => (
        <a onClick={() => handleClickFilter("userId", text)}>{dataMap[text] ?? text}</a>
      ),
    },
    {
      title: "App ID",
      dataIndex: "appId",
      key: "appId",
      render: (text: string, record: any) => (
        <a onClick={() => handleClickFilter("appId", text)}>
          {
            record.details?.applicationName
            || record.details?.applicationId
            || '-'
          }
        </a>
      ),
    }
  ];

  const eventTypeLabels = Object.fromEntries(eventTypes.map((et) => [et.value, et.label]));

  return (
    <DetailContainer>
      <Header>
        <Level1SettingPageTitle style={{marginBottom: 0}}>
          <span>{trans("enterprise.AuditLogTitle")}</span>
        </Level1SettingPageTitle>
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
                  fetchLogs(1, LOG_PAGE_SIZE, true);
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
          {Boolean(statistics.length) && !loading && (
            <Statistics stats={statistics} />
          )}
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
                  rowKey="id"
                  columns={columns}
                  dataSource={currentPageLogs}
                  size="small" // Compact Layout
                  pagination={{
                    pageSize: pagination.pageSize,
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