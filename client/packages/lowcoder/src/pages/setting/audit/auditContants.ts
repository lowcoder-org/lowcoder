import ReactECharts from 'echarts-for-react';
import { styled } from 'styled-components';
import { trans } from "i18n";

export const StyledReactECharts = styled(ReactECharts)`
  width: 100%;
  height: 400px;
`;

type EventType = | "USER_LOGIN"
| "USER_LOGOUT"
| "APPLICATION_CREATE"
| "APPLICATION_DELETE"
| "APPLICATION_UPDATE"
| "APPLICATION_MOVE"
| "APPLICATION_RECYCLED"
| "APPLICATION_RESTORE"
| "APPLICATION_PUBLISH"
| "APPLICATION_VERSION_CHANGE"
| "APPLICATION_SHARING_CHANGE"
| "APPLICATION_PERMISSION_CHANGE"
| "FOLDER_CREATE"
| "FOLDER_DELETE"
| "FOLDER_UPDATE"
| "QUERY_EXECUTION"
| "GROUP_CREATE"
| "GROUP_UPDATE"
| "GROUP_DELETE"
| "GROUP_MEMBER_ADD"
| "GROUP_MEMBER_ROLE_UPDATE"
| "GROUP_MEMBER_LEAVE"
| "GROUP_MEMBER_REMOVE"
| "SERVER_START_UP"
| "SERVER_INFO"
| "DATA_SOURCE_CREATE"
| "DATA_SOURCE_UPDATE"
| "DATA_SOURCE_DELETE"
| "DATA_SOURCE_PERMISSION_GRANT"
| "DATA_SOURCE_PERMISSION_UPDATE"
| "DATA_SOURCE_PERMISSION_DELETE"
| "LIBRARY_QUERY_CREATE"
| "LIBRARY_QUERY_UPDATE"
| "LIBRARY_QUERY_DELETE"
| "LIBRARY_QUERY_PUBLISH"
| "API_CALL_EVENT";

export type AuditLog = {
  eventType: EventType;
  eventTime: string;
  environmentId: string;
  orgId: string;
  userId: string;
  appId: string;
};

export type AuditLogStat = {
  eventType: EventType;
  groupCountResult: number;
}

export const eventTypes = [
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

// temporary geoLocation data
export const geoLocation = {
  "location": {
    "accuracy_radius": 500,
    "latitude": 24.8591,
    "longitude": 66.9983,
    "time_zone": "Asia/Karachi"
  }
}