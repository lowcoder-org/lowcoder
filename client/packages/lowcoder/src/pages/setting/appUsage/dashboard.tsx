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
import { getAppUsageLogs, getEnvironmentsByIds, getMeta } from "api/enterpriseApi";
import { debounce, uniqBy } from "lodash";
import { DatePicker } from "antd";
import dayjs, { Dayjs } from "dayjs";
import { Link, useLocation } from "react-router-dom";
import history from "util/history";
import { SETTING_URL } from "@lowcoder-ee/constants/routesURL";
import { EyeOutlined } from "@ant-design/icons";
import UserActivityByTimeChart from "./charts/userActivityByTime";
import UserAuthStatusChart from "./charts/userAuthStatus";
import DeviceOSBreakdownChart from "./charts/deviceOSBreakdown";
import BrowserEngineBreakdownChart from "./charts/browserEngineBreakdown";
import UserEngagementByRegionChart from "./charts/userEngagementByRegion";
import { geoLocation } from "../audit/auditContants";
import { Level1SettingPageTitle } from "../styled";

const { RangePicker } = DatePicker;

const AppLogContent = styled.div`
  font-size: 14px;
  color: #8b8fa3;
  flex-grow: 1;
  padding-top: 0px;
  padding-left: 0px;
  max-width: 100%;
  margin-bottom: 20px;
`;

const StyleThemeSettingsCover = styled.div`
  display: flex;
  flex-direction: row;
  background: linear-gradient(34deg, rgba(2, 0, 36, 1) 0%, rgba(102, 9, 121, 1) 35%, rgba(0, 255, 181, 1) 100%);
  padding: 15px;
  height: 80px;
  border-radius: 10px 10px 0 0;
`;

export function AppUsageDashboard() {

  type AppLog = {
    eventType: string;
    eventTime: string;
    environmentId: string;
    orgId: string;
    userId: string;
    appId: string;
    isAnonymous: boolean;
    details: Record<string, any>;
    geolocationDataJsonb?: Record<string, any>,
    applicationAuthor?: string;
    applicationAuthorOrgId?: string;
  };

  const currentUser = useSelector(getUser);
  const location = useLocation();

  const [allLogs, setAllLogs] = useState<AppLog[]>([]); 
  const [currentPageLogs, setCurrentPageLogs] = useState<AppLog[]>([]);
  const [dataMap, setDataMap] = useState<Record<string, any>>({});

  // const [logs, setLogs] = useState([]);
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

  // Fetch Logs with all form values if set
  const fetchLogs = async (newPage: number, resetData: boolean = false) => {
    const formValues = form.getFieldsValue();
  
    const cleanedParams = Object.fromEntries(
      Object.entries({
        ...formValues,
        pageSize: 100, // Always fetch 500 from API
        pageNum: newPage, // API page number
        fromTimestamp: formValues.dateRange?.[0] ? formValues.dateRange[0].toISOString() : undefined,
        toTimestamp: formValues.dateRange?.[1] ? formValues.dateRange[1].toISOString() : undefined,
      }).filter(([key, value]) => value !== undefined && value !== null && value !== "" && key !== 'dateRange')
    );

    handleQueryParams(cleanedParams as any);

    setLoading(true);
    try {
      const data = await getAppUsageLogs(cleanedParams);
  
      if (resetData) {
        setAllLogs(data.data || []);
        setPagination({ pageSize: 25, current: 1 }); // Reset pagination
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
      const nextApiPage = Math.floor(allLogs.length / 100) + 1;
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

  const appViews = useMemo(() => {
    if (!allLogs?.length) return [];

    return allLogs.reduce((acc, e) => {
      const environmentId = e.environmentId;
      const orgId = e.orgId;
      const appId = e.appId;
      const name = e.details?.applicationName ?? 'Unknown';
      const applicationAuthor = e.applicationAuthor;
      const applicationAuthorOrgId = e.applicationAuthorOrgId;
      acc[appId] = acc[appId] || { appId, name, orgId, environmentId, applicationAuthor, applicationAuthorOrgId, count: 0 };
      acc[appId].count++;
      return acc;
    }, {} as Record<string, {
      appId: string, name: string,
      orgId: string,
      environmentId: string,
      applicationAuthor?: string,
      applicationAuthorOrgId?: string,
      count: number
    }>);
  }, [allLogs]);
  
  const topApps = useMemo(() => {
    if (!Object.keys(appViews)?.length) return [];

    return Object.values(appViews)
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
  }, [appViews]);

  const findUniqueDataIds = async () => {
    if (!topApps.length) {
      return setDataMap({});
    }

    const uniqueOrgIds: string[] = uniqBy(topApps, 'orgId').map(item => item.orgId);
    const uniqueEnvIds: string[] = uniqBy(topApps, 'environmentId').map(item => item.environmentId);

    const metaResponse = await getMeta({
      orgIds: uniqueOrgIds,
      userIds: [],
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
    envResponse.data?.forEach((env: { environmentId: string; environmentType: string; }) => {
      tempDataMap[env.environmentId] = env.environmentType;
    });
    setDataMap(tempDataMap);
  }

  useEffect(() => {
    findUniqueDataIds();
  }, [topApps]);

  const columns = [
    {
      title: "",
      dataIndex: "viewApp",
      key: "viewApp",
      render: (_: string, record: any) => (
        <Link to={{
            pathname: `/apps/${record.appId}/view`,
          }}
          target="_blank"
        >
          <EyeOutlined />
        </Link>
      ),
    },
    {
      title: "App ID",
      dataIndex: "appId",
      key: "appId",
      render: (text: string, record: any) => (
        <a onClick={() => handleClickFilter("appId", text)}>
          {
            record.name
            || record.appId
            || '-'
          }
        </a>
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
      title: "Environment ID",
      dataIndex: "environmentId",
      key: "environmentId",
      render: (text: string) => (
        <a onClick={() => handleClickFilter("environmentId", text)}>{dataMap[text] ?? text}</a>
      ),
    },
    {
      title: "App Author",
      dataIndex: "applicationAuthor",
      key: "applicationAuthor",
      render: (text: string) => (
        text ? <a onClick={() => handleClickFilter("appAuthor", text)}>{text}</a> : '-'
      ),
    },
    {
      title: "App Author Org ID",
      dataIndex: "applicationAuthorOrgId",
      key: "applicationAuthorOrgId",
      render: (text: string) => (
        text ? <a onClick={() => handleClickFilter("appAuthorOrgId", text)}>{dataMap[text] ?? text}</a> : '-'
      ),
    },
    {
      title: "Total Views",
      dataIndex: "count",
      key: "count",
    },
  ];

  return (
    <DetailContainer>
      <Header>
        <Level1SettingPageTitle style={{marginBottom: 0}}>
          <span>{trans("settings.appUsage")}</span>
        </Level1SettingPageTitle>
      </Header>

      <DetailContent>
        <AppLogContent>
          <StyleThemeSettingsCover>
            <h2 style={{ color: "#ffffff", marginTop: "8px" }}>{trans("enterprise.logFilter")}</h2>
          </StyleThemeSettingsCover>
          <Card size="small" style={{ marginBottom: "20px" }}>
            <Form
              form={form}
              layout="inline"
              onValuesChange={(changedValue) => {
                const key = Object.keys(changedValue)[0];
                if (key === "dateRange") {
                  handleDateChange(changedValue.dateRange);
                } else if (["environmentId", "orgId", "userId", "appId", "appAuthor", "appAuthorOrgId"].includes(key)) {
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
                  {/* <Form.Item name="eventType">
                    <Select
                      allowClear
                      showSearch
                      placeholder="Event Type"
                      options={eventTypes}
                      style={{ width: 200 }}
                    />
                  </Form.Item> */}
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
                
                <Flex>
                  <Form.Item name="appAuthor">
                    <Input placeholder="App Author" allowClear />
                  </Form.Item>
                  <Form.Item name="appAuthorOrgId">
                    <Input placeholder="App Author Org ID" allowClear />
                  </Form.Item>
                </Flex>
              </Flex>
            </Form>
          </Card>
        </AppLogContent>
        <AppLogContent>
          <StyleThemeSettingsCover>
            <h2 style={{ color: "#ffffff", marginTop: "8px" }}>{trans("enterprise.usageLogUserEngagement")}</h2>
          </StyleThemeSettingsCover>
          <Card size="small">
            {loading ? (
              <Skeleton active paragraph={{ rows: 5 }} />
            ) : currentPageLogs.length > 0 ? (
              <>
                <UserEngagementByRegionChart data={allLogs}/>
              </>
            ) : (
              <p>{trans("enterprise.noLogsFound")}</p>
            )}
          </Card>
        </AppLogContent>
        <AppLogContent>
          <StyleThemeSettingsCover>
            <h2 style={{ color: "#ffffff", marginTop: "8px" }}>{trans("enterprise.usageLogAppViews")}</h2>
          </StyleThemeSettingsCover>
          <Card size="small">
            {loading ? (
              <Skeleton active paragraph={{ rows: 5 }} />
            ) : currentPageLogs.length > 0 ? (
              <>
                <UserActivityByTimeChart 
                  data={allLogs} 
                  setDateRange={handleChartZoom} 
                />
              </>
            ) : (
              <p>{trans("enterprise.noLogsFound")}</p>
            )}
          </Card>
        </AppLogContent>
        <AppLogContent>
          <StyleThemeSettingsCover>
            <h2 style={{ color: "#ffffff", marginTop: "8px" }}>{trans("enterprise.usageLogTopTen")}</h2>
          </StyleThemeSettingsCover>
          <Card size="small">
          {loading ? (
              <Skeleton active paragraph={{ rows: 5 }} />
            ) : currentPageLogs.length > 0 ? (
              <div style={{ overflowX: "auto", width: "100%" }}>
                <Table
                  rowKey={"id"}
                  columns={columns}
                  dataSource={topApps}
                  size="small" // Compact Layout
                  style={{ width: "100%", whiteSpace: "nowrap" }} // Fixed width, prevent line break
                  onChange={handleTableChange} // Handle pagination
                  loading={loading}
                  pagination={false}
                />
              </div>
            ) : (
              <p>{trans("enterprise.noLogsFound")}</p>
            )}
          </Card>
        </AppLogContent>
        <AppLogContent>
          <StyleThemeSettingsCover>
            <h2 style={{ color: "#ffffff", marginTop: "8px" }}>{trans("enterprise.usageLogAnonymousKNown")}</h2>
          </StyleThemeSettingsCover>
          <Card size="small">
            {loading ? (
              <Skeleton active paragraph={{ rows: 5 }} />
            ) : currentPageLogs.length > 0 ? (
              <>
                <UserAuthStatusChart 
                  data={allLogs} 
                />
              </>
            ) : (
              <p>{trans("enterprise.noLogsFound")}</p>
            )}
          </Card>
        </AppLogContent>
        <AppLogContent>
          <StyleThemeSettingsCover>
            <h2 style={{ color: "#ffffff", marginTop: "8px" }}>{trans("enterprise.usageLogDevices")}</h2>
          </StyleThemeSettingsCover>
          <Card size="small">
            {loading ? (
              <Skeleton active paragraph={{ rows: 5 }} />
            ) : currentPageLogs.length > 0 ? (
              <>
                <DeviceOSBreakdownChart 
                  data={allLogs} 
                />
              </>
            ) : (
              <p>{trans("enterprise.noLogsFound")}</p>
            )}
          </Card>
        </AppLogContent>
        <AppLogContent>
          <StyleThemeSettingsCover>
            <h2 style={{ color: "#ffffff", marginTop: "8px" }}>{trans("enterprise.usageLogBrowsers")}</h2>
          </StyleThemeSettingsCover>
          <Card size="small">
            {loading ? (
              <Skeleton active paragraph={{ rows: 5 }} />
            ) : currentPageLogs.length > 0 ? (
              <>
                <BrowserEngineBreakdownChart 
                  data={allLogs} 
                />
              </>
            ) : (
              <p>{trans("enterprise.noLogsFound")}</p>
            )}
          </Card>
        </AppLogContent>
      </DetailContent>
    </DetailContainer>
  );
}
