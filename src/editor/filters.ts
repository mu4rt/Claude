import { filters, type FabricImage } from 'fabric'
import { DEFAULT_FX } from './constants'
import type { ImageFx } from './types'

type FabricFilter = InstanceType<typeof filters.BaseFilter>

const BINOMIALS: Record<1 | 2 | 3, number[]> = {
  1: [1, 2, 1],
  2: [1, 4, 6, 4, 1],
  3: [1, 6, 15, 20, 15, 6, 1],
}

/**
 * Unsharp mask çekirdeği: K = (1 + a)·δ − a·G
 * G: Gauss (binom) bulanıklaştırma çekirdeği, δ: birim darbe, a: miktar.
 * Çekirdek toplamı 1 olduğundan parlaklık korunur; yalnızca kenar kontrastı artar.
 */
export function unsharpKernel(amount: number, radius: 1 | 2 | 3) {
  const row = BINOMIALS[radius]
  const sum = row.reduce((a, b) => a + b, 0)
  const size = row.length
  const mid = (size - 1) / 2
  const kernel: number[] = []
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const gauss = (row[x] * row[y]) / (sum * sum)
      const delta = x === mid && y === mid ? 1 : 0
      kernel.push((1 + amount) * delta - amount * gauss)
    }
  }
  return kernel
}

/** Kaydırıcı değerlerini Fabric filtre zincirine çevirir. */
export function buildFilters(fx: ImageFx): FabricFilter[] {
  const list: FabricFilter[] = []
  if (fx.sharpen > 0) {
    list.push(
      new filters.Convolute({
        // Saydam (dekupe) görsellerde alfa kanalı korunur
        opaque: false,
        matrix: unsharpKernel((fx.sharpen / 100) * 2.5, fx.sharpenRadius),
      }),
    )
  }
  if (fx.brightness) list.push(new filters.Brightness({ brightness: (fx.brightness / 100) * 0.5 }))
  if (fx.contrast) list.push(new filters.Contrast({ contrast: (fx.contrast / 100) * 0.6 }))
  if (fx.saturation) list.push(new filters.Saturation({ saturation: fx.saturation / 100 }))
  if (fx.vibrance) list.push(new filters.Vibrance({ vibrance: fx.vibrance / 100 }))
  if (fx.hue) list.push(new filters.HueRotation({ rotation: fx.hue / 180 }))
  if (fx.grayscale) list.push(new filters.Grayscale())
  if (fx.sepia) list.push(new filters.Sepia())
  if (fx.invert) list.push(new filters.Invert())
  if (fx.blur > 0) list.push(new filters.Blur({ blur: (fx.blur / 100) * 0.3 }))
  return list
}

export const getFx = (image: FabricImage): ImageFx => ({ ...DEFAULT_FX, ...image.fx })

export function applyFx(image: FabricImage, fx: ImageFx) {
  image.fx = fx
  image.filters = buildFilters(fx)
  image.applyFilters()
}

export const isDefaultFx = (fx: ImageFx) =>
  (Object.keys(DEFAULT_FX) as (keyof ImageFx)[]).every(
    (key) => key === 'sharpenRadius' || fx[key] === DEFAULT_FX[key],
  )

/** Tek tıkla netleştirme: unsharp mask + hafif kontrast ve canlılık artışı. */
export const autoEnhance = (fx: ImageFx): ImageFx => ({
  ...fx,
  sharpen: Math.max(fx.sharpen, 45),
  sharpenRadius: 2,
  contrast: Math.max(fx.contrast, 12),
  vibrance: Math.max(fx.vibrance, 10),
})
