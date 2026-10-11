import { automatorColor } from "./AutomatorTheme";
import { trans } from "i18n";
import { Button, Space } from "antd";
import styled from "styled-components";
import { AutomatorDemo } from "./AutomatorDemo";

const Welcome = styled.div`
  flex: 1; min-height: 0; overflow: auto; padding: 24px 28px; background: #fafafa;
  .ant-btn { border-radius: 8px; }
  .welcome-grid { display: grid; grid-template-columns: minmax(260px, 1fr) minmax(260px, 430px); gap: 32px;
    align-items: start; max-width: 1080px; margin: 0 auto; }
  .welcome-eyebrow { color: ${automatorColor.accent}; font-size: 11px; font-weight: 600; letter-spacing: .1em; text-transform: uppercase; }
  h2 { color: #262626; font-size: 24px; line-height: 1.2; letter-spacing: -.02em; margin: 10px 0; }
  p { color: #6b6b6b; font-size: 13px; line-height: 1.55; max-width: 480px; }
  .welcome-note { font-size: 11px; margin: 12px 0 0; }
  @container automator-panel (max-width: 900px) { .welcome-grid { grid-template-columns: 1fr; gap: 20px; } }
`;
export function AutomatorWelcome({ subscribed, onSetup, onLanguage, previewUrl }: { subscribed: boolean; onSetup: () => void; onLanguage: () => void; previewUrl: string }) {
  return <Welcome><div className="welcome-grid"><div>
    <span className="welcome-eyebrow">{subscribed ? trans("automator.welcome.connectedEyebrow") : trans("automator.welcome.eyebrow")}</span>
    <h2>{subscribed ? trans("automator.welcome.connectedTitle") : trans("automator.welcome.title")}</h2>
    <p>{subscribed ? trans("automator.welcome.connectedDescription") : trans("automator.welcome.description")}</p>
    <Space wrap>
      {subscribed ? <Button type="primary" onClick={onSetup}>{trans("automator.welcome.setup")}</Button> : <Button type="primary" href={previewUrl} target="_blank" rel="noopener noreferrer">{trans("automator.welcome.explore")}</Button>}
      {!subscribed && <Button href={`${previewUrl}#demo`} target="_blank" rel="noopener noreferrer">{trans("automator.welcome.seeDemo")}</Button>}
      <Button onClick={onLanguage}>{trans("automator.language.open")}</Button>
    </Space>
    <p className="welcome-note">{subscribed ? trans("automator.welcome.connectedNote") : trans("automator.welcome.note")}</p>
  </div><AutomatorDemo compact /></div></Welcome>;
}
