import type { DragEvent } from 'react'
import { DRAG_MIME, type DragPayload } from '../../actions'
import { useEditor } from '../../editor/EditorContext'
import { SHAPES } from '../../editor/shapes'
import type { ShapeKind } from '../../editor/types'

/** Tuvale eklenebilen temel şekiller. */
export function ShapesPanel() {
  const editor = useEditor()

  const onDragStart = (kind: ShapeKind) => (e: DragEvent) => {
    const payload: DragPayload = { type: 'shape', kind }
    e.dataTransfer.setData(DRAG_MIME, JSON.stringify(payload))
    e.dataTransfer.effectAllowed = 'copy'
  }

  return (
    <div className="p-3.5">
      <div className="grid grid-cols-3 gap-1.5">
        {SHAPES.map((shape) => (
          <button
            key={shape.kind}
            type="button"
            draggable
            onDragStart={onDragStart(shape.kind)}
            onClick={() => editor.addShape(shape.kind)}
            className="group flex aspect-square flex-col items-center justify-center gap-1.5 rounded-lg border border-line bg-raised text-muted transition-colors hover:border-accent hover:text-accent"
          >
            <svg viewBox="0 0 24 24" className="size-8" aria-hidden="true">
              <path
                d={shape.icon}
                fill={shape.strokeOnly ? 'none' : 'currentColor'}
                stroke={shape.strokeOnly ? 'currentColor' : 'none'}
                strokeWidth={shape.strokeOnly ? 2.5 : 0}
                strokeLinecap="round"
              />
            </svg>
            <span className="text-[10.5px] text-faint group-hover:text-muted">{shape.label}</span>
          </button>
        ))}
      </div>
      <p className="mt-3.5 text-[11px] leading-relaxed text-faint">
        Şekli tıklayarak ortaya ekleyin veya tuvalde istediğiniz yere sürükleyin. Renk, kenarlık ve köşe
        yuvarlaklığını sağdaki panelden ayarlayabilirsiniz.
      </p>
    </div>
  )
}
