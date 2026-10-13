import { PropsWithChildren, useEffect, useState } from "react";
import styled from "styled-components";

const Wrapper = styled.div`
  min-width: 272px;
  width: 272px;
  flex-shrink: 0;
  overflow-y: auto;
  height: 100%;
  background: var(--admin-sidebar, #fdfbfe);
  color: var(--admin-sidebar-text, #222222);
  border-right: 1px solid var(--admin-line, #e9e0ee);
  box-sizing: border-box;
  border-radius: 2px;
  padding: 28px 14px;

  h2 {
    font-weight: 500;
    font-size: 20px;
    color: inherit;
    margin: 0 0 20px 14px;
  }
  summary { list-style: none; pointer-events: none; }
  summary::-webkit-details-marker { display: none; }

  .ant-menu { background: transparent; color: inherit; }
  .ant-menu .ant-menu-item { color: var(--admin-sidebar-text); }
  .ant-menu .ant-menu-item-selected, .ant-menu .ant-menu-item:hover {
    background: var(--admin-sidebar-active);
    color: var(--admin-sidebar-active-text);
  }
  && .ant-menu-inline .ant-menu-item {
    display: flex;
    align-items: center;
    width: 100%;
    height: auto;
    min-height: 40px;
    margin: 4px 0;
    padding: 10px 12px !important;
    line-height: 20px;
    white-space: normal;
  }
  .ant-menu-item-icon { flex-shrink: 0; }
  .ant-menu-title-content {
    min-width: 0;
    white-space: normal;
    overflow: visible;
    overflow-wrap: anywhere;
  }
  .settings-nav-label {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 4px 8px;
    min-width: 0;
    > :not(.text) { margin-left: 0; }
  }
  details > .ant-card {
    margin-top: 24px;
    color: var(--admin-muted, #786a80);
    .ant-card-body { padding: 20px; }
    .ant-btn {
      width: 100%;
      max-width: 100%;
      height: auto;
      min-height: 36px;
      white-space: normal;
      padding: 7px 12px;
      > span { min-width: 0; overflow-wrap: anywhere; }
    }
  }

  @media (max-width: 1100px) {
    width: 100%; min-width: 0; height: auto; overflow: visible; padding: 20px 16px;
    border-right: 0; border-bottom: 1px solid var(--admin-line, #e9e0ee);
    .ant-menu { display: flex; flex-wrap: wrap; gap: 4px; }
    && .ant-menu-inline .ant-menu-item { width: auto; max-width: 100%; margin: 0; }
    details > .ant-card { margin-top: 16px; }
    summary { pointer-events: auto; cursor: pointer; display: flex; align-items: center; justify-content: space-between; }
    summary::after { content: '+'; color: var(--admin-muted); font-size: 24px; }
    details[open] summary::after { content: '−'; }
    summary h2 { margin: 0; }
    details[open] summary { margin-bottom: 16px; }
  }
  .ant-menu-item:hover, .ant-menu-item-selected {
    border-radius: 10px;
  }
`;

interface IProps {
  title?: string;
}

export default function SubSideBar(props: PropsWithChildren<IProps>) {
  const { title, children } = props;
  const [compact, setCompact] = useState(() => window.innerWidth <= 1100);
  const [expanded, setExpanded] = useState(false);
  useEffect(() => {
    const media = window.matchMedia("(max-width: 1100px)");
    const update = () => setCompact(media.matches);
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  return (
    <Wrapper>
      <details open={!compact || expanded} onToggle={(event) => {
        if (compact) setExpanded(event.currentTarget.open);
      }}>
        <summary tabIndex={compact ? 0 : -1} onClick={(event) => { if (!compact) event.preventDefault(); }}>{title && <h2>{title}</h2>}</summary>
        {children}
      </details>
    </Wrapper>
  );
}
