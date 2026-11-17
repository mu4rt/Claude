import { FabricImage, Point, util } from 'fabric'
import { MAX_IMAGE_SIDE } from './constants'
import type { DocSize } from './types'
import { canvasToBlob, loadHtmlImage } from './utils'

export interface LoadedImage {
  url: string
  width: number
  height: number
  name: string
}

/**
 * Bir dosyayı/blob'u tuvalde kullanılacak bir blob URL'sine çevirir.
 * Çok büyük görseller MAX_IMAGE_SIDE kenarına indirgenir; böylece WebGL
 * filtreleri ve geri al/ileri al anlık kalır. Kaynak, geçmiş kayıtlarını
 * küçük tutmak için data URL yerine blob URL olarak saklanır.
 */
export async function prepareImage(blob: Blob, name = 'Görsel'): Promise<LoadedImage> {
  const sourceUrl = URL.createObjectURL(blob)
  let img: HTMLImageElement
  try {
    img = await loadHtmlImage(sourceUrl)
  } catch (error) {
    URL.revokeObjectURL(sourceUrl)
    throw error
  }
  // Boyutu belirtilmemiş SVG'ler 0×0 gelebilir
  const naturalW = img.naturalWidth || 1024
  const naturalH = img.naturalHeight || 1024
  const longest = Math.max(naturalW, naturalH)
  const isVector = blob.type === 'image/svg+xml'

  if (longest <= MAX_IMAGE_SIDE && !isVector) {
    return { url: sourceUrl, width: naturalW, height: naturalH, name }
  }

  // Vektörleri de piksele çevir: filtreler ve arka plan silme için bitmap gerekir
  const ratio = isVector
    ? Math.min(MAX_IMAGE_SIDE, Math.max(longest, 2048)) / longest
    : MAX_IMAGE_SIDE / longest
  const width = Math.max(1, Math.round(naturalW * ratio))
  const height = Math.max(1, Math.round(naturalH * ratio))
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')!
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(img, 0, 0, width, height)
  URL.revokeObjectURL(sourceUrl)
  const opaque = blob.type === 'image/jpeg'
  const out = await canvasToBlob(canvas, opaque ? 'image/jpeg' : 'image/png', 0.92)
  return { url: URL.createObjectURL(out), width, height, name }
}

export async function createImage(url: string, name?: string) {
  const image = await FabricImage.fromURL(url)
  image.set({ kind: 'image', name })
  return image
}

/** Görseli tuvalin içine sığdıracak başlangıç ölçeğini hesaplar. */
export function initialImageScale(image: FabricImage, doc: DocSize) {
  const fit = Math.min((doc.width * 0.7) / image.width, (doc.height * 0.7) / image.height)
  return Math.min(1, fit)
}

/** Görseli tuvali kaplayacak (cover) veya içine sığacak (contain) şekilde ortalar. */
export function fitImageToDoc(image: FabricImage, doc: DocSize, mode: 'cover' | 'contain') {
  const sx = doc.width / image.width
  const sy = doc.height / image.height
  const scale = mode === 'cover' ? Math.max(sx, sy) : Math.min(sx, sy)
  image.set({
    scaleX: scale,
    scaleY: scale,
    angle: 0,
    skewX: 0,
    skewY: 0,
    left: doc.width / 2,
    top: doc.height / 2,
  })
  image.setCoords()
}

/**
 * Görselin piksel kaynağını değiştirir (arka plan silme, büyütme…).
 * `factor`, yeni kaynağın eskisine göre çözünürlük oranıdır; kırpma değerleri
 * buna göre taşınır ve ölçek ters oranda düzeltilir, böylece görsel tuvalde
 * aynı yerde ve aynı boyutta kalır.
 */
export async function replaceImageSource(image: FabricImage, url: string, factor = 1) {
  const { cropX, cropY, width, height, scaleX, scaleY } = image
  const center = image.getCenterPoint()
  await image.setSrc(url)
  const size = image.getOriginalSize()
  const newCropX = Math.min(Math.round(cropX * factor), size.width - 1)
  const newCropY = Math.min(Math.round(cropY * factor), size.height - 1)
  image.set({
    cropX: newCropX,
    cropY: newCropY,
    width: Math.min(Math.round(width * factor), size.width - newCropX),
    height: Math.min(Math.round(height * factor), size.height - newCropY),
    scaleX: scaleX / factor,
    scaleY: scaleY / factor,
  })
  image.setPositionByOrigin(center, 'center', 'center')
  image.setCoords()
  image.dirty = true
}

export interface CropRect {
  x: number
  y: number
  width: number
  height: number
}

/** Görselin kaynak pikselleri cinsinden geçerli kırpma dikdörtgeni. */
export const getCropRect = (image: FabricImage): CropRect => ({
  x: image.cropX,
  y: image.cropY,
  width: image.width,
  height: image.height,
})

/**
 * Kırpmayı uygular. Kırpma tahribatsızdır: yalnızca kaynak üzerindeki pencere
 * (cropX/cropY/width/height) değişir. Görselin tuvalde görünen kısmı yerinden
 * oynamasın diye merkez, döndürme/eğme/çevirme hesaba katılarak kaydırılır.
 */
export function applyCrop(image: FabricImage, rect: CropRect) {
  const size = image.getOriginalSize()
  const x = Math.max(0, Math.min(Math.round(rect.x), size.width - 1))
  const y = Math.max(0, Math.min(Math.round(rect.y), size.height - 1))
  const width = Math.max(1, Math.min(Math.round(rect.width), size.width - x))
  const height = Math.max(1, Math.min(Math.round(rect.height), size.height - y))

  // Yeni pencerenin merkezinin, eski pencere merkezine göre yerel konumu
  const localDelta = new Point(
    x + width / 2 - (image.cropX + image.width / 2),
    y + height / 2 - (image.cropY + image.height / 2),
  )
  const newCenter = util.transformPoint(localDelta, image.calcTransformMatrix())

  image.set({ cropX: x, cropY: y, width, height })
  image.setPositionByOrigin(newCenter, 'center', 'center')
  image.setCoords()
  image.dirty = true
}

/** Kırpma modalında gösterilecek, filtrelenmemiş tam kaynak. */
export const getSourceUrl = (image: FabricImage) => image.getSrc()
