
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Clipboard, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

/**
 * CodeBlock (UI)
 * -------------------------------------------------------------
 * A reusable, accessible, and design-system aligned code block.
 * - Uses Tailwind semantic tokens (bg-muted, border-border, etc.)
 * - Provides an optional Copy button with success feedback
 * - Works well for JSON and plain text (no syntax highlight dependency)
 *
 * NOTE: Keep this component small and focused; enhance globally here
 * so all consumers benefit from consistent visuals and UX.
 */
export interface CodeBlockProps {
  /** Raw string content to render inside the block */
  content: string;
  /** Language hint (for future syntax highlighting upgrades) */
  language?: string;
  /** Optional aria-label for a11y screen reader description */
  ariaLabel?: string;
  /** Additional className overrides */
  className?: string;
  /** Toggle soft wrap for long lines (default: false = horizontal scroll) */
  wrap?: boolean;
  /** Show copy button (default: true) */
  copyable?: boolean;
}

export function CodeBlock({
  content,
  language = "text",
  ariaLabel,
  className,
  wrap = false,
  copyable = true,
}: CodeBlockProps) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      toast({ title: "Copied", description: "Code copied to clipboard" });
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast({ title: "Copy failed", description: "Unable to copy", variant: "destructive" });
    }
  };

  return (
    <div className={cn("relative group", className)}>
      {copyable && (
        <div className="absolute right-2 top-2 z-10">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-7 w-7"
            aria-label="Copy code"
            onClick={onCopy}
          >
            {copied ? <Check className="h-4 w-4" /> : <Clipboard className="h-4 w-4" />}
          </Button>
        </div>
      )}

      {/* Using semantic tokens for colors and borders */}
      <pre
        aria-label={ariaLabel}
        role="region"
        tabIndex={0}
        className={cn(
          "font-mono text-sm leading-relaxed text-muted-foreground bg-muted/60",
          "p-4 rounded-lg border border-border shadow-sm overflow-auto",
          wrap ? "whitespace-pre-wrap break-words" : "whitespace-pre",
        )}
      >
        {/* language hint kept as data-attr for potential future highlighter */}
        <code data-language={language}>{content}</code>
      </pre>
    </div>
  );
}

export default CodeBlock;
