import type { FabricImage } from 'fabric'
import type { Editor } from '../editor/Editor'
import { autoEnhance, getFx } from '../editor/filters'
import { urlToBlob } from '../editor/utils'
import { removeBackground } from './backgroundRemoval'
import type { ProgressHandler } from './config'
import { upscaleBlob } from './upscale'

/** Görselin arka planını siler ve kaynağı saydam PNG ile değiştirir. */
export async function removeImageBackground(
  editor: Editor,
  image: FabricImage,
  onProgress?: ProgressHandler,
) {
  onProgress?.({ label: 'Görsel hazırlanıyor' })
  const source = await urlToBlob(image.getSrc())
  const cutout = await removeBackground(source, onProgress)
  onProgress?.({ label: 'Tuvale uygulanıyor' })
  await editor.replaceImage(image, cutout, 1)
}

/** Görseli 2× büyütür ve unsharp mask ile netleştirir. */
export async function upscaleImage(editor: Editor, image: FabricImage, onProgress?: ProgressHandler) {
  onProgress?.({ label: 'Görsel büyütülüyor' })
  const source = await urlToBlob(image.getSrc())
  const result = await upscaleBlob(source, 2)
  if (result.factor > 1) {
    await editor.replaceImage(image, result.blob, result.factor)
  }
  const fx = getFx(image)
  editor.setFx(image, { sharpen: Math.max(fx.sharpen, 40), sharpenRadius: 2 }, 'now')
  return result
}

/** Tek tıkla netleştirme (unsharp mask + kontrast). */
export function enhanceImage(editor: Editor, image: FabricImage) {
  editor.setFx(image, autoEnhance(getFx(image)), 'now')
}
