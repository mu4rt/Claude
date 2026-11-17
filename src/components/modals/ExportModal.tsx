import { Download } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { downloadExport } from '../../actions'
import { useEditor } from '../../editor/EditorContext'
import { canExport, exportSize, renderPreview } from '../../editor/exporter'
import type { ExportFormat } from '../../editor/types'
import { useEditorStore } from '../../store/editorStore'
import { Button } from '../ui/Button'
import { cn } from '../ui/cn'
import { Modal } from '../ui/Modal'
import { Segmented } from '../ui/Segmented'
import { Slider } from '../ui/Slider'

const SCALES = [1, 2, 3, 4]

/** PNG / JPEG dışa aktarma penceresi. */
export function ExportModal({ onClose }: { onClose: () => void }) {
  const editor = useEditor()
  const doc = useEditorStore((s) => s.doc)
  const background = useEditorStore((s) => s.background)
  const busy = useEditorStore((s) => !!s.busy)
  const [format, setFormat] = useState<ExportFormat>('png')
  const [multiplier, setMultiplier] = useState(1)
  const [quality, setQuality] = useState(92)
  const [transparent, setTransparent] = useState(false)
  const [name, setName] = useState('kapak')
  const previewCanvas = useRef<HTMLCanvasElement>(null)

  const noBackground = format === 'png' && (transparent || background.type === 'transparent')

  useEffect(() => {
    const target = previewCanvas.current
    if (!target) return
    const rendered = renderPreview(editor, 560, noBackground)
    target.width = rendered.width
    target.height = rendered.height
    target.getContext('2d')?.drawImage(rendered, 0, 0)
  }, [editor, noBackground])

  const size = exportSize(doc, multiplier)

  return (
    <Modal
      title="Dışa aktar"
      width={760}
      onClose={onClose}
      footer={
        <>
          <span className="mr-auto text-xs text-muted tabular-nums">
            {size.width} × {size.height} px · {format === 'png' ? 'PNG' : 'JPEG'}
          </span>
          <Button onClick={onClose}>Vazgeç</Button>
          <Button
            variant="primary"
            icon={<Download size={15} />}
            disabled={busy || !canExport(doc, multiplier)}
            onClick={async () => {
              const ok = await downloadExport(
                editor,
                { format, multiplier, quality: quality / 100, transparent },
                name,
              )
              if (ok) onClose()
            }}
          >
            İndir
          </Button>
        </>
      }
    >
      <div className="grid gap-5 p-4 md:grid-cols-[1fr_260px]">
        <div className={cn('flex min-h-52 items-center justify-center rounded-xl p-3', noBackground ? 'checker' : 'bg-base')}>
          <canvas
            ref={previewCanvas}
            role="img"
            aria-label="Dışa aktarma önizlemesi"
            className="max-h-[46vh] max-w-full rounded shadow-lg shadow-black/40"
          />
        </div>

        <div className="flex flex-col gap-4">
          <div>
            <p className="mb-1.5 text-xs text-muted">Biçim</p>
            <Segmented<ExportFormat>
              value={format}
              onChange={setFormat}
              options={[
                { value: 'png', label: 'PNG' },
                { value: 'jpeg', label: 'JPEG' },
              ]}
            />
            <p className="mt-1.5 text-[11px] text-faint">
              {format === 'png'
                ? 'Kayıpsız; metin ve saydamlık için en iyisi.'
                : 'Daha küçük dosya; fotoğraf ağırlıklı tasarımlar için uygun.'}
            </p>
          </div>

          <div>
            <p className="mb-1.5 text-xs text-muted">Çözünürlük</p>
            <div className="grid grid-cols-4 gap-1.5">
              {SCALES.map((scale) => {
                const enabled = canExport(doc, scale)
                const s = exportSize(doc, scale)
                return (
                  <button
                    key={scale}
                    type="button"
                    disabled={!enabled}
                    aria-pressed={scale === multiplier}
                    title={enabled ? `${s.width} × ${s.height} px` : 'Tarayıcının tuval sınırını aşıyor'}
                    onClick={() => setMultiplier(scale)}
                    className={cn(
                      'flex h-12 flex-col items-center justify-center rounded-lg border text-xs transition-colors disabled:opacity-35',
                      scale === multiplier
                        ? 'border-accent bg-accent-soft text-accent'
                        : 'border-line bg-raised text-muted hover:text-ink',
                    )}
                  >
                    <span className="font-semibold">{scale}×</span>
                    <span className="text-[10px] tabular-nums opacity-80">{s.width}px</span>
                  </button>
                )
              })}
            </div>
          </div>

          {format === 'jpeg' ? (
            <Slider label="Kalite" min={40} max={100} suffix="%" value={quality} onChange={setQuality} />
          ) : (
            <label className="flex cursor-pointer items-center justify-between gap-3 text-xs text-muted">
              Saydam arka plan
              <input
                type="checkbox"
                checked={transparent || background.type === 'transparent'}
                disabled={background.type === 'transparent'}
                onChange={(e) => setTransparent(e.target.checked)}
                className="size-4 accent-(--color-accent)"
              />
            </label>
          )}

          <label className="flex flex-col gap-1.5 text-xs text-muted">
            Dosya adı
            <span className="flex h-8.5 items-center rounded-lg border border-line bg-raised px-2.5 focus-within:border-accent">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                spellCheck={false}
                className="w-full min-w-0 bg-transparent text-[13px] text-ink outline-none"
              />
              <span className="text-faint">.{format === 'jpeg' ? 'jpg' : 'png'}</span>
            </span>
          </label>

          <p className="text-[11px] leading-relaxed text-faint">
            Çıktı tam olarak tuval sınırlarından kesilir; tuvalin dışına taşan kısımlar görsele dahil edilmez.
          </p>
        </div>
      </div>
    </Modal>
  )
}
