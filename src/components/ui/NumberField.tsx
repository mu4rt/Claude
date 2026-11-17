import { useState, type ReactNode } from 'react'
import { clamp } from '../../editor/utils'
import { cn } from './cn'

interface NumberFieldProps {
  value: number
  onChange: (value: number) => void
  /** Kutunun solundaki kısa etiket veya simge (X, Y, G, Y…) */
  prefix?: ReactNode
  suffix?: string
  min?: number
  max?: number
  step?: number
  /** Gösterimde kullanılacak ondalık basamak sayısı */
  precision?: number
  label?: string
  className?: string
  disabled?: boolean
}

/**
 * Sayısal giriş. Yazarken yerel metin tutulur; Enter veya odak kaybında
 * değer işlenir. Yukarı/aşağı ok tuşları adım kadar (Shift ile ×10) değiştirir.
 */
export function NumberField({
  value,
  onChange,
  prefix,
  suffix,
  min = -Infinity,
  max = Infinity,
  step = 1,
  precision = 0,
  label,
  className,
  disabled,
}: NumberFieldProps) {
  const format = (n: number) => (Number.isFinite(n) ? String(Number(n.toFixed(precision))) : '')
  // Odaktayken yazılan geçici metin; null iken dışarıdan gelen değer gösterilir
  const [draft, setDraft] = useState<string | null>(null)

  const commit = (text: string) => {
    const parsed = Number(text.replace(',', '.'))
    if (text.trim() === '' || !Number.isFinite(parsed)) return value
    const next = clamp(parsed, min, max)
    if (next !== value) onChange(next)
    return next
  }

  return (
    <label
      className={cn(
        'flex h-7.5 min-w-0 items-center gap-1.5 rounded-md border border-line bg-raised px-2 text-xs',
        'focus-within:border-accent hover:border-[#3a3f4d]',
        disabled && 'pointer-events-none opacity-40',
        className,
      )}
    >
      {prefix && <span className="shrink-0 text-[11px] text-faint">{prefix}</span>}
      <input
        type="text"
        inputMode="decimal"
        aria-label={label}
        value={draft ?? format(value)}
        disabled={disabled}
        onFocus={(e) => {
          setDraft(format(value))
          const input = e.currentTarget
          requestAnimationFrame(() => input.select())
        }}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={(e) => {
          commit(e.target.value)
          setDraft(null)
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            setDraft(format(commit(e.currentTarget.value)))
          } else if (e.key === 'Escape') {
            setDraft(null)
            e.currentTarget.blur()
          } else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
            e.preventDefault()
            const delta = (e.key === 'ArrowUp' ? step : -step) * (e.shiftKey ? 10 : 1)
            const base = Number(e.currentTarget.value.replace(',', '.'))
            const next = clamp((Number.isFinite(base) ? base : value) + delta, min, max)
            setDraft(format(next))
            if (next !== value) onChange(next)
          }
        }}
        className="w-full min-w-0 bg-transparent text-ink outline-none tabular-nums"
      />
      {suffix && <span className="shrink-0 text-[11px] text-faint">{suffix}</span>}
    </label>
  )
}
