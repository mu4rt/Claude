/** Koşullu sınıf adlarını birleştirir. */
export const cn = (...parts: (string | false | null | undefined)[]) => parts.filter(Boolean).join(' ')
