/**
 * Arayüz düzeyindeki eylemler: editör çekirdeğini, yapay zekâ araçlarını ve
 * arayüz durumunu (meşgul göstergesi, bildirimler) bir araya getirir.
 */
import { Point, type FabricImage } from 'fabric'
import { enhanceImage, removeImageBackground, upscaleImage } from './ai/tasks'
import type { Editor } from './editor/Editor'
import { GRADIENT_PRESETS } from './editor/constants'
import { exportImage } from './editor/exporter'
import { prepareImage } from './editor/images'
import { loadProject, serializeProject } from './editor/project'
import { TEXT_PRESETS } from './editor/text'
import type { ExportOptions } from './editor/types'
import { downloadBlob, safeFileName, uid } from './editor/utils'
import { toast, useEditorStore } from './store/editorStore'

const store = () => useEditorStore.getState()

const errorMessage = (error: unknown, fallback: string) =>
  error instanceof Error && error.message ? error.message : fallback

/** Sürükle-bırak ile sol panelden tuvale taşınan öğelerin MIME türü. */
export const DRAG_MIME = 'application/x-kapak-studyo'

export type DragPayload =
  | { type: 'shape'; kind: string }
  | { type: 'text'; preset: string }
  | { type: 'upload'; id: string }

const ACCEPTED_IMAGE = /^image\/(png|jpe?g|webp|gif|avif|svg\+xml|bmp)$/i

/** Görsel dosyalarını yüklemeler listesine ve tuvale ekler. */
export async function importImages(editor: Editor, files: Iterable<File>, at?: Point) {
  let offset = 0
  for (const file of files) {
    if (!ACCEPTED_IMAGE.test(file.type)) {
      toast(`"${file.name}" desteklenen bir görsel değil.`, 'error')
      continue
    }
    try {
      const loaded = await prepareImage(file, file.name)
      store().addUpload({
        id: uid(),
        name: file.name || 'Görsel',
        url: loaded.url,
        width: loaded.width,
        height: loaded.height,
      })
      const point = at ? new Point(at.x + offset, at.y + offset) : undefined
      await editor.addImageFromUrl(loaded.url, file.name, point)
      offset += 32
    } catch (error) {
      toast(errorMessage(error, `"${file.name}" yüklenemedi.`), 'error')
    }
  }
}

export async function runBackgroundRemoval(editor: Editor, image: FabricImage) {
  if (store().busy) return
  store().setBusy({ label: 'Arka plan siliniyor' })
  try {
    await removeImageBackground(editor, image, (p) => store().setBusy(p))
    toast('Arka plan silindi.', 'success')
  } catch (error) {
    toast(errorMessage(error, 'Arka plan silinemedi.'), 'error')
  } finally {
    store().setBusy(null)
  }
}

export async function runUpscale(editor: Editor, image: FabricImage) {
  if (store().busy) return
  store().setBusy({ label: 'Görsel büyütülüyor' })
  try {
    const result = await upscaleImage(editor, image, (p) => store().setBusy(p))
    toast(
      result.factor > 1
        ? `Görsel ${result.width} × ${result.height} px'e büyütüldü ve netleştirildi.`
        : 'Görsel zaten en yüksek çözünürlükte; yalnızca netleştirildi.',
      'success',
    )
  } catch (error) {
    toast(errorMessage(error, 'Görsel büyütülemedi.'), 'error')
  } finally {
    store().setBusy(null)
  }
}

export function runEnhance(editor: Editor, image: FabricImage) {
  enhanceImage(editor, image)
  toast('Görsel netleştirildi.', 'success')
}

export async function saveProjectFile(editor: Editor, name = 'kapak-projesi') {
  try {
    const blob = await serializeProject(editor)
    downloadBlob(blob, `${safeFileName(name)}.json`)
    toast('Proje kaydedildi.', 'success')
  } catch (error) {
    toast(errorMessage(error, 'Proje kaydedilemedi.'), 'error')
  }
}

export async function openProjectFile(editor: Editor, file: File) {
  store().setBusy({ label: 'Proje açılıyor' })
  try {
    await loadProject(editor, file)
    toast('Proje yüklendi.', 'success')
  } catch (error) {
    toast(errorMessage(error, 'Proje açılamadı.'), 'error')
  } finally {
    store().setBusy(null)
  }
}

export async function downloadExport(editor: Editor, options: ExportOptions, name: string) {
  store().setBusy({ label: 'Görsel oluşturuluyor' })
  try {
    // Meşgul göstergesinin çizilmesine fırsat ver
    await new Promise((resolve) => requestAnimationFrame(resolve))
    const blob = await exportImage(editor, options)
    downloadBlob(blob, `${safeFileName(name)}.${options.format === 'jpeg' ? 'jpg' : 'png'}`)
    toast('Görsel indirildi.', 'success')
    return true
  } catch (error) {
    toast(errorMessage(error, 'Görsel dışa aktarılamadı.'), 'error')
    return false
  } finally {
    store().setBusy(null)
  }
}

/** İlk açılışta kullanıcıyı boş bir tuval yerine küçük bir örnekle karşılar. */
export async function seedStarterDesign(editor: Editor, isCancelled: () => boolean) {
  const { width, height } = editor.doc
  editor.setBackground({ type: 'gradient', ...GRADIENT_PRESETS[0] }, 'now')
  await editor.addText(TEXT_PRESETS[0], new Point(width / 2, height * 0.45), 'Kapağını Tasarla')
  if (isCancelled()) return
  await editor.addText(
    TEXT_PRESETS[2],
    new Point(width / 2, height * 0.62),
    'Metin, görsel ve şekil ekleyerek başlayın',
  )
  if (isCancelled()) return
  editor.setProps({ opacity: 0.85 })
  editor.deselect()
  editor.history.reset()
}
