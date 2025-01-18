import ReactECharts from 'echarts-for-react';
import { DetailContainer, DetailContent, Header } from '../theme/styledComponents';
import { HeaderBack } from '../permission/styledComponents';
import { AreaTimeChart } from './AreaTimeChart';

export default function Audit() {
  return (
    <DetailContainer>
      <Header>
        <HeaderBack>
          <span>{"Audit Logs"}</span>
        </HeaderBack>
      </Header>
      <DetailContent>
        <AreaTimeChart />
      </DetailContent>
    </DetailContainer>
  )
}
