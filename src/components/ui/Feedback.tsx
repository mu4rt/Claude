import { CircleAlert, CircleCheck, Info, LoaderCircle, X } from 'lucide-react'
import { useEditorStore } from '../../store/editorStore'
import { cn } from './cn'

const ICONS = { info: Info, success: CircleCheck, error: CircleAlert }

/** Sağ altta beliren kısa bildirimler. */
export function Toaster() {
  const toasts = useEditorStore((s) => s.toasts)
  const dismiss = useEditorStore((s) => s.dismissToast)
  return (
    <div className="pointer-events-none fixed right-4 bottom-4 z-[60] flex w-80 flex-col gap-2" aria-live="polite">
      {toasts.map((toast) => {
        const Icon = ICONS[toast.kind]
        return (
          <div
            key={toast.id}
            role={toast.kind === 'error' ? 'alert' : 'status'}
            className="pointer-events-auto flex animate-pop items-start gap-2.5 rounded-xl border border-line bg-raised p-3 text-[13px] shadow-pop"
          >
            <Icon
              size={16}
              className={cn(
                'mt-0.5 shrink-0',
                toast.kind === 'error' ? 'text-danger' : toast.kind === 'success' ? 'text-success' : 'text-accent',
              )}
            />
            <p className="min-w-0 flex-1 break-words text-ink">{toast.message}</p>
            <button
              type="button"
              aria-label="Bildirimi kapat"
              onClick={() => dismiss(toast.id)}
              className="shrink-0 text-faint hover:text-ink"
            >
              <X size={14} />
            </button>
          </div>
        )
      })}
    </div>
  )
}

/** Uzun süren işlemler (AI araçları, dışa aktarma) için ilerleme göstergesi. */
export function BusyIndicator() {
  const busy = useEditorStore((s) => s.busy)
  if (!busy) return null
  const pct = busy.progress === undefined ? null : Math.round(busy.progress * 100)
  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none absolute top-4 left-1/2 z-30 w-72 -translate-x-1/2 animate-pop rounded-xl border border-line bg-raised/95 p-3 shadow-pop backdrop-blur"
    >
      <div className="flex items-center gap-2 text-[13px]">
        <LoaderCircle size={15} className="shrink-0 animate-spin text-accent" />
        <span className="min-w-0 flex-1 truncate">{busy.label}…</span>
        {pct !== null && <span className="text-xs text-muted tabular-nums">%{pct}</span>}
      </div>
      <div className="mt-2 h-1 overflow-hidden rounded-full bg-hover">
        {pct === null ? (
          <div className="h-full w-1/3 animate-slide rounded-full bg-accent" />
        ) : (
          <div className="h-full rounded-full bg-accent transition-[width]" style={{ width: `${pct}%` }} />
        )}
      </div>
    </div>
  )
}
