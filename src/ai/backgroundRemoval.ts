import { canvasToBlob } from '../editor/utils'
import { BG_REMOVAL, type ProgressHandler } from './config'
import type { BgWorkerRequest, BgWorkerResponse } from './bgRemoval.worker'

/* -------------------------------------------------------------------------- */
/*  1) Tarayıcı içi: Transformers.js (Web Worker)                              */
/* -------------------------------------------------------------------------- */

let worker: Worker | null = null
let nextId = 1
const pending = new Map<
  number,
  { resolve: (blob: Blob) => void; reject: (error: Error) => void; onProgress?: ProgressHandler }
>()

function getWorker() {
  if (worker) return worker
  worker = new Worker(new URL('./bgRemoval.worker.ts', import.meta.url), { type: 'module' })
  worker.onmessage = async (event: MessageEvent<BgWorkerResponse>) => {
    const message = event.data
    const job = pending.get(message.id)
    if (!job) return
    if (message.type === 'progress') {
      job.onProgress?.({ label: message.label, progress: message.progress })
      return
    }
    pending.delete(message.id)
    if (message.type === 'error') {
      job.reject(new Error(describeError(message.message)))
      return
    }
    try {
      const canvas = document.createElement('canvas')
      canvas.width = message.width
      canvas.height = message.height
      canvas
        .getContext('2d')!
        .putImageData(
          new ImageData(new Uint8ClampedArray(message.data), message.width, message.height),
          0,
          0,
        )
      job.resolve(await canvasToBlob(canvas, 'image/png'))
    } catch (error) {
      job.reject(error instanceof Error ? error : new Error(String(error)))
    }
  }
  worker.onerror = (event) => {
    const error = new Error(describeError(event.message || 'Arka plan silme başlatılamadı'))
    pending.forEach((job) => job.reject(error))
    pending.clear()
    worker?.terminate()
    worker = null
  }
  return worker
}

function describeError(message: string) {
  if (/fetch|network|load|http|404|401|403/i.test(message)) {
    return `Model indirilemedi. İnternet bağlantınızı ve model kimliğini (${BG_REMOVAL.model}) kontrol edin.`
  }
  return message
}

export function removeBackgroundLocal(image: Blob, onProgress?: ProgressHandler): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const id = nextId++
    pending.set(id, { resolve, reject, onProgress })
    const request: BgWorkerRequest = {
      id,
      image,
      model: BG_REMOVAL.model,
      device: BG_REMOVAL.device,
    }
    getWorker().postMessage(request)
  })
}

/* -------------------------------------------------------------------------- */
/*  2) Harici API (remove.bg uyumlu)                                           */
/* -------------------------------------------------------------------------- */

export interface BgApiOptions {
  url?: string
  apiKey?: string
  /** Anahtarın gönderileceği başlık (remove.bg: X-Api-Key) */
  keyHeader?: string
  /** Görselin gönderileceği form alanı (remove.bg: image_file) */
  fileField?: string
  /** Ek form alanları */
  fields?: Record<string, string>
}

/**
 * Görseli harici bir arka plan silme servisine gönderir ve saydam PNG döndürür.
 * Varsayılanlar remove.bg ile uyumludur; kendi sunucunuzdaki bir proxy'ye
 * yönlendirmek için `url` değerini değiştirmeniz yeterlidir. API anahtarını
 * istemci paketine gömmek yerine bir proxy arkasında tutmanız önerilir.
 */
export async function removeBackgroundViaApi(
  image: Blob,
  options: BgApiOptions = {},
  onProgress?: ProgressHandler,
): Promise<Blob> {
  const {
    url = BG_REMOVAL.apiUrl,
    apiKey = BG_REMOVAL.apiKey,
    keyHeader = 'X-Api-Key',
    fileField = 'image_file',
    fields = { size: 'auto', format: 'png' },
  } = options

  const form = new FormData()
  form.append(fileField, image, 'image.png')
  for (const [key, value] of Object.entries(fields)) form.append(key, value)

  onProgress?.({ label: 'Görsel servise gönderiliyor' })
  const response = await fetch(url, {
    method: 'POST',
    headers: apiKey ? { [keyHeader]: apiKey } : undefined,
    body: form,
  })
  if (!response.ok) {
    const detail = await response.text().catch(() => '')
    throw new Error(`Arka plan silme servisi hata döndürdü (${response.status}). ${detail.slice(0, 160)}`)
  }
  const blob = await response.blob()
  if (!blob.type.startsWith('image/')) {
    throw new Error('Arka plan silme servisi görsel döndürmedi.')
  }
  return blob
}

/* -------------------------------------------------------------------------- */
/*  Ortak giriş noktası                                                        */
/* -------------------------------------------------------------------------- */

/** Yapılandırılmış sağlayıcıyı kullanarak görselin arka planını siler. */
export function removeBackground(image: Blob, onProgress?: ProgressHandler): Promise<Blob> {
  return BG_REMOVAL.provider === 'api'
    ? removeBackgroundViaApi(image, {}, onProgress)
    : removeBackgroundLocal(image, onProgress)
}
