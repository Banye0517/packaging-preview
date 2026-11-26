export function assetUrl(path: string): string {
  const base = import.meta.env.BASE_URL || './'
  const cleanBase = base.endsWith('/') ? base : `${base}/`
  return `${cleanBase}${path.replace(/^\//, '')}`
}

/** Samples the outer border pixels of an uploaded packaging image so pouch heat-seals match the artwork paper/film base color. */
export function sampleArtworkBorderColor(source: string, fallback = '#f3f4f6'): Promise<string> {
  return new Promise((resolve) => {
    if (typeof Image === 'undefined' || typeof document === 'undefined') {
      resolve(fallback)
      return
    }
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      try {
        const size = 24
        const canvas = document.createElement('canvas')
        canvas.width = size
        canvas.height = size
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          resolve(fallback)
          return
        }
        ctx.drawImage(img, 0, 0, size, size)
        const data = ctx.getImageData(0, 0, size, size).data
        let r = 0
        let g = 0
        let b = 0
        let count = 0
        for (let y = 0; y < size; y += 1) {
          for (let x = 0; x < size; x += 1) {
            if (x > 2 && x < size - 3 && y > 2 && y < size - 3) continue
            const idx = (y * size + x) * 4
            if (data[idx + 3] < 128) continue
            r += data[idx]
            g += data[idx + 1]
            b += data[idx + 2]
            count += 1
          }
        }
        if (!count) {
          resolve(fallback)
          return
        }
        const toHex = (n: number) => Math.round(n / count).toString(16).padStart(2, '0')
        resolve(`#${toHex(r)}${toHex(g)}${toHex(b)}`)
      } catch {
        resolve(fallback)
      }
    }
    img.onerror = () => resolve(fallback)
    img.src = source
  })
}
