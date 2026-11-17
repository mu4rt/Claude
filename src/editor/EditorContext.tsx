import { createContext, useContext } from 'react'
import { useEditorStore } from '../store/editorStore'
import type { Editor } from './Editor'

export const EditorContext = createContext<Editor | null>(null)

/** Editör örneği (tuval henüz bağlanmadıysa null). */
export const useEditorOrNull = () => useContext(EditorContext)

/** Editör örneği. Yalnızca editör hazırken çizilen bileşenlerde kullanın. */
export function useEditor() {
  const editor = useContext(EditorContext)
  if (!editor) throw new Error('Editör henüz hazır değil')
  return editor
}

/**
 * Seçili nesneleri döndürür ve nesnelerin özellikleri değiştikçe bileşeni
 * yeniden çizer. Değerler doğrudan Fabric nesnesinden okunur; böylece tuval
 * tek doğruluk kaynağı olarak kalır.
 */
export function useSelection() {
  useEditorStore((s) => s.tick)
  return useEditorStore((s) => s.selection)
}
