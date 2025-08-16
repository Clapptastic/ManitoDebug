import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

/**
 * Increase Limit Dialog
 *
 * Promise-based, programmatic dialog for setting a new monthly budget limit.
 * Designed for use from non-UI contexts (e.g., hooks) while following
 * UI/UX best practices: clear context, validation, accessible labels, and
 * explicit confirm/cancel actions.
 */
export interface IncreaseLimitOptions {
  currentLimit: number;
  monthlySpend: number;
  suggested: number;
  estimatedCost: number;
  currency?: string; // default: '$'
}

/**
 * Opens a modal that lets the user choose a new monthly limit value.
 * Resolves with the chosen amount (number) or null if the user cancels.
 */
export function promptIncreaseLimit(options: IncreaseLimitOptions): Promise<number | null> {
  const { currentLimit, monthlySpend, suggested, estimatedCost, currency = '$' } = options;

  return new Promise((resolve) => {
    const container = document.createElement('div');
    document.body.appendChild(container);

    const root = createRoot(container);

    const Modal: React.FC = () => {
      const [open, setOpen] = useState(true);
      const [value, setValue] = useState<string>(suggested.toFixed(2));
      const [touched, setTouched] = useState(false);

      // Basic validation: positive number; allow below current spend but warn
      const parsed = Number(value);
      const isValid = Number.isFinite(parsed) && parsed > 0;
      const showBelowSpendWarning = isValid && parsed < monthlySpend;

      const cleanup = () => {
        setOpen(false);
        setTimeout(() => {
          root.unmount();
          container.remove();
        }, 200);
      };

      const handleConfirm = () => {
        setTouched(true);
        if (!isValid) return;
        resolve(parsed);
        cleanup();
      };

      const handleCancel = () => {
        resolve(null);
        cleanup();
      };

      // Keyboard UX: Enter to confirm if valid
      useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            if (isValid) handleConfirm();
          }
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
      }, [isValid]);

      return (
        <Dialog open={open} onOpenChange={(o) => (!o ? handleCancel() : undefined)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Increase monthly budget limit</DialogTitle>
              <DialogDescription>
                The projected cost ({currency}{estimatedCost.toFixed(2)}) exceeds your current monthly limit.
                Set a new limit to continue safely.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3 text-sm text-muted-foreground">
                <div>
                  <div className="font-medium text-foreground">Current limit</div>
                  <div>
                    {currency}
                    {Number(currentLimit).toFixed(2)}
                  </div>
                </div>
                <div>
                  <div className="font-medium text-foreground">Current spend</div>
                  <div>
                    {currency}
                    {Number(monthlySpend).toFixed(2)}
                  </div>
                </div>
              </div>

              <label className="text-sm font-medium text-foreground" htmlFor="new-limit">
                New monthly limit ({currency})
              </label>
              <div className="flex items-center gap-2">
                <div className="relative w-full">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    {currency}
                  </span>
                  <Input
                    id="new-limit"
                    inputMode="decimal"
                    type="number"
                    min={0}
                    step={0.01}
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    onBlur={() => setTouched(true)}
                    className="pl-7"
                    aria-invalid={touched && !isValid}
                    aria-describedby="new-limit-help"
                    placeholder={suggested.toFixed(2)}
                  />
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setValue(suggested.toFixed(2))}
                  title="Use suggested"
                >
                  Use {currency}
                  {suggested.toFixed(2)}
                </Button>
              </div>

              <p id="new-limit-help" className="text-xs text-muted-foreground">
                You can change this anytime in Settings → Billing.
                {showBelowSpendWarning && (
                  <>
                    {' '}
                    Setting a limit below your current spend may block further usage this month.
                  </>
                )}
              </p>

              {!isValid && touched && (
                <p className="text-xs text-destructive">Enter a valid amount greater than 0.</p>
              )}
            </div>

            <DialogFooter className="mt-4">
              <Button type="button" variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
              <Button type="button" onClick={handleConfirm} disabled={!isValid}>
                Update limit
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      );
    };

    root.render(<Modal />);
  });
}
