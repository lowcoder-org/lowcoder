import { createGlobalStyle } from "styled-components";

export interface ToastStyleProps {
  $instanceId: string;
  $background?: string;
  $textColor?: string;
  $closeIconColor?: string;
  $infoIconColor?: string;
  $successIconColor?: string;
  $warningIconColor?: string;
  $errorIconColor?: string;
  $progressColor?: string;
  $progressBackground?: string;
  $progressHeight?: string;
  $border?: string;
  $borderWidth?: string;
  $borderStyle?: string;
  $radius?: string;
  $margin?: string;
  $padding?: string;
  $width?: string;
}

export const ToastGlobalStyle = createGlobalStyle<ToastStyleProps>`
  .ant-notification .ant-notification-notice-wrapper:has(.lowcoder-toast-${props => props.$instanceId}) {
    background: ${props => props.$background || 'inherit'};
    border-color: ${props => props.$border || 'transparent'};
    border-width: ${props => props.$borderWidth || '0'};
    border-style: ${props => props.$borderStyle || 'solid'};
    border-radius: ${props => props.$radius || '8px'};
    ${props => props.$margin ? `margin: ${props.$margin};` : ''}
    ${props => props.$padding ? `padding: ${props.$padding};` : ''}

    .ant-notification-notice {
      background: transparent;
      ${props => props.$width ? `width: ${props.$width};` : ''}
    }

    .ant-notification-notice-message,
    .ant-notification-notice-description {
      color: ${props => props.$textColor || 'inherit'};
    }

    .ant-notification-notice-close {
      color: ${props => props.$closeIconColor || 'inherit'};
    }

    .ant-notification-notice-icon-info.anticon {
      color: ${props => props.$infoIconColor || '#1890ff'};
    }

    .ant-notification-notice-icon-success.anticon {
      color: ${props => props.$successIconColor || '#52c41a'};
    }

    .ant-notification-notice-icon-warning.anticon {
      color: ${props => props.$warningIconColor || '#faad14'};
    }

    .ant-notification-notice-icon-error.anticon {
      color: ${props => props.$errorIconColor || '#ff4d4f'};
    }

    .ant-notification-notice-progress {
      ${props => props.$progressHeight ? `height: ${props.$progressHeight};` : ''}
      ${props => props.$progressBackground ? `background: ${props.$progressBackground};` : ''}
      &::-webkit-progress-bar {
        background: ${props => props.$progressBackground || '#e8e8e8'};
      }
      &::-webkit-progress-value {
        background: ${props => props.$progressColor || '#1890ff'};
      }
      &::-moz-progress-bar {
        background: ${props => props.$progressColor || '#1890ff'};
      }
    }
  }
`;
