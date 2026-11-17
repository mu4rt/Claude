import { Circle, Line, Path, Polygon, Rect, Triangle, type FabricObject } from 'fabric'
import type { ShapeKind } from './types'

export interface ShapeDef {
  kind: ShapeKind
  label: string
  /** Panel önizlemesi için 24×24 görünüm kutusunda SVG yolu */
  icon: string
  /** Yalnızca konturla çizilen şekiller (çizgi) */
  strokeOnly?: boolean
}

export const SHAPES: ShapeDef[] = [
  { kind: 'rect', label: 'Dikdörtgen', icon: 'M3 5h18v14H3z' },
  {
    kind: 'rounded',
    label: 'Yuvarlak köşe',
    icon: 'M7 5h10a4 4 0 0 1 4 4v6a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V9a4 4 0 0 1 4-4z',
  },
  { kind: 'circle', label: 'Daire', icon: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z' },
  { kind: 'triangle', label: 'Üçgen', icon: 'M12 3l10 18H2z' },
  { kind: 'diamond', label: 'Eşkenar', icon: 'M12 2l10 10-10 10L2 12z' },
  { kind: 'hexagon', label: 'Altıgen', icon: 'M7 3.5h10l5 8.5-5 8.5H7L2 12z' },
  {
    kind: 'star',
    label: 'Yıldız',
    icon: 'M12 2l2.9 6.6 7.1.7-5.4 4.8 1.6 7L12 17.4 5.8 21.1l1.6-7L2 9.3l7.1-.7z',
  },
  {
    kind: 'heart',
    label: 'Kalp',
    icon: 'M12 21C5 15.5 2 12.2 2 8.4 2 5.4 4.3 3 7.2 3c1.9 0 3.6 1 4.8 2.6C13.2 4 14.9 3 16.8 3 19.7 3 22 5.4 22 8.4c0 3.8-3 7.1-10 12.6z',
  },
  { kind: 'arrow', label: 'Ok', icon: 'M2 9.5h12V4l8 8-8 8v-5.5H2z' },
  { kind: 'line', label: 'Çizgi', icon: 'M3 12h18', strokeOnly: true },
]

export const SHAPE_LABELS = Object.fromEntries(SHAPES.map((s) => [s.kind, s.label])) as Record<
  ShapeKind,
  string
>

const regularPolygon = (sides: number, radius: number, rotation = -Math.PI / 2) =>
  Array.from({ length: sides }, (_, i) => {
    const a = rotation + (i * 2 * Math.PI) / sides
    return { x: radius * Math.cos(a), y: radius * Math.sin(a) }
  })

const starPoints = (spikes: number, outer: number, inner: number) =>
  Array.from({ length: spikes * 2 }, (_, i) => {
    const r = i % 2 === 0 ? outer : inner
    const a = -Math.PI / 2 + (i * Math.PI) / spikes
    return { x: r * Math.cos(a), y: r * Math.sin(a) }
  })

/**
 * Yeni bir şekil üretir. `size`, şeklin tuvalde kaplayacağı yaklaşık kenar
 * uzunluğudur (tuval boyutuna göre editör tarafından belirlenir).
 */
export function createShape(kind: ShapeKind, size: number, fill: string): FabricObject {
  const common = { fill, strokeWidth: 0, stroke: '', strokeUniform: true, kind: 'shape', shape: kind } as const
  const s = size
  switch (kind) {
    case 'rect':
      return new Rect({ ...common, width: s * 1.4, height: s * 0.9 })
    case 'rounded':
      return new Rect({ ...common, width: s * 1.4, height: s * 0.9, rx: s * 0.14, ry: s * 0.14 })
    case 'circle':
      return new Circle({ ...common, radius: s / 2 })
    case 'triangle':
      return new Triangle({ ...common, width: s, height: s * 0.88 })
    case 'diamond':
      return new Polygon(regularPolygon(4, s / 2), common)
    case 'hexagon':
      return new Polygon(regularPolygon(6, s / 2, 0), common)
    case 'star':
      return new Polygon(starPoints(5, s / 2, s / 4.6), common)
    case 'heart': {
      const heart = new Path(
        'M12 21C5 15.5 2 12.2 2 8.4 2 5.4 4.3 3 7.2 3c1.9 0 3.6 1 4.8 2.6C13.2 4 14.9 3 16.8 3 19.7 3 22 5.4 22 8.4c0 3.8-3 7.1-10 12.6z',
        common,
      )
      heart.scale(s / 20)
      return heart
    }
    case 'arrow': {
      const arrow = new Path('M2 9.5h12V4l8 8-8 8v-5.5H2z', common)
      arrow.scale((s * 1.3) / 20)
      return arrow
    }
    case 'line':
      return new Line([0, 0, s * 1.6, 0], {
        ...common,
        fill: '',
        stroke: fill,
        strokeWidth: Math.max(2, Math.round(s * 0.03)),
        strokeLineCap: 'round',
      })
  }
}
