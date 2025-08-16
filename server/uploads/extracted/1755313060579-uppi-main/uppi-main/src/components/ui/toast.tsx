import React from "react";
import { toast as sonnerToast } from "sonner";
import { errorTracker } from "@/utils/errorTracker";

// Toast deduping to prevent infinite/duplicate notifications during StrictMode double-renders
// Keeps a short-lived signature cache of recent toasts
const TOAST_DEDUP_WINDOW_MS = 5000; // 5s window
const recentToasts = new Map<string, number>();

function makeToastKey(props: { title?: React.ReactNode; description?: React.ReactNode; variant?: "default" | "destructive"; source?: string }) {
  const t = typeof props.title === "string" ? props.title : String(props.title ?? "");
  const d = typeof props.description === "string" ? props.description : String(props.description ?? "");
  return `${props.variant || "default"}|${t}|${d}|${props.source || ""}`.slice(0, 512);
}

export type ToastActionElement = React.ReactElement;

export type ToastProps = {
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode; // Keep compatibility – existing code passes React nodes
  variant?: "default" | "destructive";
  duration?: number;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  // Added optional context fields for richer error handling
  context?: unknown;
  error?: unknown;
  source?: string;
};

export const useToast = () => {
  const toast = (props: ToastProps) => {
    const { title, description, action, variant, duration = 5000, context, error, source } = props;

    // Deduplicate identical toasts within a short window to avoid infinite spam
    const key = makeToastKey({ title, description, variant, source });
    const now = Date.now();
    const until = recentToasts.get(key);
    if (until && until > now) {
      return; // suppressed duplicate
    }
    // Record and schedule cleanup
    recentToasts.set(key, now + TOAST_DEDUP_WINDOW_MS);
    setTimeout(() => {
      const expiry = recentToasts.get(key);
      if (expiry && expiry <= Date.now()) recentToasts.delete(key);
    }, TOAST_DEDUP_WINDOW_MS + 100);

    // Build a copyable payload for AI troubleshooting
    const buildCopyPayload = () => {
      const err = error instanceof Error ? { message: error.message, stack: error.stack } : error;
      return {
        title: typeof title === "string" ? title : String(title ?? ""),
        description: typeof description === "string" ? description : String(description ?? ""),
        context,
        error: err,
        url: typeof window !== "undefined" ? window.location.href : "",
        userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "",
        timestamp: new Date().toISOString(),
      };
    };

    const options: any = {
      duration,
    };

    // Add default Copy action for error toasts if none provided
    if (variant === "destructive" && !action) {
      const payload = buildCopyPayload();
      options.action = {
        label: "Copy error for AI",
        onClick: async () => {
          try {
            const isTest = typeof process !== 'undefined' && process.env?.NODE_ENV === 'test';
            const canUseClipboard = typeof navigator !== 'undefined' && !!navigator.clipboard?.writeText && (typeof isSecureContext === 'boolean' ? isSecureContext : true);
            if (!canUseClipboard || isTest) {
              sonnerToast("Copy unavailable", { description: "Clipboard not accessible in this environment." });
              return;
            }
            await navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
            sonnerToast("Copied", { description: "Error + context copied." });
          } catch (e) {
            sonnerToast.error("Copy failed", { description: e instanceof Error ? e.message : "Unknown clipboard error" });
          }
        },
      };
    }

    // Persist to Dev Tools when the toast likely disappears (approx via duration)
    if (variant === "destructive" && typeof window !== "undefined") {
      window.setTimeout(() => {
        const message =
          (typeof description === "string" && description) ||
          (typeof title === "string" && title) ||
          "Unknown error";
        const errObj = error instanceof Error ? error : new Error(message);
        errorTracker.trackError(errObj, source || "toast-error");
      }, duration + 100);
    }

    if (action) {
      options.action = action; // preserve custom actions
    }

    if (variant === "destructive") {
      return sonnerToast.error(title as string, {
        description,
        ...options,
      });
    }

    return sonnerToast(title as string, {
      description,
      ...options,
    });
  };

  return { toast };
};

export const toast = (props: ToastProps) => {
  const { toast: innerToast } = useToast();
  return innerToast(props);
};
