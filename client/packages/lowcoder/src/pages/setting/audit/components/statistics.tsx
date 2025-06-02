import Statistic from "antd/es/statistic";
import { AuditLogStat } from "../auditContants";
import Card from "antd/es/card";
import styled from "styled-components";
import { useMemo } from "react";

const StyledStatistics = styled(Statistic)`
  .ant-statistic-title {
    font-size: 12px;
  }
  .ant-statistic-content {
    font-size: 20px;
  }
`;

const Statistics = ({ stats }: { stats: AuditLogStat[] }) => {
  const width = useMemo(() => {
    if (stats.length < 5) return `${100/stats.length}%`;
    return '20%';
  }, [stats.length]);

  return (
    <Card size="small" variant="borderless" style={{marginBottom: '20px'}}>
      {stats.map(stat => (
        <Card.Grid key={stat.eventType} hoverable={false} style={{width, padding: '12px'}}>
          <StyledStatistics
            title={stat.eventType.split('_').join(' ')}
            value={stat.groupCountResult}
          />
        </Card.Grid>
      ))}
    </Card>
  )
}

export default Statistics;
