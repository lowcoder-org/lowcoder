import React, { useCallback, useMemo } from "react";
import SimpleBar from "simplebar-react";
import styled from "styled-components";
import { DebouncedFunc } from 'lodash'; // Assuming you're using lodash's DebouncedFunc type

// import 'simplebar-react/dist/simplebar.min.css';

const ScrollBarWrapper = styled.div<{
  $hideplaceholder?: boolean;
  $overflow?: string;
}>`
  min-height: 0;
  height: ${props => props.$overflow? props.$overflow === 'scroll' ? '300px' : '100%':'100%'
  };
  width: 100%;
  overflow:${props=>props.$overflow};

  .simplebar-scrollbar::before {
    background: rgba(139, 143, 163, 0.5) !important;
    right: 4px !important;
    left: 1px !important;
  }

  .simplebar-hover::before {
    background: rgba(139, 143, 163, 0.5) !important;
    right: 4px !important;
    left: 1px !important;
    opacity: 1 !important;
  }

  .simplebar-content-wrapper {
    height: 100% !important;
    outline: none !important;
  }

  .simplebar-offset {
    width: 100% !important;
  }

  .simplebar-track.simplebar-vertical .simplebar-scrollbar:before {
    top: 10px;
    bottom: 10px;
  }

  ${(props) =>
    Boolean(props.$hideplaceholder) &&
    `
    .simplebar-placeholder {
      display: none !important;
    }
  `}
`;

// .simplebar-placeholder { added by Falk Wolsky to hide the placeholder - as it doubles the vertical space of a Module on a page

interface IProps {
  children: React.ReactNode;
  className?: string;
  height?: string;
  overflow?: string,
  style?: React.CSSProperties; // Add this line to include a style prop
  scrollableNodeProps?: {
    onScroll: DebouncedFunc<(e: any) => void>;
  };
  $hideplaceholder?: boolean;
  hideScrollbar?: boolean;
  prefixNode?: React.ReactNode;
  suffixNode?: React.ReactNode;
}

export const ScrollBar = React.memo(({
  className,
  children,
  style,
  overflow,
  scrollableNodeProps,
  hideScrollbar = false,
  $hideplaceholder = false,
  prefixNode,
  suffixNode,
  ...otherProps
}: IProps) => {
  // Memoize the combined style to prevent unnecessary re-renders
  const combinedStyle = useMemo(() => {
    const height = style?.height ?? '100%';
    return { ...style, height };
  }, [style]);

  // Memoize the render function to prevent recreation on every render
  const renderContent = useCallback(({ scrollableNodeProps, contentNodeProps }: any) => (
    <div {...scrollableNodeProps}>
      {prefixNode}
      <div {...contentNodeProps}>
        {children}
      </div>
      {suffixNode}
    </div>
  ), [prefixNode, children, suffixNode]);

  return hideScrollbar ? (
    <ScrollBarWrapper 
      className={className}
    >
      {prefixNode}
      {children}
      {suffixNode}
    </ScrollBarWrapper>
  ) : (
    <ScrollBarWrapper 
      className={className}
    >
      <SimpleBar 
        style={combinedStyle} 
        scrollableNodeProps={scrollableNodeProps} 
        {...otherProps}
      >
        {renderContent}
      </SimpleBar>
    </ScrollBarWrapper>
  );
});
