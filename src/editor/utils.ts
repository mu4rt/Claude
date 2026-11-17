export const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value))

export const round = (value: number, digits = 0) => {
  const f = 10 ** digits
  return Math.round(value * f) / f
}

export const uid = () =>
  `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`

export const degToRad = (deg: number) => (deg * Math.PI) / 180
export const radToDeg = (rad: number) => (rad * 180) / Math.PI

/** Bir fonksiyonu kare başına en fazla bir kez çalıştırır. */
export function rafThrottle<A extends unknown[]>(fn: (...args: A) => void) {
  let frame = 0
  let lastArgs: A
  return (...args: A) => {
    lastArgs = args
    if (frame) return
    frame = requestAnimationFrame(() => {
      frame = 0
      fn(...lastArgs)
    })
  }
}

export function blobToDataURL(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(reader.error ?? new Error('Dosya okunamadı'))
    reader.readAsDataURL(blob)
  })
}

export async function urlToBlob(url: string): Promise<Blob> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Kaynak okunamadı (${res.status})`)
  return res.blob()
}

export function canvasToBlob(
  canvas: HTMLCanvasElement,
  type = 'image/png',
  quality?: number,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Görsel oluşturulamadı'))),
      type,
      quality,
    )
  })
}

export function loadHtmlImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Görsel yüklenemedi'))
    img.src = url
  })
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  // Tarayıcıya indirmeyi başlatması için zaman tanı
  setTimeout(() => URL.revokeObjectURL(url), 10_000)
}

/** Dosya adında sorun çıkarabilecek karakterleri temizler. */
export const safeFileName = (name: string, fallback = 'kapak') =>
  name
    .trim()
    .replace(/[\\/:*?"<>|]+/g, '-')
    .replace(/\s+/g, '-') || fallback

/** "16:9", "16/9", "1.91" gibi girdileri en/boy oranına çevirir. */
export function parseAspectRatio(input: string): number | null {
  const text = input.trim().replace(',', '.')
  const pair = text.match(/^(\d+(?:\.\d+)?)\s*[:/x×]\s*(\d+(?:\.\d+)?)$/i)
  if (pair) {
    const w = Number(pair[1])
    const h = Number(pair[2])
    return w > 0 && h > 0 ? w / h : null
  }
  const single = Number(text)
  return Number.isFinite(single) && single > 0 ? single : null
}

const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : a)

/** 1920×1080 → "16:9". Sadeleşmeyen oranlar ondalıklı gösterilir. */
export function formatAspectRatio(width: number, height: number) {
  const d = gcd(Math.round(width), Math.round(height)) || 1
  const w = Math.round(width) / d
  const h = Math.round(height) / d
  if (w <= 64 && h <= 64) return `${w}:${h}`
  return `${round(width / height, 2)}:1`
}

export const isTypingTarget = (target: EventTarget | null) => {
  if (!(target instanceof HTMLElement)) return false
  return (
    target.isContentEditable ||
    target.tagName === 'INPUT' ||
    target.tagName === 'TEXTAREA' ||
    target.tagName === 'SELECT'
  )
}
