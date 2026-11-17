import { cache } from 'fabric'
import { FONT_CATALOG, FONT_MAP, googleFontUrl, type FontDef } from './fontCatalog'

const stylesheetPromises = new Map<string, Promise<void>>()

/** Ailenin Google Fonts stil sayfasını (bir kez) ekler ve yüklenmesini bekler. */
function loadStylesheet(def: FontDef): Promise<void> {
  let promise = stylesheetPromises.get(def.family)
  if (!promise) {
    promise = new Promise<void>((resolve, reject) => {
      const link = document.createElement('link')
      link.rel = 'stylesheet'
      link.href = googleFontUrl(def)
      link.dataset.font = def.family
      link.onload = () => resolve()
      link.onerror = () => {
        link.remove()
        stylesheetPromises.delete(def.family)
        reject(new Error(`"${def.family}" yazı tipi yüklenemedi`))
      }
      document.head.appendChild(link)
    })
    stylesheetPromises.set(def.family, promise)
  }
  return promise
}

const quote = (family: string) => `"${family.replace(/"/g, '')}"`

/**
 * Bir yazı tipinin istenen kesimini tuvalde kullanılabilir hâle getirir.
 * Google Fonts alt kümelere (latin, latin-ext…) bölündüğü için `text`
 * parametresi, Türkçe karakterleri de içeren doğru alt kümelerin
 * indirilmesini sağlar.
 */
export async function ensureFont(
  family: string,
  options: { weight?: number | string; italic?: boolean; text?: string } = {},
): Promise<boolean> {
  const def = FONT_MAP.get(family)
  if (!def) return true // sistem yazı tipi
  const { weight = 400, italic = false, text = '' } = options
  try {
    await loadStylesheet(def)
    const spec = `${italic ? 'italic ' : ''}${weight} 32px ${quote(family)}`
    await document.fonts.load(spec, `${text} AaĞğŞşİıÖöÜüÇç0123`)
    cache.clearFontCache(family)
    return true
  } catch (error) {
    console.warn(error)
    return false
  }
}

let previewsRequested = false

/** Yazı tipi seçicideki önizlemeler için tüm katalog stil sayfalarını ekler. */
export function loadFontPreviews() {
  if (previewsRequested) return
  previewsRequested = true
  for (const def of FONT_CATALOG) {
    loadStylesheet(def).catch(() => {})
  }
}

/**
 * Tuval metni henüz inmemiş bir alt kümeden karakter içeriyorsa tarayıcı
 * yazı tipini arka planda indirir. İndirme bittiğinde ölçümlerin yenilenmesi
 * için çağrılacak bir dinleyici kaydeder.
 */
export function onFontsLoaded(callback: (families: string[]) => void) {
  const handler = (event: Event) => {
    const faces = (event as FontFaceSetLoadEvent).fontfaces ?? []
    const families = [
      ...new Set(faces.map((face) => face.family.replace(/^["']|["']$/g, ''))),
    ].filter((family) => FONT_MAP.has(family))
    if (!families.length) return
    families.forEach((family) => cache.clearFontCache(family))
    callback(families)
  }
  document.fonts.addEventListener('loadingdone', handler)
  return () => document.fonts.removeEventListener('loadingdone', handler)
}
