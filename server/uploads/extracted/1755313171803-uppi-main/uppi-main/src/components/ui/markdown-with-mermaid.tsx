import React from 'react';
import ReactMarkdown from 'react-markdown';
import type { Components } from 'react-markdown';
import { Mermaid } from './mermaid';

interface MarkdownWithMermaidProps {
  children: string;
  className?: string;
}

export const MarkdownWithMermaid: React.FC<MarkdownWithMermaidProps> = ({ 
  children, 
  className = "" 
}) => {
  const components: Components = {
    code(props) {
      const { children, className: codeClassName, ...rest } = props;
      const match = /language-(\w+)/.exec(codeClassName || '');
      const language = match ? match[1] : '';
      
      if (language === 'mermaid') {
        return (
          <div className="not-prose my-6">
            <Mermaid chart={String(children).replace(/\n$/, '')} />
          </div>
        );
      }
      
      return (
        <code className={codeClassName} {...rest}>
          {children}
        </code>
      );
    },
    // Enhance other markdown elements with better styling
    h1: ({ children }) => (
      <h1 className="text-3xl font-bold mb-4 text-foreground border-b pb-2">
        {children}
      </h1>
    ),
    h2: ({ children }) => (
      <h2 className="text-2xl font-semibold mb-3 text-foreground">
        {children}
      </h2>
    ),
    h3: ({ children }) => (
      <h3 className="text-xl font-medium mb-2 text-foreground">
        {children}
      </h3>
    ),
    p: ({ children }) => (
      <p className="mb-4 text-muted-foreground leading-relaxed">
        {children}
      </p>
    ),
    ul: ({ children }) => (
      <ul className="mb-4 ml-6 space-y-1 text-muted-foreground list-disc">
        {children}
      </ul>
    ),
    ol: ({ children }) => (
      <ol className="mb-4 ml-6 space-y-1 text-muted-foreground list-decimal">
        {children}
      </ol>
    ),
    li: ({ children }) => (
      <li className="leading-relaxed">
        {children}
      </li>
    ),
    blockquote: ({ children }) => (
      <blockquote className="border-l-4 border-primary pl-4 my-4 italic text-muted-foreground bg-muted/50 py-2 rounded-r">
        {children}
      </blockquote>
    ),
    table: ({ children }) => (
      <div className="overflow-x-auto my-4">
        <table className="w-full border-collapse border border-border">
          {children}
        </table>
      </div>
    ),
    th: ({ children }) => (
      <th className="border border-border px-3 py-2 bg-muted font-semibold text-left">
        {children}
      </th>
    ),
    td: ({ children }) => (
      <td className="border border-border px-3 py-2">
        {children}
      </td>
    ),
    a: ({ children, href }) => (
      <a 
        href={href} 
        className="text-primary underline hover:text-primary/80 transition-colors"
        target={href?.startsWith('http') ? '_blank' : undefined}
        rel={href?.startsWith('http') ? 'noopener noreferrer' : undefined}
      >
        {children}
      </a>
    ),
    pre: ({ children }) => (
      <pre className="bg-muted p-4 rounded-lg overflow-x-auto my-4 text-sm">
        {children}
      </pre>
    ),
  };

  return (
    <div className={`prose prose-sm max-w-none dark:prose-invert ${className}`}>
      <ReactMarkdown components={components}>
        {children}
      </ReactMarkdown>
    </div>
  );
};