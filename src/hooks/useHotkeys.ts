import { useEffect } from 'react'
import { importImages, saveProjectFile } from '../actions'
import type { Editor } from '../editor/Editor'
import { isTypingTarget } from '../editor/utils'
import { useEditorStore } from '../store/editorStore'

/** Klavye kısayolları ve pano (kopyala/kes/yapıştır) işlemleri. */
export function useHotkeys(editor: Editor | null) {
  useEffect(() => {
    if (!editor) return

    const blocked = (e: Event) => {
      const state = useEditorStore.getState()
      return isTypingTarget(e.target) || !!state.cropTarget || state.exportOpen
    }

    const onKeyDown = (e: KeyboardEvent) => {
      if (blocked(e)) return
      const mod = e.ctrlKey || e.metaKey
      const key = e.key.toLowerCase()
      const handled = () => e.preventDefault()

      if (mod) {
        switch (key) {
          case 'z':
            handled()
            void (e.shiftKey ? editor.redo() : editor.undo())
            return
          case 'y':
            handled()
            void editor.redo()
            return
          case 'd':
            handled()
            void editor.duplicate()
            return
          case 'a':
            handled()
            editor.selectAll()
            return
          case 's':
            handled()
            void saveProjectFile(editor)
            return
          case 'e':
            handled()
            useEditorStore.getState().setExportOpen(true)
            return
          case '0':
            handled()
            editor.fit()
            return
          case '1':
            handled()
            editor.zoomTo(1)
            return
          case '=':
          case '+':
            handled()
            editor.zoomBy(1.2)
            return
          case '-':
            handled()
            editor.zoomBy(1 / 1.2)
            return
          case ']':
            handled()
            editor.arrange(e.shiftKey ? 'front' : 'forward')
            return
          case '[':
            handled()
            editor.arrange(e.shiftKey ? 'back' : 'backward')
            return
        }
        return
      }

      const step = e.shiftKey ? 10 : 1
      switch (key) {
        case 'delete':
        case 'backspace':
          handled()
          editor.deleteSelection()
          break
        case 'escape':
          editor.deselect()
          break
        case 'arrowleft':
          handled()
          editor.nudge(-step, 0)
          break
        case 'arrowright':
          handled()
          editor.nudge(step, 0)
          break
        case 'arrowup':
          handled()
          editor.nudge(0, -step)
          break
        case 'arrowdown':
          handled()
          editor.nudge(0, step)
          break
      }
    }

    // Kopyalarken sistem panosuna bir işaret yazılır; böylece panoda eski bir
    // görsel kalmış olsa bile sonraki yapıştırma editör içi kopyayı kullanır.
    const onCopy = (e: ClipboardEvent) => {
      if (blocked(e) || !editor.getSelection().length) return
      e.preventDefault()
      e.clipboardData?.setData('text/plain', '')
      void (e.type === 'cut' ? editor.cut() : editor.copy())
    }

    const onPaste = (e: ClipboardEvent) => {
      if (blocked(e)) return
      const images = [...(e.clipboardData?.files ?? [])].filter((f) => f.type.startsWith('image/'))
      e.preventDefault()
      if (images.length) void importImages(editor, images)
      else void editor.paste()
    }

    window.addEventListener('keydown', onKeyDown)
    document.addEventListener('copy', onCopy)
    document.addEventListener('cut', onCopy)
    document.addEventListener('paste', onPaste)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      document.removeEventListener('copy', onCopy)
      document.removeEventListener('cut', onCopy)
      document.removeEventListener('paste', onPaste)
    }
  }, [editor])
}
