import { Color } from 'fabric'

/** Herhangi bir CSS rengini #rrggbb (veya alfa varsa #rrggbbaa) biçimine çevirir. */
export function toHex(value: string | null | undefined, withAlpha = false): string {
  if (!value) return '#ffffff'
  try {
    const color = new Color(value)
    const alpha = color.getAlpha()
    return `#${(withAlpha && alpha < 1 ? color.toHexa() : color.toHex()).toLowerCase()}`
  } catch {
    return '#ffffff'
  }
}

export const HEX_RE = /^#?([0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/i
