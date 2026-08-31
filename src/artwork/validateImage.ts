import type { ImageMimeType } from '../app/types'

const ALLOWED_TYPES = new Set<ImageMimeType>([
  'image/png',
  'image/jpeg',
  'image/webp',
])
const MAX_PIXELS = 40_000_000

export interface ImageMetadata {
  mimeType: ImageMimeType
  width: number
  height: number
}

async function decodeWithImage(file: File): Promise<{ width: number; height: number }> {
  const url = URL.createObjectURL(file)

  try {
    return await new Promise((resolve, reject) => {
      const image = new Image()
      image.onload = () => resolve({ width: image.naturalWidth, height: image.naturalHeight })
      image.onerror = () => reject(new Error('无法读取图片，请更换文件'))
      image.src = url
    })
  } finally {
    URL.revokeObjectURL(url)
  }
}

async function decodeDimensions(file: File) {
  if ('createImageBitmap' in globalThis) {
    const bitmap = await createImageBitmap(file)
    const dimensions = { width: bitmap.width, height: bitmap.height }
    bitmap.close()
    return dimensions
  }

  return decodeWithImage(file)
}

export async function validateImage(file: File): Promise<ImageMetadata> {
  if (!file.size) {
    throw new Error('图片文件为空')
  }
  if (!ALLOWED_TYPES.has(file.type as ImageMimeType)) {
    throw new Error('仅支持 PNG、JPG 和 WebP')
  }

  const { width, height } = await decodeDimensions(file)
  if (!width || !height) {
    throw new Error('图片尺寸无效')
  }
  if (width * height > MAX_PIXELS) {
    throw new Error('图片尺寸过大，请使用不超过 4000 万像素的图片')
  }

  return { mimeType: file.type as ImageMimeType, width, height }
}
