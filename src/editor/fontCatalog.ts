export type FontCategory =
  | 'sans'
  | 'serif'
  | 'display'
  | 'handwriting'
  | 'futuristic'
  | 'mono'

export interface FontDef {
  family: string
  category: FontCategory
  /** Google Fonts'ta bulunan kalınlıklar */
  weights: number[]
  /** Gerçek italik kesimi var mı? (yoksa tarayıcı eğik çizer) */
  italic?: boolean
}

export const FONT_CATEGORIES: { id: FontCategory | 'all'; label: string }[] = [
  { id: 'all', label: 'Tümü' },
  { id: 'sans', label: 'Modern' },
  { id: 'serif', label: 'Serif' },
  { id: 'display', label: 'Başlık' },
  { id: 'handwriting', label: 'El Yazısı' },
  { id: 'futuristic', label: 'Fütüristik' },
  { id: 'mono', label: 'Mono' },
]

/**
 * Küratörlü Google Fonts kataloğu. Her aile kendi <link> etiketiyle ve
 * yalnızca ihtiyaç duyulduğunda yüklenir (bkz. fonts.ts).
 */
export const FONT_CATALOG: FontDef[] = [
  // Modern / sans-serif
  { family: 'Inter', category: 'sans', weights: [300, 400, 500, 600, 700, 800, 900], italic: true },
  { family: 'Poppins', category: 'sans', weights: [300, 400, 500, 600, 700, 800, 900], italic: true },
  { family: 'Montserrat', category: 'sans', weights: [300, 400, 500, 600, 700, 800, 900], italic: true },
  { family: 'Roboto', category: 'sans', weights: [300, 400, 500, 700, 900], italic: true },
  { family: 'Open Sans', category: 'sans', weights: [300, 400, 600, 700, 800], italic: true },
  { family: 'Lato', category: 'sans', weights: [300, 400, 700, 900], italic: true },
  { family: 'Raleway', category: 'sans', weights: [300, 400, 500, 600, 700, 800, 900], italic: true },
  { family: 'Nunito', category: 'sans', weights: [300, 400, 600, 700, 800, 900], italic: true },
  { family: 'Work Sans', category: 'sans', weights: [300, 400, 500, 600, 700, 800, 900], italic: true },
  { family: 'DM Sans', category: 'sans', weights: [300, 400, 500, 700, 900], italic: true },
  { family: 'Rubik', category: 'sans', weights: [300, 400, 500, 600, 700, 800, 900], italic: true },
  { family: 'Outfit', category: 'sans', weights: [300, 400, 500, 600, 700, 800, 900] },
  { family: 'Manrope', category: 'sans', weights: [300, 400, 500, 600, 700, 800] },
  { family: 'Space Grotesk', category: 'sans', weights: [300, 400, 500, 600, 700] },
  { family: 'Oswald', category: 'sans', weights: [300, 400, 500, 600, 700] },

  // Serif
  { family: 'Playfair Display', category: 'serif', weights: [400, 500, 600, 700, 800, 900], italic: true },
  { family: 'Merriweather', category: 'serif', weights: [300, 400, 700, 900], italic: true },
  { family: 'Lora', category: 'serif', weights: [400, 500, 600, 700], italic: true },
  { family: 'Cormorant Garamond', category: 'serif', weights: [300, 400, 500, 600, 700], italic: true },
  { family: 'Libre Baskerville', category: 'serif', weights: [400, 700], italic: true },
  { family: 'DM Serif Display', category: 'serif', weights: [400], italic: true },
  { family: 'Cinzel', category: 'serif', weights: [400, 500, 600, 700, 800, 900] },
  { family: 'Abril Fatface', category: 'serif', weights: [400] },

  // Başlık / display
  { family: 'Bebas Neue', category: 'display', weights: [400] },
  { family: 'Anton', category: 'display', weights: [400] },
  { family: 'Archivo Black', category: 'display', weights: [400] },
  { family: 'Alfa Slab One', category: 'display', weights: [400] },
  { family: 'Righteous', category: 'display', weights: [400] },
  { family: 'Fredoka', category: 'display', weights: [300, 400, 500, 600, 700] },
  { family: 'Lobster', category: 'display', weights: [400] },
  { family: 'Bangers', category: 'display', weights: [400] },
  { family: 'Titan One', category: 'display', weights: [400] },
  { family: 'Luckiest Guy', category: 'display', weights: [400] },
  { family: 'Bungee', category: 'display', weights: [400] },
  { family: 'Monoton', category: 'display', weights: [400] },

  // El yazısı
  { family: 'Pacifico', category: 'handwriting', weights: [400] },
  { family: 'Dancing Script', category: 'handwriting', weights: [400, 500, 600, 700] },
  { family: 'Caveat', category: 'handwriting', weights: [400, 500, 600, 700] },
  { family: 'Great Vibes', category: 'handwriting', weights: [400] },
  { family: 'Satisfy', category: 'handwriting', weights: [400] },
  { family: 'Sacramento', category: 'handwriting', weights: [400] },
  { family: 'Kaushan Script', category: 'handwriting', weights: [400] },
  { family: 'Permanent Marker', category: 'handwriting', weights: [400] },
  { family: 'Shadows Into Light', category: 'handwriting', weights: [400] },
  { family: 'Indie Flower', category: 'handwriting', weights: [400] },

  // Fütüristik
  { family: 'Orbitron', category: 'futuristic', weights: [400, 500, 600, 700, 800, 900] },
  { family: 'Audiowide', category: 'futuristic', weights: [400] },
  { family: 'Exo 2', category: 'futuristic', weights: [300, 400, 500, 600, 700, 800, 900], italic: true },
  { family: 'Rajdhani', category: 'futuristic', weights: [300, 400, 500, 600, 700] },
  { family: 'Oxanium', category: 'futuristic', weights: [300, 400, 500, 600, 700, 800] },
  { family: 'Chakra Petch', category: 'futuristic', weights: [300, 400, 500, 600, 700], italic: true },
  { family: 'Michroma', category: 'futuristic', weights: [400] },
  { family: 'Syncopate', category: 'futuristic', weights: [400, 700] },
  { family: 'Russo One', category: 'futuristic', weights: [400] },
  { family: 'Black Ops One', category: 'futuristic', weights: [400] },
  { family: 'Press Start 2P', category: 'futuristic', weights: [400] },

  // Eş aralıklı
  { family: 'JetBrains Mono', category: 'mono', weights: [300, 400, 500, 700, 800], italic: true },
  { family: 'Space Mono', category: 'mono', weights: [400, 700], italic: true },
  { family: 'Fira Code', category: 'mono', weights: [300, 400, 500, 600, 700] },
]

export const FONT_MAP = new Map(FONT_CATALOG.map((f) => [f.family, f]))

/** Bir ailenin Google Fonts CSS2 adresini üretir. */
export function googleFontUrl(def: FontDef) {
  const family = def.family.replace(/ /g, '+')
  const weights = [...def.weights].sort((a, b) => a - b)
  let axis = ''
  if (def.italic) {
    const tuples = [
      ...weights.map((w) => `0,${w}`),
      ...weights.map((w) => `1,${w}`),
    ]
    axis = `:ital,wght@${tuples.join(';')}`
  } else if (!(weights.length === 1 && weights[0] === 400)) {
    axis = `:wght@${weights.join(';')}`
  }
  return `https://fonts.googleapis.com/css2?family=${family}${axis}&display=swap`
}

/** İstenen kalınlığa en yakın mevcut kalınlığı döndürür. */
export function nearestWeight(def: FontDef | undefined, weight: number) {
  if (!def) return weight
  return def.weights.reduce((best, w) =>
    Math.abs(w - weight) < Math.abs(best - weight) ? w : best,
  )
}
