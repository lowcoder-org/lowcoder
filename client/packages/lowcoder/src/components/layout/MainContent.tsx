import { default as Layout } from "antd/es/layout";
import { TopHeaderHeight } from "constants/style";
import styled from "styled-components";

const { Content } = Layout;

const MainContent = styled((props: any) => <Content {...props} />)`
  height: calc(100vh - ${TopHeaderHeight});
  /* display: flex; */
  overflow: auto;
  background: #ffffff;
  position: relative;
`;

export default MainContent;
