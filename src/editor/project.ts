import type { Editor } from './Editor'
import { MAX_DOC_SIDE, MIN_DOC_SIDE } from './constants'
import { ensureFont } from './fonts'
import type { ProjectFile, Snapshot } from './types'
import { blobToDataURL, urlToBlob } from './utils'

type Json = Record<string, unknown>

/** Nesne ağacındaki (clipPath dahil) her düğümü dolaşır. */
function walkObjects(objects: Json[], visit: (obj: Json) => void) {
  for (const obj of objects) {
    visit(obj)
    if (Array.isArray(obj.objects)) walkObjects(obj.objects as Json[], visit)
    if (obj.clipPath && typeof obj.clipPath === 'object') walkObjects([obj.clipPath as Json], visit)
  }
}

const isImageNode = (obj: Json) =>
  typeof obj.type === 'string' && obj.type.toLowerCase() === 'image' && typeof obj.src === 'string'

/**
 * Projeyi tek başına taşınabilir bir JSON'a çevirir. Çalışma sırasında
 * görseller blob URL olarak tutulur; dosyaya yazarken data URL olarak gömülür.
 */
export async function buildProjectFile(editor: Editor): Promise<ProjectFile> {
  const snapshot = editor.serialize()
  const cache = new Map<string, Promise<string>>()
  const jobs: Promise<void>[] = []

  walkObjects(snapshot.canvas.objects, (obj) => {
    if (!isImageNode(obj)) return
    const src = obj.src as string
    if (!src.startsWith('blob:')) return
    let pending = cache.get(src)
    if (!pending) cache.set(src, (pending = urlToBlob(src).then(blobToDataURL)))
    jobs.push(
      pending.then((dataUrl) => {
        obj.src = dataUrl
      }),
    )
  })
  await Promise.all(jobs)

  return { app: 'kapak-studyo', version: 1, savedAt: new Date().toISOString(), ...snapshot }
}

export async function serializeProject(editor: Editor) {
  const file = await buildProjectFile(editor)
  return new Blob([JSON.stringify(file)], { type: 'application/json' })
}

function assertProject(data: unknown): asserts data is ProjectFile {
  const file = data as Partial<ProjectFile> | null
  const validSide = (n: unknown) =>
    typeof n === 'number' && Number.isFinite(n) && n >= MIN_DOC_SIDE && n <= MAX_DOC_SIDE
  if (
    !file ||
    file.app !== 'kapak-studyo' ||
    !file.doc ||
    !validSide(file.doc.width) ||
    !validSide(file.doc.height) ||
    !file.canvas ||
    !Array.isArray(file.canvas.objects)
  ) {
    throw new Error('Bu dosya geçerli bir Kapak Stüdyo projesi değil.')
  }
  if (file.version !== 1) {
    throw new Error('Proje dosyası bu sürümle uyumlu değil.')
  }
}

/** Proje dosyasını okuyup editöre yükler. */
export async function loadProject(editor: Editor, source: Blob | string) {
  const text = typeof source === 'string' ? source : await source.text()
  let data: unknown
  try {
    data = JSON.parse(text)
  } catch {
    throw new Error('Proje dosyası okunamadı (bozuk JSON).')
  }
  assertProject(data)

  const fontJobs: Promise<unknown>[] = []
  const imageJobs: Promise<void>[] = []
  const urls = new Map<string, Promise<string>>()

  walkObjects(data.canvas.objects as Json[], (obj) => {
    if (typeof obj.fontFamily === 'string') {
      fontJobs.push(
        ensureFont(obj.fontFamily, {
          weight: Number(obj.fontWeight) || 400,
          italic: obj.fontStyle === 'italic',
          text: typeof obj.text === 'string' ? obj.text : '',
        }),
      )
    }
    if (isImageNode(obj) && (obj.src as string).startsWith('data:')) {
      // Gömülü görselleri blob URL'ye çevir: geçmiş kayıtları küçük kalır
      const src = obj.src as string
      let pending = urls.get(src)
      if (!pending) {
        urls.set(src, (pending = urlToBlob(src).then((blob) => URL.createObjectURL(blob))))
      }
      imageJobs.push(
        pending.then((url) => {
          obj.src = url
        }),
      )
    }
  })
  await Promise.all([...fontJobs, ...imageJobs])

  const snapshot: Snapshot = {
    doc: { width: Math.round(data.doc.width), height: Math.round(data.doc.height) },
    background: data.background ?? { type: 'solid', color: '#ffffff' },
    canvas: data.canvas,
  }
  await editor.load(snapshot)
}
