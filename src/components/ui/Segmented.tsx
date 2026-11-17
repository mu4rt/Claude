import type { ReactNode } from 'react'
import { cn } from './cn'

interface Option<T extends string> {
  value: T
  label: string
  icon?: ReactNode
}

interface SegmentedProps<T extends string> {
  value: T
  options: Option<T>[]
  onChange: (value: T) => void
  /** Simge varsa etiketi gizle (etiket ipucu olarak kalır) */
  iconOnly?: boolean
  className?: string
}

/** Tek seçimli düğme grubu. */
export function Segmented<T extends string>({
  value,
  options,
  onChange,
  iconOnly,
  className,
}: SegmentedProps<T>) {
  return (
    <div role="radiogroup" className={cn('flex rounded-lg border border-line bg-raised p-0.5', className)}>
      {options.map((option) => {
        const active = option.value === value
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={active}
            title={option.label}
            aria-label={option.label}
            onClick={() => onChange(option.value)}
            className={cn(
              'flex h-6.5 min-w-0 flex-1 items-center justify-center gap-1 rounded-md px-2 text-xs font-medium transition-colors',
              active ? 'bg-hover text-ink shadow-sm' : 'text-muted hover:text-ink',
            )}
          >
            {option.icon}
            {!(iconOnly && option.icon) && <span className="truncate">{option.label}</span>}
          </button>
        )
      })}
    </div>
  )
}
