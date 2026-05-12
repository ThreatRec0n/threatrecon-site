import clsx from 'clsx';
import type { ReactNode } from 'react';

export function Modal({
  open,
  title,
  children,
  footer,
  onClose,
  wide,
}: {
  open: boolean;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  onClose: () => void;
  wide?: boolean;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
      <div
        className={clsx(
          'max-h-[90vh] overflow-y-auto border border-border-active bg-bg-secondary shadow polaroid',
          wide ? 'w-full max-w-4xl' : 'w-full max-w-lg',
        )}
      >
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h2 className="font-display text-lg text-amber">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-ink-muted hover:text-ink-primary"
          >
            ✕
          </button>
        </div>
        <div className="p-4">{children}</div>
        {footer ? (
          <div className="flex justify-end gap-2 border-t border-border px-4 py-3">
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );
}
