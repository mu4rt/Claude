import { RotateCcw } from 'lucide-react'
import type { CSSProperties } from 'react'
import { cn } from './cn'
import { NumberField } from './NumberField'

interface SliderProps {
  label: string
  value: number
  min: number
  max: number
  step?: number
  onChange: (value: number) => void
  suffix?: string
  /** Verilirse değer bundan farklıyken küçük bir sıfırlama düğmesi görünür */
  defaultValue?: number
  /** Dolgu merkezden iki yöne çizilir (−100…100 gibi simetrik aralıklar) */
  bipolar?: boolean
  precision?: number
  disabled?: boolean
}

/** Etiket, sayısal kutu ve kaydırıcıdan oluşan ayar satırı. */
export function Slider({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
  suffix,
  defaultValue,
  bipolar,
  precision = 0,
  disabled,
}: SliderProps) {
  const pct = ((Math.min(max, Math.max(min, value)) - min) / (max - min)) * 100
  const changed = defaultValue !== undefined && Math.abs(value - defaultValue) > 1e-6
  return (
    <div className={cn('flex flex-col gap-1', disabled && 'pointer-events-none opacity-40')}>
      <div className="flex h-7 items-center justify-between gap-2">
        <span className="flex min-w-0 items-center gap-1 truncate text-xs text-muted">
          {label}
          {changed && (
            <button
              type="button"
              title="Varsayılana dön"
              aria-label={`${label}: varsayılana dön`}
              onClick={() => onChange(defaultValue)}
              className="rounded p-0.5 text-faint hover:text-accent"
            >
              <RotateCcw size={11} />
            </button>
          )}
        </span>
        <NumberField
          label={label}
          value={value}
          min={min}
          max={max}
          step={step}
          precision={precision}
          suffix={suffix}
          onChange={onChange}
          className="h-6.5 w-16"
        />
      </div>
      <input
        type="range"
        aria-label={label}
        className={cn('range', bipolar && 'range-bipolar')}
        style={{ '--pct': `${pct}%` } as CSSProperties}
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  )
}
