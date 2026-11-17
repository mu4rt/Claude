import type { TMat2D } from 'fabric'
import type { Editor } from './Editor'
import type { DocSize, ExportOptions } from './types'
import { canvasToBlob } from './utils'

/** Tarayıcıların güvenle oluşturabildiği tuval sınırları. */
const MAX_EXPORT_SIDE = 16384
const MAX_EXPORT_PIXELS = 120_000_000

export const exportSize = (doc: DocSize, multiplier: number) => ({
  width: Math.round(doc.width * multiplier),
  height: Math.round(doc.height * multiplier),
})

export function canExport(doc: DocSize, multiplier: number) {
  const { width, height } = exportSize(doc, multiplier)
  return (
    width <= MAX_EXPORT_SIDE && height <= MAX_EXPORT_SIDE && width * height <= MAX_EXPORT_PIXELS
  )
}

/**
 * Tuvali (artboard) istenen çözünürlük çarpanıyla ayrı bir <canvas> üzerine çizer.
 *
 * Görünüm dönüşümü geçici olarak sıfırlanır; böylece çıktı ekrandaki
 * yakınlaştırmadan bağımsızdır ve tam olarak tuval sınırlarından kırpılır.
 * Tuval dışına taşan nesne parçaları çıktıya girmez.
 */
export function renderDocument(
  editor: Editor,
  multiplier: number,
  options: { transparent?: boolean } = {},
): HTMLCanvasElement {
  const { canvas, doc } = editor
  const active = canvas.getActiveObject()
  if (active && 'isEditing' in active && active.isEditing) {
    ;(active as unknown as { exitEditing: () => void }).exitEditing()
  }

  const viewport = canvas.viewportTransform
  const background = canvas.backgroundColor
  const hideBackground = options.transparent || editor.background.type === 'transparent'

  canvas.viewportTransform = [1, 0, 0, 1, 0, 0] as TMat2D
  if (hideBackground) canvas.backgroundColor = ''
  try {
    return editor.renderOffscreen(() =>
      canvas.toCanvasElement(multiplier, {
        left: 0,
        top: 0,
        width: doc.width,
        height: doc.height,
      }),
    )
  } finally {
    canvas.viewportTransform = viewport
    canvas.backgroundColor = background
    canvas.calcViewportBoundaries()
    canvas.requestRenderAll()
  }
}

/** Tuvali PNG veya JPEG blob'una dönüştürür. */
export async function exportImage(editor: Editor, options: ExportOptions): Promise<Blob> {
  if (!canExport(editor.doc, options.multiplier)) {
    throw new Error('Seçilen çözünürlük tarayıcının tuval sınırını aşıyor.')
  }
  const isJpeg = options.format === 'jpeg'
  let output = renderDocument(editor, options.multiplier, {
    transparent: !isJpeg && options.transparent,
  })

  if (isJpeg && editor.background.type === 'transparent') {
    // JPEG saydamlığı desteklemez: beyaz zemine yerleştir
    const flat = document.createElement('canvas')
    flat.width = output.width
    flat.height = output.height
    const ctx = flat.getContext('2d')!
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, flat.width, flat.height)
    ctx.drawImage(output, 0, 0)
    output = flat
  }

  return canvasToBlob(output, isJpeg ? 'image/jpeg' : 'image/png', isJpeg ? options.quality : undefined)
}

/** Dışa aktarma penceresindeki küçük önizleme için. */
export function renderPreview(editor: Editor, maxSide = 520, transparent = false) {
  const multiplier = Math.min(1, maxSide / Math.max(editor.doc.width, editor.doc.height))
  return renderDocument(editor, multiplier, { transparent })
}
