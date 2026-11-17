import { Trash2, Upload } from 'lucide-react'
import { useRef, type DragEvent } from 'react'
import { DRAG_MIME, importImages, type DragPayload } from '../../actions'
import { useEditor } from '../../editor/EditorContext'
import { toast, useEditorStore, type UploadItem } from '../../store/editorStore'
import { Button } from '../ui/Button'

/** Görsel yükleme ve bu oturumda yüklenen görsellerin galerisi. */
export function ImagesPanel() {
  const editor = useEditor()
  const uploads = useEditorStore((s) => s.uploads)
  const removeUpload = useEditorStore((s) => s.removeUpload)
  const input = useRef<HTMLInputElement>(null)

  const onDragStart = (item: UploadItem) => (e: DragEvent) => {
    const payload: DragPayload = { type: 'upload', id: item.id }
    e.dataTransfer.setData(DRAG_MIME, JSON.stringify(payload))
    e.dataTransfer.effectAllowed = 'copy'
  }

  return (
    <div className="flex flex-col gap-3.5 p-3.5">
      <Button variant="primary" block icon={<Upload size={15} />} onClick={() => input.current?.click()}>
        Görsel yükle
      </Button>
      <input
        ref={input}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif,image/avif,image/svg+xml"
        multiple
        className="hidden"
        onChange={(e) => {
          const files = [...(e.target.files ?? [])]
          e.target.value = ''
          if (files.length) void importImages(editor, files)
        }}
      />
      <p className="-mt-1 text-[11px] leading-relaxed text-faint">
        PNG, JPG, WebP, SVG… Dosyaları doğrudan tuvale sürükleyebilir veya panodan yapıştırabilirsiniz (Ctrl V).
      </p>

      {uploads.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-line px-4 py-8 text-center">
          <Upload size={22} className="text-faint" />
          <p className="text-xs text-muted">Henüz görsel yüklenmedi</p>
        </div>
      ) : (
        <div>
          <h3 className="mb-2 text-[11px] font-semibold tracking-wider text-muted uppercase">Yüklenenler</h3>
          <div className="grid grid-cols-2 gap-1.5">
            {uploads.map((item) => (
              <div key={item.id} className="group relative">
                <button
                  type="button"
                  draggable
                  title={`${item.name} · ${item.width} × ${item.height}`}
                  onDragStart={onDragStart(item)}
                  onClick={() =>
                    editor
                      .addImageFromUrl(item.url, item.name)
                      .catch(() => toast('Görsel eklenemedi.', 'error'))
                  }
                  className="checker block aspect-square w-full overflow-hidden rounded-lg border border-line transition-colors hover:border-accent"
                >
                  <img src={item.url} alt={item.name} draggable={false} className="size-full object-cover" />
                </button>
                <button
                  type="button"
                  aria-label={`${item.name} görselini listeden kaldır`}
                  title="Listeden kaldır"
                  onClick={() => removeUpload(item.id)}
                  className="absolute top-1 right-1 flex size-6 items-center justify-center rounded-md bg-black/70 text-white opacity-0 transition-opacity group-hover:opacity-100 hover:bg-danger focus-visible:opacity-100"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
