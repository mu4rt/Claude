import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cn } from './cn'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: 'sm' | 'md'
  icon?: ReactNode
  block?: boolean
}

const variants: Record<Variant, string> = {
  primary: 'bg-accent text-white hover:bg-accent-strong shadow-sm shadow-accent/20',
  secondary: 'bg-raised text-ink hover:bg-hover border border-line',
  ghost: 'text-muted hover:text-ink hover:bg-hover',
  danger: 'bg-danger/10 text-danger hover:bg-danger/20 border border-danger/20',
}

export function Button({
  variant = 'secondary',
  size = 'md',
  icon,
  block,
  className,
  children,
  type = 'button',
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        'inline-flex items-center justify-center gap-1.5 rounded-lg font-medium transition-colors',
        'disabled:opacity-40 disabled:pointer-events-none',
        size === 'sm' ? 'h-7 px-2.5 text-xs' : 'h-8.5 px-3 text-[13px]',
        block && 'w-full',
        variants[variant],
        className,
      )}
      {...rest}
    >
      {icon}
      {children}
    </button>
  )
}

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string
  active?: boolean
  size?: 'sm' | 'md'
}

/** Yalnızca simge içeren düğme; `label` hem ipucu hem erişilebilir addır. */
export function IconButton({
  label,
  active,
  size = 'md',
  className,
  children,
  type = 'button',
  ...rest
}: IconButtonProps) {
  return (
    <button
      type={type}
      title={label}
      aria-label={label}
      aria-pressed={active}
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-md transition-colors',
        'disabled:opacity-35 disabled:pointer-events-none',
        size === 'sm' ? 'size-6.5' : 'size-8',
        active
          ? 'bg-accent-soft text-accent'
          : 'text-muted hover:bg-hover hover:text-ink',
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  )
}
