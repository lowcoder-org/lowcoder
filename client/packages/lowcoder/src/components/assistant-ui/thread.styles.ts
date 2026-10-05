import { ThreadPrimitive } from "@assistant-ui/react";
import styled from "styled-components";

export const StyledThreadRoot = styled(ThreadPrimitive.Root)`
  background: #f9fafb;
  color: #1f2937;
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  overflow: hidden;

  .aui-thread-viewport {
    display: flex;
    flex: 1;
    flex-direction: column;
    min-height: 0;
    overflow-x: hidden;
    overflow-y: auto;
    scroll-behavior: smooth;
  }

  .aui-thread-layout {
    display: flex;
    flex: 1;
    flex-direction: column;
    margin: 0 auto;
    max-width: var(--thread-max-width);
    min-height: 0;
    padding: 16px;
    width: 100%;
  }

  .aui-message-group {
    display: flex;
    flex-direction: column;
    gap: 24px;
    margin-bottom: 24px;
  }

  .aui-message-group:empty {
    display: none;
  }

  .aui-thread-welcome-root {
    display: flex;
    flex: 1;
    flex-direction: column;
    justify-content: center;
    margin: auto 0;
  }

  .aui-thread-welcome-center {
    align-items: center;
    display: flex;
    flex: 1;
    justify-content: center;
    width: 100%;
  }

  .aui-thread-welcome-message {
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: 0 16px;
    width: 100%;
  }

  .aui-thread-welcome-message-inner {
    color: #111827;
    font-size: 20px;
    font-weight: 600;
    line-height: 28px;
    margin: 0;
  }

  .aui-thread-welcome-suggestions {
    display: grid;
    gap: 8px;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    padding-bottom: 16px;
    width: 100%;
  }

  .aui-thread-welcome-suggestion {
    align-items: flex-start;
    background: #ffffff;
    border: 1px solid #d9d9d9;
    border-radius: 16px;
    color: #1f2937;
    cursor: pointer;
    display: flex;
    flex-wrap: wrap;
    font-size: 14px;
    gap: 4px;
    min-height: 44px;
    padding: 10px 14px;
    text-align: left;
    transition:
      background-color 0.2s ease,
      border-color 0.2s ease;
    width: 100%;
  }

  .aui-thread-welcome-suggestion:hover {
    background: #f3f4f6;
    border-color: #bfbfbf;
  }

  .aui-thread-welcome-suggestion-text-1 {
    font-weight: 500;
  }

  .aui-thread-viewport-footer {
    background: linear-gradient(180deg, rgba(249, 250, 251, 0), #f9fafb 24px);
    bottom: 0;
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin-top: auto;
    overflow: visible;
    padding-bottom: 16px;
    padding-top: 24px;
    position: sticky;
    z-index: 2;
  }

  .aui-thread-scroll-to-bottom {
    align-self: center;
    box-shadow: 0 4px 12px rgba(15, 23, 42, 0.12);
  }

  .aui-composer-root {
    display: flex;
    flex-direction: column;
    position: relative;
    width: 100%;
  }

  .aui-composer-shell {
    background: #ffffff;
    border: 1px solid #d9d9d9;
    border-radius: var(--composer-radius);
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: var(--composer-padding);
    transition:
      border-color 0.2s ease,
      box-shadow 0.2s ease;
    width: 100%;
  }

  .aui-composer-shell:focus-within {
    border-color: #1677ff;
    box-shadow: 0 0 0 2px rgba(22, 119, 255, 0.12);
  }

  .aui-composer-input {
    background: transparent;
    border: 0;
    color: #1f2937;
    font-size: 14px;
    line-height: 22px;
    max-height: 128px;
    min-height: 40px;
    outline: 0;
    padding: 4px 6px;
    resize: none;
    width: 100%;
  }

  .aui-composer-input::placeholder {
    color: #8c8c8c;
  }

  .aui-composer-action-wrapper {
    align-items: center;
    display: flex;
    justify-content: space-between;
    min-height: 32px;
  }

  .aui-composer-add-attachment,
  .aui-composer-send,
  .aui-composer-cancel {
    border-radius: 50%;
  }

  .aui-assistant-message-root {
    margin: 0 auto;
    max-width: var(--thread-max-width);
    position: relative;
    width: 100%;
  }

  .aui-assistant-message-content {
    color: #1f2937;
    font-size: 14px;
    line-height: 24px;
    padding: 0 8px;
    word-break: break-word;
  }

  .aui-assistant-message-footer {
    align-items: center;
    display: flex;
    margin-left: 8px;
    min-height: 28px;
  }

  .aui-assistant-action-bar-root {
    align-items: center;
    color: #6b7280;
    display: flex;
    gap: 4px;
  }

  .aui-action-bar-more-content {
    background: #ffffff;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    box-shadow: 0 8px 24px rgba(15, 23, 42, 0.12);
    min-width: 144px;
    padding: 4px;
    z-index: 1000;
  }

  .aui-action-bar-more-item {
    align-items: center;
    border-radius: 6px;
    color: #1f2937;
    cursor: pointer;
    display: flex;
    font-size: 14px;
    gap: 8px;
    outline: none;
    padding: 7px 8px;
  }

  .aui-action-bar-more-item:hover,
  .aui-action-bar-more-item:focus {
    background: #f3f4f6;
  }

  .aui-user-message-root {
    animation: none;
    display: grid;
    grid-auto-rows: auto;
    grid-template-columns: minmax(72px, 1fr) auto;
    gap: 8px 0;
    margin: 0 auto;
    max-width: var(--thread-max-width);
    padding: 0 8px;
    width: 100%;
  }

  .aui-user-message-content-wrapper {
    grid-column-start: 2;
    min-width: 0;
    position: relative;
  }

  .aui-user-message-content {
    background: #e5e7eb;
    border-radius: 16px;
    color: #111827;
    font-size: 14px;
    line-height: 22px;
    padding: 10px 16px;
    word-break: break-word;
  }

  .aui-user-action-bar-wrapper {
    padding-right: 8px;
    position: absolute;
    right: 100%;
    top: 50%;
    transform: translateY(-50%);
  }

  .aui-user-action-bar-root {
    align-items: flex-end;
    display: flex;
    flex-direction: column;
  }

  .aui-user-branch-picker {
    grid-column: 1 / -1;
    grid-row-start: 3;
    justify-content: flex-end;
  }

  .aui-edit-composer-wrapper {
    display: flex;
    flex-direction: column;
    padding: 0 8px;
  }

  .aui-edit-composer-root {
    align-self: flex-end;
    background: #e5e7eb;
    border-radius: 16px;
    display: flex;
    flex-direction: column;
    max-width: 85%;
    width: 100%;
  }

  .aui-edit-composer-input {
    background: transparent;
    border: 0;
    color: #111827;
    font-size: 14px;
    min-height: 56px;
    outline: 0;
    padding: 16px;
    resize: none;
    width: 100%;
  }

  .aui-edit-composer-footer {
    align-items: center;
    align-self: flex-end;
    display: flex;
    gap: 8px;
    margin: 0 12px 12px;
  }

  .aui-branch-picker-root {
    align-items: center;
    color: #6b7280;
    display: inline-flex;
    font-size: 12px;
    gap: 4px;
    margin-left: -8px;
    margin-right: 8px;
  }

  .aui-branch-picker-state {
    font-weight: 500;
    min-width: 36px;
    text-align: center;
  }

  .aui-tooltip-icon-button svg,
  .aui-button svg {
    height: 16px;
    width: 16px;
  }

  .aui-assistant-message-root:has([data-status="running"]) {
    display: none;
  }

  .aui-assistant-message-content [data-status="running"] {
    display: none;
  }
`;
