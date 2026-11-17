import type { FabricObject } from 'fabric'

/** Tuvalin (artboard) piksel cinsinden boyutu. */
export interface DocSize {
  width: number
  height: number
}

export interface GradientStop {
  offset: number
  color: string
}

/** Tuval arka planı: düz renk, doğrusal gradyan veya saydam. */
export type BackgroundSpec =
  | { type: 'solid'; color: string }
  | { type: 'gradient'; angle: number; stops: GradientStop[] }
  | { type: 'transparent' }

/** Katman listesinde ve UI'da kullanılan nesne türü etiketi. */
export type ObjectKind = 'text' | 'image' | 'shape'

export type ShapeKind =
  | 'rect'
  | 'rounded'
  | 'circle'
  | 'triangle'
  | 'diamond'
  | 'hexagon'
  | 'star'
  | 'heart'
  | 'arrow'
  | 'line'

/**
 * Görsel ayarları. Kaydırıcı birimleriyle (−100…100 / 0…100) saklanır,
 * Fabric filtrelerine `filters.ts` içinde dönüştürülür.
 */
export interface ImageFx {
  brightness: number
  contrast: number
  saturation: number
  vibrance: number
  hue: number
  blur: number
  /** Unsharp mask miktarı (0…100) */
  sharpen: number
  /** Unsharp mask yarıçapı: 1 = 3×3, 2 = 5×5, 3 = 7×7 çekirdek */
  sharpenRadius: 1 | 2 | 3
  grayscale: boolean
  sepia: boolean
  invert: boolean
}

export interface LayerInfo {
  id: string
  name: string
  kind: ObjectKind
  visible: boolean
  locked: boolean
}

export interface SizePreset {
  id: string
  label: string
  group: string
  width: number
  height: number
}

/** Geri al / ileri al ve proje dosyası için kullanılan tam durum görüntüsü. */
export interface Snapshot {
  doc: DocSize
  background: BackgroundSpec
  canvas: { objects: Record<string, unknown>[]; [key: string]: unknown }
}

export interface ProjectFile extends Snapshot {
  app: 'kapak-studyo'
  version: 1
  savedAt: string
}

export type EditorEvents = {
  /** Seçim değişti */
  selection: FabricObject[]
  /** Seçili nesnenin özellikleri değişti (panel yenilensin) */
  change: void
  /** Katman listesi / sırası / görünürlüğü değişti */
  layers: void
  /** Geri al / ileri al yığını değişti */
  history: { canUndo: boolean; canRedo: boolean }
  /** Yakınlaştırma değişti */
  zoom: number
  /** Tuval boyutu veya arka planı değişti */
  doc: void
}

export type AlignMode = 'left' | 'centerH' | 'right' | 'top' | 'centerV' | 'bottom'

export type ExportFormat = 'png' | 'jpeg'

export interface ExportOptions {
  format: ExportFormat
  /** Çözünürlük çarpanı (1 = tuval boyutu) */
  multiplier: number
  /** JPEG kalitesi 0…1 */
  quality: number
  /** PNG'de arka planı saydam bırak */
  transparent: boolean
}

declare module 'fabric' {
  // Örnek üzerinde tanınan özel alanlar
  interface FabricObject {
    id?: string
    name?: string
    kind?: ObjectKind
    locked?: boolean
    shape?: ShapeKind
    fx?: ImageFx
  }
  // Serileştirilmiş nesnede tanınan özel alanlar
  interface SerializedObjectProps {
    id?: string
    name?: string
    kind?: ObjectKind
    locked?: boolean
    shape?: ShapeKind
    fx?: ImageFx
  }
}
