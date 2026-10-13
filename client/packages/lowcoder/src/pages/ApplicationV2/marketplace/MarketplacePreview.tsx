import { useEffect, useState } from "react";
import { AppstoreOutlined, PictureOutlined } from "@ant-design/icons";
import { trans } from "i18n";
import styled from "styled-components";
import { APPLICATION_MARKETPLACE_URL } from "constants/routesURL";
import { MarketplaceSource } from "./marketplaceUtils";

const Frame = styled.div`
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 10;
  overflow: hidden;
  background: var(--admin-tint);
  border-bottom: 1px solid var(--admin-line);
  display: flex;
  align-items: center;
  justify-content: center;
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: top;
  }
  .preview-placeholder {
    display: flex;
    align-items: center;
    flex-direction: column;
    gap: 14px;
    color: var(--admin-muted);
    padding: 20px;
    text-align: center;
    font-size: 12px;
  }
  .preview-placeholder > .anticon {
    font-size: 34px;
    padding: 18px;
    border: 1px solid #fff;
    background: #ffffff75;
    border-radius: 20px;
  }
`;

export function MarketplacePreview({
  appId,
  source,
  title,
}: {
  appId: string;
  source: MarketplaceSource;
  title: string;
}) {
  const communityHost = new URL(APPLICATION_MARKETPLACE_URL).origin;
  const origin =
    source === "community" && window.location.origin !== communityHost
      ? new URL(trans("home.marketplaceURL")).origin
      : "";
  // This is a stored image read at the app's origin. No render requests or polling.
  const url = `${origin}/api/v1/applications/${encodeURIComponent(appId)}/marketplace-preview/image`;
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    setLoaded(false);
    setFailed(false);
  }, [url]);
  return (
    <Frame>
      {!failed && (
        <img
          key={url}
          src={url}
          alt={trans("marketplace.previewAlt", { title })}
          loading="lazy"
          decoding="async"
          crossOrigin="anonymous"
          referrerPolicy="no-referrer"
          style={{ position: "absolute", inset: 0, opacity: loaded ? 1 : 0 }}
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
        />
      )}
      {!loaded && (
        <div className="preview-placeholder">
          {failed ? <PictureOutlined /> : <AppstoreOutlined />}
          <span>
            {trans(
              failed
                ? "marketplace.previewUnavailable"
                : "marketplace.loadingPreview",
            )}
          </span>
        </div>
      )}
    </Frame>
  );
}
