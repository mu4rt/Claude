import type { BackgroundSpec, DocSize, GradientStop, ImageFx, SizePreset } from './types'

/** Her Fabric nesnesiyle birlikte JSON'a yazılan özel alanlar. */
export const CUSTOM_PROPS = ['id', 'name', 'kind', 'locked', 'shape', 'fx']

export const ACCENT = '#8b6cff'

export const MIN_ZOOM = 0.05
export const MAX_ZOOM = 8
/** Tuvalin çalışma alanı kenarlarına olan boşluğu (px). */
export const FIT_PADDING = 56

export const MIN_DOC_SIDE = 16
export const MAX_DOC_SIDE = 8000

/**
 * İçe aktarılan görseller bu kenar uzunluğuna indirgenir. Fabric'in WebGL
 * filtre arka ucu 4096 px doku boyutuyla çalıştığı için filtreler akıcı kalır.
 */
export const MAX_IMAGE_SIDE = 4096

export const HISTORY_LIMIT = 60

export const DEFAULT_DOC: DocSize = { width: 1280, height: 720 }

export const DEFAULT_BACKGROUND: BackgroundSpec = { type: 'solid', color: '#ffffff' }

export const SIZE_PRESETS: SizePreset[] = [
  { id: 'fb-cover', group: 'Facebook', label: 'Kapak Fotoğrafı', width: 1640, height: 624 },
  { id: 'fb-post', group: 'Facebook', label: 'Gönderi', width: 1200, height: 630 },
  { id: 'fb-event', group: 'Facebook', label: 'Etkinlik Kapağı', width: 1920, height: 1005 },
  { id: 'yt-banner', group: 'YouTube', label: 'Kanal Banner', width: 2560, height: 1440 },
  { id: 'yt-thumb', group: 'YouTube', label: 'Küçük Resim', width: 1280, height: 720 },
  { id: 'ig-post', group: 'Instagram', label: 'Kare Gönderi', width: 1080, height: 1080 },
  { id: 'ig-portrait', group: 'Instagram', label: 'Dikey Gönderi', width: 1080, height: 1350 },
  { id: 'ig-story', group: 'Instagram', label: 'Hikâye / Reels', width: 1080, height: 1920 },
  { id: 'x-header', group: 'X (Twitter)', label: 'Başlık Görseli', width: 1500, height: 500 },
  { id: 'x-post', group: 'X (Twitter)', label: 'Gönderi', width: 1600, height: 900 },
  { id: 'li-cover', group: 'LinkedIn', label: 'Profil Kapağı', width: 1584, height: 396 },
  { id: 'li-post', group: 'LinkedIn', label: 'Gönderi', width: 1200, height: 627 },
  { id: 'twitch-banner', group: 'Diğer', label: 'Twitch Banner', width: 1200, height: 480 },
  { id: 'pinterest', group: 'Diğer', label: 'Pinterest Pin', width: 1000, height: 1500 },
  { id: 'tiktok', group: 'Diğer', label: 'TikTok Kapak', width: 1080, height: 1920 },
  { id: 'og', group: 'Diğer', label: 'Web / Open Graph', width: 1200, height: 630 },
]

export const DEFAULT_FX: ImageFx = {
  brightness: 0,
  contrast: 0,
  saturation: 0,
  vibrance: 0,
  hue: 0,
  blur: 0,
  sharpen: 0,
  sharpenRadius: 2,
  grayscale: false,
  sepia: false,
  invert: false,
}

export const COLOR_SWATCHES = [
  '#ffffff',
  '#0b0c10',
  '#f43f5e',
  '#f97316',
  '#facc15',
  '#22c55e',
  '#06b6d4',
  '#3b82f6',
  '#8b6cff',
  '#ec4899',
  '#94a3b8',
  '#1e293b',
]

export interface GradientPreset {
  name: string
  angle: number
  stops: GradientStop[]
}

export const GRADIENT_PRESETS: GradientPreset[] = [
  {
    name: 'Gece Moru',
    angle: 135,
    stops: [
      { offset: 0, color: '#1b1036' },
      { offset: 0.55, color: '#4c2fb8' },
      { offset: 1, color: '#c13fd6' },
    ],
  },
  {
    name: 'Gün Batımı',
    angle: 120,
    stops: [
      { offset: 0, color: '#ff512f' },
      { offset: 1, color: '#f09819' },
    ],
  },
  {
    name: 'Okyanus',
    angle: 135,
    stops: [
      { offset: 0, color: '#0f2027' },
      { offset: 0.5, color: '#203a43' },
      { offset: 1, color: '#2c7a8c' },
    ],
  },
  {
    name: 'Neon',
    angle: 90,
    stops: [
      { offset: 0, color: '#00f5a0' },
      { offset: 1, color: '#00d9f5' },
    ],
  },
  {
    name: 'Şeftali',
    angle: 135,
    stops: [
      { offset: 0, color: '#ffecd2' },
      { offset: 1, color: '#fcb69f' },
    ],
  },
  {
    name: 'Kutup',
    angle: 160,
    stops: [
      { offset: 0, color: '#4facfe' },
      { offset: 1, color: '#00f2fe' },
    ],
  },
  {
    name: 'Gül',
    angle: 135,
    stops: [
      { offset: 0, color: '#ee0979' },
      { offset: 1, color: '#ff6a00' },
    ],
  },
  {
    name: 'Kömür',
    angle: 180,
    stops: [
      { offset: 0, color: '#232526' },
      { offset: 1, color: '#414345' },
    ],
  },
  {
    name: 'Lavanta',
    angle: 135,
    stops: [
      { offset: 0, color: '#a18cd1' },
      { offset: 1, color: '#fbc2eb' },
    ],
  },
  {
    name: 'Orman',
    angle: 135,
    stops: [
      { offset: 0, color: '#134e5e' },
      { offset: 1, color: '#71b280' },
    ],
  },
]
