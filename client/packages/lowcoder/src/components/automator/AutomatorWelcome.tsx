import { Button, Space } from "antd";
import styled from "styled-components";
import { AutomatorDemo } from "./AutomatorDemo";

const Welcome = styled.div`
  flex: 1; min-height: 0; overflow: auto; padding: 16px 24px;
  .welcome-grid { display: grid; grid-template-columns: minmax(260px, 1fr) minmax(260px, 430px); gap: 32px;
    align-items: start; max-width: 1080px; margin: 0 auto; }
  .welcome-eyebrow { color: #8164a2; font-size: 11px; font-weight: 600; letter-spacing: .1em; text-transform: uppercase; }
  h2 { color: #29243a; font-size: 24px; line-height: 1.2; letter-spacing: -.02em; margin: 10px 0; }
  p { color: #6e6879; font-size: 13px; line-height: 1.55; max-width: 480px; }
  .welcome-note { font-size: 11px; margin: 12px 0 0; }
  @media (max-width: 900px) { .welcome-grid { grid-template-columns: 1fr; gap: 20px; } }
`;
export function AutomatorWelcome({ subscribed, onSetup, previewUrl }: { subscribed: boolean; onSetup: () => void; previewUrl: string }) {
  return <Welcome><div className="welcome-grid"><div>
    <span className="welcome-eyebrow">{subscribed ? 'One connection. Then your first app.' : 'Meet your AI building partner'}</span>
    <h2>{subscribed ? 'Let’s get your first app started.' : 'Describe it. Build it. Make it yours.'}</h2>
    <p>{subscribed ? 'Connect your model and we’ll create the queries for you. A guided test helps you get ready before Automator makes its first edit.' : 'Turn an idea into editable tables, forms and layouts. Ask for the next change in plain language, and keep building right here in Lowcoder.'}</p>
    <Space wrap>
      {subscribed ? <Button type="primary" onClick={onSetup}>Set up AI connection</Button> : <Button type="primary" href={previewUrl} target="_blank" rel="noopener noreferrer">Explore AI Robot</Button>}
      {!subscribed && <Button href={`${previewUrl}#demo`} target="_blank" rel="noopener noreferrer">See it in action</Button>}
    </Space>
    <p className="welcome-note">{subscribed ? 'Already connected? Select your bridge query above. OpenAI, your own provider or a self-hosted model.' : 'AI Robot subscription for workspace admins and editors. Viewers are not billed. Your model, your provider costs.'}</p>
  </div><AutomatorDemo compact /></div></Welcome>;
}
