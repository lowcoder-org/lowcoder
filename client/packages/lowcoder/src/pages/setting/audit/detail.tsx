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
import { getAuditLogs, getMeta } from "@lowcoder-ee/api/enterpriseApi";
import { isEmpty } from "lodash";
import { getEventColor, getEventLabel } from "./dashboard";
import Tag from "antd/es/tag";

const StyleThemeSettingsCover = styled.div`
  display: flex;
  flex-direction: row;
  background: linear-gradient(34deg, rgba(2, 0, 36, 1) 0%, rgba(102, 9, 121, 1) 35%, rgba(0, 255, 181, 1) 100%);
  padding: 15px;
  height: 80px;
  border-radius: 10px 10px 0 0;
`;

const StyledTree = styled(Tree)`
  .ant-tree-treenode {
    margin-bottom: 24px;
  }

  .ant-descriptions-header {
    margin-bottom: 8px;
  }

  .ant-tree-indent-unit {
    width: 48px;
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

  return undefined;
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
        <Descriptions.Item label={dataKey}>{props.data[dataKey] || '-'}</Descriptions.Item>
      ))}
    </Descriptions>
  )
}
export function AuditLogDetail() {
  const { eventId } = useParams<{eventId: string}>();
  const [ event, setEvent ] = useState<any>({});

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
    console.log(response);
    // setEvent(response?.data?.[0]);
  }

  useEffect(() => {
    fetchEventData();
  }, [eventId]);

  useEffect(() => {
    fetchEventMeta();
  }, [event]);

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
            data={{ ID: event?.environmentId, Name: event?.environmentName}}
          />
        ),
        key: "0",
        children: [
          {
            title: (
              <EventTreeNode
                icon={<TeamOutlined />}
                title="Workspace"
                data={{ ID: event?.orgId, Name: event?.orgName}}
              />
            ),
            key: "0-0",
            children: [
              {
                title: (
                  <EventTreeNode
                    icon={<UserOutlined />}
                    title="User"
                    data={{ ID: event?.userId, Name: event?.userName}}
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
  }, [event]);

  if (!Boolean(event)) {
    return (
      <DetailContainer>
        <Header>
          <HeaderBack>
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
          <span>{"Audit Log Detail"}</span>
        </HeaderBack>
      </Header>

      <DetailContent>
        {/* Geolocation */}
        <StyleThemeSettingsCover>
          <h2 style={{ color: "#ffffff", marginTop: "8px" }}>Geo Location</h2>
        </StyleThemeSettingsCover>
        <Card size="small" style={{ marginBottom: "20px", borderTopLeftRadius: 0, borderTopRightRadius: 0 }}>
          <Map height={300} defaultCenter={[50.879, 4.6997]} defaultZoom={11}>
            <Marker width={50} anchor={[50.879, 4.6997]} />
          </Map>
        </Card>

        {/* Browser/System Meta data */}
        <StyleThemeSettingsCover>
          <h2 style={{ color: "#ffffff", marginTop: "8px" }}>Browser / System Metadata</h2>
        </StyleThemeSettingsCover>
        <Card size="small" style={{ marginBottom: "20px", borderTopLeftRadius: 0, borderTopRightRadius: 0 }}>
          <Descriptions bordered column={1}>
            <Descriptions.Item label={<span><ChromeOutlined className="text-lg mr-2" /> Browser</span>}>{event?.agentName}</Descriptions.Item>
            <Descriptions.Item label={<span><AppleOutlined className="text-lg mr-2" /> OS</span>}>{event?.operatingSystemName} ({event?.operatingSystemVersion})</Descriptions.Item>
            <Descriptions.Item label={<span><DesktopOutlined className="text-lg mr-2" /> Device</span>}>{event?.deviceName}</Descriptions.Item>
            <Descriptions.Item label={<span><DesktopOutlined className="text-lg mr-2" /> Device Type</span>}>{event?.deviceClass}</Descriptions.Item>
            <Descriptions.Item label={<span><AppstoreOutlined className="text-lg mr-2" /> Engine</span>}>{event?.layoutEngineName} (Version: {event?.layoutEngineVersion})</Descriptions.Item>
            <Descriptions.Item label={<span><AppstoreOutlined className="text-lg mr-2" /> Webview</span>}>{event?.webviewAppName}</Descriptions.Item>
          </Descriptions>
        </Card>

        {/* Event Detail */}
        <StyleThemeSettingsCover>
          <h2 style={{ color: "#ffffff", marginTop: "8px" }}>Event Detail</h2>
        </StyleThemeSettingsCover>
        <Card size="small" style={{ marginBottom: "20px", borderTopLeftRadius: 0, borderTopRightRadius: 0 }}>
          <StyledTree
            showLine
            defaultExpandAll
            selectable={false}
            treeData={eventHierarchy}
          />
        </Card>
      </DetailContent>
    </DetailContainer>
  )
}