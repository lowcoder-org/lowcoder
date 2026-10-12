import styled from "styled-components";

export const MarketplaceShell = styled.div`
  max-width: 1520px;
  padding: 32px 36px 48px;
  margin: 0 auto;
  width: 100%;
  min-width: 0;
  .marketplace-heading {
    display: flex;
    align-items: start;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 20px;
    margin-bottom: 28px;
  }
  .eyebrow {
    font-size: 11px;
    font-weight: 500;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--admin-accent);
    margin-bottom: 10px;
  }
  h1 {
    margin: 0;
    font-size: clamp(28px, 3vw, 40px);
    font-weight: 500;
    letter-spacing: -0.04em;
    line-height: 1.15;
    overflow-wrap: anywhere;
  }
  .intro {
    color: var(--admin-muted);
    margin: 12px 0 0;
    font-size: 15px;
    line-height: 1.6;
    max-width: 660px;
  }
  .tabs {
    display: flex;
    gap: 8px;
    border-bottom: 1px solid var(--admin-line);
    margin-bottom: 24px;
  }
  .tabs button {
    border: 0;
    border-bottom: 3px solid transparent;
    background: none;
    padding: 12px 16px 15px;
    font: inherit;
    font-weight: 500;
    color: var(--admin-muted);
    cursor: pointer;
  }
  .tabs button[aria-selected="true"] {
    color: var(--admin-accent);
    border-bottom-color: var(--admin-accent);
  }
  .tab-count {
    font-size: 11px;
    padding: 3px 7px;
    margin-left: 7px;
    background: #eee6f3;
    border-radius: 8px;
  }
  .toolbar {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
    align-items: center;
  }
  .search {
    flex: 1 1 280px;
    max-width: 540px;
  }
  .filter {
    min-width: 140px;
  }
  .categories {
    display: flex;
    gap: 8px;
    margin: 16px 0 22px;
    flex-wrap: wrap;
  }
  .categories button {
    font: inherit;
    font-size: 12px;
    border: 1px solid var(--admin-line);
    border-radius: 999px;
    padding: 7px 12px;
    background: #fff;
    cursor: pointer;
    color: var(--admin-muted);
  }
  .categories button[aria-pressed="true"] {
    background: var(--admin-accent);
    color: white;
    border-color: var(--admin-accent);
  }
  .results-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 12px;
    margin: 20px 0 16px;
    color: var(--admin-muted);
    font-size: 13px;
  }
  .results-actions {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 12px;
  }
  .view-switch {
    display: flex;
    gap: 4px;
  }
  .empty {
    padding: 64px 20px;
    border: 1px dashed var(--admin-line);
    border-radius: 18px;
    background: #ffffff80;
    text-align: center;
  }
  .empty p {
    color: var(--admin-muted);
    max-width: 450px;
    margin: 16px auto;
    line-height: 1.6;
  }
  .back-link {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 28px;
    font-size: 13px;
  }
  .detail-grid {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 290px;
    gap: 28px;
    align-items: start;
  }
  .detail-preview {
    border: 1px solid var(--admin-line);
    border-radius: 16px;
    overflow: hidden;
    background: white;
  }
  .preview-caption {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    gap: 12px;
    padding: 12px 18px;
    font-size: 12px;
    color: var(--admin-muted);
  }
  .detail-body {
    margin-top: 28px;
    padding: 28px;
    background: white;
    border: 1px solid var(--admin-line);
    border-radius: 16px;
  }
  .detail-body h2,
  .creator-panel h2 {
    font-size: 18px;
    font-weight: 500;
    margin: 0 0 16px;
  }
  .description {
    white-space: pre-wrap;
    overflow-wrap: anywhere;
    line-height: 1.8;
    color: #66556e;
  }
  .creator-panel {
    background: white;
    border: 1px solid var(--admin-line);
    border-radius: 16px;
    padding: 24px;
  }
  .creator-row {
    display: flex;
    align-items: center;
    gap: 10px;
    min-width: 0;
  }
  .creator-name {
    min-width: 0;
    overflow-wrap: anywhere;
    font-size: 13px;
    color: var(--admin-muted);
  }
  .avatar {
    display: inline-flex;
    flex-shrink: 0;
    width: 28px;
    height: 28px;
    border-radius: 50%;
    align-items: center;
    justify-content: center;
    background: #efe4f7;
    color: var(--admin-accent);
    font-size: 11px;
    font-weight: 500;
  }
  .creator-panel .avatar {
    width: 42px;
    height: 42px;
    font-size: 16px;
  }
  .creator-panel dl {
    border-top: 1px solid var(--admin-line);
    margin: 24px 0;
    padding-top: 8px;
  }
  .creator-panel dt {
    color: var(--admin-muted);
    font-size: 12px;
    margin-top: 16px;
  }
  .creator-panel dd {
    margin: 5px 0 0;
    font-size: 13px;
    overflow-wrap: anywhere;
  }
  .creator-panel .ant-btn {
    white-space: normal;
    height: auto;
    min-height: 36px;
  }
  .tag {
    background: var(--admin-tint);
    color: #79558b;
    border-radius: 6px;
    padding: 4px 7px;
    font-size: 10px;
    line-height: 1.3;
  }
  .tags {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 6px;
  }
  .detail-tags {
    margin-top: 16px;
  }
  .detail-tags .tag {
    font-size: 12px;
    padding: 6px 10px;
  }
  @media (min-width: 1500px) {
    padding: 40px 48px;
  }
  @media (max-width: 1100px) {
    padding: 24px;
    .detail-grid {
      grid-template-columns: minmax(0, 1fr) 240px;
      gap: 20px;
    }
  }
  @media (max-width: 850px) {
    .detail-grid {
      grid-template-columns: minmax(0, 1fr);
    }
  }
  @media (max-width: 720px) {
    padding: 24px 16px;
    .tabs button {
      padding: 12px 8px;
      font-size: 13px;
    }
    .toolbar > .filter {
      flex: 1;
      min-width: 120px;
    }
    .search {
      max-width: none;
    }
    .detail-body {
      padding: 20px;
    }
  }
`;

export const MarketplaceGrid = styled.div<{ $list: boolean }>`
  display: grid;
  grid-template-columns: ${({ $list }) =>
    $list
      ? "minmax(0, 1fr)"
      : "repeat(auto-fill, minmax(min(100%, 265px), 1fr))"};
  gap: 22px;
  .marketplace-card {
    display: flex;
    flex-direction: ${({ $list }) => ($list ? "row" : "column")};
    min-width: 0;
    border: 1px solid var(--admin-line);
    border-radius: 16px;
    overflow: hidden;
    background: #fff;
    transition:
      box-shadow 0.2s,
      border-color 0.2s;
  }
  .marketplace-card:hover {
    border-color: #cdb5dc;
    box-shadow: 0 10px 28px #4a255e10;
  }
  .cover-link {
    display: block;
    flex-shrink: 0;
    width: ${({ $list }) => ($list ? "240px" : "100%")};
  }
  .card-body {
    padding: 20px;
    min-width: 0;
    flex: 1;
    display: flex;
    flex-direction: column;
  }
  .title-link {
    margin: 12px 0 8px;
    font-size: 17px;
    font-weight: 500;
    color: var(--admin-ink);
    line-height: 1.35;
    overflow-wrap: anywhere;
  }
  .title-link:hover {
    color: var(--admin-accent);
  }
  .card-description {
    color: var(--admin-muted);
    line-height: 1.6;
    font-size: 13px;
    margin: 0 0 20px;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    min-height: 42px;
  }
  .card-footer {
    margin-top: auto;
    border-top: 1px solid #f1ebf4;
    padding-top: 14px;
    display: flex;
    align-items: center;
    gap: 12px;
    justify-content: space-between;
  }
  .creator-button {
    border: 0;
    background: none;
    padding: 0;
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
    font: inherit;
    cursor: pointer;
    text-align: left;
  }
  .creator-button .creator-name {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 12px;
  }
  .open-link {
    display: flex;
    gap: 6px;
    align-items: center;
    font-size: 12px;
    flex-shrink: 0;
  }
  @media (max-width: 720px) {
    .marketplace-card {
      flex-direction: column;
    }
    .cover-link {
      width: 100%;
    }
  }
`;
