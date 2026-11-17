import { useEffect, useState } from 'react'
import { LeftSidebar } from './components/left/LeftSidebar'
import { CropModal } from './components/modals/CropModal'
import { ExportModal } from './components/modals/ExportModal'
import { PropertiesPanel } from './components/right/PropertiesPanel'
import { TopBar } from './components/TopBar'
import { Toaster } from './components/ui/Feedback'
import { Workspace } from './components/Workspace'
import type { Editor } from './editor/Editor'
import { EditorContext } from './editor/EditorContext'
import { useHotkeys } from './hooks/useHotkeys'
import { useEditorStore } from './store/editorStore'

export default function App() {
  const [editor, setEditor] = useState<Editor | null>(null)
  const cropTarget = useEditorStore((s) => s.cropTarget)
  const openCrop = useEditorStore((s) => s.openCrop)
  const exportOpen = useEditorStore((s) => s.exportOpen)
  const setExportOpen = useEditorStore((s) => s.setExportOpen)
  const hasChanges = useEditorStore((s) => s.canUndo)

  useHotkeys(editor)

  // Kaydedilmemiş değişiklik varken sekmenin yanlışlıkla kapatılmasını önle
  useEffect(() => {
    if (!hasChanges) return
    const onBeforeUnload = (e: BeforeUnloadEvent) => e.preventDefault()
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [hasChanges])

  return (
    <EditorContext.Provider value={editor}>
      <div className="flex h-full flex-col">
        <TopBar />
        <div className="relative flex min-h-0 flex-1">
          <LeftSidebar />
          <Workspace onEditor={setEditor} />
          <PropertiesPanel />
        </div>
      </div>
      {editor && cropTarget && <CropModal image={cropTarget} onClose={() => openCrop(null)} />}
      {editor && exportOpen && <ExportModal onClose={() => setExportOpen(false)} />}
      <Toaster />
    </EditorContext.Provider>
  )
}
