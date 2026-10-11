import React from "react";
import styled from "styled-components";
import { trans } from "../i18n";
import {
  TwitterIcon,
  LinkedInIcon,
  FacebookIcon,
  MediumIcon,
  RedditIcon,
} from "lowcoder-design";

const ShareWrapper = styled.div`
  margin-top: 0px;
  padding: 0px;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 12px;
  margin-top: 8px;

  a {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 44px;
    height: 44px;
    border-radius: 4px;
    background-color: #f5f5f5;
    text-decoration: none;
    color: #333;

    &:hover {
      background-color: #e6e6e6;
    }

    svg {
      width: 20px;
      height: 20px;
    }
  }
`;

export const SocialShareButtons: React.FC<{ url: string; text: string }> = ({
  url,
  text,
}) => {
  const encodedUrl = encodeURIComponent(url);
  const encodedText = encodeURIComponent(text);

  return (
    <ShareWrapper>
      <div style={{ fontWeight: 500, marginBottom: 4 }}>
        {trans("home.appSocialSharing")}
      </div>
      <ButtonGroup>
        {/* Twitter supports inline text and URL */}
        <a
          href={`https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`}
          target="_blank"
          title={trans("home.socialShare") + " Twitter"}
          rel="noopener noreferrer"
        >
          <TwitterIcon />
        </a>

        {/* Facebook ONLY accepts the URL and reads OG metadata from it */}
        <a
          href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`}
          target="_blank"
          title={trans("home.socialShare") + " Facebook"}
          rel="noopener noreferrer"
        >
          <FacebookIcon />
        </a>

        {/* LinkedIn also only uses the URL; title/summary are ignored unless OG tags exist */}
        <a
          href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`}
          target="_blank"
          title={trans("home.socialShare") + " LinkedIn"}
          rel="noopener noreferrer"
        >
          <LinkedInIcon />
        </a>

        {/* Reddit sharing */}
        <a
          href={`https://www.reddit.com/submit?url=${encodedUrl}&title=${encodedText}`}
          target="_blank"
          title={trans("home.socialShare") + " Reddit"}
          rel="noopener noreferrer"
        >
          <RedditIcon />
        </a>

        {/* Medium sharing - sharing the Medium article URL directly */}
        <a
          href={"https://medium.com/new-story"}
          target="_blank"
          title={trans("home.socialShare") + " Medium"}
          rel="noopener noreferrer"
        >
          <MediumIcon />
        </a>
      </ButtonGroup>
    </ShareWrapper>
  );
};
