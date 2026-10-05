'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

export interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
}

/**
 * Reusable Confirmation Modal strictly following the Refined Utilitarian 4px rounded-sm design system.
 */
export function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title = 'Delete Addresses',
  description = 'Are you sure you want to delete these selected addresses?',
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  isDestructive = true,
}: ConfirmationModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="border-border bg-card transform-gpu rounded-[4px] border p-5 font-sans shadow-xl will-change-[transform,opacity] sm:max-w-md"
        showCloseButton={true}
      >
        <DialogHeader className="gap-2 text-left font-sans">
          <DialogTitle className="text-foreground font-sans text-base font-bold tracking-tight md:text-lg">
            {title}
          </DialogTitle>
          {description && (
            <DialogDescription className="text-muted-foreground pt-1 font-sans text-xs leading-relaxed md:text-sm">
              {description}
            </DialogDescription>
          )}
        </DialogHeader>

        <div className="border-border mt-4 flex w-full flex-col-reverse gap-2 border-t pt-4 font-sans sm:flex-row sm:justify-end sm:gap-3">
          <button
            type="button"
            onClick={onClose}
            className="border-border text-foreground bg-background hover:bg-muted w-full cursor-pointer rounded-[4px] border px-3.5 py-2 text-center font-sans text-xs font-medium transition-[transform,opacity] duration-150 ease-out active:scale-[0.98] sm:w-auto md:text-sm"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
            }}
            className={`flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-[4px] border px-4 py-2 font-sans text-xs font-semibold shadow-xs transition-[transform,opacity] duration-150 ease-out active:scale-[0.98] sm:w-auto md:text-sm ${
              isDestructive
                ? 'border-red-600 bg-red-600 text-white hover:bg-red-700 dark:border-red-600 dark:bg-red-600 dark:hover:bg-red-700'
                : 'bg-primary text-primary-foreground hover:bg-primary/90'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
