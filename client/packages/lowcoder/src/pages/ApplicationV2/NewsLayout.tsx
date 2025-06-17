import styled from "styled-components";
import { trans } from "../../i18n";
import { default as Divider } from "antd/es/divider";
import { getReleases, getYoutubeVideos, getHubspotContent } from "api/newsApi";
import { Card, Col, Row, Typography } from "antd";
import React, { useEffect, useState } from "react";

const { Title, Paragraph } = Typography;

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
`;

const HeaderWrapper = styled.div`
  height: 40px;
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


const NewsView = styled.div`
  font-size: 14px;
  color: #8b8fa3;
  flex-grow: 1;
  padding-top: 0px;
  padding-left: 40px;
  max-width: 95%;
`;

const StyleNewsCover = styled.div`
    background: rgb(2,0,36);
    background: -moz-linear-gradient(39deg, rgba(2,0,36,1) 0%, rgba(104,9,121,1) 35%, rgba(255,83,0,1) 100%);
    background: -webkit-linear-gradient(39deg, rgba(2,0,36,1) 0%, rgba(104,9,121,1) 35%, rgba(255,83,0,1) 100%);
    background: linear-gradient(39deg, rgba(2,0,36,1) 0%, rgba(104,9,121,1) 35%, rgba(255,83,0,1) 100%);
    filter: progid:DXImageTransform.Microsoft.gradient(startColorstr="#020024",endColorstr="#ff5300",GradientType=1);
    padding: 25px;
    height: 120px;
    border-radius:10px 10px 0 0;
`;

const SectionTitle = styled(Title)`
  margin-top: 24px;
  font-size: 0.9em;
`;

const CardImage = styled.img`
  width: 100%;
  height: 160px;
  object-fit: cover;
  border-radius: 4px;
`;

const cardGridStyle = { padding: "8px" };

type NewsEntry = any; // replace with actual types if available

interface NewsGridProps {
  entries: NewsEntry[];
}


export function NewsLayout() {

  const [releasesData, setReleasesData] = useState<any[]>([]);

  useEffect(() => {
    getReleases()
      .then(data => setReleasesData(data))
      .catch(err => console.error("Failed to load news:", err));
  }, []);

  const [youTubeData, setYouTubeData] = useState<any[]>([]);

  useEffect(() => {
    getYoutubeVideos()
      .then(data => setYouTubeData(data))
      .catch(err => console.error("Failed to load news:", err));
  }, []);

  const [hubspotData, setHubspotData] = useState<any[]>([]);

  useEffect(() => {
    getHubspotContent()
      .then(data => setHubspotData(data))
      .catch(err => console.error("Failed to load news:", err));
  }, []);

  return (
    <Wrapper>
      <HeaderWrapper></HeaderWrapper>

      <ContentWrapper>
        <NewsView>
          <StyleNewsCover>
            <h1 style={{color: "#ffffff", marginTop : "12px"}}>Lowcoder {trans("home.news")}</h1>
          </StyleNewsCover>
          <Card style={{ marginBottom: "20px", minHeight : "800px" }}>

          <SectionTitle level={2}>📝 Latest Blog Posts</SectionTitle>
            <Row gutter={[16, 16]}>
              {hubspotData?.map((item: { htmlTitle: any; publishDate: any; postSummary: any; url: any; featuredImage: any; metaDescription: any; }, idx: any) => {
                const {
                  htmlTitle,
                  publishDate,
                  postSummary,
                  url,
                  featuredImage,
                  metaDescription,
                } = item;

                const summaryHtml = postSummary || metaDescription || "";
                const coverImage = featuredImage || "https://placehold.co/600x400?text=Lowcoder+Blog";

                // Strip HTML to plain text
                const stripHtml = (html: string): string => {
                  const div = document.createElement("div");
                  div.innerHTML = html;
                  return div.textContent || div.innerText || "";
                };

                const plainSummary = stripHtml(summaryHtml);

                return (
                  <Col xs={24} sm={12} md={12} lg={8} key={`blog-${idx}`}>
                    <Card
                      hoverable
                      cover={
                        <a href={url} target="_blank" rel="noreferrer">
                          <CardImage src={coverImage} alt={htmlTitle} />
                        </a>
                      }
                    >
                      <Card.Meta
                        title={
                          <a href={url} target="_blank" rel="noreferrer">
                            {htmlTitle}
                          </a>
                        }
                        description={
                          <>
                            <Paragraph type="secondary" style={{ marginBottom: 4 }}>
                              {new Date(publishDate).toLocaleDateString()}
                            </Paragraph>
                            <Paragraph
                              ellipsis={{ rows: 4 }}
                              type="secondary"
                              style={{ fontSize: "13px" }}
                            >
                              {plainSummary}
                            </Paragraph>
                          </>
                        }
                      />
                    </Card>
                  </Col>
                );
              })}
            </Row>
          
            <Divider />
          
            <SectionTitle level={2}>📺 Latest YouTube Videos
            <Paragraph type="secondary" style={{ marginBottom: 0, marginTop: 4 }}>
                <Typography.Link href="https://www.youtube.com/@Lowcoder_cloud" target="_blank" rel="noopener noreferrer">
                  Visit YouTube Channel →
                </Typography.Link>
              </Paragraph>
            </SectionTitle>

            <Row gutter={[16, 16]}>
              {youTubeData.map((item, idx) => {
                const s = item.snippet;
                return (
                  <Col xs={24} sm={12} md={8} lg={6} key={`yt-${idx}`}>
                    <Card
                      hoverable
                      cover={
                        <a href={`https://www.youtube.com/watch?v=${item.id.videoId}`} target="_blank" rel="noreferrer">
                          <CardImage src={s.thumbnails.high.url} alt={s.title} />
                        </a>
                      }
                    >
                      <Card.Meta
                        title={s.title}
                        description={<Paragraph ellipsis={{ rows: 2 }}>{s.description}</Paragraph>}
                      />
                    </Card>
                  </Col>
                );
              })}
            </Row>

            <Divider />

            <SectionTitle level={2}>🚀 Latest Releases
              <Paragraph type="secondary" style={{ marginBottom: 0, marginTop: 4 }}>
                <Typography.Link href="https://github.com/lowcoder-org/lowcoder/releases" target="_blank" rel="noopener noreferrer">
                  View all GitHub Releases →
                </Typography.Link>
              </Paragraph>
            </SectionTitle>
            <Row gutter={[16, 16]}>
              {releasesData.map((item, idx) => {
                const c = item;
                return (
                  <Col xs={24} sm={12} md={12} lg={8} key={`gh-${idx}`}>
                    <Card
                      hoverable
                      title={`${c.tag_name} (${c.name})`}
                      extra={<a href={c.html_url} target="_blank" rel="noreferrer">View</a>}
                    >
                      <Paragraph type="secondary">{new Date(c.published_at).toLocaleDateString()}</Paragraph>
                      <Paragraph ellipsis={{ rows: 5 }}>
                        <span dangerouslySetInnerHTML={{ __html: c.body.replace(/\r\n/g, "<br />") }} />
                      </Paragraph>
                    </Card>
                  </Col>
                );
              })}
            </Row>

            <Divider />

          

          </Card>  
          
        </NewsView>
      </ContentWrapper>
    </Wrapper>
  );
}
