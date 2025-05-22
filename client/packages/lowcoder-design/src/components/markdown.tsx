import { css } from "styled-components";
import { lazy, Suspense, memo, useMemo } from "react";
// import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import remarkGfm from "remark-gfm";
import type { Options as ReactMarkdownOptions, Components } from "react-markdown/lib";
import type { Pluggable } from "unified";

const ReactMarkdown = lazy(() => import('react-markdown'));

export const markdownCompCss = css`
  .markdown-body {
    background-color: unset;
    font-size: 13px;
    margin: 3px 0;

    h1,
    h2 {
      border: none;
      padding-bottom: 0;
    }

    p {
      line-height: 1.9;
    }

    h3 {
      padding: 2px 0;
    }

    h4 {
      padding: 4px 0;
    }
  }
`;

interface TacoMarkDownProps extends ReactMarkdownOptions {
  children: string;
}

interface AnchorProps {
  node?: any;
  children: React.ReactNode;
  href?: string;
  className?: string;
  style?: React.CSSProperties;
}

// Memoize the anchor component to prevent unnecessary re-renders
const Anchor = memo((props: AnchorProps) => {
  const { node, children, ...otherProps } = props;
  return (
    <a {...otherProps} target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  );
});

Anchor.displayName = 'Anchor';

// Memoize the components object with proper typing
const components: Components = {
  a: Anchor as any, // Type assertion needed due to react-markdown's type definitions
};

// Memoize the sanitize schema
const sanitizeSchema = {
  ...defaultSchema,
  attributes: {
    ...defaultSchema.attributes,
    "*": [
      ...((defaultSchema.attributes && defaultSchema.attributes["*"]) || []),
      "style",
      "className",
    ],
  },
};

// Memoize the rehype plugins array with proper typing
const rehypePlugins: Pluggable[] = [
  [rehypeRaw] as Pluggable,
  [rehypeSanitize, sanitizeSchema] as Pluggable,
];

export const TacoMarkDown = memo((props: TacoMarkDownProps) => {
  const { children, ...otherProps } = props;

  // Memoize the remark plugins array with proper typing
  const remarkPlugins = useMemo(() => [remarkGfm] as Pluggable[], []);

  return (
    <Suspense fallback={<div className="markdown-body">Loading...</div>}>
      <ReactMarkdown
        remarkPlugins={remarkPlugins}
        components={components}
        rehypePlugins={rehypePlugins}
        className="markdown-body"
        {...otherProps}
      >
        {children}
      </ReactMarkdown>
    </Suspense>
  );
});

TacoMarkDown.displayName = 'TacoMarkDown';
