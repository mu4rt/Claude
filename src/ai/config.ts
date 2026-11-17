/**
 * Arka plan silme yapılandırması. Değerler .env dosyasındaki VITE_* değişkenleriyle
 * değiştirilebilir (bkz. README → "Arka plan silme").
 */
export const BG_REMOVAL = {
  /** 'local': tarayıcı içi Transformers.js · 'api': harici HTTP servisi */
  provider: (import.meta.env.VITE_BG_REMOVAL_PROVIDER ?? 'local') as 'local' | 'api',

  /**
   * Hugging Face Hub model kimliği. Transformers.js'in `background-removal`
   * işlem hattıyla uyumlu herhangi bir model olabilir. Varsayılan RMBG-1.4
   * genel amaçlıdır (insan, araç, ürün…); ticari kullanım için lisansını
   * kontrol edin veya izin verici lisanslı bir modelle değiştirin.
   */
  model: import.meta.env.VITE_BG_REMOVAL_MODEL ?? 'briaai/RMBG-1.4',

  /** 'auto': WebGPU varsa onu, yoksa WASM'ı kullanır */
  device: (import.meta.env.VITE_BG_REMOVAL_DEVICE ?? 'auto') as 'auto' | 'webgpu' | 'wasm',

  /** Harici servis (ör. remove.bg uyumlu) uç noktası ve anahtarı */
  apiUrl: import.meta.env.VITE_BG_REMOVAL_API_URL ?? 'https://api.remove.bg/v1.0/removebg',
  apiKey: import.meta.env.VITE_BG_REMOVAL_API_KEY ?? '',
} as const

export interface AiProgress {
  /** Kullanıcıya gösterilecek aşama metni */
  label: string
  /** 0…1 arası ilerleme; bilinmiyorsa undefined */
  progress?: number
}

export type ProgressHandler = (progress: AiProgress) => void
