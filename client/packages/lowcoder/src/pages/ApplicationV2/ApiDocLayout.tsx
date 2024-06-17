import styled, { createGlobalStyle } from "styled-components";
import { trans } from "../../i18n";
// import { API } from '@stoplight/elements';
import React from 'react';
import { useLocation } from "react-router-dom";
import history from "util/history";
import { Card } from "antd";
import { default as AntdBreadcrumb } from "antd/es/breadcrumb";
import { ALL_APPLICATIONS_URL, API_DOCS_URL } from "constants/routesURL";
import { ArrowIcon } from "lowcoder-design";

import './components/stoplight.styles.css';

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
`;

const HeaderWrapper = styled.div`
  height: 84px;
  width: 100%;
  display: flex;
  padding: 0 36px;
  align-items: center;
  flex-shrink: 0;
  @media screen and (max-width: 500px) {
    padding: 0 24px;
  }
`;

const ContentWrapper = styled.div`
  position: relative;
`;

const Breadcrumb = styled(AntdBreadcrumb)`
  font-size: 20px;

  li:not(:last-child) {
    color: #8b8fa3;
  }

  li:last-child {
    font-weight: 500;
    color: #222222;
  }

  li.ant-breadcrumb-separator {
    display: flex;
    flex-direction: column;
    justify-content: center;
  }
`;

const BreadcrumbItem = styled.div`
  cursor: pointer;
`;

const ApiDocView = styled.div`
  font-size: 14px;
  color: #8b8fa3;
  flex-grow: 1;
  padding-top: 0px;
  padding-left: 40px;
  max-width: 98%;
`;

const StyleApiDocCover = styled.div`
    background: rgb(9,52,121);
    background: -moz-linear-gradient(139deg, rgba(9,52,121,1) 19%, rgba(5,98,180,1) 67%, rgba(0,76,255,1) 100%);
    background: -webkit-linear-gradient(139deg, rgba(9,52,121,1) 19%, rgba(5,98,180,1) 67%, rgba(0,76,255,1) 100%);
    background: linear-gradient(139deg, rgba(9,52,121,1) 19%, rgba(5,98,180,1) 67%, rgba(0,76,255,1) 100%);
    filter: progid:DXImageTransform.Microsoft.gradient(startColorstr="#093479",endColorstr="#004cff",GradientType=1);
    padding: 25px;
    height: 120px;
    border-radius:10px 10px 0 0;
`;


const isSelfHost = window.location.host !== 'app.lowcoder.cloud';

export type ApiDocBreadcrumbType = { text: string; path: string };

export interface ApiDocLayoutProps {
  breadcrumb?: ApiDocBreadcrumbType[];
}

export function ApiDoc(props: ApiDocLayoutProps) {

  const { breadcrumb = []} = props;
  const currentPath = useLocation().pathname;

  const breadcrumbItems = [
    {
      key: 0,
      title: trans("home.home"),
      onClick: () =>
        currentPath !== ALL_APPLICATIONS_URL && history.push(ALL_APPLICATIONS_URL),
    },
    ...breadcrumb.map((b, i) => ({
      key: i+1,
      title: b.text,
      onClick: () => currentPath !== b.path && history.push(b.path)
    }))
  ]

  return (
    <Wrapper>
      <HeaderWrapper>
        <Breadcrumb
          separator={<ArrowIcon />}
          items={breadcrumbItems}
          itemRender={(item) => (
            <BreadcrumbItem
              key={item.key}
              onClick={item.onClick}
            >
              {item.title}
            </BreadcrumbItem>
          )}
        >
        </Breadcrumb>
      </HeaderWrapper>

      <ContentWrapper>
        <ApiDocView>
          <StyleApiDocCover>
            <h1 style={{color: "#ffffff", marginTop : "12px"}}>{trans("home.api")}</h1>
          </StyleApiDocCover>
          <Card style={{ marginBottom: "20px", minHeight : "800px", width: "100%" }}>
            <div style={{width : "100%"}}> {/* className={styles.stoplightApidoc} */}
              {/* <API
                layout="responsive"
                hideSchemas={true}
                hideInternal={true}
                hideExport={true}
                tryItCredentialsPolicy="include"
                tryItCorsProxy={isSelfHost ? undefined : 'https://api-service.lowcoder.cloud'}
                basePath={API_DOCS_URL}
                apiDescriptionUrl="https://api-service.lowcoder.cloud/api/docs/api-docs"
              /> */}
            </div>
          </Card>  
          
        </ApiDocView>
      </ContentWrapper>
    </Wrapper>
  );
}
