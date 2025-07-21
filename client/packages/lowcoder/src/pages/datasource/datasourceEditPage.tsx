import styled from "styled-components";
import history from "../../util/history";
import { default as Button } from "antd/es/button";
import { Spin } from "antd";
import { useCallback, useEffect, useMemo, useState } from "react";
import { CopyTextButton, DocIcon, PackUpIcon, TacoButton } from "lowcoder-design";
import { useDatasourceForm } from "./form/useDatasourceForm";
import { useParams } from "react-router-dom";
import { DATASOURCE_URL } from "../../constants/routesURL";
import { useSelector } from "react-redux";
import { getDataSourceTypes } from "../../redux/selectors/datasourceSelectors";
import { trans } from "i18n";
import { DatasourceType } from "@lowcoder-ee/constants/queryConstants";
import { getDatasourceTutorial } from "@lowcoder-ee/util/tutorialUtils";
import { getDataSourceFormManifest } from "./getDataSourceFormManifest";
import DataSourceIcon from "components/DataSourceIcon";
import { Helmet } from "react-helmet";
import { DatasourceApi } from "@lowcoder-ee/api/datasourceApi";
import { DatasourceInfo } from "@lowcoder-ee/api/datasourceApi";
import { GenericApiResponse } from "../../api/apiResponses";
import { Datasource } from "@lowcoder-ee/constants/datasourceConstants";
import { AxiosResponse } from "axios";
const Wrapper = styled.div`
  display: flex;
  justify-content: center;
  width: 100%;
  height: 100%;
  min-width: min-content;
  background-color: #ffffff;
`;

const ContentWrapper = styled.div`
  display: flex;
  flex-direction: column;
  max-width: 1488px;
  height: 100%;
  padding: 36px 36px 0;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
`;

const BackBtn = styled.div`
  display: flex;
  align-items: center;
  font-weight: 500;
  font-size: 16px;
  line-height: 24px;
  cursor: pointer;
  height: 24px;

  &:hover {
    color: #4965f2;
  }

  svg {
    transform: rotate(-90deg);
    width: 24px;
    height: 24px;
    margin-right: 4px;
  }

  &:hover svg g path {
    fill: #4965f2;
  }
`;

const Body = styled.div`
  display: flex;
  gap: 24px;
`;

const FormHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 21px 0 13px;
  font-size: 18px;
  font-weight: 500;
`;
const FormWrapper = styled.div`
  flex-shrink: 1;
  width: 912px;
`;
const FormFooter = styled.div`
  display: flex;
  justify-content: end;
  gap: 8px;
  height: 80px;
  padding: 24px 0 80px;
`;

const Whitelist = styled.div`
  flex-shrink: 0;
  height: fit-content;
  width: 192px;
  padding: 16px;
  line-height: 22px;
  border-radius: 6px;
  background-color: #f5f5f6;
`;

const IPWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;

  svg g {
    fill: #8b8fa3;
  }
`;

const TitleWrapper = styled.div`
  display: flex;
  align-items: center;

  & > div:first-child {
    margin-right: 4px;
  }
`;

const TutorialButton = styled(Button)`
  font-size: 13px;
  color: #333333;
  text-align: center;
  background: #ffffff;
  border-radius: 4px;
  border: 1px solid #d7d9e0;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 10px;

  &:hover {
    background-color: #f5f5f6;
    border: 1px solid #d7d9e0;
    color: #333333;
  }

  &:focus {
    background-color: #f5f5f6;
    border: 1px solid #d7d9e0;
    color: #333333;
  }
`;

const TutorialIcon = styled(DocIcon)`
  height: 12px;
  margin-right: 4px;
`;

type DatasourcePathParams = {
  datasourceId: string;
  datasourceType: DatasourceType;
};

export const DatasourceEditPage = () => {
  const { datasourceId, datasourceType } = useParams<DatasourcePathParams>();
  const datasourceTypes = useSelector(getDataSourceTypes);
  const [isReady, setIsReady] = useState(true);


  const [datasourceInfo, setDatasourceInfo] = useState<DatasourceInfo | undefined>();
  const [loading, setLoading] = useState(false);

  // Fetch individual datasource when editing
  useEffect(() => {
    if (!datasourceId) {
      setDatasourceInfo(undefined);
      return;
    }
    
    const fetchDatasource = async () => {
      setLoading(true);
      try {
        const response: AxiosResponse<GenericApiResponse<Datasource>> = await DatasourceApi.getDatasourceById(datasourceId);
        if (response.data.success) {
          // Transform to DatasourceInfo format
          setDatasourceInfo({
            datasource: response.data.data,
            edit: true, // Assume editable since user reached edit page
          });
        } else {
          console.error('API returned error:', response.data);
          setDatasourceInfo(undefined);
        }
      } catch (error: any) {
        console.error('Failed to fetch datasource:', error);
        setDatasourceInfo(undefined);
      } finally {
        setLoading(false);
      }
    };

    fetchDatasource();
  }, [datasourceId]);

  const dataSourceTypeInfo = useMemo(() => {
    if (datasourceId) {
      return undefined;
    }
    return datasourceTypes.find((t) => t.id === datasourceType);
  }, [datasourceId, datasourceTypes, datasourceType]);

  const finalDataSourceType = datasourceType || datasourceInfo?.datasource.type;

  const { testLoading, createLoading, form, genRequest, resolveTest, resolveCreate } =
    useDatasourceForm();

  const handleFormReadyStatusChange = useCallback((isReady: boolean) => {
    setIsReady(isReady);
  }, []);

  // Show loading state while fetching datasource
  if (loading) {
    return (
      <Wrapper>
        <ContentWrapper>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            height: '400px',
            flexDirection: 'column',
            gap: '16px'
          }}>
            <Spin size="large" />
          </div>
        </ContentWrapper>
      </Wrapper>
    );
  }

  if (!finalDataSourceType) {
    return null;
  }

  const tutorial = getDatasourceTutorial(finalDataSourceType);
  const pluginDef = datasourceInfo?.datasource.pluginDefinition || dataSourceTypeInfo?.definition;
  const formManifest = getDataSourceFormManifest(finalDataSourceType, pluginDef);
  const DatasourceForm = formManifest?.form;

  return (
    <><Helmet>{<title>{trans("home.datasource")} | {finalDataSourceType}</title>}</Helmet><Wrapper>
      <ContentWrapper>
        <Header>
          <BackBtn onClick={() => history.push(DATASOURCE_URL)}>
            <PackUpIcon />
            {trans("query.returnList")}
          </BackBtn>
        </Header>

        <FormHeader>
          <TitleWrapper>
            <DataSourceIcon dataSourceType={finalDataSourceType} size="large" />
            {datasourceInfo?.datasource.name ??
              dataSourceTypeInfo?.name ??
              trans("query.chooseDatasourceType")}
          </TitleWrapper>

          {tutorial && (
            <TutorialButton onClick={() => window.open(tutorial, "_blank")}>
              <TutorialIcon />
              {trans("query.viewDocuments")}
            </TutorialButton>
          )}
        </FormHeader>

        <Body>
          <FormWrapper>
            {DatasourceForm && (
              <DatasourceForm
                form={form}
                onFormReadyStatusChange={handleFormReadyStatusChange}
                dataSourceTypeInfo={dataSourceTypeInfo}
                datasource={datasourceInfo?.datasource!}
                size={"middle"} />
            )}

            {formManifest && (
              <FormFooter>
                {(formManifest.enableTest ?? true) && (
                  <TacoButton
                    buttonType="link"
                    loading={testLoading}
                    onClick={() => resolveTest(
                      genRequest({
                        datasourceId: datasourceId,
                        datasourceType: datasourceType ?? datasourceInfo?.datasource.type,
                      })
                    )}
                  >
                    {trans("query.testConnection")}
                  </TacoButton>
                )}
                <TacoButton
                  style={{ width: "84px" }}
                  buttonType="primary"
                  loading={createLoading}
                  disabled={!isReady}
                  onClick={() => resolveCreate({
                    datasourceId: datasourceId,
                    request: genRequest({
                      datasourceId: datasourceId,
                      datasourceType: datasourceType ?? datasourceInfo?.datasource.type,
                    }),
                    afterCreate: () => history.push(DATASOURCE_URL),
                  })}
                >
                  {!createLoading && trans("query.save")}
                </TacoButton>
              </FormFooter>
            )}
          </FormWrapper>

          {formManifest?.whitelist && (
            <Whitelist>
              <div style={{ fontWeight: 600, fontSize: "14px" }}>{trans("query.whitelist")}</div>
              <div style={{ fontSize: "14px", color: "#8B8FA3", marginBottom: "12px" }}>
                {trans("query.whitelistTooltip")}
              </div>

              {REACT_APP_SERVER_IPS && (
                <>
                  <span>{trans("query.address")}</span>
                  {REACT_APP_SERVER_IPS.split(",")
                    .filter((s) => s)
                    .map((ip, i) => (
                      <IPWrapper key={i}>
                        {ip} <CopyTextButton text={ip} />
                      </IPWrapper>
                    ))}
                </>
              )}
            </Whitelist>
          )}
        </Body>
      </ContentWrapper>
    </Wrapper></>
  );
};
