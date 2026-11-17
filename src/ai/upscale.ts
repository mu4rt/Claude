import { MAX_IMAGE_SIDE } from '../editor/constants'
import { canvasToBlob, loadHtmlImage } from '../editor/utils'

export interface UpscaleResult {
  blob: Blob
  /** Gerçekleşen büyütme oranı (kenar sınırı nedeniyle istenenden küçük olabilir) */
  factor: number
  width: number
  height: number
}

/**
 * Görseli yüksek kaliteli yeniden örneklemeyle büyütür.
 *
 * Tek seferde büyük oranla ölçeklemek yerine en fazla 1,5× adımlarla ilerlenir;
 * tarayıcının yüksek kaliteli (bikübik benzeri) enterpolasyonu her adımda
 * uygulandığı için kenarlar daha temiz kalır. Netlik, ardından uygulanan
 * unsharp mask filtresiyle geri kazanılır (bkz. tasks.ts).
 */
export async function upscaleBlob(source: Blob, factor = 2): Promise<UpscaleResult> {
  const url = URL.createObjectURL(source)
  try {
    const img = await loadHtmlImage(url)
    const sw = img.naturalWidth
    const sh = img.naturalHeight
    const scale = Math.min(factor, MAX_IMAGE_SIDE / Math.max(sw, sh))
    if (scale <= 1.01) {
      return { blob: source, factor: 1, width: sw, height: sh }
    }
    const targetW = Math.round(sw * scale)
    const targetH = Math.round(sh * scale)

    let current: CanvasImageSource = img
    let cw = sw
    let ch = sh
    while (cw < targetW) {
      const nw = Math.min(targetW, Math.round(cw * 1.5))
      const nh = nw === targetW ? targetH : Math.round(ch * (nw / cw))
      const canvas = document.createElement('canvas')
      canvas.width = nw
      canvas.height = nh
      const ctx = canvas.getContext('2d')!
      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = 'high'
      ctx.drawImage(current, 0, 0, nw, nh)
      current = canvas
      cw = nw
      ch = nh
    }
    const blob = await canvasToBlob(current as HTMLCanvasElement, 'image/png')
    return { blob, factor: targetW / sw, width: targetW, height: targetH }
  } finally {
    URL.revokeObjectURL(url)
  }
}
