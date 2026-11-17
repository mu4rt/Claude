/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** 'local' (Transformers.js, varsayılan) veya 'api' (harici servis) */
  readonly VITE_BG_REMOVAL_PROVIDER?: 'local' | 'api'
  /** Tarayıcı içi model kimliği (Hugging Face Hub) */
  readonly VITE_BG_REMOVAL_MODEL?: string
  /** 'auto' | 'webgpu' | 'wasm' */
  readonly VITE_BG_REMOVAL_DEVICE?: 'auto' | 'webgpu' | 'wasm'
  /** Harici arka plan silme servisi uç noktası */
  readonly VITE_BG_REMOVAL_API_URL?: string
  /** Harici servis anahtarı (üretimde bir proxy arkasında tutun) */
  readonly VITE_BG_REMOVAL_API_KEY?: string
}
