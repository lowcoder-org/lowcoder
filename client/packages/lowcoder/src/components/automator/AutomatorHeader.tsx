import { automatorColor } from "./AutomatorTheme";
import { useState } from "react";
import { Button, Popover, Select, Tooltip } from "antd";
import {
  BookOpen,
  Braces,
  ChevronDown,
  Maximize2,
  Minimize2,
  Plug2,
  Sparkles,
} from "lucide-react";
import styled from "styled-components";
import { trans } from "i18n";

const Header = styled.header`
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-height: 65px;
  padding: 12px 22px;
  background: #fff;
  border-bottom: 1px solid #e8e8e8;
  .automator-brand {
    display: flex;
    align-items: center;
    gap: 11px;
    min-width: 0;
  }
  .automator-mark {
    display: grid;
    place-items: center;
    width: 36px;
    height: 36px;
    flex-shrink: 0;
    border-radius: 12px;
    color: ${automatorColor.onAccent};
    background: ${automatorColor.accent};
    box-shadow:
      0 3px 9px #00000026,
      inset 0 1px 0 #fff;
  }
  .automator-brand small {
    display: block;
    color: #757575;
    font-size: 9px;
    font-weight: 600;
    letter-spacing: 0.15em;
    line-height: 14px;
  }
  h3 {
    margin: 0;
    color: #262626;
    font-size: 18px;
    letter-spacing: -0.04em;
    font-weight: 650;
    line-height: 22px;
  }
  .automator-header-actions {
    display: flex;
    align-items: center;
    gap: 6px;
    min-width: 0;
  }
  .ant-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 7px;
    height: 32px;
    border-radius: 8px;
    font-size: 12px;
    box-shadow: none;
  }
  .ant-btn svg {
    color: ${automatorColor.accent};
  }
  .automator-query-button {
    background: #f5f5f5;
    border: 1px solid #e8e8e8;
    max-width: 200px;
    color: #434343;
  }
  .automator-query-name {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .automator-icon-button {
    width: 32px;
    padding: 0;
  }
  .automator-action-separator {
    width: 1px;
    height: 20px;
    background: #e8e8e8;
    margin: 0 5px;
  }
  @container automator-panel (max-width: 700px) {
    padding: 10px 14px;
    gap: 8px;
    .automator-query-button {
      max-width: 155px;
    }
    .automator-code-label {
      display: none;
    }
    .automator-code-button {
      width: 32px;
      padding: 0;
    }
  }
  @container automator-panel (max-width: 470px) {
    .automator-query-name,
    .automator-query-chevron,
    .automator-docs,
    .automator-action-separator {
      display: none;
    }
    .automator-query-button {
      width: 32px;
      padding: 0;
    }
    .automator-brand small {
      display: none;
    }
    h3 {
      font-size: 16px;
    }
  }
`;

const ConnectionPanel = styled.div`
  width: 280px;
  max-width: calc(100vw - 64px);
  padding: 5px;
  h4 {
    color: #262626;
    font-size: 14px;
    margin: 0 0 5px;
  }
  p {
    color: #6b6b6b;
    font-size: 12px;
    line-height: 1.6;
    margin: 0 0 16px;
  }
  label {
    display: block;
    font-size: 11px;
    color: #595959;
    margin-bottom: 6px;
  }
  .ant-select {
    width: 100%;
  }
  .ant-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    width: 100%;
    margin-top: 12px;
    border-radius: 8px;
  }
`;

export function AutomatorHeader({
  hasAccess,
  queryName,
  queryOptions,
  onSelect,
  onSetup,
  onLanguage,
  expanded,
  onExpand,
}: {
  hasAccess: boolean;
  queryName?: string;
  queryOptions: { label: string; value: string }[];
  onSelect: (name: string) => void;
  onSetup: () => void;
  onLanguage: () => void;
  expanded: boolean;
  onExpand: () => void;
}) {
  const [connectionOpen, setConnectionOpen] = useState(false);
  return (
    <Header>
      <div className="automator-brand">
        <span className="automator-mark" aria-hidden="true">
          <Sparkles size={20} strokeWidth={1.7} />
        </span>
        <div>
          <small>LOWCODER</small>
          <h3>Automator</h3>
        </div>
      </div>
      <div className="automator-header-actions">
        {hasAccess && (
          <Popover
            trigger="click"
            placement="bottomRight"
            open={connectionOpen}
            onOpenChange={setConnectionOpen}
            content={
              <ConnectionPanel>
                <h4>{trans("automator.studio.connection")}</h4>
                <p>{trans("automator.studio.connectionDescription")}</p>
                <label htmlFor="automator-query-select">
                  {trans("automator.panel.query")}
                </label>
                <Select
                  id="automator-query-select"
                  showSearch
                  allowClear
                  value={queryName}
                  options={queryOptions}
                  placeholder={trans("automator.panel.selectQuery")}
                  onChange={(value) => onSelect(value || "")}
                />
                <Button
                  onClick={() => {
                    setConnectionOpen(false);
                    onSetup();
                  }}
                >
                  <Plug2 size={14} />
                  {trans("automator.panel.setup")}
                </Button>
              </ConnectionPanel>
            }
          >
            <Button
              className="automator-query-button"
              aria-label={trans("automator.studio.connection")}
              aria-expanded={connectionOpen}
            >
              <Plug2 size={14} />
              <span className="automator-query-name">
                {queryName || trans("automator.studio.connection")}
              </span>
              <ChevronDown size={12} className="automator-query-chevron" />
            </Button>
          </Popover>
        )}
        <Tooltip title={trans("automator.language.open")}>
          <Button
            type="text"
            className="automator-code-button"
            aria-label={trans("automator.language.open")}
            onClick={onLanguage}
          >
            <Braces size={16} />
            <span className="automator-code-label">
              {trans("automator.language.open")}
            </span>
          </Button>
        </Tooltip>
        <span className="automator-action-separator" aria-hidden="true" />
        <Tooltip title={trans("comp.menuViewDocs")}>
          <Button
            type="text"
            className="automator-icon-button automator-docs"
            aria-label={trans("comp.menuViewDocs")}
            href={trans("docUrls.githubAutomator")}
            target="_blank"
            rel="noopener noreferrer"
          >
            <BookOpen size={16} />
          </Button>
        </Tooltip>
        <Tooltip
          title={trans(
            expanded ? "automator.studio.restore" : "automator.studio.expand",
          )}
        >
          <Button
            type="text"
            className="automator-icon-button"
            aria-label={trans(
              expanded ? "automator.studio.restore" : "automator.studio.expand",
            )}
            onClick={onExpand}
          >
            {expanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </Button>
        </Tooltip>
      </div>
    </Header>
  );
}
