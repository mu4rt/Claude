import { useEditorStore } from '../store/editorStore'
import type { Editor } from './Editor'

/** Editör olaylarını arayüz durumuna (zustand) aktarır. */
export function bindEditorToStore(editor: Editor) {
  const set = useEditorStore.setState
  const bump = () => set((s) => ({ tick: s.tick + 1 }))

  const syncDoc = () => set({ doc: { ...editor.doc }, background: editor.background })
  const syncLayers = () => set({ layers: editor.getLayers() })

  const offs = [
    editor.on('selection', (selection) => set((s) => ({ selection: [...selection], tick: s.tick + 1 }))),
    editor.on('change', bump),
    editor.on('layers', syncLayers),
    editor.on('history', ({ canUndo, canRedo }) => {
      set({ canUndo, canRedo })
      // Geçmişe işlenen her değişiklik katman listesini de etkileyebilir (ad, görünürlük…)
      syncLayers()
    }),
    editor.on('zoom', (zoom) => set({ zoom })),
    editor.on('doc', syncDoc),
  ]

  set({
    ready: true,
    selection: editor.getSelection(),
    layers: editor.getLayers(),
    zoom: editor.zoom,
    canUndo: editor.history.canUndo,
    canRedo: editor.history.canRedo,
    doc: { ...editor.doc },
    background: editor.background,
  })

  return () => {
    offs.forEach((off) => off())
    set({ ready: false, selection: [], layers: [], cropTarget: null })
  }
}
