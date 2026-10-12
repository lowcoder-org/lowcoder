import { AdminPage, AdminCover } from "components/layout/adminTheme";
import styled from "styled-components";
import { trans } from "../../i18n";
import { default as Divider } from "antd/es/divider";
import { getReleases, getYoutubeVideos, getHubspotContent } from "api/newsApi";
import { Card, Col, Row, Typography, Skeleton, Empty } from "antd";
import { AdminListError } from "components/layout/AdminListFeedback";
import React, { useEffect, useState } from "react";

const { Title, Paragraph } = Typography;

const Wrapper = AdminPage;

const HeaderWrapper = styled.div`margin-bottom: 18px;`;

const ContentWrapper = styled.div`
  position: relative;
`;


const NewsView = styled.div`min-width: 0;`;

const StyleNewsCover = AdminCover;

const SectionTitle = styled(Title)`
  margin-top: 24px;
  &.ant-typography { font-size: 20px; font-weight: 500; margin-bottom: 24px; }
`;

const CardImage = styled.img`
  width: 100%;
  height: 190px;
  object-fit: cover;
  border-radius: 4px;
`;

const StyledParagraph = styled(Paragraph)`
  img {
    max-width: 100%;   /* or whatever you want */
    height: auto;         /* keep aspect ratio */
    object-fit: contain; /* prevent distortion */
    display: block;      /* optional: avoid inline weirdness */
    margin: 8px 0;       /* optional spacing */
  }
`;

const cardGridStyle = { padding: "8px" };

type NewsEntry = any; // replace with actual types if available

interface NewsGridProps {
  entries: NewsEntry[];
}


// Blog publication is paused while HubSpot is replaced with Solan.
// Replace the blog loader before enabling this section again.
const BLOG_NEWS_ENABLED = false;

function useNewsFeed(load: () => Promise<any[]>, enabled = true) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState(false);
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    if (!enabled) return;
    let active = true;
    setLoading(true);
    setError(false);
    load().then(result => { if (active) setData(result); })
      .catch(() => { if (active) setError(true); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [load, revision, enabled]);
  const feedback = loading ? <Skeleton active paragraph={{ rows: 3 }} />
    : error ? <AdminListError retry={() => setRevision(value => value + 1)} />
    : data.length === 0 ? <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} /> : null;
  return { data, feedback };
}

export function NewsLayout() {
  const releases = useNewsFeed(getReleases);
  const videos = useNewsFeed(getYoutubeVideos);
  const blog = useNewsFeed(getHubspotContent, BLOG_NEWS_ENABLED);
  const releasesData = releases.data;
  const youTubeData = videos.data;
  const hubspotData = blog.data;

  return (
    <Wrapper>

      <ContentWrapper>
        <NewsView>
          <StyleNewsCover>
            <h1>{trans("home.news")}</h1><p>{trans("admin.newsDescription")}</p>
          </StyleNewsCover>
          <Card style={{ marginBottom: "20px" }}>

          {BLOG_NEWS_ENABLED && <>
          <SectionTitle level={2}>{trans("admin.blogPosts")}</SectionTitle>
            {blog.feedback}
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
                          <CardImage src={coverImage} alt={htmlTitle} loading="lazy"/>
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
          </>}
          
            <SectionTitle level={2}>{trans("admin.videos")}
            <Paragraph type="secondary" style={{ marginBottom: 0, marginTop: 4 }}>
                <Typography.Link href="https://www.youtube.com/@Lowcoder_cloud" target="_blank" rel="noopener noreferrer">
                  Visit YouTube Channel →
                </Typography.Link>
              </Paragraph>
            </SectionTitle>

            {videos.feedback}
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

            <SectionTitle level={2}>{trans("admin.releases")}
              <Paragraph type="secondary" style={{ marginBottom: 0, marginTop: 4 }}>
                <Typography.Link href="https://github.com/lowcoder-org/lowcoder/releases" target="_blank" rel="noopener noreferrer">
                  View all GitHub Releases →
                </Typography.Link>
              </Paragraph>
            </SectionTitle>
            {releases.feedback}
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
                      <StyledParagraph ellipsis={{ rows: 10 }}>
                        <span dangerouslySetInnerHTML={{ __html: c.body.replace(/\r\n/g, "<br />") }} />
                      </StyledParagraph>
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
