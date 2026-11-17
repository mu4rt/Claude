import { Check, ChevronDown, Search } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { FONT_CATALOG, FONT_CATEGORIES, type FontCategory } from '../../editor/fontCatalog'
import { loadFontPreviews } from '../../editor/fonts'
import { cn } from './cn'
import { Popover } from './Popover'

interface FontPickerProps {
  value: string
  onChange: (family: string) => void
}

/** Kategorili ve aranabilir Google Fonts seçici; her aile kendi yazı tipiyle listelenir. */
export function FontPicker({ value, onChange }: FontPickerProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<FontCategory | 'all'>('all')
  const anchor = useRef<HTMLButtonElement>(null)
  const activeRow = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    loadFontPreviews()
    requestAnimationFrame(() => activeRow.current?.scrollIntoView({ block: 'center' }))
  }, [open])

  const fonts = useMemo(() => {
    const q = query.trim().toLocaleLowerCase('tr')
    return FONT_CATALOG.filter(
      (font) =>
        (category === 'all' || font.category === category) &&
        (!q || font.family.toLocaleLowerCase('tr').includes(q)),
    )
  }, [query, category])

  return (
    <>
      <button
        ref={anchor}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'flex h-8.5 w-full items-center justify-between gap-2 rounded-lg border border-line bg-raised px-2.5 text-left',
          'hover:border-[#3a3f4d]',
          open && 'border-accent',
        )}
      >
        <span className="truncate text-sm" style={{ fontFamily: `"${value}", sans-serif` }}>
          {value}
        </span>
        <ChevronDown size={14} className="shrink-0 text-faint" />
      </button>

      <Popover open={open} onClose={() => setOpen(false)} anchor={anchor} width={280} align="end">
        <div className="flex max-h-[420px] flex-col">
          <div className="p-2.5 pb-2">
            <label className="flex h-8 items-center gap-2 rounded-lg border border-line bg-raised px-2.5 focus-within:border-accent">
              <Search size={14} className="text-faint" />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Yazı tipi ara"
                aria-label="Yazı tipi ara"
                className="w-full bg-transparent text-[13px] outline-none placeholder:text-faint"
              />
            </label>
            <div className="mt-2 flex flex-wrap gap-1">
              {FONT_CATEGORIES.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setCategory(item.id)}
                  className={cn(
                    'rounded-full px-2 py-0.5 text-[11px] font-medium transition-colors',
                    category === item.id
                      ? 'bg-accent text-white'
                      : 'bg-raised text-muted hover:text-ink',
                  )}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
          <div role="listbox" aria-label="Yazı tipleri" className="min-h-0 flex-1 overflow-y-auto border-t border-line p-1.5">
            {fonts.length === 0 && (
              <p className="px-2 py-6 text-center text-xs text-faint">Eşleşen yazı tipi yok</p>
            )}
            {fonts.map((font) => {
              const selected = font.family === value
              return (
                <button
                  key={font.family}
                  ref={selected ? activeRow : undefined}
                  type="button"
                  role="option"
                  aria-selected={selected}
                  onClick={() => {
                    onChange(font.family)
                    setOpen(false)
                  }}
                  className={cn(
                    'flex h-9 w-full items-center justify-between gap-2 rounded-md px-2.5 text-left',
                    selected ? 'bg-accent-soft text-ink' : 'text-ink/90 hover:bg-hover',
                  )}
                >
                  <span className="truncate text-[15px]" style={{ fontFamily: `"${font.family}", sans-serif` }}>
                    {font.family}
                  </span>
                  {selected && <Check size={14} className="shrink-0 text-accent" />}
                </button>
              )
            })}
          </div>
        </div>
      </Popover>
    </>
  )
}
