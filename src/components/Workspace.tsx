import { ImagePlus, Maximize, Minus, Plus } from 'lucide-react'
import { useEffect, useRef, useState, type DragEvent } from 'react'
import { DRAG_MIME, importImages, seedStarterDesign, type DragPayload } from '../actions'
import { Editor } from '../editor/Editor'
import { bindEditorToStore } from '../editor/bindStore'
import { useEditorOrNull } from '../editor/EditorContext'
import { TEXT_PRESETS, TEXT_STYLE_PRESETS } from '../editor/text'
import type { ShapeKind } from '../editor/types'
import { toast, useEditorStore } from '../store/editorStore'
import { BusyIndicator } from './ui/Feedback'

interface WorkspaceProps {
  onEditor: (editor: Editor | null) => void
}

/** Fabric tuvalini barındıran çalışma alanı; dosya ve öğe bırakmayı karşılar. */
export function Workspace({ onEditor }: WorkspaceProps) {
  const host = useRef<HTMLDivElement>(null)
  const editor = useEditorOrNull()
  const [dropping, setDropping] = useState(false)
  const dragDepth = useRef(0)

  useEffect(() => {
    if (!host.current) return
    let cancelled = false
    const instance = new Editor(host.current)
    const unbind = bindEditorToStore(instance)
    onEditor(instance)
    // Geliştirme sırasında konsoldan erişim için
    if (import.meta.env.DEV) (window as unknown as { __editor?: Editor }).__editor = instance
    void seedStarterDesign(instance, () => cancelled)
    return () => {
      cancelled = true
      onEditor(null)
      unbind()
      instance.dispose()
    }
  }, [onEditor])

  const accepts = (e: DragEvent) =>
    e.dataTransfer.types.includes('Files') || e.dataTransfer.types.includes(DRAG_MIME)

  const onDrop = async (e: DragEvent) => {
    e.preventDefault()
    dragDepth.current = 0
    setDropping(false)
    if (!editor) return
    const at = editor.clientToScene(e.clientX, e.clientY)
    const raw = e.dataTransfer.getData(DRAG_MIME)
    if (raw) {
      try {
        const payload = JSON.parse(raw) as DragPayload
        if (payload.type === 'shape') {
          editor.addShape(payload.kind as ShapeKind, at)
        } else if (payload.type === 'text') {
          const preset = [...TEXT_PRESETS, ...TEXT_STYLE_PRESETS].find((p) => p.id === payload.preset)
          if (preset) await editor.addText(preset, at)
        } else if (payload.type === 'upload') {
          const upload = useEditorStore.getState().uploads.find((u) => u.id === payload.id)
          if (upload) await editor.addImageFromUrl(upload.url, upload.name, at)
        }
      } catch {
        toast('Öğe tuvale eklenemedi.', 'error')
      }
      return
    }
    const files = [...e.dataTransfer.files]
    if (files.length) await importImages(editor, files, at)
  }

  return (
    <main
      className="workspace-surface relative min-w-0 flex-1 overflow-hidden"
      onDragEnter={(e) => {
        if (!accepts(e)) return
        dragDepth.current++
        setDropping(true)
      }}
      onDragOver={(e) => {
        if (!accepts(e)) return
        e.preventDefault()
        e.dataTransfer.dropEffect = 'copy'
      }}
      onDragLeave={() => {
        dragDepth.current = Math.max(0, dragDepth.current - 1)
        if (dragDepth.current === 0) setDropping(false)
      }}
      onDrop={onDrop}
    >
      <div ref={host} className="absolute inset-0" />
      <BusyIndicator />
      <ZoomBar />
      {dropping && (
        <div className="pointer-events-none absolute inset-3 z-20 flex items-center justify-center rounded-2xl border-2 border-dashed border-accent bg-accent/10">
          <div className="flex items-center gap-2 rounded-xl bg-panel px-4 py-2.5 text-sm font-medium shadow-pop">
            <ImagePlus size={18} className="text-accent" />
            Tuvale eklemek için bırakın
          </div>
        </div>
      )}
    </main>
  )
}

function ZoomBar() {
  const editor = useEditorOrNull()
  const zoom = useEditorStore((s) => s.zoom)
  const [hint, setHint] = useState(false)
  if (!editor) return null
  const button =
    'flex size-7.5 items-center justify-center rounded-md text-muted transition-colors hover:bg-hover hover:text-ink'
  return (
    <div className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 flex-col items-center gap-2">
      {hint && (
        <div className="animate-pop rounded-lg border border-line bg-raised px-3 py-2 text-[11px] leading-relaxed text-muted shadow-pop">
          <b className="text-ink">Ctrl/⌘ + tekerlek</b> yakınlaştırır · <b className="text-ink">Boşluk + sürükle</b>{' '}
          gezdirir · <b className="text-ink">Shift + kenar tutamacı</b> eğer
        </div>
      )}
      <div
        className="flex items-center gap-0.5 rounded-xl border border-line bg-panel/95 p-1 shadow-pop backdrop-blur"
        onMouseEnter={() => setHint(true)}
        onMouseLeave={() => setHint(false)}
      >
        <button type="button" className={button} title="Uzaklaştır (Ctrl −)" aria-label="Uzaklaştır" onClick={() => editor.zoomBy(1 / 1.25)}>
          <Minus size={15} />
        </button>
        <button
          type="button"
          title="%100 (Ctrl 1)"
          onClick={() => editor.zoomTo(1)}
          className="h-7.5 w-14 rounded-md text-xs font-medium text-ink tabular-nums hover:bg-hover"
        >
          %{Math.round(zoom * 100)}
        </button>
        <button type="button" className={button} title="Yakınlaştır (Ctrl +)" aria-label="Yakınlaştır" onClick={() => editor.zoomBy(1.25)}>
          <Plus size={15} />
        </button>
        <span className="mx-0.5 h-4 w-px bg-line" />
        <button type="button" className={button} title="Ekrana sığdır (Ctrl 0)" aria-label="Ekrana sığdır" onClick={() => editor.fit()}>
          <Maximize size={14} />
        </button>
      </div>
    </div>
  )
}
