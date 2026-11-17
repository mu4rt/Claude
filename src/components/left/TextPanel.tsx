import { Plus } from 'lucide-react'
import { useEffect, type DragEvent } from 'react'
import { DRAG_MIME, type DragPayload } from '../../actions'
import { useEditor } from '../../editor/EditorContext'
import { ensureFont } from '../../editor/fonts'
import { TEXT_PRESETS, TEXT_STYLE_PRESETS, type TextPreset } from '../../editor/text'
import { toast } from '../../store/editorStore'
import { Button } from '../ui/Button'

const dragPreset = (preset: TextPreset) => (e: DragEvent) => {
  const payload: DragPayload = { type: 'text', preset: preset.id }
  e.dataTransfer.setData(DRAG_MIME, JSON.stringify(payload))
  e.dataTransfer.effectAllowed = 'copy'
}

/** Metin ekleme araçları: temel metin türleri ve hazır stiller. */
export function TextPanel() {
  const editor = useEditor()

  // Önizleme kutucuklarının kendi yazı tipleriyle görünmesi için
  useEffect(() => {
    for (const preset of [...TEXT_PRESETS, ...TEXT_STYLE_PRESETS]) {
      void ensureFont(String(preset.props.fontFamily), {
        weight: Number(preset.props.fontWeight ?? 400),
        text: preset.text,
      })
    }
  }, [])

  const add = (preset: TextPreset) => {
    editor.addText(preset).catch(() => toast('Metin eklenemedi.', 'error'))
  }

  return (
    <div className="flex flex-col gap-4 p-3.5">
      <Button variant="primary" block icon={<Plus size={15} />} onClick={() => add(TEXT_PRESETS[2])}>
        Metin kutusu ekle
      </Button>

      <div>
        <h3 className="mb-2 text-[11px] font-semibold tracking-wider text-muted uppercase">Temel</h3>
        <div className="flex flex-col gap-1.5">
          {TEXT_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              draggable
              onDragStart={dragPreset(preset)}
              onClick={() => add(preset)}
              className="flex h-13 items-center rounded-lg border border-line bg-raised px-3 text-left text-ink transition-colors hover:border-accent hover:bg-hover"
            >
              <span className="truncate" style={preset.preview}>
                {preset.text}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="mb-2 text-[11px] font-semibold tracking-wider text-muted uppercase">Hazır stiller</h3>
        <div className="grid grid-cols-2 gap-1.5">
          {TEXT_STYLE_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              draggable
              title={preset.label}
              onDragStart={dragPreset(preset)}
              onClick={() => add(preset)}
              className="group flex h-20 flex-col items-center justify-center gap-1 overflow-hidden rounded-lg border border-line bg-[#20232c] px-2 transition-colors hover:border-accent"
            >
              <span className="max-w-full truncate leading-tight text-white" style={preset.preview}>
                {preset.text}
              </span>
              <span className="text-[10px] text-faint group-hover:text-muted">{preset.label}</span>
            </button>
          ))}
        </div>
      </div>

      <p className="text-[11px] leading-relaxed text-faint">
        Öğeleri tıklayarak ekleyin veya tuvale sürükleyin. Metni düzenlemek için tuvalde çift tıklayın.
      </p>
    </div>
  )
}
