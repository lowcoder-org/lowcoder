// client/packages/lowcoder/src/comps/comps/chatComp/components/ChatContainer.styles.ts

import styled from "styled-components";


export interface StyledChatContainerProps {
  $autoHeight?: boolean;
  $sidebarWidth?: string;
  $sidebarStyle?: any;
  $messagesStyle?: any;
  $inputStyle?: any;
  $sendButtonStyle?: any;
  $newThreadButtonStyle?: any;
  $threadItemStyle?: any;
  $animationStyle?: any;
  style?: any; 
}

export const StyledChatContainer = styled.div<StyledChatContainerProps>`
  display: flex;
  align-items: stretch;
  height: ${(props) => (props.$autoHeight ? "auto" : "100%")};
  min-height: ${(props) => (props.$autoHeight ? "300px" : "unset")};
  min-width: 0;
  overflow: hidden;

  /* Main container styles */
  background: ${(props) => props.style?.background || "transparent"};
  margin: ${(props) => props.style?.margin || "0"};
  padding: ${(props) => props.style?.padding || "0"};
  border: ${(props) => props.style?.borderWidth || "0"} ${(props) => props.style?.borderStyle || "solid"} ${(props) => props.style?.border || "transparent"};
  border-radius: ${(props) => props.style?.radius || "0"};

  /* Animation styles */
  animation: ${(props) => props.$animationStyle?.animation || "none"};
  animation-duration: ${(props) => props.$animationStyle?.animationDuration || "0s"};
  animation-delay: ${(props) => props.$animationStyle?.animationDelay || "0s"};
  animation-iteration-count: ${(props) => props.$animationStyle?.animationIterationCount || "1"};

  p {
    margin: 0;
  }

  /* Sidebar Styles */
  .aui-thread-list-root {
    align-self: stretch;
    width: ${(props) => props.$sidebarWidth || "250px"};
    background-color: ${(props) => props.$sidebarStyle?.sidebarBackground || "#fff"};
    padding: 10px;
    min-height: 0;
    overflow-y: auto;
  }

  .aui-thread-list-item-title {
    color: ${(props) => props.$sidebarStyle?.threadText || "inherit"};
  }

  /* Messages Window Styles */
  .aui-thread-root {
    flex: 1 1 auto;
    align-self: stretch;
    min-width: 0;
    min-height: 0;
    background-color: ${(props) => props.$messagesStyle?.messagesBackground || "#f9fafb"};
    height: ${(props) => (props.$autoHeight ? "auto" : "100%")};
    overflow: hidden;
  }

  .aui-thread-viewport {
    flex: 1 1 auto;
    min-height: 0;
  }

  /* User Message Styles */
  .aui-user-message-content {
    background-color: ${(props) => props.$messagesStyle?.userMessageBackground || "#e5e7eb"};
    color: ${(props) => props.$messagesStyle?.userMessageText || "#111827"};
  }

  .aui-user-message-content:empty {
    display: none;
  }

  .aui-user-message-content img {
    display: block;
    height: auto;
    max-height: 320px;
    max-width: 100%;
    object-fit: contain;
  }

  /* Assistant Message Styles */
  .aui-assistant-message-content {
    display: inline-block;
    max-width: 85%;
    padding: 10px 16px;
    border-radius: 16px;
    background-color: ${(props) => props.$messagesStyle?.assistantMessageBackground || "#ffffff"};
    color: ${(props) => props.$messagesStyle?.assistantMessageText || "inherit"};
  }

  /* Input Field Styles */


 

  /* Send Button Styles */
  .aui-composer-send {
    background-color: ${(props) => props.$sendButtonStyle?.sendButtonBackground || "#3b82f6"} !important;
    
    svg {
      color: ${(props) => props.$sendButtonStyle?.sendButtonIcon || "#ffffff"};
    }
  }

  /* New Thread Button Styles */
  .aui-thread-list-root > button {
    background-color: ${(props) => props.$newThreadButtonStyle?.newThreadBackground || "#3b82f6"} !important;
    color: ${(props) => props.$newThreadButtonStyle?.newThreadText || "#ffffff"} !important;
    border-color: ${(props) => props.$newThreadButtonStyle?.newThreadBackground || "#3b82f6"} !important;
  }

  /* Thread item styling */
  .aui-thread-list-item {
    cursor: pointer;
    transition: background-color 0.2s ease;
    background-color: ${(props) => props.$threadItemStyle?.threadItemBackground || "transparent"};
    color: ${(props) => props.$threadItemStyle?.threadItemText || "inherit"};
    border: 1px solid ${(props) => props.$threadItemStyle?.threadItemBorder || "transparent"};

    &[data-active="true"] {
      background-color: ${(props) => props.$threadItemStyle?.activeThreadBackground || "#dbeafe"};
      color: ${(props) => props.$threadItemStyle?.activeThreadText || "inherit"};
      border: 1px solid ${(props) => props.$threadItemStyle?.activeThreadBorder || "#bfdbfe"};
    }
  }
`;
