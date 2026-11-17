import { Image, Layers, Palette, Ratio, Shapes, Type, X } from 'lucide-react'
import type { ComponentType } from 'react'
import { useEditorOrNull } from '../../editor/EditorContext'
import { useEditorStore, type LeftTab } from '../../store/editorStore'
import { cn } from '../ui/cn'
import { BackgroundPanel } from './BackgroundPanel'
import { ImagesPanel } from './ImagesPanel'
import { LayersPanel } from './LayersPanel'
import { ShapesPanel } from './ShapesPanel'
import { SizePanel } from './SizePanel'
import { TextPanel } from './TextPanel'

const TABS: { id: LeftTab; label: string; icon: ComponentType<{ size?: number }>; panel: ComponentType }[] = [
  { id: 'size', label: 'Boyut', icon: Ratio, panel: SizePanel },
  { id: 'text', label: 'Metin', icon: Type, panel: TextPanel },
  { id: 'images', label: 'Görsel', icon: Image, panel: ImagesPanel },
  { id: 'shapes', label: 'Şekil', icon: Shapes, panel: ShapesPanel },
  { id: 'background', label: 'Arka Plan', icon: Palette, panel: BackgroundPanel },
  { id: 'layers', label: 'Katman', icon: Layers, panel: LayersPanel },
]

/** Sol araç rayı ve seçili aracın paneli. */
export function LeftSidebar() {
  const editor = useEditorOrNull()
  const active = useEditorStore((s) => s.leftTab)
  const setActive = useEditorStore((s) => s.setLeftTab)
  const current = TABS.find((tab) => tab.id === active)
  const Panel = current?.panel

  return (
    <aside className="flex shrink-0 border-r border-line bg-panel">
      <nav aria-label="Araçlar" className="flex w-17 flex-col items-center gap-1 border-r border-line py-2">
        {TABS.map(({ id, label, icon: Icon }) => {
          const selected = id === active
          return (
            <button
              key={id}
              type="button"
              aria-pressed={selected}
              onClick={() => setActive(selected ? null : id)}
              className={cn(
                'flex w-14.5 flex-col items-center gap-1 rounded-lg py-2 text-[10.5px] font-medium transition-colors',
                selected ? 'bg-accent-soft text-accent' : 'text-muted hover:bg-hover hover:text-ink',
              )}
            >
              <Icon size={19} />
              {label}
            </button>
          )
        })}
      </nav>

      {current && Panel && (
        <div className="flex w-68 flex-col max-md:absolute max-md:top-13 max-md:bottom-0 max-md:left-17 max-md:z-20 max-md:border-r max-md:border-line max-md:bg-panel max-md:shadow-pop">
          <header className="flex h-11 shrink-0 items-center justify-between border-b border-line pr-2 pl-3.5">
            <h2 className="text-[13px] font-semibold">{PANEL_TITLES[current.id]}</h2>
            <button
              type="button"
              aria-label="Paneli kapat"
              title="Paneli kapat"
              onClick={() => setActive(null)}
              className="flex size-7 items-center justify-center rounded-md text-faint hover:bg-hover hover:text-ink"
            >
              <X size={15} />
            </button>
          </header>
          <div className="min-h-0 flex-1 overflow-y-auto">{editor ? <Panel /> : null}</div>
        </div>
      )}
    </aside>
  )
}

const PANEL_TITLES: Record<LeftTab, string> = {
  size: 'Tuval Boyutu',
  text: 'Metin Ekle',
  images: 'Görseller',
  shapes: 'Şekiller',
  background: 'Arka Plan',
  layers: 'Katmanlar',
}
