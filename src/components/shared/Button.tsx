import clsx from 'clsx';
import type { ButtonHTMLAttributes } from 'react';

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'ghost' | 'danger';
};

export function Button({ variant = 'primary', className, ...rest }: Props) {
  return (
    <button
      className={clsx(
        'rounded-sm px-4 py-2 text-sm font-display tracking-wide transition',
        variant === 'primary' &&
          'border border-amber/40 bg-amber/10 text-amber-bright hover:bg-amber/20',
        variant === 'ghost' &&
          'border border-border text-ink-secondary hover:border-border-active hover:text-ink-primary',
        variant === 'danger' &&
          'border border-threat-red/40 bg-threat-red-dim text-threat-red hover:bg-threat-red/20',
        className,
      )}
      {...rest}
    />
  );
}
