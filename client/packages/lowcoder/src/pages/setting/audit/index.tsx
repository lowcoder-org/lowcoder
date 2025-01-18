import { EmptyContent } from "components/EmptyContent";
import { HelpText } from "components/HelpText";
import { Switch, Card, Input, message, Divider } from "antd";
import React, { useEffect, useState } from "react";
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


export function AuditLog() {  
  const currentUser = useSelector(getUser);
  const dispatch = useDispatch();

  const [logs, setLogs] = useState([]);
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    dispatch(fetchCommonSettings({ orgId: currentUser.currentOrgId }));
  }, [currentUser.currentOrgId, dispatch]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const data = await getAuditLogs({ orgId: currentUser.currentOrgId });
      setLogs(data);
    } catch (error) {
      message.error("Failed to fetch audit logs.");
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <DetailContainer>
      <Header>
        <HeaderBack>
          <span>{trans("branding.title")}</span>
        </HeaderBack>
      </Header>

      <DetailContent>
        <AuditContent>
          <StyleThemeSettingsCover>
            <h2 style={{ color: "#ffffff", marginTop: "8px" }}>{trans("branding.logoSection")}</h2>
          </StyleThemeSettingsCover>
          <Card>
            <div>
              <h3>{trans("branding.logo")}</h3>
              <EventTypeTimeChart data={logs}/>
            </div>
            
          </Card>
        </AuditContent>
      </DetailContent>
    </DetailContainer>
  );
}