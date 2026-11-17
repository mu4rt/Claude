/**
 * Arka plan silme Web Worker'ı.
 *
 * Model indirme ve çıkarım ana iş parçacığının dışında yürür; böylece tuval
 * işlem boyunca akıcı kalır. Model ilk kullanımda Hugging Face Hub'dan iner ve
 * tarayıcı önbelleğinde (Cache Storage) saklanır.
 */
import { RawImage, pipeline, type ProgressInfo } from '@huggingface/transformers'

export interface BgWorkerRequest {
  id: number
  image: Blob
  model: string
  device: 'auto' | 'webgpu' | 'wasm'
}

export type BgWorkerResponse =
  | { id: number; type: 'progress'; label: string; progress?: number }
  | { id: number; type: 'result'; width: number; height: number; data: ArrayBuffer }
  | { id: number; type: 'error'; message: string }

type Device = 'webgpu' | 'wasm'
type Segmenter = (image: RawImage) => Promise<RawImage | RawImage[]>

const ctx = self as unknown as {
  postMessage(message: BgWorkerResponse, transfer?: Transferable[]): void
  onmessage: ((event: MessageEvent<BgWorkerRequest>) => void) | null
}
const post = (message: BgWorkerResponse, transfer: Transferable[] = []) =>
  ctx.postMessage(message, transfer)

let cached: { key: string; segmenter: Promise<Segmenter> } | null = null

async function hasWebGPU() {
  try {
    const gpu = (navigator as Navigator & { gpu?: { requestAdapter(): Promise<unknown> } }).gpu
    return !!gpu && !!(await gpu.requestAdapter())
  } catch {
    return false
  }
}

async function createSegmenter(model: string, device: Device, id: number): Promise<Segmenter> {
  const progress_callback = (info: ProgressInfo) => {
    if (info.status === 'progress_total') {
      post({ id, type: 'progress', label: 'Model indiriliyor', progress: info.progress / 100 })
    }
  }
  const segmenter = await pipeline('background-removal', model, {
    device,
    // WebGPU'da tam hassasiyet, WASM'da 8-bit nicemlenmiş (küçük ve hızlı) ağırlıklar
    dtype: device === 'webgpu' ? 'fp32' : 'q8',
    progress_callback,
  })
  return segmenter as unknown as Segmenter
}

function getSegmenter(model: string, device: Device, id: number) {
  const key = `${model}@${device}`
  if (cached?.key !== key) {
    const segmenter = createSegmenter(model, device, id)
    cached = { key, segmenter }
    // Başarısız yüklemeyi önbellekte tutma: sonraki deneme yeniden başlasın
    segmenter.catch(() => {
      if (cached?.key === key) cached = null
    })
  }
  return cached.segmenter
}

async function run(request: BgWorkerRequest, device: Device) {
  const { id, image, model } = request
  post({ id, type: 'progress', label: 'Model hazırlanıyor' })
  const segmenter = await getSegmenter(model, device, id)
  post({ id, type: 'progress', label: 'Arka plan ayrıştırılıyor' })
  const input = await RawImage.fromBlob(image)
  const output = await segmenter(input)
  const result = Array.isArray(output) ? output[0] : output
  // Çıktı, alfa kanalına maske yazılmış RGBA görüntüdür
  const rgba = result.channels === 4 ? result : result.rgba()
  const data = new Uint8ClampedArray(rgba.data).buffer
  post({ id, type: 'result', width: rgba.width, height: rgba.height, data }, [data])
}

ctx.onmessage = async (event: MessageEvent<BgWorkerRequest>) => {
  const request = event.data
  const preferred: Device =
    request.device === 'wasm'
      ? 'wasm'
      : request.device === 'webgpu' || (await hasWebGPU())
        ? 'webgpu'
        : 'wasm'
  const report = (error: unknown) =>
    post({
      id: request.id,
      type: 'error',
      message: error instanceof Error ? error.message : String(error),
    })
  try {
    await run(request, preferred)
  } catch (error) {
    if (preferred !== 'webgpu' || request.device === 'webgpu') {
      report(error)
      return
    }
    // WebGPU başlatılamadı veya model desteklenmedi: WASM ile yeniden dene
    try {
      await run(request, 'wasm')
    } catch (fallbackError) {
      report(fallbackError)
    }
  }
}
