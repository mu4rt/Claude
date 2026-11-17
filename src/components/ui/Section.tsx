import { ChevronDown } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { cn } from './cn'

interface SectionProps {
  title: string
  children: ReactNode
  /** Başlığın sağında gösterilen eylem (ör. sıfırla düğmesi) */
  action?: ReactNode
  defaultOpen?: boolean
  collapsible?: boolean
}

/** Sağ/sol panellerdeki başlıklı, katlanabilir bölüm. */
export function Section({ title, children, action, defaultOpen = true, collapsible = true }: SectionProps) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <section className="border-b border-line px-3.5 py-3 last:border-b-0">
      <div className="flex h-6 items-center justify-between">
        <button
          type="button"
          disabled={!collapsible}
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="flex items-center gap-1 text-[11px] font-semibold tracking-wider text-muted uppercase hover:text-ink disabled:cursor-default disabled:hover:text-muted"
        >
          {collapsible && (
            <ChevronDown size={13} className={cn('transition-transform', !open && '-rotate-90')} />
          )}
          {title}
        </button>
        {open && action}
      </div>
      {open && <div className="mt-2.5 flex flex-col gap-2.5">{children}</div>}
    </section>
  )
}

/** Etiket + denetim satırı. */
export function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex min-h-7.5 items-center justify-between gap-3">
      <span className="shrink-0 text-xs text-muted">{label}</span>
      <div className="flex min-w-0 items-center gap-1.5">{children}</div>
    </div>
  )
}
