import { automatorColor } from "./AutomatorTheme";
import styled from "styled-components";

export const AutomatorStudio = styled.div`
  container: automator-chat / inline-size;
  position: relative;
  display: flex;
  flex: 1 1 auto;
  height: 100%;
  min-height: 0;
  min-width: 0;
  overflow: hidden;
  background: #fafafa;
  color: #262626;
  p {
    margin: 0;
  }
  .automator-history {
    display: flex;
    flex-direction: column;
    flex: 0 0 58px;
    gap: 8px;
    padding: 16px 10px;
    background: #fff;
    border-right: 1px solid #e8e8e8;
    min-height: 0;
    z-index: 4;
  }
  .automator-history.is-open {
    flex-basis: 210px;
    width: 210px;
    padding: 14px 12px;
  }
  .automator-history-heading {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 5px;
    padding-left: 7px;
    color: #757575;
    font-size: 11px;
    font-weight: 500;
  }
  .studio-icon-button {
    display: grid;
    place-items: center;
    width: 36px;
    height: 36px;
    flex-shrink: 0;
    border: 0;
    background: transparent;
    border-radius: 10px;
    color: ${automatorColor.accent};
    cursor: pointer;
    transition:
      background 0.2s,
      color 0.2s;
  }
  .studio-icon-button:hover {
    background: #f5f5f5;
    color: ${automatorColor.accent};
  }
  .studio-icon-button:focus-visible {
    outline: 2px solid ${automatorColor.accent};
    outline-offset: 2px;
  }
  .studio-new-build {
    color: ${automatorColor.accent};
    background: ${automatorColor.accentBg};
    margin-bottom: 2px;
  }
  .aui-thread-list-root {
    width: 100%;
    background: transparent;
    padding: 0;
    min-height: 0;
    overflow-y: auto;
    gap: 6px;
  }
  .aui-thread-list-root > .aui-button {
    background: ${automatorColor.accentBg};
    border-color: ${automatorColor.accentBorder};
    color: ${automatorColor.accent};
    border-radius: 9px;
    font-size: 12px;
    margin-bottom: 9px;
  }
  .aui-thread-list-root > .aui-button:hover {
    background: ${automatorColor.accentBg} !important;
    border-color: ${automatorColor.accentBorder} !important;
    color: ${automatorColor.accent} !important;
  }
  .aui-thread-list-item {
    border: 1px solid transparent;
    height: 36px;
    border-radius: 8px;
  }
  .aui-thread-list-item[data-active="true"] {
    background: #f5f5f5;
    border-color: #e8e8e8;
  }
  .aui-thread-list-item-trigger {
    padding: 0 9px;
    font-size: 12px;
    color: #6b6b6b;
  }
  .aui-thread-list-item[data-active="true"] .aui-thread-list-item-trigger {
    color: #434343;
    font-weight: 500;
  }
  .aui-thread-list-item-more {
    color: #8c8c8c;
  }
  .aui-thread-root {
    flex: 1 1 auto;
    min-width: 0;
    min-height: 0;
    height: 100%;
    overflow: hidden;
    background: #fafafa;
  }
  .aui-thread-viewport {
    min-height: 0;
    scrollbar-width: thin;
    scrollbar-color: #d6d6d6 transparent;
  }
  .aui-thread-layout {
    max-width: 850px;
    padding: 18px 30px 8px;
  }
  .aui-message-group {
    gap: 22px;
    margin-bottom: 8px;
    flex-shrink: 0;
  }
  .aui-assistant-message-root {
    padding: 0;
  }
  .automator-speaker {
    display: flex;
    align-items: center;
    gap: 7px;
    color: #757575;
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 0.025em;
    margin: 0 0 9px;
  }
  .automator-speaker svg {
    color: ${automatorColor.accent};
  }
  .aui-assistant-message-content {
    padding: 0;
    font-size: 13px;
    line-height: 1.75;
    color: #595959;
  }
  .aui-assistant-message-footer {
    margin-left: 0;
    min-height: 22px;
    opacity: 0;
    transition: opacity 0.15s;
  }
  @media (hover: none) {
    .aui-assistant-message-footer {
      opacity: 1;
    }
  }
  .aui-assistant-message-root:hover .aui-assistant-message-footer,
  .aui-assistant-message-root:focus-within .aui-assistant-message-footer {
    opacity: 1;
  }
  .aui-assistant-action-bar-root {
    gap: 2px;
  }
  .aui-assistant-action-bar-root .aui-button {
    height: 24px;
    width: 24px;
    color: ${automatorColor.accent};
  }
  .aui-assistant-action-bar-root svg {
    height: 14px;
    width: 14px;
  }
  .aui-user-message-root {
    padding: 0;
    grid-template-columns: minmax(28px, 1fr) auto;
  }
  .aui-user-message-content {
    background: #f3f3f3;
    border: 1px solid #e6e6e6;
    border-radius: 14px 14px 4px 14px;
    padding: 10px 15px;
    color: #434343;
    font-size: 13px;
    line-height: 1.65;
  }
  .aui-thread-viewport-footer {
    flex-shrink: 0;
    gap: 0;
    padding: 16px 0 2px;
    background: #fafafa;
  }
  .aui-thread-scroll-to-bottom {
    position: absolute;
    left: 50%;
    top: -22px;
    transform: translateX(-50%);
    height: 28px;
    width: 28px;
    border-color: #e5e5e5;
    color: #8c8c8c;
    box-shadow: 0 3px 12px #0000000c;
    background: #fff;
  }
  .aui-thread-scroll-to-bottom:disabled {
    visibility: hidden;
    pointer-events: none;
  }
  .aui-composer-shell {
    flex-direction: row;
    align-items: flex-end;
    gap: 10px;
    border-radius: 15px;
    padding: 10px 12px;
    border: 1px solid #dedede;
    background: #fff;
    box-shadow:
      0 4px 20px #00000008,
      0 1px 3px #00000004;
  }
  .aui-composer-shell:focus-within {
    border-color: ${automatorColor.accentBorder};
    box-shadow:
      0 0 0 3px #0000000c,
      0 6px 24px #0000000a;
  }
  .aui-composer-input {
    flex: 1 1 auto;
    min-width: 0;
    min-height: 34px;
    font-size: 13px;
    color: #434343;
    padding: 6px 4px;
  }
  .aui-composer-input::placeholder {
    color: #6b6b6b;
  }
  .aui-composer-action-wrapper {
    flex: 0 0 auto;
  }
  .aui-composer-send,
  .aui-composer-cancel {
    height: 32px;
    width: 32px;
    border-radius: 10px;
    background: ${automatorColor.accent};
    color: ${automatorColor.onAccent};
    border: 0;
    box-shadow: 0 2px 5px #00000025;
  }
  .aui-composer-send:not(:disabled):hover,
  .aui-composer-cancel:hover {
    background: ${automatorColor.accentHover};
  }
  .aui-composer-send:disabled {
    background: #f0f0f0;
    color: #bfbfbf;
    opacity: 1;
    box-shadow: none;
  }
  .automator-composer-note {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 5px;
    color: #6b6b6b;
    font-size: 10px;
    line-height: 16px;
    margin-top: 7px;
    text-align: center;
  }
  @container automator-chat (max-width: 680px) {
    .aui-thread-layout {
      padding: 14px 18px 6px;
    }
    .automator-history.is-open {
      position: absolute;
      inset: 0 auto 0 0;
      box-shadow: 8px 0 22px #00000015;
    }
  }
  @container automator-chat (max-width: 480px) {
    .automator-history {
      flex-basis: 46px;
      padding: 12px 5px;
    }
    .aui-thread-layout {
      padding: 12px 12px 6px;
    }
    .automator-composer-note {
      display: none;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    *,
    *::before,
    *::after {
      scroll-behavior: auto !important;
      transition: none !important;
    }
  }
`;
