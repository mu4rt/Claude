import { Copy, Image, Keyboard, Lock, LockOpen, MousePointer2, Shapes, Trash2, Type } from 'lucide-react'
import { isImage, isText } from '../../editor/Editor'
import { useEditor, useEditorOrNull, useSelection } from '../../editor/EditorContext'
import { formatAspectRatio } from '../../editor/utils'
import { useEditorStore } from '../../store/editorStore'
import { Button, IconButton } from '../ui/Button'
import { Section } from '../ui/Section'
import { ArrangeSection, OpacitySection, ShadowSection, TransformSection } from './CommonSections'
import { ImageSection } from './ImageSection'
import { ShapeSection } from './ShapeSection'
import { TextSection } from './TextSection'

const KIND = {
  text: { label: 'Metin', icon: Type },
  image: { label: 'Görsel', icon: Image },
  shape: { label: 'Şekil', icon: Shapes },
}

/** Seçime göre içeriği değişen sağ özellik paneli. */
export function PropertiesPanel() {
  const editor = useEditorOrNull()
  return (
    <aside className="flex w-74 shrink-0 flex-col border-l border-line bg-panel max-lg:w-66 max-md:hidden">
      {editor ? <PanelBody /> : null}
    </aside>
  )
}

function PanelBody() {
  const editor = useEditor()
  const selection = useSelection()

  if (selection.length === 0) return <DocumentInfo />

  if (selection.length > 1) {
    const group = editor.getActive()
    return (
      <>
        <Header title={`${selection.length} nesne seçili`} subtitle="Çoklu seçim" icon={MousePointer2} />
        <div className="min-h-0 flex-1 overflow-y-auto">
          <ArrangeSection />
          {group && <TransformSection object={group} lockSize />}
          <OpacitySection object={selection[0]} />
        </div>
      </>
    )
  }

  const object = selection[0]
  const kind = KIND[object.kind ?? 'shape']

  if (object.locked) {
    return (
      <>
        <Header title={object.name ?? kind.label} subtitle={kind.label} icon={kind.icon} hideActions />
        <div className="flex flex-col items-center gap-3 px-6 py-10 text-center">
          <span className="flex size-11 items-center justify-center rounded-full bg-raised text-muted">
            <Lock size={18} />
          </span>
          <p className="text-[13px] text-ink">Bu katman kilitli</p>
          <p className="text-xs text-muted">Kilitli katmanlar tuvalde seçilemez, taşınamaz ve düzenlenemez.</p>
          <Button
            variant="primary"
            icon={<LockOpen size={14} />}
            onClick={() => object.id && editor.setLayerLocked(object.id, false)}
          >
            Kilidi aç
          </Button>
        </div>
      </>
    )
  }

  return (
    <>
      <Header title={object.name ?? kind.label} subtitle={kind.label} icon={kind.icon} />
      <div className="min-h-0 flex-1 overflow-y-auto">
        {isText(object) ? (
          <TextSection text={object} />
        ) : isImage(object) ? (
          <ImageSection image={object} />
        ) : (
          <ShapeSection shape={object} />
        )}
        <ShadowSection object={object} />
        <OpacitySection object={object} />
        <TransformSection object={object} lockSize={isText(object)} />
        <ArrangeSection />
      </div>
    </>
  )
}

interface HeaderProps {
  title: string
  subtitle: string
  icon: typeof Type
  hideActions?: boolean
}

function Header({ title, subtitle, icon: Icon, hideActions }: HeaderProps) {
  const editor = useEditor()
  const active = editor.getActive()
  return (
    <header className="flex h-13 shrink-0 items-center gap-2.5 border-b border-line pr-2 pl-3.5">
      <span className="flex size-7.5 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-accent">
        <Icon size={15} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-semibold">{title}</p>
        <p className="text-[11px] text-faint">{subtitle}</p>
      </div>
      {!hideActions && (
        <div className="flex items-center">
          {active?.id && (
            <IconButton label="Kilitle" onClick={() => editor.setLayerLocked(active.id!, true)}>
              <LockOpen size={15} />
            </IconButton>
          )}
          <IconButton label="Çoğalt (Ctrl D)" onClick={() => void editor.duplicate()}>
            <Copy size={15} />
          </IconButton>
          <IconButton label="Sil (Delete)" className="hover:text-danger" onClick={() => editor.deleteSelection()}>
            <Trash2 size={15} />
          </IconButton>
        </div>
      )}
    </header>
  )
}

const SHORTCUTS: [string, string][] = [
  ['Ctrl Z / Ctrl Shift Z', 'Geri al / İleri al'],
  ['Ctrl C · X · V · D', 'Kopyala · Kes · Yapıştır · Çoğalt'],
  ['Delete', 'Seçimi sil'],
  ['Ok tuşları (+Shift)', '1 px (10 px) kaydır'],
  ['Ctrl ] / Ctrl [', 'Öne al / Arkaya at'],
  ['Shift + sürükle', 'Çoklu seçim, orantıyı boz'],
  ['Shift + kenar tutamacı', 'Eğ (skew)'],
  ['Boşluk + sürükle', 'Tuvali gezdir'],
  ['Ctrl + tekerlek', 'Yakınlaştır'],
  ['Ctrl S / Ctrl E', 'Projeyi kaydet / Dışa aktar'],
]

/** Hiçbir şey seçili değilken gösterilen tuval özeti ve ipuçları. */
function DocumentInfo() {
  const doc = useEditorStore((s) => s.doc)
  const layerCount = useEditorStore((s) => s.layers.length)
  const setLeftTab = useEditorStore((s) => s.setLeftTab)
  return (
    <div className="min-h-0 flex-1 overflow-y-auto">
      <Section title="Tuval" collapsible={false}>
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-xs">
          <dt className="text-muted">Boyut</dt>
          <dd className="text-right tabular-nums">
            {doc.width} × {doc.height} px
          </dd>
          <dt className="text-muted">En-boy oranı</dt>
          <dd className="text-right tabular-nums">{formatAspectRatio(doc.width, doc.height)}</dd>
          <dt className="text-muted">Katman</dt>
          <dd className="text-right tabular-nums">{layerCount}</dd>
        </dl>
        <div className="grid grid-cols-2 gap-1.5">
          <Button size="sm" onClick={() => setLeftTab('size')}>
            Boyutu değiştir
          </Button>
          <Button size="sm" onClick={() => setLeftTab('background')}>
            Arka plan
          </Button>
        </div>
      </Section>

      <div className="flex flex-col items-center gap-2 border-b border-line px-6 py-7 text-center">
        <span className="flex size-10 items-center justify-center rounded-full bg-raised text-muted">
          <MousePointer2 size={17} />
        </span>
        <p className="text-[13px] text-ink">Bir nesne seçin</p>
        <p className="text-xs leading-relaxed text-muted">
          Renk, yazı tipi, filtre ve dönüşüm ayarları seçtiğiniz nesneye göre burada görünür.
        </p>
      </div>

      <Section title="Kısayollar" defaultOpen>
        <ul className="flex flex-col gap-1.5">
          {SHORTCUTS.map(([keys, label]) => (
            <li key={keys} className="flex items-baseline justify-between gap-3 text-[11px]">
              <span className="text-muted">{label}</span>
              <kbd className="shrink-0 rounded bg-raised px-1.5 py-0.5 font-sans text-[10px] text-faint">{keys}</kbd>
            </li>
          ))}
        </ul>
        <p className="flex items-center gap-1.5 text-[11px] text-faint">
          <Keyboard size={12} /> Mac'te Ctrl yerine ⌘ kullanın.
        </p>
      </Section>
    </div>
  )
}
