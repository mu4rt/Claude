import { Ban } from 'lucide-react'
import { useRef, useState } from 'react'
import { HexAlphaColorPicker, HexColorPicker } from 'react-colorful'
import { COLOR_SWATCHES } from '../../editor/constants'
import { cn } from './cn'
import { HEX_RE, toHex } from './color'
import { Popover } from './Popover'

interface ColorFieldProps {
  /** Geçerli renk; boş dize veya null "yok" anlamına gelir */
  value: string | null | undefined
  onChange: (value: string) => void
  label?: string
  /** Saydamlık (alfa) kaydırıcısını göster */
  alpha?: boolean
  /** "Yok" seçeneğini göster; seçildiğinde onChange('') çağrılır */
  allowNone?: boolean
  /** Renk "yok" iken seçici açıldığında başlanacak renk */
  fallback?: string
  swatches?: string[]
  className?: string
}

/** Renk kutucuğu + açılır seçici (ton alanı, HEX girişi, hazır renkler). */
export function ColorField({
  value,
  onChange,
  label = 'Renk',
  alpha = false,
  allowNone = false,
  fallback = '#ffffff',
  swatches = COLOR_SWATCHES,
  className,
}: ColorFieldProps) {
  const [open, setOpen] = useState(false)
  const anchor = useRef<HTMLButtonElement>(null)
  const isNone = !value
  const hex = toHex(value || fallback, alpha)
  // HEX kutusuna yazılırken geçici metin; null iken geçerli renk gösterilir
  const [draft, setDraft] = useState<string | null>(null)

  const Picker = alpha ? HexAlphaColorPicker : HexColorPicker

  return (
    <>
      <button
        ref={anchor}
        type="button"
        title={label}
        aria-label={label}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'checker relative size-7 shrink-0 overflow-hidden rounded-md border border-[#3a3f4d] transition-shadow',
          'hover:border-muted',
          open && 'ring-2 ring-accent',
          className,
        )}
      >
        {isNone ? (
          <span className="absolute inset-0 flex items-center justify-center bg-raised text-faint">
            <Ban size={14} />
          </span>
        ) : (
          <span className="absolute inset-0" style={{ background: hex }} />
        )}
      </button>

      <Popover open={open} onClose={() => setOpen(false)} anchor={anchor} width={232} align="end">
        <div className="color-picker p-2.5">
          <Picker color={hex} onChange={onChange} />
          <div className="mt-2.5 flex items-center gap-2">
            <label className="flex h-7.5 flex-1 items-center gap-1.5 rounded-md border border-line bg-raised px-2 text-xs focus-within:border-accent">
              <span className="text-faint">HEX</span>
              <input
                aria-label={`${label} HEX`}
                value={draft ?? hex}
                spellCheck={false}
                onChange={(e) => {
                  const text = e.target.value.trim()
                  setDraft(text)
                  if (HEX_RE.test(text)) onChange(toHex(text.startsWith('#') ? text : `#${text}`, alpha))
                }}
                onBlur={() => setDraft(null)}
                className="w-full min-w-0 bg-transparent font-mono text-ink uppercase outline-none"
              />
            </label>
            {allowNone && (
              <button
                type="button"
                title="Rengi kaldır"
                onClick={() => {
                  onChange('')
                  setOpen(false)
                }}
                className={cn(
                  'flex h-7.5 items-center gap-1 rounded-md border px-2 text-xs',
                  isNone
                    ? 'border-accent bg-accent-soft text-accent'
                    : 'border-line bg-raised text-muted hover:text-ink',
                )}
              >
                <Ban size={12} /> Yok
              </button>
            )}
          </div>
          <div className="mt-2.5 grid grid-cols-6 gap-1.5">
            {swatches.map((swatch) => (
              <button
                key={swatch}
                type="button"
                title={swatch}
                aria-label={`Renk ${swatch}`}
                onClick={() => onChange(swatch)}
                style={{ background: swatch }}
                className={cn(
                  'aspect-square rounded-md border border-white/10 transition-transform hover:scale-110',
                  !isNone && hex.slice(0, 7) === swatch && 'ring-2 ring-accent ring-offset-1 ring-offset-panel',
                )}
              />
            ))}
          </div>
        </div>
      </Popover>
    </>
  )
}
