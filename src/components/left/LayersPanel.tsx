import {
  ChevronDown,
  ChevronUp,
  ChevronsDown,
  ChevronsUp,
  Eye,
  EyeOff,
  GripVertical,
  Image,
  Layers,
  Lock,
  LockOpen,
  Shapes,
  Trash2,
  Type,
} from 'lucide-react'
import { useState, type DragEvent } from 'react'
import { useEditor } from '../../editor/EditorContext'
import type { LayerInfo, ObjectKind } from '../../editor/types'
import { useEditorStore } from '../../store/editorStore'
import { IconButton } from '../ui/Button'
import { cn } from '../ui/cn'

const KIND_ICON: Record<ObjectKind, typeof Type> = { text: Type, image: Image, shape: Shapes }

/** Katman listesi: sıralama (sürükle-bırak), kilitleme, gizleme, yeniden adlandırma, silme. */
export function LayersPanel() {
  const editor = useEditor()
  const layers = useEditorStore((s) => s.layers)
  const selection = useEditorStore((s) => s.selection)
  const selectedIds = new Set(selection.map((o) => o.id))
  const [dragId, setDragId] = useState<string | null>(null)
  /** Bırakma konumu: listede araya girilecek sıra (0…n) */
  const [dropIndex, setDropIndex] = useState<number | null>(null)
  const [renaming, setRenaming] = useState<string | null>(null)
  const hasSelection = selection.length > 0

  const onDragOver = (index: number) => (e: DragEvent) => {
    if (!dragId) return
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    const rect = e.currentTarget.getBoundingClientRect()
    setDropIndex(e.clientY < rect.top + rect.height / 2 ? index : index + 1)
  }

  const onDrop = (e: DragEvent) => {
    e.preventDefault()
    if (dragId !== null && dropIndex !== null) {
      const from = layers.findIndex((l) => l.id === dragId)
      const to = dropIndex > from ? dropIndex - 1 : dropIndex
      if (from !== -1 && to !== from) editor.moveLayer(dragId, to)
    }
    setDragId(null)
    setDropIndex(null)
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex shrink-0 items-center justify-between border-b border-line px-2.5 py-1.5">
        <span className="pl-1 text-[11px] text-faint">{layers.length} katman</span>
        <div className="flex items-center">
          <IconButton size="sm" label="En öne getir" disabled={!hasSelection} onClick={() => editor.arrange('front')}>
            <ChevronsUp size={15} />
          </IconButton>
          <IconButton size="sm" label="Bir öne al" disabled={!hasSelection} onClick={() => editor.arrange('forward')}>
            <ChevronUp size={15} />
          </IconButton>
          <IconButton size="sm" label="Bir arkaya at" disabled={!hasSelection} onClick={() => editor.arrange('backward')}>
            <ChevronDown size={15} />
          </IconButton>
          <IconButton size="sm" label="En arkaya gönder" disabled={!hasSelection} onClick={() => editor.arrange('back')}>
            <ChevronsDown size={15} />
          </IconButton>
        </div>
      </div>

      {layers.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 px-6 text-center">
          <Layers size={24} className="text-faint" />
          <p className="text-xs text-muted">Tuval boş</p>
          <p className="text-[11px] text-faint">Metin, görsel veya şekil eklediğinizde katmanlar burada listelenir.</p>
        </div>
      ) : (
        <ul
          className="min-h-0 flex-1 overflow-y-auto p-1.5"
          onDrop={onDrop}
          onDragOver={(e) => dragId && e.preventDefault()}
          onDragLeave={(e) => {
            if (!e.currentTarget.contains(e.relatedTarget as Node)) setDropIndex(null)
          }}
        >
          {layers.map((layer, index) => (
            <LayerRow
              key={layer.id}
              layer={layer}
              selected={selectedIds.has(layer.id)}
              dragging={dragId === layer.id}
              indicator={dropIndex === index ? 'top' : dropIndex === index + 1 && index === layers.length - 1 ? 'bottom' : null}
              renaming={renaming === layer.id}
              onRename={(editing) => setRenaming(editing ? layer.id : null)}
              onDragStart={(e) => {
                e.dataTransfer.effectAllowed = 'move'
                e.dataTransfer.setData('text/plain', layer.name)
                setDragId(layer.id)
              }}
              onDragEnd={() => {
                setDragId(null)
                setDropIndex(null)
              }}
              onDragOver={onDragOver(index)}
            />
          ))}
        </ul>
      )}
      <p className="shrink-0 border-t border-line px-3.5 py-2 text-[11px] leading-relaxed text-faint">
        Sıralamak için sürükleyin · Yeniden adlandırmak için çift tıklayın
      </p>
    </div>
  )
}

interface LayerRowProps {
  layer: LayerInfo
  selected: boolean
  dragging: boolean
  indicator: 'top' | 'bottom' | null
  renaming: boolean
  onRename: (editing: boolean) => void
  onDragStart: (e: DragEvent) => void
  onDragEnd: () => void
  onDragOver: (e: DragEvent) => void
}

function LayerRow({
  layer,
  selected,
  dragging,
  indicator,
  renaming,
  onRename,
  onDragStart,
  onDragEnd,
  onDragOver,
}: LayerRowProps) {
  const editor = useEditor()
  const Icon = KIND_ICON[layer.kind]

  return (
    <li
      draggable={!renaming}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragOver={onDragOver}
      className={cn(
        'group relative flex h-9.5 items-center gap-1 rounded-lg pr-1 pl-0.5 transition-colors',
        selected ? 'bg-accent-soft' : 'hover:bg-hover',
        dragging && 'opacity-40',
        !layer.visible && 'text-faint',
      )}
    >
      {indicator && (
        <span
          className={cn(
            'pointer-events-none absolute right-1 left-1 h-0.5 rounded-full bg-accent',
            indicator === 'top' ? '-top-px' : '-bottom-px',
          )}
        />
      )}
      <GripVertical size={13} className="shrink-0 cursor-grab text-faint opacity-0 group-hover:opacity-100" />
      <button
        type="button"
        onClick={(e) => editor.selectLayer(layer.id, e.shiftKey || e.ctrlKey || e.metaKey)}
        onDoubleClick={() => onRename(true)}
        className="flex h-full min-w-0 flex-1 items-center gap-2 text-left"
      >
        <span
          className={cn(
            'flex size-6 shrink-0 items-center justify-center rounded-md',
            selected ? 'bg-accent text-white' : 'bg-raised text-muted',
          )}
        >
          <Icon size={13} />
        </span>
        {renaming ? (
          <input
            autoFocus
            defaultValue={layer.name}
            aria-label="Katman adı"
            onClick={(e) => e.stopPropagation()}
            onFocus={(e) => e.currentTarget.select()}
            onBlur={(e) => {
              editor.renameLayer(layer.id, e.currentTarget.value)
              onRename(false)
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') e.currentTarget.blur()
              if (e.key === 'Escape') {
                e.currentTarget.value = layer.name
                e.currentTarget.blur()
              }
            }}
            className="h-6.5 w-full min-w-0 rounded border border-accent bg-base px-1.5 text-xs text-ink outline-none"
          />
        ) : (
          <span className={cn('truncate text-xs', layer.visible ? 'text-ink' : 'text-faint line-through')}>
            {layer.name}
          </span>
        )}
      </button>
      {!renaming && (
        <div className="flex shrink-0 items-center">
          <IconButton
            size="sm"
            label={layer.locked ? 'Kilidi aç' : 'Kilitle'}
            active={layer.locked}
            className={cn(!layer.locked && 'opacity-0 group-hover:opacity-100 focus-visible:opacity-100')}
            onClick={() => editor.setLayerLocked(layer.id, !layer.locked)}
          >
            {layer.locked ? <Lock size={13} /> : <LockOpen size={13} />}
          </IconButton>
          <IconButton
            size="sm"
            label={layer.visible ? 'Gizle' : 'Göster'}
            className={cn(layer.visible && 'opacity-0 group-hover:opacity-100 focus-visible:opacity-100')}
            onClick={() => editor.setLayerVisible(layer.id, !layer.visible)}
          >
            {layer.visible ? <Eye size={13} /> : <EyeOff size={13} />}
          </IconButton>
          <IconButton
            size="sm"
            label="Katmanı sil"
            className="opacity-0 group-hover:opacity-100 hover:text-danger focus-visible:opacity-100"
            onClick={() => editor.removeLayer(layer.id)}
          >
            <Trash2 size={13} />
          </IconButton>
        </div>
      )}
    </li>
  )
}
