import { useParams } from "react-router-dom";
import { DetailContainer, DetailContent, Header } from "../theme/styledComponents";
import { HeaderBack } from "../permission/styledComponents";
import { trans } from "i18n";
import Card from "antd/es/card";
import { styled } from "styled-components";
import Descriptions from "antd/es/descriptions";
import { AppleOutlined, AppstoreAddOutlined, AppstoreOutlined, ChromeOutlined, DesktopOutlined, EnvironmentOutlined, FileSearchOutlined, InfoCircleOutlined, TeamOutlined, UserOutlined } from "@ant-design/icons";
import { Map, Marker } from "pigeon-maps"
import Tree from "antd/es/tree";
import Empty from "antd/es/empty";
import { ReactNode, useEffect, useMemo, useState } from "react";
import { getAuditLogs, getEnvironmentsByIds, getMeta } from "@lowcoder-ee/api/enterpriseApi";
import { isEmpty } from "lodash";
import { getEventColor, getEventLabel } from "./dashboard";
import Tag from "antd/es/tag";
import { ArrowIcon } from "lowcoder-design";
import history from "util/history";
import { AUDIT_LOG_DASHBOARD } from "@lowcoder-ee/constants/routesURL";

const StyleThemeSettingsCover = styled.div`
  display: flex;
  flex-direction: row;
  background: linear-gradient(34deg, rgba(2, 0, 36, 1) 0%, rgba(102, 9, 121, 1) 35%, rgba(0, 255, 181, 1) 100%);
  padding: 15px;
  height: 80px;
  border-radius: 10px 10px 0 0;
`;

const StyledTree = styled(Tree)`
  &.ant-tree {
    margin-top: 24px;
  }

  .ant-tree-treenode {
    margin-bottom: 12px;
  }

  .ant-tree-node-content-wrapper {
    padding: 8px;
  }
  
  .ant-tree-switcher {
    padding-top: 8px;
    &::before {
      top: 8px;
    }  
  }

  .ant-tree-switcher_open::after {
    content: "";
    width: 1px;
    height: 100%;
    position: absolute;
    left: 46%;
    top: 26px;
    background: #d9d9d9;
  }

  .ant-descriptions-header {
    margin-bottom: 8px;
  }

  .ant-tree-indent-unit {
    width: 0;
  }
`;

const getResourceName = (eventType: string) => {
  if (eventType.startsWith("USER_")) return "User";
  if (eventType.startsWith("APPLICATION_")) return "Application";
  if (eventType.startsWith("FOLDER_")) return "Folder";
  if (eventType.startsWith("QUERY_") || eventType.startsWith("LIBRARY_QUERY_")) return "Query";
  if (eventType.startsWith("GROUP_")) return "Group";
  if (eventType.startsWith("SERVER_")) return "Server";
  if (eventType.startsWith("DATA_SOURCE")) return "Data Source";
  if (eventType.startsWith("API_")) return "API";

  return undefined;
}

const getResourceData = (eventType: string, eventDetail: any) => {
  if (eventType.startsWith("APPLICATION_"))
    return { ID: eventDetail.applicationId, Name: eventDetail.applicationName};

  return {
    ID: eventDetail.id, Name: eventDetail.name,
  }
}

const EventTreeNode = (props: {
  icon: ReactNode,
  title: string,
  data: Record<string, any>
}) => {
  return (
    <Descriptions
      bordered
      column={1}
      size="small"
      title={<span>{props.icon} {props.title}</span>}
    >
      {Object.keys(props.data).map(dataKey => (
        <Descriptions.Item key={dataKey} label={dataKey}>{props.data[dataKey] || '-'}</Descriptions.Item>
      ))}
    </Descriptions>
  )
}
export function AuditLogDetail() {
  const { eventId } = useParams<{eventId: string}>();
  const [ event, setEvent ] = useState<any>({});
  const [ meta, setMeta ] = useState<any>({});
  const [ environment, setEnvironment ] = useState<any>({});

  const fetchEventData = async () => {
    const response = await getAuditLogs({ eventId });
    setEvent(response?.data?.[0]);
  }

  const fetchEventMeta = async () => {
    if (isEmpty(event)) return;
  
    const response = await getMeta({
      orgIds: [event.orgId],
      userIds: [event.userId],
      appIds: [],
      groupIds: [],
      bundleIds: [],
      datasourceIds: [],
      folderIds: [],
      libraryQueryIds: []
    });
    setMeta(response.data);
  }

  const fetchEnvironmentData = async () => {
    if (isEmpty(event)) return;
  
    const response = await getEnvironmentsByIds([event.environmentId]);
    setEnvironment(response.data?.[0] || {});
  }

  useEffect(() => {
    fetchEventData();
  }, [eventId]);

  useEffect(() => {
    fetchEventMeta();
    fetchEnvironmentData();
  }, [JSON.stringify(event)]);

  const eventHierarchy = useMemo(() => {
    if (isEmpty(event)) return [];

    const date = new Date(event.eventTime);
    const eventTime = new Intl.DateTimeFormat(navigator.language, {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      timeZoneName: "short",
    }).format(date);

    const resourceName = getResourceName(event.eventType);
    const eventNode = {
      title: (
        <EventTreeNode
          icon={<InfoCircleOutlined />}
          title="Event"
          data={{
            Type: <Tag color={getEventColor(event?.eventType)}>{getEventLabel(event?.eventType)}</Tag>,
            Time: eventTime,
          }}
        />
      ),
      key: "0-0-0-0-0",
    }
    
    let eventData = [];
    if (Boolean(resourceName)) {
      if (resourceName !== "User") {
        const resource = {
          title: (
            <EventTreeNode
              icon={<AppstoreAddOutlined />}
              title={resourceName as string}
              data={getResourceData(event.eventType as string, event.details) || {}}
            />
          ),
          key: "0-0-0-0",
          children: [] as any[],
        };
        resource.children.push(eventNode)
        eventData.push(resource);
      } else {
        eventData.push(eventNode)
      }
    }

    return [
      {
        title: (
          <EventTreeNode
            icon={<EnvironmentOutlined />}
            title="Environment"
            data={{
              ID: event?.environmentId,
              Name: environment?.environmentType || '-'
            }}
          />
        ),
        key: "0",
        children: [
          {
            title: (
              <EventTreeNode
                icon={<TeamOutlined />}
                title="Workspace"
                data={{
                  ID: event?.orgId,
                  Name: meta?.orgs?.[0]?.name || '-',
                }}
              />
            ),
            key: "0-0",
            children: [
              {
                title: (
                  <EventTreeNode
                    icon={<UserOutlined />}
                    title="User"
                    data={{
                      ID: event?.userId,
                      Name: meta?.users?.[0]?.name || '-',
                    }}
                  />
                ),
                key: "0-0-0",
                children: eventData,
              },
            ],
          },
        ],
      },
    ];
  }, [event, meta, environment]);

  if (!Boolean(event)) {
    return (
      <DetailContainer>
        <Header>
          <HeaderBack>
            <span onClick={() => history.push(AUDIT_LOG_DASHBOARD)}>
              {trans("enterprise.AuditLogTitle")}
            </span>
            <ArrowIcon />
            <span>{"Audit Log Detail"}</span>
          </HeaderBack>
        </Header>
        <DetailContent>
          <Empty />
        </DetailContent>
      </DetailContainer>
    )
  }

  return (
    <DetailContainer>
      <Header>
        <HeaderBack>
          <span onClick={() => history.push(AUDIT_LOG_DASHBOARD)}>
            {trans("enterprise.AuditLogTitle")}
          </span>
          <ArrowIcon />
          <span>{trans("auditLog.title")}</span>
        </HeaderBack>
      </Header>

      <DetailContent>
        {/* Geolocation */}
        <StyleThemeSettingsCover>
          <h2 style={{ color: "#ffffff", marginTop: "8px" }}>{trans("auditLog.geoLocation")}</h2>
        </StyleThemeSettingsCover>
        <Card size="small" style={{ marginBottom: "20px", borderTopLeftRadius: 0, borderTopRightRadius: 0 }}>
          <Map
            height={300}
            defaultZoom={5}
            defaultCenter={[55, 15]}
          >
            <Marker
              width={50}
              anchor={[55, 15]}
            />
          </Map>
        </Card>

        {/* Browser/System Meta data */}
        <StyleThemeSettingsCover>
          <h2 style={{ color: "#ffffff", marginTop: "8px" }}>{trans("auditLog.browserData")}</h2>
        </StyleThemeSettingsCover>
        <Card size="small" style={{ marginBottom: "20px", borderTopLeftRadius: 0, borderTopRightRadius: 0 }}>
          <Descriptions bordered column={1} size="small">
            <Descriptions.Item label={<span><ChromeOutlined className="text-lg mr-2" /> {trans("auditLog.browser")}</span>}>{event?.agentName}</Descriptions.Item>
            <Descriptions.Item label={<span><AppleOutlined className="text-lg mr-2" /> {trans("auditLog.OS")}</span>}>{event?.operatingSystemName} ({event?.operatingSystemVersion})</Descriptions.Item>
            <Descriptions.Item label={<span><DesktopOutlined className="text-lg mr-2" /> {trans("auditLog.device")}</span>}>{event?.deviceName}</Descriptions.Item>
            <Descriptions.Item label={<span><DesktopOutlined className="text-lg mr-2" /> {trans("auditLog.deviceType")}</span>}>{event?.deviceClass}</Descriptions.Item>
            <Descriptions.Item label={<span><AppstoreOutlined className="text-lg mr-2" /> {trans("auditLog.engine")}</span>}>{event?.layoutEngineName} (Version: {event?.layoutEngineVersion})</Descriptions.Item>
            <Descriptions.Item label={<span><AppstoreOutlined className="text-lg mr-2" /> {trans("auditLog.browserData")}</span>}>{event?.webviewAppName}</Descriptions.Item>
          </Descriptions>
        </Card>

        {/* Event Detail */}
        <StyleThemeSettingsCover>
          <h2 style={{ color: "#ffffff", marginTop: "8px" }}>{trans("auditLog.eventDetail")}</h2>
        </StyleThemeSettingsCover>
        <Card size="small" style={{ marginBottom: "20px", borderTopLeftRadius: 0, borderTopRightRadius: 0 }}>
          {Boolean(eventHierarchy.length) && (
            <StyledTree
              showLine
              defaultExpandAll
              selectable={false}
              treeData={eventHierarchy}
            />
          )}
        </Card>
      </DetailContent>
    </DetailContainer>
  )
}