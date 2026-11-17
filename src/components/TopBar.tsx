import { Download, FilePlus2, FolderOpen, Redo2, Save, Undo2 } from 'lucide-react'
import { useRef } from 'react'
import { openProjectFile, saveProjectFile } from '../actions'
import { useEditorOrNull } from '../editor/EditorContext'
import { formatAspectRatio } from '../editor/utils'
import { useEditorStore } from '../store/editorStore'
import { Button, IconButton } from './ui/Button'

/** Uygulamanın üst çubuğu: proje işlemleri, geri al/ileri al ve dışa aktarma. */
export function TopBar() {
  const editor = useEditorOrNull()
  const canUndo = useEditorStore((s) => s.canUndo)
  const canRedo = useEditorStore((s) => s.canRedo)
  const doc = useEditorStore((s) => s.doc)
  const hasContent = useEditorStore((s) => s.layers.length > 0)
  const setLeftTab = useEditorStore((s) => s.setLeftTab)
  const setExportOpen = useEditorStore((s) => s.setExportOpen)
  const fileInput = useRef<HTMLInputElement>(null)

  const confirmDiscard = (question: string) => !hasContent || window.confirm(question)

  return (
    <header className="flex h-13 shrink-0 items-center gap-2 border-b border-line bg-panel px-3">
      <div className="mr-2 flex items-center gap-2.5">
        <img src="/favicon.svg" alt="" className="size-7 rounded-lg" />
        <span className="text-sm font-semibold tracking-tight max-lg:hidden">Kapak Stüdyo</span>
      </div>

      <div className="flex items-center gap-0.5">
        <IconButton
          label="Yeni proje"
          disabled={!editor}
          onClick={() => {
            if (editor && confirmDiscard('Geçerli tasarım silinecek. Yeni bir projeye başlansın mı?')) {
              void editor.reset()
            }
          }}
        >
          <FilePlus2 size={16} />
        </IconButton>
        <IconButton
          label="Proje aç (.json)"
          disabled={!editor}
          onClick={() => fileInput.current?.click()}
        >
          <FolderOpen size={16} />
        </IconButton>
        <IconButton
          label="Projeyi kaydet (Ctrl S)"
          disabled={!editor}
          onClick={() => editor && void saveProjectFile(editor)}
        >
          <Save size={16} />
        </IconButton>
        <input
          ref={fileInput}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            e.target.value = ''
            if (
              file &&
              editor &&
              confirmDiscard('Geçerli tasarımın yerine seçilen proje yüklenecek. Devam edilsin mi?')
            ) {
              void openProjectFile(editor, file)
            }
          }}
        />
      </div>

      <span className="mx-1 h-5 w-px bg-line" />

      <div className="flex items-center gap-0.5">
        <IconButton label="Geri al (Ctrl Z)" disabled={!canUndo} onClick={() => void editor?.undo()}>
          <Undo2 size={16} />
        </IconButton>
        <IconButton label="İleri al (Ctrl Shift Z)" disabled={!canRedo} onClick={() => void editor?.redo()}>
          <Redo2 size={16} />
        </IconButton>
      </div>

      <div className="flex min-w-0 flex-1 justify-center">
        <button
          type="button"
          title="Tuval boyutunu değiştir"
          onClick={() => setLeftTab('size')}
          className="flex h-8 min-w-0 items-center gap-2 rounded-lg px-3 text-xs text-muted hover:bg-hover hover:text-ink"
        >
          <span className="truncate font-medium text-ink tabular-nums">
            {doc.width} × {doc.height} px
          </span>
          <span className="rounded bg-raised px-1.5 py-0.5 text-[10px] font-medium tabular-nums max-sm:hidden">
            {formatAspectRatio(doc.width, doc.height)}
          </span>
        </button>
      </div>

      <Button
        variant="primary"
        icon={<Download size={15} />}
        disabled={!editor}
        onClick={() => setExportOpen(true)}
      >
        Dışa Aktar
      </Button>
    </header>
  )
}
