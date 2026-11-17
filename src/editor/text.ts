import { Path, Shadow, util } from 'fabric'
import type { CSSProperties } from 'react'
import { StudioText } from './objects/StudioText'
import { degToRad } from './utils'

export interface TextPreset {
  id: string
  label: string
  /** Panelde gösterilecek örnek ve tuvale eklenecek metin */
  text: string
  /** 1080 px kısa kenara göre punto; tuval boyutuna oranlanır */
  size: number
  props: Record<string, unknown>
  /** Önizleme kutucuğu için CSS */
  preview: CSSProperties
}

export const TEXT_PRESETS: TextPreset[] = [
  {
    id: 'heading',
    label: 'Başlık',
    text: 'Başlık Ekle',
    size: 110,
    props: { fontFamily: 'Poppins', fontWeight: 800, fill: '#ffffff' },
    preview: { fontFamily: 'Poppins', fontWeight: 800, fontSize: 24 },
  },
  {
    id: 'subheading',
    label: 'Alt başlık',
    text: 'Alt başlık ekle',
    size: 60,
    props: { fontFamily: 'Poppins', fontWeight: 600, fill: '#ffffff' },
    preview: { fontFamily: 'Poppins', fontWeight: 600, fontSize: 17 },
  },
  {
    id: 'body',
    label: 'Gövde metni',
    text: 'Gövde metni ekle',
    size: 36,
    props: { fontFamily: 'Inter', fontWeight: 400, fill: '#ffffff' },
    preview: { fontFamily: 'Inter', fontWeight: 400, fontSize: 13 },
  },
]

export const TEXT_STYLE_PRESETS: TextPreset[] = [
  {
    id: 'outline',
    label: 'Dış hatlı',
    text: 'DIŞ HAT',
    size: 110,
    props: {
      fontFamily: 'Anton',
      fontWeight: 400,
      fill: '#ffffff',
      stroke: '#0b0c10',
      strokeWidth: 8,
      charSpacing: 20,
    },
    preview: {
      fontFamily: 'Anton',
      fontSize: 24,
      color: '#fff',
      WebkitTextStroke: '2px #0b0c10',
      paintOrder: 'stroke fill',
      letterSpacing: 1,
    },
  },
  {
    id: 'box',
    label: 'Kutu içinde',
    text: 'KUTU İÇİNDE',
    size: 64,
    props: {
      fontFamily: 'Montserrat',
      fontWeight: 800,
      fill: '#0b0c10',
      backgroundColor: '#facc15',
      boxPadding: 26,
      boxRadius: 14,
    },
    preview: {
      fontFamily: 'Montserrat',
      fontWeight: 800,
      fontSize: 13,
      color: '#0b0c10',
      background: '#facc15',
      padding: '4px 8px',
      borderRadius: 5,
    },
  },
  {
    id: 'neon',
    label: 'Neon',
    text: 'NEON',
    size: 120,
    props: {
      fontFamily: 'Orbitron',
      fontWeight: 800,
      fill: '#e8fbff',
      shadow: { color: '#22d3ee', blur: 36, offsetX: 0, offsetY: 0 },
      charSpacing: 60,
    },
    preview: {
      fontFamily: 'Orbitron',
      fontWeight: 800,
      fontSize: 22,
      color: '#e8fbff',
      textShadow: '0 0 10px #22d3ee, 0 0 2px #22d3ee',
      letterSpacing: 2,
    },
  },
  {
    id: 'shadow',
    label: 'Gölgeli',
    text: 'Gölgeli',
    size: 110,
    props: {
      fontFamily: 'Archivo Black',
      fontWeight: 400,
      fill: '#ffffff',
      shadow: { color: '#000000b3', blur: 0, offsetX: 8, offsetY: 8 },
    },
    preview: {
      fontFamily: 'Archivo Black',
      fontSize: 22,
      color: '#fff',
      textShadow: '3px 3px 0 rgba(0,0,0,.7)',
    },
  },
  {
    id: 'script',
    label: 'El yazısı',
    text: 'El yazısı',
    size: 120,
    props: { fontFamily: 'Pacifico', fontWeight: 400, fill: '#f472b6' },
    preview: { fontFamily: 'Pacifico', fontSize: 24, color: '#f472b6' },
  },
  {
    id: 'curved',
    label: 'Kavisli',
    text: 'KAVİSLİ METİN',
    size: 64,
    props: {
      fontFamily: 'Bebas Neue',
      fontWeight: 400,
      fill: '#ffffff',
      charSpacing: 80,
      curve: 150,
    },
    preview: { fontFamily: 'Bebas Neue', fontSize: 20, letterSpacing: 2 },
  },
]

const TEXT_DEFAULTS = {
  fontFamily: 'Inter',
  fontWeight: 400,
  fill: '#ffffff',
  textAlign: 'center',
  lineHeight: 1.16,
  // Dış hat dolgunun arkasına çizilir; kalın konturlar harfi yemez
  paintFirst: 'stroke',
  strokeLineJoin: 'round',
  strokeWidth: 0,
  strokeUniform: false,
} as const

interface ShadowSpec {
  color: string
  blur: number
  offsetX: number
  offsetY: number
}

export function createText(preset: TextPreset, scale: number, textOverride?: string) {
  const { shadow, curve, strokeWidth, boxPadding, boxRadius, ...rest } = preset.props as {
    shadow?: ShadowSpec
    curve?: number
    strokeWidth?: number
    boxPadding?: number
    boxRadius?: number
  } & Record<string, unknown>

  const text = new StudioText(textOverride ?? preset.text, {
    ...TEXT_DEFAULTS,
    ...rest,
    fontSize: Math.max(8, Math.round(preset.size * scale)),
    strokeWidth: strokeWidth ? Math.max(1, Math.round(strokeWidth * scale)) : 0,
    boxPadding: Math.round((boxPadding ?? 0) * scale),
    boxRadius: Math.round((boxRadius ?? 0) * scale),
    kind: 'text',
  })
  if (shadow) {
    text.set(
      'shadow',
      new Shadow({
        color: shadow.color,
        blur: Math.round(shadow.blur * scale),
        offsetX: Math.round(shadow.offsetX * scale),
        offsetY: Math.round(shadow.offsetY * scale),
      }),
    )
  }
  if (curve) {
    text.curve = curve
    updateTextCurve(text)
  }
  return text
}

/* -------------------------------------------------------------------------- */
/*  Kavisli metin                                                              */
/* -------------------------------------------------------------------------- */

export const MAX_CURVE = 340

let measureCtx: CanvasRenderingContext2D | null = null

/** Yazı tipinin taban çizgisinin üstünde ve altında kapladığı yüksekliği ölçer. */
function fontExtents(text: StudioText) {
  measureCtx ??= document.createElement('canvas').getContext('2d')
  let ascent = text.fontSize * 0.95
  let descent = text.fontSize * 0.3
  if (measureCtx) {
    measureCtx.font = text._getFontDeclaration()
    const m = measureCtx.measureText('ÇĞÅgjpqy')
    if (m.fontBoundingBoxAscent) ascent = m.fontBoundingBoxAscent
    if (m.fontBoundingBoxDescent) descent = m.fontBoundingBoxDescent
  }
  const stroke = text.stroke ? (text.strokeWidth || 0) / 2 : 0
  return { ascent: ascent + stroke, descent: descent + stroke }
}

const fmt = (n: number) => Number(n.toFixed(3))

/** Bir çember yayını kübik Bézier parçalarıyla ifade eder. */
function arcToCubics(r: number, a0: number, a1: number) {
  const segments = Math.max(1, Math.ceil(Math.abs(a1 - a0) / (Math.PI / 4)))
  const step = (a1 - a0) / segments
  const k = (4 / 3) * Math.tan(step / 4)
  let d = `M ${fmt(r * Math.cos(a0))} ${fmt(r * Math.sin(a0))}`
  for (let i = 0; i < segments; i++) {
    const s = a0 + i * step
    const e = s + step
    const [cs, ss, ce, se] = [Math.cos(s), Math.sin(s), Math.cos(e), Math.sin(e)]
    d +=
      ` C ${fmt(r * (cs - k * ss))} ${fmt(r * (ss + k * cs))}` +
      ` ${fmt(r * (ce + k * se))} ${fmt(r * (se - k * ce))}` +
      ` ${fmt(r * ce)} ${fmt(r * se)}`
  }
  return d
}

/**
 * `text.curve` değerine göre metnin üzerine oturacağı yayı (yeniden) üretir.
 *
 * Fabric yol üzerindeki metnin sınır kutusunu yalnızca yolun kendisinden
 * hesaplar; harflerin yüksekliği hesaba katılmadığı için seçim çerçevesi
 * metni kesiyormuş gibi görünür. Bunu aşmak için yola, harf bandının sınır
 * kutusunun köşelerine denk gelen iki adet sıfır uzunluklu parça eklenir:
 * yol uzunluğunu değiştirmezler ama sınır kutusunu gerçek boyuta genişletirler.
 */
export function updateTextCurve(text: StudioText) {
  const curve = Math.max(-MAX_CURVE, Math.min(MAX_CURVE, text.curve || 0))
  const center = text.getCenterPoint()

  if (!curve) {
    if (text.path) {
      text.set({ path: undefined, pathStartOffset: 0 })
      text.setPositionByOrigin(center, 'center', 'center')
      text.setCoords()
    }
    text.curve = 0
    return
  }

  // Yol üzerindeki metin tek satırdır
  if (text.text.includes('\n')) text.set('text', text.text.replace(/\s*\n\s*/g, ' '))
  if (text.isEditing) text.exitEditing()

  // 1) Düz hâlin genişliğini ölç.
  //    Fabric her harf kutusuna harf aralığını ekler; yol üzerindeki yerleşim
  //    son harfin ardındaki aralığı da sayar (full), görünen metin ise saymaz.
  text.set({ path: undefined, pathStartOffset: 0 })
  const spacing = text.charSpacing ? text._getWidthOfCharSpacing() : 0
  const visible = Math.max(1, text.calcTextWidth())
  const full = visible + spacing
  const { ascent, descent } = fontExtents(text)

  // 2) Yay geometrisi: görünen metin, istenen açıyı kaplar
  const theta = degToRad(Math.abs(curve))
  const radius = visible / theta
  // Sayısal yuvarlamada ilk/son harfin yolun dışına taşıp başa sarmaması için pay
  const slack = Math.max(2, text.fontSize * 0.05)
  const half = (Math.max(full, visible) + slack) / (2 * radius)
  const up = curve > 0
  // Yukarı kemer: çemberin tepesinde saat yönünde; aşağı kemer: dibinde saat yönü tersine
  const a0 = up ? -Math.PI / 2 - half : Math.PI / 2 + half
  const a1 = up ? -Math.PI / 2 + half : Math.PI / 2 - half

  // 3) Harf bandının sınır kutusu
  const outer = radius + (up ? ascent : descent)
  const inner = Math.max(0, radius - (up ? descent : ascent))
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  const samples = Math.max(8, Math.ceil(Math.abs(a1 - a0) / degToRad(3)))
  for (let i = 0; i <= samples; i++) {
    const a = a0 + ((a1 - a0) * i) / samples
    const c = Math.cos(a)
    const s = Math.sin(a)
    for (const r of [outer, inner]) {
      minX = Math.min(minX, r * c)
      maxX = Math.max(maxX, r * c)
      minY = Math.min(minY, r * s)
      maxY = Math.max(maxY, r * s)
    }
  }

  const d =
    `M ${fmt(minX)} ${fmt(minY)} L ${fmt(minX)} ${fmt(minY)} ` +
    `M ${fmt(maxX)} ${fmt(maxY)} L ${fmt(maxX)} ${fmt(maxY)} ` +
    arcToCubics(radius, a0, a1)

  const path = new Path(d, {
    visible: false,
    fill: '',
    stroke: '',
    strokeWidth: 0,
  })

  // 4) Görünen metni, hizalama ayarından bağımsız olarak yayın ortasına yerleştir.
  //    Fabric başlangıç konumunu hizalamaya göre seçer; fark pathStartOffset ile kapatılır.
  const total = util.getPathSegmentsInfo(path.path).at(-1)!.length
  const start = (total - visible) / 2
  const align = text.textAlign
  const base = align === 'center' ? (total - full) / 2 : align === 'right' ? total - full : 0

  text.set({ path, pathStartOffset: start - base, pathSide: 'left', pathAlign: 'baseline' })
  text.curve = curve
  text.setPositionByOrigin(center, 'center', 'center')
  text.setCoords()
}

/** Yazı tipi yüklendikten veya metin değiştikten sonra ölçüleri tazeler. */
export function refreshText(text: StudioText) {
  if (text.curve) {
    updateTextCurve(text)
  } else {
    const center = text.getCenterPoint()
    text.initDimensions()
    text.setPositionByOrigin(center, 'center', 'center')
    text.setCoords()
  }
  text.dirty = true
}
