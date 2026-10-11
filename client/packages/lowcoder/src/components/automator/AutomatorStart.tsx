import { automatorColor } from "./AutomatorTheme";
import { ThreadPrimitive } from "@assistant-ui/react";
import {
  ArrowUpRight,
  LayoutDashboard,
  ListTodo,
  Sparkles,
} from "lucide-react";
import styled from "styled-components";
import { trans } from "i18n";

const Start = styled.section`
  flex: 1 0 auto;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 12px 8px 22px;
  .studio-intro {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 24px;
    margin-bottom: 22px;
  }
  .studio-eyebrow {
    color: ${automatorColor.accent};
    font-size: 10px;
    letter-spacing: 0.14em;
    font-weight: 650;
    text-transform: uppercase;
    margin-bottom: 9px;
  }
  h1 {
    margin: 0;
    max-width: 420px;
    color: #262626;
    font-size: clamp(24px, 2.6vw, 34px);
    font-weight: 600;
    line-height: 1.16;
    letter-spacing: -0.045em;
  }
  p {
    color: #6b6b6b;
    font-size: 13px;
    line-height: 1.65;
    max-width: 370px;
    margin: 10px 0 0 !important;
  }
  .studio-sketch {
    flex: 0 0 148px;
    height: 116px;
    position: relative;
    border: 1px solid #e5e5e5;
    border-radius: 12px;
    transform: rotate(-5deg);
    background: #fff;
    padding: 12px;
    box-shadow:
      0 12px 25px #0000000d,
      8px 8px 0 -1px #f0f0f0;
    display: grid;
    grid-template-columns: 28px 1fr;
    gap: 7px;
  }
  .studio-sketch::before {
    content: "";
    grid-column: 1 / -1;
    height: 5px;
    width: 24px;
    border-radius: 4px;
    background: ${automatorColor.accent};
    box-shadow:
      32px 0 #eeeeee,
      64px 0 #eeeeee;
  }
  .sketch-side {
    background: #f0f0f0;
    border-radius: 5px;
    grid-row: span 2;
  }
  .sketch-chart {
    border-radius: 5px;
    background: #f0f0f0;
    display: flex;
    gap: 5px;
    align-items: end;
    padding: 10px;
  }
  .sketch-chart i {
    flex: 1;
    border-radius: 2px 2px 0 0;
    background: ${automatorColor.accent};
    height: 50%;
  }
  .sketch-chart i:nth-child(2) {
    height: 90%;
    background: ${automatorColor.accent};
  }
  .sketch-chart i:nth-child(3) {
    height: 70%;
    background: ${automatorColor.accent};
  }
  .sketch-lines {
    height: 3px;
    margin-top: 2px;
    border-radius: 4px;
    background: #eeeeee;
    box-shadow:
      0 7px #eeeeee,
      0 14px #eeeeee;
  }
  .sketch-spark {
    position: absolute;
    right: -14px;
    top: -13px;
    display: grid;
    place-items: center;
    height: 35px;
    width: 35px;
    color: ${automatorColor.onAccent};
    border-radius: 11px;
    background: ${automatorColor.accent};
    box-shadow: 0 4px 10px #00000026;
    transform: rotate(10deg);
  }
  .studio-suggestions {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 10px;
  }
  .studio-suggestion {
    display: flex;
    align-items: center;
    gap: 10px;
    background: #fff;
    border: 1px solid #e5e5e5;
    padding: 12px;
    border-radius: 12px;
    color: #595959;
    text-align: left;
    cursor: pointer;
    transition:
      border-color 0.2s,
      box-shadow 0.2s,
      transform 0.2s;
  }
  .studio-suggestion:hover {
    border-color: ${automatorColor.accentBorder};
    box-shadow: 0 5px 14px #0000000b;
    transform: translateY(-2px);
  }
  .studio-suggestion:focus-visible {
    outline: 2px solid ${automatorColor.accent};
    outline-offset: 3px;
  }
  .studio-suggestion-icon {
    display: grid;
    place-items: center;
    flex: 0 0 30px;
    height: 32px;
    color: ${automatorColor.accent};
    background: ${automatorColor.accentBg};
    border-radius: 8px;
  }
  .studio-suggestion:nth-child(2) .studio-suggestion-icon {
    background: ${automatorColor.accentBg};
    color: ${automatorColor.accent};
  }
  .studio-suggestion:nth-child(3) .studio-suggestion-icon {
    background: ${automatorColor.accentBg};
    color: ${automatorColor.accent};
  }
  .studio-suggestion-label {
    flex: 1;
    font-size: 12px;
    font-weight: 500;
    line-height: 1.4;
  }
  .studio-suggestion-arrow {
    flex-shrink: 0;
    color: #8c8c8c;
  }
  @container automator-chat (max-width: 680px) {
    .studio-sketch {
      display: none;
    }
    .studio-suggestions {
      gap: 7px;
    }
    .studio-suggestion {
      padding: 10px;
    }
    .studio-suggestion-arrow {
      display: none;
    }
  }
  @container automator-chat (max-width: 480px) {
    .studio-suggestions {
      grid-template-columns: 1fr;
    }
    .studio-intro {
      margin-bottom: 14px;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .studio-suggestion {
      transition: none;
    }
    .studio-suggestion:hover {
      transform: none;
    }
  }
`;

export function AutomatorStart() {
  const suggestions = [
    { key: "dashboard", icon: LayoutDashboard },
    { key: "tasks", icon: ListTodo },
    { key: "refine", icon: Sparkles },
  ] as const;
  return (
    <Start aria-label={trans("automator.studio.startTitle")}>
      <div className="studio-intro">
        <div>
          <div className="studio-eyebrow">
            {trans("automator.studio.eyebrow")}
          </div>
          <h1>{trans("automator.studio.startTitle")}</h1>
          <p>{trans("automator.studio.startDescription")}</p>
        </div>
        <div className="studio-sketch" aria-hidden="true">
          <div className="sketch-side" />
          <div className="sketch-chart">
            <i />
            <i />
            <i />
          </div>
          <div className="sketch-lines" />
          <div className="sketch-spark">
            <Sparkles size={19} />
          </div>
        </div>
      </div>
      <div className="studio-suggestions">
        {suggestions.map(({ key, icon: Icon }) => (
          <ThreadPrimitive.Suggestion
            key={key}
            className="studio-suggestion"
            prompt={trans(`automator.studio.${key}Prompt`)}
            method="replace"
            autoSend={false}
          >
            <span className="studio-suggestion-icon">
              <Icon size={16} strokeWidth={1.7} />
            </span>
            <span className="studio-suggestion-label">
              {trans(`automator.studio.${key}`)}
            </span>
            <ArrowUpRight size={14} className="studio-suggestion-arrow" />
          </ThreadPrimitive.Suggestion>
        ))}
      </div>
    </Start>
  );
}
